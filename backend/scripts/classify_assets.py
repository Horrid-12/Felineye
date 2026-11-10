#!/usr/bin/env python
"""Explicit asset-type classification CLI for breed-v1.

Appends to ``backend/datasets/breed-v1/asset_types.jsonl`` (append-only audit
log) and re-syncs the manifest. It never changes a review decision, never
approves anything, and never promotes a split.

Usage (repo root):
    # dry run: show what would be classified
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\classify_assets.py --reviewer Howwid --asset-type animal_photograph
    # apply to verified rows whose asset type is still unknown
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\classify_assets.py --reviewer Howwid --asset-type animal_photograph --apply
    # limit to one breed
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\classify_assets.py --reviewer Howwid --asset-type animal_photograph --breed siamese --apply
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from backend.app.services.breed_review import (  # noqa: E402
    ASSET_TYPES, classify_assets, review_report,
)

ROOT = REPO / "backend/datasets/breed-v1"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--reviewer", required=True, help="handle recorded in the audit log")
    ap.add_argument("--asset-type", required=True, choices=list(ASSET_TYPES))
    ap.add_argument("--status", default="verified",
                    help="only rows with this review status (default: verified; 'any' disables)")
    ap.add_argument("--breed", default=None)
    ap.add_argument("--include-classified", action="store_true",
                    help="re-classify rows that already have a non-unknown asset type")
    ap.add_argument("--apply", action="store_true", help="write the log + re-sync (default: dry run)")
    args = ap.parse_args()

    status = None if args.status == "any" else args.status
    try:
        result = classify_assets(
            ROOT, args.reviewer, args.asset_type,
            status=status, only_unknown=not args.include_classified,
            breed=args.breed, apply=args.apply,
        )
    except ValueError as exc:
        print(f"[FAIL] {exc}")
        return 2

    print(f"matched {result['matched']} rows for asset_type={result['asset_type']}"
          + (f" (breed={args.breed})" if args.breed else ""))
    if result["matched"] and not result["applied"]:
        for image_id in result["ids"][:10]:
            print(f"  {image_id[:16]}")
        if result["matched"] > 10:
            print(f"  … {result['matched'] - 10} more")
        print("dry run — re-run with --apply to record and re-sync")
        return 0
    if not result["applied"]:
        print("nothing to do")
        return 0

    report = review_report(ROOT, args.reviewer)
    rows = (ROOT / "manifest.jsonl").read_text(encoding="utf-8").splitlines()
    eligible = sum(1 for line in rows if line.strip() and '"training_eligible": true' in line)
    print(f"applied — manifest synced; training_eligible rows: {eligible}"
          f" | verified {report['total_verified']} / {report['total']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
