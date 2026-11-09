"""Two-reviewer verification for breed-v1 candidates (Phase 3B).

Storage: reviews.jsonl (one row per decision) beside manifest.jsonl.
An image becomes verified only when two DISTINCT reviewers both approve.
Anything else (reject, ambiguous, disagreement, single approve) stays
``candidates``/``unverified``/``pending`` — never silently relabelled,
never moved into train/val/test, never auto-approved.

Pure stdlib; no production inference imports.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List

DECISIONS = ("approved", "rejected", "ambiguous")
# Re-exported from breed_dataset for a single vocabulary.
ASSET_TYPES = (
    "animal_photograph", "historical_photograph", "scientific_illustration",
    "book_illustration", "painting_or_artwork", "sculpture_or_artefact",
    "diagram_or_infographic", "ai_generated", "unknown",
)
TRAINING_ELIGIBLE_ASSET_TYPES = ("animal_photograph", "historical_photograph")
EXCLUSION_REASON_NON_PHOTOGRAPHIC = "non_photographic_asset"
# Per-breed reviewer prompts (special checks).
SPECIAL_CHECKS = {
    "manx": "TAIL MUST BE VISIBLE (rump/tail). Tail-invisible = ambiguous, never approved.",
    "siamese": "Check point-colour + blue eyes; distinguish from Balinese (longer coat) and Birman (white gloves).",
    "siberian": "Distinguish from Maine Coon (size/ear tufts) and Norwegian Forest Cat (ear-set/coat).",
    "norwegian-forest-cat": "Do NOT trust category membership. Check tufted ears, coat, wedge head; reject generic longhair.",
    "tonkinese": "Search false positives expected: reject non-cats, historical 'Tonkin' subjects, anatomy images, and kittens held in hands.",
}


def load_reviews(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def append_review(path: Path, image_id: str, breed_id: str, reviewer: str,
                  decision: str, reason: str = "", asset_type: str | None = None) -> Dict[str, Any]:
    """Record one reviewer's decision. Enforces: valid decision, non-empty reviewer,
    no duplicate reviewer per image, reason required unless approved."""
    if decision not in DECISIONS:
        raise ValueError(f"invalid decision {decision!r}")
    if not reviewer.strip():
        raise ValueError("reviewer must be non-empty")
    if asset_type is not None and asset_type not in ASSET_TYPES:
        raise ValueError(f"invalid asset_type {asset_type!r}")
    for r in load_reviews(path):
        if r["image_id"] == image_id and r["reviewer"].strip().lower() == reviewer.strip().lower():
            raise ValueError(f"duplicate review by {reviewer} for {image_id}")
    if decision != "approved" and not reason.strip():
        raise ValueError(f"reason required for {decision}")
    row = {"image_id": image_id, "breed_id": breed_id, "reviewer": reviewer.strip(),
           "decision": decision, "reason": reason.strip(),
           "asset_type": asset_type,
           "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(row, ensure_ascii=True) + "\n")
    return row


def image_status(reviews: List[Dict[str, Any]], image_id: str) -> str:
    """verified | rejected | ambiguous | contested | pending (disagreement never resolves alone)."""
    mine = [r for r in reviews if r["image_id"] == image_id]
    decisions = {r["decision"] for r in mine}
    reviewers = {r["reviewer"].strip().lower() for r in mine}
    if len(reviewers) >= 2 and len(decisions) == 1:
        if "approved" in decisions:
            return "verified"
        if "rejected" in decisions:
            return "rejected"
        return "ambiguous"
    if len(decisions) > 1:
        return "contested"
    if len(reviewers) >= 2:
        return next(iter(decisions))  # both same non-verified decision handled above
    return "pending"


def training_eligibility(asset_type: str, review_status: str) -> tuple[bool, str | None]:
    """Training only needs verified photographic assets. Unknown stays
    unverified; non-photographic types keep metadata with an exclusion reason."""
    asset_type = (asset_type or "unknown").strip().lower()
    if asset_type not in ASSET_TYPES:
        asset_type = "unknown"
    if asset_type not in TRAINING_ELIGIBLE_ASSET_TYPES:
        return False, EXCLUSION_REASON_NON_PHOTOGRAPHIC
    if review_status != "verified":
        return False, "not_yet_verified"
    return True, None


def training_export_rows(rows: List[Dict[str, Any]], reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Rows eligible for a training export. Excluded assets never appear."""
    out = []
    for r in rows:
        st = image_status(reviews, r["id"])
        eligible, _ = training_eligibility(r.get("asset_type", "unknown"), st)
        if eligible:
            out.append(r)
    return out


def sync_manifest(dataset_root: Path) -> int:
    """Rewrite manifest rows' status fields from reviews.jsonl. Returns verified count.

    Verified rows keep split=candidates (review only touches confidence/status,
    never splits) until a separate promotion step runs."""
    manifest_path = dataset_root / "manifest.jsonl"
    reviews = load_reviews(dataset_root / "reviews.jsonl")
    rows = [json.loads(l) for l in manifest_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    verified = 0
    for r in rows:
        st = image_status(reviews, r["id"])
        r["review_status"] = st
        r["label_confidence"] = "verified" if st == "verified" else "unverified"
        r["reviewers"] = sorted({x["reviewer"] for x in reviews if x["image_id"] == r["id"]})
        asset_type = (r.get("asset_type") or "unknown").strip().lower()
        if asset_type not in ASSET_TYPES:
            asset_type = "unknown"
        r["asset_type"] = asset_type
        eligible, reason = training_eligibility(asset_type, st)
        r["training_eligible"] = eligible
        r["exclusion_reason"] = reason
        if st == "verified":
            verified += 1
    tmp = dataset_root / "manifest.jsonl.tmp"
    tmp.write_text("".join(json.dumps(r, ensure_ascii=True) + "\n" for r in rows), encoding="utf-8")
    tmp.replace(manifest_path)
    return verified


def review_report(dataset_root: Path) -> Dict[str, Any]:
    manifest_path = dataset_root / "manifest.jsonl"
    reviews = load_reviews(dataset_root / "reviews.jsonl")
    rows = [json.loads(l) for l in manifest_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    status_by_id = {r["id"]: image_status(reviews, r["id"]) for r in rows}
    per: Dict[str, Dict[str, int]] = {}
    for r in rows:
        b = per.setdefault(r["breed_id"], {"total": 0, "verified": 0, "rejected": 0,
                                           "ambiguous": 0, "contested": 0, "pending": 0})
        b["total"] += 1
        b[status_by_id[r["id"]]] += 1
    for b, v in per.items():
        n = v["total"] or 1
        v["approval_rate"] = round(v["verified"] / n, 4)
        v["rejection_rate"] = round(v["rejected"] / n, 4)
        v["ambiguity_rate"] = round(v["ambiguous"] / n, 4)
    return {"generated": time.strftime("%Y-%m-%d"),
            "total": len(rows), "total_verified": sum(v["verified"] for v in per.values()),
            "per_breed": per, "special_checks": SPECIAL_CHECKS}


def gallery_html(dataset_root: Path, breed: str | None = None) -> str:
    """Self-contained review gallery. Embeds images as file:// links relative."""
    manifest_path = dataset_root / "manifest.jsonl"
    reviews = load_reviews(dataset_root / "reviews.jsonl")
    rows = [json.loads(l) for l in manifest_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    if breed:
        rows = [r for r in rows if r["breed_id"] == breed]
    cards = []
    for r in rows:
        st = image_status(reviews, r["id"])
        check = SPECIAL_CHECKS.get(r["breed_id"], "Generic breed checklist.")
        cards.append(f"""<div class=card data-status="{st}">
<img src="{r['file']}" alt="{r['id'][:12]}" loading=lazy>
<div class=meta><b>{r['breed_id']}</b> · {st} · {r['width']}×{r['height']} · {r['bytes']//1024} KB<br>
Author: {r['author']} · Licence: {r['license']}<br>
Source: <a href="{r['description_url']}">{r['title'][:70]}</a> · {r['source']}<br>
<b>Check:</b> {check}<br>
<details class=rev><summary>reviews ({len([x for x in reviews if x['image_id']==r['id']])})</summary>
{''.join(f"<div>{x['reviewer']}: <b>{x['decision']}</b> — {x['reason']}</div>" for x in reviews if x['image_id']==r['id'])}
</details></div></div>""")
    return ("<html><head><meta charset=utf-8><title>breed-v1 review gallery</title>"
            "<style>body{font-family:system-ui} .card{border:1px solid #ccc;margin:8px;padding:8px;max-width:520px}"
            "img{max-width:480px} [data-status=verified]{border-color:green} [data-status=rejected]{border-color:red}"
            " [data-status=contested]{border-color:orange}</style></head><body>"
            f"<h1>breed-v1 candidates: {len(rows)} images</h1>" + "".join(cards) + "</body></html>\n")
