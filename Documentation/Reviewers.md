# Reviewer Roster

**Date:** 2026-11-11 · **Status:** Handles registered; sessions disabled until secrets are configured.

| Handle | Role | Rationale |
|---|---|---|
| `reviewer-a` | **Primary reviewer (operator)** | Owner/approver of the 125 pilot candidates; sign in via Dataset Review → handle |
| `reviewer-b` | **Second reviewer (independent)** | Must be a human other than approval author; required for verification (2 distinct approvals) |
| `reviewer-c` | **Reserve** | Available for contested tie-input (never auto-resolves) |

## Configuration (backend env, never committed)

```powershell
$env:REVIEWER_NAMES="reviewer-a,reviewer-b,reviewer-c"
$env:REVIEWER_SESSION_SECRET="<generated 32-byte hex secret, rotated per season>"
$env:DATASET_ROOT="D:\Software\Felineye\backend\datasets\breed-v1"
```

- Without a secret, `/api/dataset-review/login` returns **503** and the workspace cannot start — no anonymous reviews.
- Sessions are HMAC tokens per handle; chat/CLI `--reviewer` values are compared case-insensitively and duplicates are refused.
- Decisions land in `backend/datasets/breed-v1/reviews.jsonl` with reviewer, decision, reason, UTC timestamp.

## Rules

- The two approvals must come from **different handles** on different sessions.
- No reviewer may edit another reviewer's row (append-only; reconciliation = new contested input, never silent overwrite).
- Reject/ambiguous decisions always carry a reason; categories stay `candidates` until verified.
