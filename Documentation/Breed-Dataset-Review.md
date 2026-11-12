# Breed Dataset — Human Review Workflow

**Date:** 2026-11-11 (updated for single-reviewer mode) · **Status:** Native workspace live; CLI kept as fallback. **One reviewer decides by default** (`REVIEW_APPROVALS_REQUIRED=1`); set `2` for dual verification. No auto-approval.

## Native workspace (primary)

App navigation **Dataset Review** (Navbar, ActivePage `dataset-review`). Design system: felid palette, brutalist cards, felid-accent/ivory/muted, display+mono typography, `bg-[#141218]` / `bg-[#0c0a0e]` / `bg-[#1d1922]` surfaces.

Flow: sign in with allow-listed reviewer handle (`REVIEWER_NAMES` + `REVIEWER_SESSION_SECRET` HMAC session) → Dashboard (total/unreviewed/awaiting-2nd/your-decisions/verified/rejected/ambiguous/contested cards, per-breed progress bars, candidate table, breed/verdict/progress/source filters) → Review workspace (one image at a time: large preview with zoom 0.5–4×, claimed breed, source title/link, author, licence, resolution/size, SHA-256, review count + your own decision, special check; Approve/Reject/Ambiguous with reason-required validation; prev/next + keyboard A/R/U and ←/→; position `n of N`).

Progress is tracked separately from the verdict: with `REVIEW_APPROVALS_REQUIRED=1` the decision is the verdict (no pending wait); with `2` a single decision increments `reviewed` / `awaiting_second` / `mine` while the row stays `pending`. Either way `GET /candidates?review_state=unreviewed|awaiting_second|mine|not_mine` filters on progress. The workspace queues only genuinely open rows — `status=pending` with no decision from you — so a row another reviewer already rejected (for example the `quality-gate` batch) does not reappear; the **include decided** toggle brings resolved rows back for inspection. It advances to the next open image after each decision and sends the row's real `review_count` as `expected_reviews`, so re-deciding a row 409s instead of silently duplicating.

Backend: `backend/app/routes/dataset_review.py` (`/api/dataset-review/*`): `POST /login`, `GET /me`, `GET /stats`, `GET /candidates` (filter+pagination), `GET /candidates/{id}`, `GET /candidates/{id}/image` (authenticated FileResponse, no fs paths in payloads), `POST /candidates/{id}/review` (optimistic `expected_reviews` + thread lock; duplicate → 409; stale → 409). Status logic stays in `breed_review.py` — React never computes it. Reviewer identity derives from the session token only.

Images: served as original bytes (`private, no-store`); 404 on missing/corrupt; path containment check.

## CLI fallback (unchanged)

```powershell
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py gallery
# or per-breed: gallery --breed siamese
```

Self-contained HTML: claimed breed, source title + description link, author,
licence, resolution, file size, review history, and the per-breed *special
check* prompt (Manx tail visibility; Siamese vs Balinese/Birman; Siberian vs
Maine Coon/Norwegian Forest; Norwegian Forest category-trust warning;
Tonkinese search false-positives). Open via file:// reference to dataset images.

## Deciding

```powershell
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py decide --image <sha256-prefix> --reviewer <name> --decision approved|rejected|ambiguous [--reason "..."]
```

- Rejected/ambiguous **require** `--reason`; approved does not (still recorded).
- Reviewer names are case-insensitive identities; duplicate per-image reviews are refused.
- `id` prefix accepted; ambiguous prefixes are refused (len != 1).
- Decisions append to `backend/datasets/breed-v1/reviews.jsonl` — append-only audit trail.

## Status logic (`breed_review.py`)

`REVIEW_APPROVALS_REQUIRED` (env, read at call time; default **1**, clamped 1–3) sets how many distinct reviewers must agree. `N` = the configured value.

| Status | Rule |
|---|---|
| `verified` | ≥N distinct reviewers, all approved |
| `rejected` | ≥N distinct reviewers, all rejected |
| `ambiguous` | ≥N distinct reviewers, all ambiguous |
| `contested` | mixed decisions present (approve+reject etc.) — **never auto-resolved**, regardless of N |
| `pending` | <N distinct reviewers |

With the default `1`, a single decision is final. With `2`, the earlier dual-sign-off rule applies. Config lives in `backend/.env` (loaded at import; OS env wins) and must be set before the backend starts; changing it then re-running `sync` re-derives statuses from the existing `reviews.jsonl` without deleting anything.

Labels are never changed; candidate images stay under `images/candidates/`.
`sync` rewrites manifest `review_status`/`label_confidence`/`reviewers` only —
`split` is never touched here, so nothing reaches train/val/test from review.

## Asset types

Fields: `asset_type` (9 values incl. `unknown`), `training_eligible`, `exclusion_reason` (`non_photographic_asset` | `asset_type_unknown` | `not_yet_verified`). Only `animal_photograph` + `historical_photograph` with a `verified` review enter a training export (`training_export_rows` filters) — a single approval cannot promote an `unknown` or non-photographic asset. Collector guesses conservatively from titles (real photos stay `unknown`); reviewers set the type manually in the workspace, and explicit classifications go to `asset_types.jsonl` (append-only: reviewer, previous type, scope, timestamp). Precedence on sync is classification log > review-time type > collector guess.

Bulk classification: `backend/scripts/classify_assets.py --reviewer <handle> --asset-type <type> [--status verified] [--breed <id>] [--apply]`, dry-run unless `--apply`. It records classifications only — it never changes a review decision or split.

Pilot audit (125, complete): 71 verified, 49 rejected, 5 ambiguous. Asset types after the audited bulk pass: 70 `animal_photograph`, 28 `unknown` (all rejected/ambiguous), 13 `book_illustration`, 5 `diagram_or_infographic`, 4 `painting_or_artwork`, 3 `historical_photograph`, 2 `sculpture_or_artefact`. Training-eligible: **70** (manx 9, Norwegian Forest 16, siamese 4, siberian 24, tonkinese 17). One verified `painting_or_artwork` is retained but excluded. Non-photographic rows keep metadata for a historical/cultural archive — never deleted, never trained on.

## Round 2 — collection gap

Target: **30 training-eligible photographs per breed** (`COLLECTION_TARGET_PER_BREED`, default 30, overridable with `--gap-target` or the API's `target` query). Priority order: `siamese`, `manx` (tier 1), `norwegian-forest-cat`, `tonkinese` (tier 2), `siberian` (tier 3 top-up).

```powershell
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --gaps
```

Writes `backend/datasets/breed-v1/collection_gap.json` and prints it. Per breed: `collected`, `reviewed`, `decided`, verified/rejected/ambiguous/contested/pending, `eligible`, `remaining`, `target`, `completion_pct`, `yield_rate`, `estimated_candidates_needed`, plus asset-type and exclusion counts. `eligible` is derived with `training_eligibility(asset_type, review_status)` — never `label_confidence` — so only verified `animal_photograph`/`historical_photograph` rows count; rejected, ambiguous, pending and non-photographic assets are excluded. The estimate is `ceil(remaining / yield_rate)`, where the yield comes from the completed pilot sample (blank until something is decided).

Current report (2026-11-12): **70 eligible / 80 remaining** — siamese 4/30, manx 9/30, Norwegian Forest 16/30, Tonkinese 17/30, Siberian 24/30. Eligible counts only move when pending rows are reviewed.

Authenticated `GET /api/dataset-review/gaps?target=30&breeds=siamese,manx` returns the same shape. The dashboard renders priority chips, eligible/target bars and remaining counts, refreshing with the review stats.

Second-round collection:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --breeds siamese,manx --per-breed 20
```

`--per-breed` is **new candidates this run**, not the breed total. Re-collection is blocked by exact SHA-256, the frozen legacy test hashes, existing Commons titles, and dHash-64 near-duplicates (hamming ≤5) against the whole manifest. New rows stay `split=candidates`, `label_confidence=unverified`, `review_status=pending`, `training_eligible=false`; nothing is promoted or trained.

### Batch-1 quality audit (2026-11-12)

The first batch (50 new candidates: 25 Siamese, 25 Manx) predates the
colour/relevance gates and was unusable: 23 Siamese rows were B&W or sepia
scans, and 13 Manx rows were motorcycles, Cymric/Owyhee Bob mislabels or
portraits.

`--audit-quality` adds derived `quality_flags` to the manifest without deleting
anything or inventing a review (`greyscale`, `toned_monochrome`,
`irrelevant_subject`, `foreign_breed`, `unreadable`). The dashboard shows them
as an amber chip on each candidate. `--reject-flagged` then records a normal
rejected verdict under the `quality-gate` reviewer:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --audit-quality
backend\.venv\Scripts\python.exe backend\scripts\collect_breed_dataset.py --reject-flagged --reviewer quality-gate
```

Batch 1 result: **36 of 50 rejected** (23 Siamese, 13 Manx), 14 kept pending
(12 Manx, 2 Siamese). All 175 image files and manifest rows remain, and the
flags stay visible after rejection. A `verified` row is never demoted by a flag,
and reversing a gate rejection needs a second reviewer like any decision. See
`Documentation/Breed-Dataset-Collection.md` for the gate thresholds.

### Batch-2 replacement collection (2026-11-12)

The replacement run used the new gates. Siamese: 224 listings → **40 new
candidates** written (50 already collected, 4 near-duplicates, 4 legacy
overlaps, 3 licence rejects, 4 monochrome rejects). All 40 are colour photos
with no flags.

Manx: Commons coverage is the bottleneck. Category/search traversal found only
**33 listings** in total (category depth 2 plus search pagination), of which 27
were already collected; the run wrote **5 new candidates** (4 at depth 2, 1 via
search) and rejected 1 licence + 1 legacy overlap. All 5 are genuine colour Manx
photos. **Manx cannot reach 30 eligible photos from Wikimedia Commons alone** —
every additional pass skips the same 27 titles. A second image source or a
relaxed retrieval route is needed before Manx can close its gap.

Manifest: 220 rows / 220 image files (85 rejected, 71 verified, 59 pending, 5
ambiguous). The 45 new rows are `pending`, `candidates`, `unverified`,
`training_eligible=false`; `--audit-quality` left all of them flag-free.

## Backend

`POST /api/dataset-review/candidates/{id}/review` accepts `asset_type` and persists it on the manifest row (synced immediately).

## Reports

```powershell
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py sync
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py report
```

`review_report.json` (gitignored): per-breed totals + verified/rejected/ambiguous/contested/pending + `reviewed`/`unreviewed`/`awaiting_second`/`mine` + rates. Initial state: **0 verified, 125 pending** — honest emptiness, not a missed deadline. Verified only moves with a second distinct reviewer.

**Tests:** `backend/tests/test_breed_review.py` (9, incl. single-reviewer default and `REVIEW_APPROVALS_REQUIRED=2` mode) + `backend/tests/test_dataset_review.py` (9, incl. progress counters, `review_state` filters, dual-mode pending, asset-type persistence and the authenticated gaps route) + `backend/tests/test_asset_types.py` (9, incl. bulk classification, dry run and overrides) + `backend/tests/test_collection_gap.py` (6, incl. eligibility exclusions, priority order, target override and round-2 dedupe/per-run semantics) + `frontend/src/tests/DatasetReviewPage.test.tsx` (6: login→dashboard, authenticated image blob, navigation/keyboard A/R, progress cards, collection-gap bars, decision advance + reason guard). Backend **127 passed**, frontend **44 passed**, build OK.
