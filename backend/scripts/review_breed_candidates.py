#!/usr/bin/env python
"""Human-review CLI for breed-v1 candidates (Phase 3B).

Static gallery + two-reviewer decision entry. No auto-approve, no relabel,
no split promotion. Reviews go to backend/datasets/breed-v1/reviews.jsonl.

Usage (repo root):
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\review_breed_candidates.py gallery --breed siamese
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\review_breed_candidates.py decide --image <sha256> --reviewer alice --decision approved
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\review_breed_candidates.py decide --image <sha256> --reviewer bob --decision rejected --reason "not a cat"
    backend\\.venv\\Scripts\\python.exe backend\\scripts\\review_breed_candidates.py report
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from backend.app.services.breed_review import (  # noqa: E402
    append_review, gallery_html, review_report, sync_manifest,
)

ROOT = REPO / "backend/datasets/breed-v1"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("gallery")
    g.add_argument("--breed", default=None)
    d = sub.add_parser("decide")
    d.add_argument("--image", required=True, help="sha256 id (prefix ok)")
    d.add_argument("--reviewer", required=True)
    d.add_argument("--decision", required=True, choices=["approved", "rejected", "ambiguous"])
    d.add_argument("--reason", default="")
    sub.add_parser("sync")
    sub.add_parser("report")
    args = ap.parse_args()

    if args.cmd == "gallery":
        out = ROOT / f"review_gallery{('--' + args.breed) if args.breed else ''}.html"
        out.write_text(gallery_html(ROOT, args.breed), encoding="utf-8")
        print(f"gallery: {out}")
        return 0
    if args.cmd == "decide":
        rows = [json.loads(l) for l in (ROOT / "manifest.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
        match = [r for r in rows if r["id"].startswith(args.image)]
        if len(match) != 1:
            print(f"[FAIL] image prefix matched {len(match)} rows")
            return 2
        try:
            row = append_review(ROOT / "reviews.jsonl", match[0]["id"], match[0]["breed_id"],
                                args.reviewer, args.decision, args.reason)
        except ValueError as exc:
            print(f"[FAIL] {exc}")
            return 2
        print("recorded:", row)
        return 0
    if args.cmd == "sync":
        print(f"verified: {sync_manifest(ROOT)}")
        return 0
    if args.cmd == "report":
        rep = review_report(ROOT)
        (ROOT / "review_report.json").write_text(json.dumps(rep, indent=2) + "\n")
        print(json.dumps(rep, indent=2))
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
