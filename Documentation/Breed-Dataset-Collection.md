# Breed Dataset — Collection Pipeline

**Date:** 2026-11-11 · **Status:** Infrastructure ready; pilot collected. No training, no production change.

## How to run

```powershell
# Pilot (5 breeds x 25 candidates) — downloads via Commons, throttled
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py

# One-off / top-up
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --breeds siamese,manx --per-breed 10

# Progress only (no network)
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --offline-report
```

**Outputs** (`backend/datasets/breed-v1/`, images gitignored; manifest tracked):
- `manifest.jsonl` — one JSON row/image: `id` (=SHA-256), `breed_id`, `split`, `file`, `sha256`, `phash` (dHash-64), `source`, `title`, `description_url`, `author`, `license`, `license_url`, `attribution_required`, `width`, `height`, `bytes`, `label_confidence`, `reviewers`, `audit_reason`, `collected_at`, `category_hint`.
- `progress.json` — per-breed candidates vs 230 target + shortage.
- `images/candidates/{breed_id}/{sha256}.jpg` — always `unverified`, never `train`.

**Safety rails baked in:**
- Rate limit (`--min-interval` 2.0 s API / 0.6 s downloads) + 4 retries with `Retry-After` backoff on 429/5xx.
- Licence filter: accepts Public domain / CC0 / CC BY / CC BY-SA only; rejects NC, ND, missing author or licence, unrecognised terms.
- Integrity: Pillow verify + decode; JPEG/PNG only; both dimensions ≥400px; junk-title tokens (logo/map/artwork/museum/specimen…) skipped.
- Exact dedupe (SHA-256) + near-dedupe (dHash ≤5 bits on 8×8 gray). Historical 86-image test SHA set (93 byte streams) is loaded and any overlap is rejected as `legacy_overlap`.
- Category recursion (subcats) + Commons `filetype:bitmap` search fallback so thin categories (Norwegian Forest cats = 0 files + 1 subcat) don't starve.

**What this is not:** a labelling tool. Rows stay `candidates/unverified` with empty `reviewers` until the two-reviewer visual checklist pass. Do not promote to train/val/test splits from this script.

**Tests:** `backend\.venv\Scripts\python.exe -m pytest backend/tests/test_breed_collection.py -q` — offline (mocked images, licence matrix, hash/dHash, manifest, progress, legacy-set size guard).

## Pilot report

See `Documentation/Breed-Dataset-Pilot-Report.md` for the 2026-11-09 pilot (125 candidates, 25/breed × 5).
