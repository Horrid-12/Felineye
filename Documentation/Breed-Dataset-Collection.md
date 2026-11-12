# Breed Dataset — Collection Pipeline

**Date:** 2026-11-10 (updated 2026-11-12) · **Status:** Infrastructure ready; pilot collected and reviewed. No training, no production change.

## How to run

```powershell
# Round 2: collection-gap report only (no network)
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --gaps

# Round-2 top-up: 20 *new* candidates each for the two priority breeds
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --breeds siamese,manx --per-breed 20

# Quality audit of already-collected rows (no network; --dry-run to preview)
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --audit-quality
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --reject-flagged --reviewer quality-gate

# Progress only (no network)
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --offline-report
```

`--per-breed` is **new candidates collected by this run**, not the breed total.
A thin breed is topped up even if it already has 25 rows (including rejected
ones). Use `--gaps` to see how many eligible photos are still missing.

**Outputs** (`backend/datasets/breed-v1/`, images gitignored; manifest tracked):
- `manifest.jsonl` — one JSON row/image: `id` (=SHA-256), `breed_id`, `split`, `file`, `sha256`, `phash` (dHash-64), `source`, `title`, `description_url`, `author`, `license`, `license_url`, `attribution_required`, `width`, `height`, `bytes`, `label_confidence`, `review_status`, `reviewers`, `asset_type`, `training_eligible`, `exclusion_reason`, `audit_reason`, `collected_at`, `category_hint`, `retrieval` (category/subcategory/search), `quality` (colour profile) and `quality_flags`.
- `progress.json` — per-breed candidates vs 230 target + shortage.
- `collection_gap.json` — round-2 gap: eligible photos, target (default 30), remaining and estimated new candidates per priority breed.
- `images/candidates/{breed_id}/{sha256}.jpg` — always `unverified`, never `train`.

**Safety rails baked in:**
- Rate limit (`--min-interval` 2.0 s API / 0.6 s downloads) + 4 retries with `Retry-After` backoff on 429/5xx.
- Licence filter: accepts Public domain / CC0 / CC BY / CC BY-SA only; rejects NC, ND, missing author or licence, unrecognised terms.
- Integrity: Pillow verify + decode; JPEG/PNG only; both dimensions ≥400px; junk-title tokens (logo/map/artwork/museum/specimen…) skipped.
- Re-collection guard: exact SHA-256, frozen legacy-86 hashes, existing Commons titles, and dHash-64 near-duplicates (≤5 bits on 8×8 gray) all skip before a file is written.
- Colour gate: a photo must carry usable colour. White-balanced colour fraction and hue spread reject greyscale and sepia/duotone scans before they reach the manifest (`rejected_monochrome`).
- Relevance gate: Commons search fallback rows must name the breed in the file title, and titles naming vehicles/races/sports/memorials or a different breed (Cymric, bobtails) are dropped (`rejected_irrelevant`). Direct category and subcategory members keep the category hint but still drop irrelevant titles.
- Category recursion to **two** subcategory levels + paginated Commons `filetype:bitmap` search fallback so thin categories don't starve (Norwegian Forest cats = 0 files + 1 subcat; Manx files most photos under `Black tabby Manx cats → Black blotched tabby Manx cats`). Artwork/culture subcategories are never entered. Listing limits are capped at the Commons maximum of 500 per response.

**What this is not:** a labelling tool. Rows stay `candidates/unverified` with empty `reviewers` until the two-reviewer visual checklist pass. Do not promote to train/val/test splits from this script.

## Quality gates (round 2, added after batch 1)

Batch 1 (2026-11-10, 50 candidates) was unusable: 23 of the 25 Siamese rows were 1920s plates, book scans and B&W press photos, and 13 of the 25 Manx rows were Isle of Man TT motorcycles, Cymric/Owyhee Bob mislabels and portraits. Coat colour is a primary Siamese/Manx cue, so a monochrome scan cannot be labelled at all, and a motorcycle is not a cat photo however colourful it is.

**Colour gate** (`colour_profile` / `monochrome_reason`): sample to 160 px, apply a grey-world white balance (removes a global sepia cast), then count pixels with chroma ≥20 and value ≥45. A real colour photo keeps a broad hue spread; a B&W or sepia scan loses its tint and collapses to grey. Reject when `colour_fraction < 0.02` (greyscale) or `colour_fraction < 0.06` with `hue_entropy < 2.2` and `dominant_share ≥ 0.45` (toned monochrome). Calibrated on the pilot and batch 1: every historical B&W/sepia row sits below the line, while the pilot's colour photos keep ≥6 hue bins. Two already-verified but genuinely near-grey NFO photos are flagged too — the gate is deliberately conservative and only blocks **new** rows.

**Relevance gate** (`title_is_irrelevant`, `title_mentions_breed`, `title_has_foreign_breed`, `title_has_cat_context`): search-derived rows must contain the breed token as a whole word **and** a cat-context word (so "MV Manxman", "1966 Manx" the dune buggy and "Siamese fighting fish" are not cats); category and subcategory rows are trusted as retrieval hints. Titles naming motorcycles, races, ships, railways, sports, memorials, livestock (sheep/horses/cattle) or a different breed (Cymric, Owyhee/Mountain/Pixie-Bob, bobtails) are dropped everywhere, and foreign/artwork subcategories are not recursed into.

`--audit-quality` recomputes `quality_flags` on every existing row without deleting anything or inventing a review. `--reject-flagged` records a normal `rejected` verdict from the `quality-gate` reviewer for pending flagged rows; files, manifest rows and provenance stay. Reversing one needs a second reviewer, like any decision. The colour check runs after download (the thumb URL is all we have), so rejected scans still cost one fetch.

**Tests:** `backend\.venv\Scripts\python.exe -m pytest backend/tests/test_breed_collection.py backend/tests/test_collection_gap.py -q` — offline (mocked images, licence matrix, hash/dHash, manifest, progress, legacy-set size guard, gap math/exclusions, priority order, per-run semantics, colour/relevance gates, two-level category recursion, search pagination, quality audit and flagged-row rejection).

## Round-2 result (2026-11-12)

| Breed | Listings found | New candidates | Notes |
| --- | --- | --- | --- |
| Siamese | 224 | **40** | 4 monochrome, 4 legacy overlap, 3 licence, 2 near-dupe skipped; 50 already collected |
| Manx | 33 | **5** | 27 already collected; 1 licence + 1 legacy overlap skipped |

The Siamese top-up is healthy: every new row is a colour photo and `--audit-quality` leaves it flag-free. **Manx is the limiting case** — Wikimedia Commons exposes only ~33 usable listings across the whole category tree and search, so a repeat run always skips the same titles. Manx cannot reach 30 eligible photographs from Commons alone; it needs a second source or an accepted lower target.

Nothing was promoted: all 45 new rows are `pending` / `candidates` / `unverified` / `training_eligible=false`.

## Pilot report

See `Documentation/Breed-Dataset-Pilot-Report.md` for the 2026-11-09 pilot (125 candidates, 25/breed × 5).
