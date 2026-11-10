# Breed Dataset — Human Review Workflow

**Date:** 2026-11-11 (updated for single-reviewer mode) · **Status:** Native workspace live; CLI kept as fallback. **One reviewer decides by default** (`REVIEW_APPROVALS_REQUIRED=1`); set `2` for dual verification. No auto-approval.

## Native workspace (primary)

App navigation **Dataset Review** (Navbar, ActivePage `dataset-review`). Design system: felid palette, brutalist cards, felid-accent/ivory/muted, display+mono typography, `bg-[#141218]` / `bg-[#0c0a0e]` / `bg-[#1d1922]` surfaces.

Flow: sign in with allow-listed reviewer handle (`REVIEWER_NAMES` + `REVIEWER_SESSION_SECRET` HMAC session) → Dashboard (total/unreviewed/awaiting-2nd/your-decisions/verified/rejected/ambiguous/contested cards, per-breed progress bars, candidate table, breed/verdict/progress/source filters) → Review workspace (one image at a time: large preview with zoom 0.5–4×, claimed breed, source title/link, author, licence, resolution/size, SHA-256, review count + your own decision, special check; Approve/Reject/Ambiguous with reason-required validation; prev/next + keyboard A/R/U and ←/→; position `n of N`).

Progress is tracked separately from the verdict: with `REVIEW_APPROVALS_REQUIRED=1` the decision is the verdict (no pending wait); with `2` a single decision increments `reviewed` / `awaiting_second` / `mine` while the row stays `pending`. Either way `GET /candidates?review_state=unreviewed|awaiting_second|mine|not_mine` filters on progress. The workspace hides rows you already decided (toggle "include mine") and advances to the next unreviewed image after each decision; it sends the row's real `review_count` as `expected_reviews`, so re-deciding a row 409s instead of silently duplicating.

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

Fields: `asset_type` (9 values incl. `unknown`), `training_eligible`, `exclusion_reason` (`non_photographic_asset` | `asset_type_unknown` | `not_yet_verified`). Only `animal_photograph` + `historical_photograph` with a `verified` review enter a training export (`training_export_rows` filters) — a single approval cannot promote an `unknown` or non-photographic asset. Collector guesses conservatively from titles (real photos stay `unknown`); reviewers set the type manually via the workspace select, and a reviewer-set type in `reviews.jsonl` always wins over the collector guess on re-sync. Pilot audit (125): 114 `unknown`, 7 `book_illustration`, 2 `diagram_or_infographic`, 1 `sculpture_or_artefact` (the 1970 Isle of Man Manx coin), 1 `painting_or_artwork` — non-photographic rows are **retained with metadata** for a historical/cultural archive, never deleted, never trained on.

## Backend

`POST /api/dataset-review/candidates/{id}/review` accepts `asset_type` and persists it on the manifest row (synced immediately).

## Reports

```powershell
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py sync
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py report
```

`review_report.json` (gitignored): per-breed totals + verified/rejected/ambiguous/contested/pending + `reviewed`/`unreviewed`/`awaiting_second`/`mine` + rates. Initial state: **0 verified, 125 pending** — honest emptiness, not a missed deadline. Verified only moves with a second distinct reviewer.

**Tests:** `backend/tests/test_breed_review.py` (9, incl. single-reviewer default and `REVIEW_APPROVALS_REQUIRED=2` mode) + `backend/tests/test_dataset_review.py` (8, incl. progress counters, `review_state` filters, dual-mode pending and asset-type persistence) + `backend/tests/test_asset_types.py` (6) + `frontend/src/tests/DatasetReviewPage.test.tsx` (5: login→dashboard, authenticated image blob, navigation/keyboard A/R, progress cards, decision advance + reason guard). Backend **117 passed**, frontend **43 passed**, build OK.
