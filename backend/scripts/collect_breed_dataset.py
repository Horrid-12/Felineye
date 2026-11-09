#!/usr/bin/env python
"""Collect breed-v1 *candidate* images from Wikimedia Commons.

Pilot defaults (5 schedule-critical breeds, 25/breed). All rows stay
``split=candidates`` / ``label_confidence=unverified`` until the two-reviewer
pass; nothing here trains, evaluates, or touches production inference.

Usage (repo root):
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\collect_breed_dataset.py
    ... --breeds siamese,manx --per-breed 10
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
    CATEGORY_BY_BREED, CommonsClient, collect_breed, legacy_test_hashes,
    load_manifest, progress_report,
)

DATASET_ROOT = REPO / "backend/datasets/breed-v1"
PILOT = ["norwegian-forest-cat", "siamese", "manx", "siberian", "tonkinese"]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--breeds", default=",".join(PILOT), help="comma list or 'all'")
    ap.add_argument("--per-breed", type=int, default=25, help="new candidates per breed")
    ap.add_argument("--target", type=int, default=230, help="net verified target per breed")
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

    if args.offline_report:
        report = progress_report(DATASET_ROOT, args.target)
        (DATASET_ROOT / "progress.json").write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps(report, indent=2))
        return 0

    legacy = legacy_test_hashes(REPO)
    print(f"historical test hashes protected: {len(legacy)}")
    manifest = load_manifest(DATASET_ROOT / "manifest.jsonl")
    known_sha = {r["sha256"] for r in manifest}
    known_ph: list[int] = [int(r["phash"], 16) for r in manifest if r.get("phash")]
    client = CommonsClient(min_interval=args.min_interval, image_interval=args.image_interval)

    summary = {}
    for breed in breeds:
        existing = sum(1 for r in load_manifest(DATASET_ROOT / "manifest.jsonl")
                       if r.get("breed_id") == breed and r.get("split") == "candidates")
        print(f"== {breed} ({CATEGORY_BY_BREED[breed]}) existing={existing} want<={args.per_breed}")
        summary[breed] = collect_breed(breed, CATEGORY_BY_BREED[breed], args.per_breed,
                                       client, DATASET_ROOT, legacy, known_sha, known_ph, existing)
        print("   ", summary[breed])

    report = progress_report(DATASET_ROOT, args.target)
    (DATASET_ROOT / "progress.json").write_text(json.dumps(report, indent=2) + "\n")
    (DATASET_ROOT / "pilot_summary.json").write_text(json.dumps(
        {"generated": __import__("time").strftime("%Y-%m-%d"), "breeds": breeds,
         "per_breed": args.per_breed, "runs": summary,
         "progress": report}, indent=2) + "\n")
    print(f"done. candidates total={report['total_candidates']} requests={client.requests} downloads={client.downloads}")
    print(f"report: {DATASET_ROOT / 'progress.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
