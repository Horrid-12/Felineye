# Breed Dataset — Human Review Workflow

**Date:** 2026-11-11 (updated for native workspace) · **Status:** Native workspace live; CLI kept as fallback. 125 candidates pending, 0 verified. No auto-approval.

## Native workspace (primary)

App navigation **Dataset Review** (Navbar, ActivePage `dataset-review`). Design system: felid palette, brutalist cards, felid-accent/ivory/muted, display+mono typography, `bg-[#141218]` / `bg-[#0c0a0e]` / `bg-[#1d1922]` surfaces.

Flow: sign in with allow-listed reviewer handle (`REVIEWER_NAMES` + `REVIEWER_SESSION_SECRET` HMAC session) → Dashboard (total/pending/verified/rejected/ambiguous/contested + per-breed progress + reviewer activity, breed/status/source filters) → Review workspace (one image at a time: large preview with zoom 0.5–4×, claimed breed, source title/link, author, licence, resolution/size, SHA-256, special check, existing decisions; Approve/Reject/Ambiguous with reason-required validation; prev/next + keyboard A/R/U and ←/→; position `n of N`).

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

| Status | Rule |
|---|---|
| `verified` | ≥2 distinct reviewers, all approved |
| `rejected` | ≥2 distinct reviewers, all rejected |
| `ambiguous` | ≥2 distinct reviewers, all ambiguous |
| `contested` | mixed decisions present (approve+reject etc.) — **never auto-resolved** |
| `pending` | <2 distinct reviewers |

Labels are never changed; candidate images stay under `images/candidates/`.
`sync` rewrites manifest `review_status`/`label_confidence`/`reviewers` only —
`split` is never touched here, so nothing reaches train/val/test from review.

## Asset types

Fields: `asset_type` (9 values incl. `unknown`), `training_eligible`, `exclusion_reason` (`non_photographic_asset` | `not_yet_verified`). Only `animal_photograph` + `historical_photograph` meeting two-review verification enter a training export (`training_export_rows` filters). Collector guesses conservatively from titles (real photos stay `unknown`); reviewers set the type manually via the workspace select. Pilot audit (125): `unknown` ×120, `diagram_or_infographic` ×2, `book_illustration` ×2, `painting_or_artwork` ×1 — the 5 non-photographic rows are **retained with metadata** for a historical/cultural archive, never deleted, never trained on.

## Backend

`POST /api/dataset-review/candidates/{id}/review` accepts `asset_type` and persists it on the manifest row (synced immediately).

## Reports

```powershell
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py sync
backend\.venv\Scripts\python.exe backend\scripts\review_breed_candidates.py report
```

`review_report.json` (gitignored): per-breed totals + verified/rejected/ambiguous/contested/pending + rates. Initial state: **0.0% approval across all 5 breeds (125 pending)** — honest emptiness, not a missed deadline.

**Tests:** `backend/tests/test_breed_review.py` (7) + `backend/tests/test_dataset_review.py` (5: auth, stats/filter/pagination, two-approver verification, duplicate/stale 409, contested, reason-required, auth-only image with no fs paths) + `frontend/src/tests/DatasetReviewPage.test.tsx` (3: login→dashboard, navigation/keyboard A/R, client-side reason guard). Backend **106 passed**, frontend **40 passed**, build OK.
