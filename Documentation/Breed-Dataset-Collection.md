# Breed Dataset — Collection Pipeline

**Date:** 2026-11-10 · **Status:** Infrastructure ready; pilot collected and reviewed. No training, no production change.

## How to run

```powershell
# Round 2: collection-gap report only (no network)
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --gaps

# Round-2 top-up: 20 *new* candidates each for the two priority breeds
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --breeds siamese,manx --per-breed 20

# Progress only (no network)
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --offline-report
```

`--per-breed` is **new candidates collected by this run**, not the breed total.
A thin breed is topped up even if it already has 25 rows (including rejected
ones). Use `--gaps` to see how many eligible photos are still missing.

**Outputs** (`backend/datasets/breed-v1/`, images gitignored; manifest tracked):
- `manifest.jsonl` — one JSON row/image: `id` (=SHA-256), `breed_id`, `split`, `file`, `sha256`, `phash` (dHash-64), `source`, `title`, `description_url`, `author`, `license`, `license_url`, `attribution_required`, `width`, `height`, `bytes`, `label_confidence`, `review_status`, `reviewers`, `asset_type`, `training_eligible`, `exclusion_reason`, `audit_reason`, `collected_at`, `category_hint`.
- `progress.json` — per-breed candidates vs 230 target + shortage.
- `collection_gap.json` — round-2 gap: eligible photos, target (default 30), remaining and estimated new candidates per priority breed.
- `images/candidates/{breed_id}/{sha256}.jpg` — always `unverified`, never `train`.

**Safety rails baked in:**
- Rate limit (`--min-interval` 2.0 s API / 0.6 s downloads) + 4 retries with `Retry-After` backoff on 429/5xx.
- Licence filter: accepts Public domain / CC0 / CC BY / CC BY-SA only; rejects NC, ND, missing author or licence, unrecognised terms.
- Integrity: Pillow verify + decode; JPEG/PNG only; both dimensions ≥400px; junk-title tokens (logo/map/artwork/museum/specimen…) skipped.
- Re-collection guard: exact SHA-256, frozen legacy-86 hashes, existing Commons titles, and dHash-64 near-duplicates (≤5 bits on 8×8 gray) all skip before a file is written.
- Category recursion (subcats) + Commons `filetype:bitmap` search fallback so thin categories (Norwegian Forest cats = 0 files + 1 subcat) don't starve. Listing limits are capped at the Commons maximum of 500.

**What this is not:** a labelling tool. Rows stay `candidates/unverified` with empty `reviewers` until the two-reviewer visual checklist pass. Do not promote to train/val/test splits from this script.

**Tests:** `backend\.venv\Scripts\python.exe -m pytest backend/tests/test_breed_collection.py backend/tests/test_collection_gap.py -q` — offline (mocked images, licence matrix, hash/dHash, manifest, progress, legacy-set size guard, gap math/exclusions, priority order, per-run semantics and re-collection).

## Pilot report

See `Documentation/Breed-Dataset-Pilot-Report.md` for the 2026-11-09 pilot (125 candidates, 25/breed × 5).
