#!/usr/bin/env python
"""Collect breed-v1 *candidate* images from Wikimedia Commons.

Round 2 defaults to the under-represented breeds in priority order (Siamese,
Manx, Norwegian Forest, Tonkinese, Siberian). ``--per-breed`` means **new
candidates per run**, so a thin breed is topped up even though it already has
rows. All rows stay ``split=candidates`` / ``label_confidence=unverified`` until
the review pass; nothing here trains, evaluates, or touches production
inference.

Already collected images are never fetched twice: exact SHA-256, frozen legacy
test hashes, existing Commons titles and perceptual dHash near-duplicates are
all skipped.

Usage (repo root):
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\collect_breed_dataset.py --gaps
    ... --breeds siamese,manx --per-breed 20
    ... --offline-report   # progress report only, no network
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from backend.app.services.breed_dataset import (  # noqa: E402
    CATEGORY_BY_BREED, CommonsClient, collect_breed, flag_manifest_quality,
    legacy_test_hashes, load_manifest, progress_report,
)
from backend.app.services.collection_gap import (  # noqa: E402
    PRIORITY_BREEDS, collection_gap, target_per_breed,
)

DATASET_ROOT = REPO / "backend/datasets/breed-v1"
PILOT = list(PRIORITY_BREEDS)


def write_gap_report(target: int | None, breeds: list[str] | None) -> dict:
    report = collection_gap(DATASET_ROOT, target=target, breeds=breeds)
    (DATASET_ROOT / "collection_gap.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--breeds", default=",".join(PILOT), help="comma list or 'all'")
    ap.add_argument("--per-breed", type=int, default=25,
                    help="new candidates per breed this run (not the breed total)")
    ap.add_argument("--target", type=int, default=230, help="net verified target per breed")
    ap.add_argument("--gap-target", type=int, default=None,
                    help="round-2 eligible-photo target per breed (default 30 or COLLECTION_TARGET_PER_BREED)")
    ap.add_argument("--gaps", action="store_true",
                    help="write collection_gap.json and exit (no network)")
    ap.add_argument("--audit-quality", action="store_true",
                    help="flag already-collected rows (colour/relevance) and exit (no network)")
    ap.add_argument("--dry-run", action="store_true",
                    help="with --audit-quality: report flags without rewriting the manifest")
    ap.add_argument("--min-interval", type=float, default=2.0)
    ap.add_argument("--image-interval", type=float, default=0.6)
    ap.add_argument("--offline-report", action="store_true")
    args = ap.parse_args()

    breeds = sorted(CATEGORY_BY_BREED) if args.breeds == "all" else \
        [b.strip() for b in args.breeds.split(",") if b.strip()]
    unknown = [b for b in breeds if b not in CATEGORY_BY_BREED]
    if unknown:
        print(f"[FAIL] unknown breeds: {unknown}")
        return 2
    DATASET_ROOT.mkdir(parents=True, exist_ok=True)

    if args.gaps:
        report = write_gap_report(args.gap_target, breeds)
        print(json.dumps(report, indent=2))
        print(f"report: {DATASET_ROOT / 'collection_gap.json'}")
        return 0

    if args.audit_quality:
        report = flag_manifest_quality(DATASET_ROOT, apply=not args.dry_run)
        (DATASET_ROOT / "quality_audit.json").write_text(
            json.dumps(report, indent=2) + "\n", encoding="utf-8")
        for item in report["items"]:
            print(f"  {item['breed_id']:22} {item['id'][:10]} {','.join(item['flags']):32} {item['title'][:60]}")
        print(f"scanned={report['scanned']} flagged={report['flagged']} "
              f"applied={report['applied']} by_flag={report['by_flag']}")
        print(f"report: {DATASET_ROOT / 'quality_audit.json'}")
        return 0

    if args.offline_report:
        report = progress_report(DATASET_ROOT, args.target)
        (DATASET_ROOT / "progress.json").write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps(report, indent=2))
        return 0

    target = args.gap_target if args.gap_target is not None else target_per_breed()
    gaps = collection_gap(DATASET_ROOT, target=target, breeds=breeds)
    legacy = legacy_test_hashes(REPO)
    print(f"historical test hashes protected: {len(legacy)}")
    manifest = load_manifest(DATASET_ROOT / "manifest.jsonl")
    known_sha = {r["sha256"] for r in manifest}
    known_ph: list[int] = [int(r["phash"], 16) for r in manifest if r.get("phash")]
    client = CommonsClient(min_interval=args.min_interval, image_interval=args.image_interval)

    summary = {}
    for breed in breeds:
        gap = gaps["per_breed"].get(breed, {})
        existing = gap.get("collected", 0)
        eligible = gap.get("eligible", 0)
        print(f"== {breed} ({CATEGORY_BY_BREED[breed]}) collected={existing} "
              f"eligible={eligible}/{target} remaining={gap.get('remaining', 0)} "
              f"new<={args.per_breed}")
        summary[breed] = collect_breed(breed, CATEGORY_BY_BREED[breed], args.per_breed,
                                       client, DATASET_ROOT, legacy, known_sha, known_ph)
        print("   ", summary[breed])

    report = progress_report(DATASET_ROOT, args.target)
    (DATASET_ROOT / "progress.json").write_text(json.dumps(report, indent=2) + "\n")
    (DATASET_ROOT / "pilot_summary.json").write_text(json.dumps(
        {"generated": __import__("time").strftime("%Y-%m-%d"), "breeds": breeds,
         "new_candidates_per_breed": args.per_breed, "gap_target": target,
         "runs": summary, "progress": report,
         "gap": collection_gap(DATASET_ROOT, target=target, breeds=breeds)}, indent=2) + "\n")
    print(f"done. candidates total={report['total_candidates']} requests={client.requests} downloads={client.downloads}")
    print(f"report: {DATASET_ROOT / 'progress.json'}")
    print(f"gaps:   {DATASET_ROOT / 'collection_gap.json'} (run with --gaps to refresh)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
