"""Breed-v1 candidate collection pipeline (Phase 3A).

Reproducible, licence-safe Wikimedia Commons ingestion. Images land in
``backend/datasets/breed-v1/images/candidates/{breed_id}/{sha256}.jpg`` with
``split="candidates"``, ``label_confidence="unverified"``, ``reviewers=[]`` —
never in a training split, never pedigree-claimed. Category membership is a
weak retrieval hint only; labels stay unverified until the two-reviewer pass.

Pure stdlib + Pillow; the API runtime never imports this module.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

from PIL import Image

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = (
    "FelineyeBreedCollector/1.0 (local reproducible dataset collection; "
    "contact: repository maintainer) python-urllib"
)
# Verified Commons categories (mirrors validate_breed_coverage.py + plan).
CATEGORY_BY_BREED: Dict[str, str] = {
    "ragdoll": "Ragdoll cats",
    "persian": "Persian cats",
    "siamese": "Siamese cats",
    "maine-coon": "Maine Coon cats",
    "bengal": "Bengal cats",
    "sphynx": "Sphynx (cat)",
    "british-shorthair": "British Shorthair cats",
    "scottish-fold": "Scottish Fold cats",
    "abyssinian": "Abyssinian cats",
    "american-shorthair": "American Shorthair cats",
    "balinese": "Balinese cats",
    "birman": "Birman cats",
    "bombay": "Bombay cats",
    "burmese": "Burmese cats",
    "devon-rex": "Devon Rex",
    "egyptian-mau": "Egyptian Mau",
    "manx": "Manx cats",
    "norwegian-forest-cat": "Norwegian Forest cats",
    "russian-blue": "Russian Blue cats",
    "siberian": "Siberian (cat)",
    "tonkinese": "Tonkinese",
    "turkish-angora": "Turkish Angora",
}
# Almost never a clean single-cat photo (same as validation sampler).
SKIP_TITLE_TOKENS = (
    "logo", "map", "diagram", "drawing", "painting", "illustration", "cartoon",
    "stamp", "sculpture", "skeleton", "skull", "taxidermy", "anatomy", "genetic",
    "head", "kitten", "museo", "museum", "specimen",
)
MIN_WIDTH = 400
MIN_HEIGHT = 400
ALLOWED_MIMES = {"image/jpeg", "image/png"}
# Licence allow-list: public domain, CC0, CC BY, CC BY-SA (any version).
# Everything else (NC, ND, missing author, unknown) is rejected.
_REJECT = re.compile(r"\b(NC|ND|no deriv|no-deriv|non-?commercial)\b", re.I)
_ALLOW = re.compile(
    r"(public domain|CC0|CC BY(-SA)?\s+\d\.\d|CC BY-SA|CC BY\s*(\d|$)|"
    r"Attribution|no restrictions|CC [A-Z-]+\s*\d\.\d)", re.I)
HTML_TAG = re.compile(r"<[^>]+>")


def clean(value: Optional[str]) -> str:
    if not value:
        return ""
    return html.unescape(HTML_TAG.sub("", value)).strip()


def license_decision(author: str, license_name: str) -> tuple[bool, str]:
    """Return (accepted, reason). Missing attribution/licence always rejects."""
    if not author or not license_name:
        return False, "missing_attribution"
    if _REJECT.search(license_name):
        return False, "nc_nd_or_unknown_restriction"
    if "CC BY" not in license_name.upper() and "CC0" not in license_name.upper() \
            and "PUBLIC DOMAIN" not in license_name.upper() and "ATTRIBUTION" not in license_name.upper() \
            and "NO RESTRICTIONS" not in license_name.upper():
        return False, "unrecognised_license"
    if _ALLOW.search(license_name) is None:
        return False, "unrecognised_license"
    return True, "accepted"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def dhash64(image: Image.Image, hash_size: int = 8) -> int:
    """64-bit difference hash (perceptual near-duplicate detection)."""
    g = image.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.BILINEAR)
    px = g.tobytes()
    bits = 0
    for r in range(hash_size):
        for c in range(hash_size):
            bits = (bits << 1) | (1 if px[r * (hash_size + 1) + c] > px[r * (hash_size + 1) + c + 1] else 0)
    return bits


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def is_near_duplicate(ph: int, seen: Iterable[int], threshold: int = 5) -> bool:
    return any(hamming(ph, s) <= threshold for s in seen)


def validate_image_bytes(data: bytes) -> tuple[Image.Image, int, int, str]:
    """Decode check; returns (image, width, height, format). Raises ValueError."""
    import io
    try:
        with Image.open(io.BytesIO(data)) as im:
            im.verify()
        with Image.open(io.BytesIO(data)) as im:
            im.load()
            w, h = im.size
            fmt = (im.format or "").lower()
            if fmt not in ("jpeg", "png"):
                raise ValueError(f"unsupported_format:{fmt}")
            if w < MIN_WIDTH or h < MIN_HEIGHT:
                raise ValueError(f"below_min_resolution:{w}x{h}")
            return im.copy(), w, h, fmt
    except (Image.UnidentifiedImageError, EOFError, OSError, ValueError) as exc:
        if isinstance(exc, ValueError) and str(exc).startswith(("below_min", "unsupported")):
            raise
        raise ValueError(f"integrity_failure:{exc}") from exc


class CommonsClient:
    """Throttled Commons client with retry/backoff (mirrors validation sampler)."""

    def __init__(self, min_interval: float = 2.0, image_interval: float = 0.6, retries: int = 4):
        self.min_interval = min_interval
        self.image_interval = image_interval
        self.retries = retries
        self._last_call = 0.0
        self._last_download = 0.0
        self.requests = 0
        self.downloads = 0

    def _throttle(self):
        elapsed = time.monotonic() - self._last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last_call = time.monotonic()

    def _throttle_download(self):
        elapsed = time.monotonic() - self._last_download
        if elapsed < self.image_interval:
            time.sleep(self.image_interval - elapsed)
        self._last_download = time.monotonic()

    def _open(self, url: str, *, timeout: int = 60) -> bytes:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        last: Optional[Exception] = None
        for attempt in range(self.retries):
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
                    return resp.read()
            except urllib.error.HTTPError as exc:
                last = exc
                if exc.code not in (429, 500, 502, 503, 504):
                    raise
                time.sleep(int(exc.headers.get("Retry-After", 10)) + 2 * (attempt + 1))
            except urllib.error.URLError as exc:
                last = exc
                time.sleep(3 * (attempt + 1))
        raise RuntimeError(f"request failed after {self.retries} attempts: {last}")

    def api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        self._throttle()
        self.requests += 1
        return json.loads(self._open(COMMONS_API + "?" + urllib.parse.urlencode(params)).decode("utf-8"))

    def download(self, url: str, destination: Path) -> None:
        self._throttle_download()
        self.downloads += 1
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(self._open(url))


def _category_pages(client: CommonsClient, category: str, limit: int, gcmtype: str = "file",
                    cont: str | None = None) -> dict:
    params: Dict[str, Any] = {
        "action": "query", "generator": "categorymembers", "gcmtitle": f"Category:{category}",
        "gcmtype": gcmtype, "gcmlimit": max(limit, 50), "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata", "iiurlwidth": 960, "format": "json"}
    if cont:
        params["gcmcontinue"] = cont
    return client.api(params)


def list_category_files(client: CommonsClient, category: str, limit: int) -> List[Dict[str, Any]]:
    """Return imageinfo rows for a Commons category (jpeg/png, min size, no junk titles).

    Recurses one level into subcategories (e.g. Norwegian Forest cats has only
    subcats), then falls back to Commons full-text search so filing quirks in a
    few thin categories don't starve the run. Pages are deduped by title.
    """
    rows: List[Dict[str, Any]] = []
    seen: set[str] = set()

    def add_pages(data: Dict[str, Any]) -> None:
        for page in (data.get("query", {}).get("pages", {}) or {}).values():
            title = page.get("title", "")
            infos = page.get("imageinfo") or []
            if not infos or title in seen:
                continue
            seen.add(title)
            info = infos[0]
            if info.get("mime") not in ALLOWED_MIMES:
                continue
            if int(info.get("width") or 0) < MIN_WIDTH or int(info.get("height") or 0) < MIN_HEIGHT:
                continue
            if any(tok in title.lower() for tok in SKIP_TITLE_TOKENS):
                continue
            meta = info.get("extmetadata", {})
            rows.append({"title": title, "url": info.get("thumburl") or info.get("url"),
                         "description_url": info.get("descriptionurl", ""),
                         "author": clean(meta.get("Artist", {}).get("value")),
                         "license": clean(meta.get("LicenseShortName", {}).get("value")),
                         "license_url": clean(meta.get("LicenseURL", {}).get("value")),
                         "width": int(info.get("width") or 0), "height": int(info.get("height") or 0),
                         "mime": info.get("mime")})

    add_pages(_category_pages(client, category, limit))
    # One level of subcategories.
    if len(rows) < limit:
        subs = _category_pages(client, category, limit, gcmtype="subcat")
        for page in (subs.get("query", {}).get("pages", {}) or {}).values():
            sub = page.get("title", "").removeprefix("Category:")
            if sub:
                add_pages(_category_pages(client, sub, limit))
            if len(rows) >= limit:
                break
    # Search fallback (filetype bitmap + breed phrase, namespace File only).
    if len(rows) < limit:
        data = client.api({
            "action": "query", "generator": "search", "gsrsearch": f"{category} filetype:bitmap",
            "gsrnamespace": 6, "gsrlimit": max(limit * 3, 50), "prop": "imageinfo",
            "iiprop": "url|mime|size|extmetadata", "iiurlwidth": 960, "format": "json"})
        add_pages(data)
    return rows[:limit]


def legacy_test_hashes(repo_root: Path) -> Set[str]:
    """SHA-256 set of the frozen 86-image historical test set (never touch)."""
    val_dir = repo_root / "backend/tests/fixtures/breed-validation/images"
    hashes: Set[str] = set()
    if val_dir.exists():
        for f in val_dir.rglob("*"):
            if f.is_file():
                hashes.add(sha256_bytes(f.read_bytes()))
    return hashes


def load_manifest(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def append_manifest(path: Path, row: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(row, ensure_ascii=True) + "\n")


def collect_breed(
    breed_id: str, category: str, per_breed: int, client: CommonsClient,
    dataset_root: Path, legacy_hashes: Set[str], known_sha: Set[str],
    known_ph: List[int], existing_count: int = 0,
) -> Dict[str, int]:
    """Download candidates for one breed. Returns counters; writes <= per_breed rows."""
    manifest = dataset_root / "manifest.jsonl"
    counts = {"listed": 0, "downloaded": 0, "written": 0, "rejected_license": 0,
              "rejected_title": 0, "rejected_resolution": 0, "exact_dupe": 0,
              "near_dupe": 0, "legacy_overlap": 0, "integrity_fail": 0}
    if existing_count >= per_breed:
        return counts
    files = list_category_files(client, category, max(per_breed * 3, per_breed))
    counts["listed"] = len(files)
    for f in files:
        if sum(1 for _ in load_manifest(manifest) if _.get("breed_id") == breed_id) >= per_breed:
            break
        ok, reason = license_decision(f["author"], f["license"])
        if not ok:
            counts["rejected_license"] += 1
            continue
        tmp = dataset_root / "images/candidates" / breed_id / "_tmp.jpg"
        try:
            client.download(f["url"], tmp)
            data = tmp.read_bytes()
        except Exception:
            counts["integrity_fail"] += 1
            continue
        digest = sha256_bytes(data)
        if digest in known_sha:
            counts["exact_dupe"] += 1
            tmp.unlink(missing_ok=True)
            continue
        if digest in legacy_hashes:
            counts["legacy_overlap"] += 1
            tmp.unlink(missing_ok=True)
            continue
        try:
            image, w, h, fmt = validate_image_bytes(data)
        except ValueError as exc:
            if "below_min_resolution" in str(exc):
                counts["rejected_resolution"] += 1
            else:
                counts["integrity_fail"] += 1
            tmp.unlink(missing_ok=True)
            continue
        ph = dhash64(image)
        if is_near_duplicate(ph, known_ph):
            counts["near_dupe"] += 1
            tmp.unlink(missing_ok=True)
            continue
        dest = dataset_root / "images/candidates" / breed_id / f"{digest}.jpg"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        tmp.unlink(missing_ok=True)
        known_sha.add(digest)
        known_ph.append(ph)
        counts["downloaded"] += 1
        counts["written"] += 1
        append_manifest(manifest, {
            "id": digest, "breed_id": breed_id, "split": "candidates",
            "file": f"images/candidates/{breed_id}/{digest}.jpg", "sha256": digest,
            "phash": format(ph, "016x"), "source": "wikimedia-commons",
            "title": f["title"], "description_url": f["description_url"],
            "author": f["author"], "license": f["license"],
            "license_url": f["license_url"],
            "attribution_required": True, "width": f["width"], "height": f["height"],
            "bytes": len(data), "label_confidence": "unverified", "reviewers": [],
            "audit_reason": None, "collected_at": time.strftime("%Y-%m-%d"),
            "category_hint": category,
        })
    return counts


def progress_report(dataset_root: Path, target: int = 230) -> Dict[str, Any]:
    rows = load_manifest(dataset_root / "manifest.jsonl")
    by: Dict[str, int] = {}
    for r in rows:
        if r.get("split") == "candidates":
            by[r["breed_id"]] = by.get(r["breed_id"], 0) + 1
    per = {b: {"candidates": by.get(b, 0), "target": target,
               "shortage": max(0, target - by.get(b, 0))} for b in CATEGORY_BY_BREED}
    return {"generated": time.strftime("%Y-%m-%d"), "target_per_breed": target,
            "total_candidates": sum(by.values()), "per_breed": per}
