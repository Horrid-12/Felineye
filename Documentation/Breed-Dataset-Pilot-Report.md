# Breed Dataset — Pilot Collection Report

**Date:** 2026-11-09/11 · **Status:** 125 unverified candidates; no training, no production change.

## Scope & protocol

Pilot breeds (schedule-critical, ≤2 usable each): Norwegian Forest Cat, Siamese, Manx, Siberian, Tonkinese — 25 new candidates/breed via `backend/scripts/collect_breed_dataset.py` (Commons category + subcat recursion + `filetype:bitmap` search fallback, 2.0 s/0.6 s throttles, 4 retries). All licence/integrity/dedupe rails on; historical 93 test SHA streams blocked as `legacy_overlap`.

## Outcomes (measured)

| Breed | Candidates written | Shortage to 230 | Notes |
|---|---:|---:|---|
| Norwegian Forest Cat | 25 | 205 | Direct category `Norwegian Forest cats` = **0 files, 1 subcat** — subcat recursion required; first run yielded 0 until recursion added |
| Siamese | 25 | 205 | First naive run: 6 written, 4 `legacy_overlap`; search fallback recovered full 25 |
| Manx | 25 | 205 | Direct category = 2 files — search fallback required |
| Siberian | 25 | 205 | Direct category = 2 files — top-up run needed |
| Tonkinese | 25 | 205 | Direct category = 3 files (1 anatomy image, 1 video) — search fallback returned 55 incl. false positives filtered by licence/size; dedupe handled re-listing |
| **Total** | **125** | — | **34.7 MB** on disk |

- All 125 rows: `split=candidates`, `label_confidence=unverified`, `reviewers=[]`. **Zero in train/val/test splits.** `splits.json` remains `{}` until verification.
- **Licences (125):** Public domain ×27, CC BY-SA 4.0 ×26, CC BY-SA 3.0 ×25, CC BY 2.0 ×15, CC BY-SA 2.0 ×12, CC BY 3.0 ×11, No restrictions ×4, CC0 ×3, CC BY 4.0 ×1, CC BY-SA 2.0 de ×1. NC/ND/missing-author rejections: 0 accepted violations; every row has author + licence + `description_url`.
- **Integrity:** min dimensions 422×408 (all ≥400×400 gate); SHA-256 exact + dHash near-dupe (≤5 bits) enforced; historical-test overlap = 0 written.
- **Historical 86 untouched.** `backend/tests/fixtures/breed-validation/` not modified by this phase.

## Issues found

1. Direct Commons categories are far thinner than the audit assumed (Norwegian Forest 0 files, Siamese 17 members incl. diagrams, Manx/Siberian/Tonkinese 2–3). Without subcat recursion + search fallback the pilot would have produced ~6 candidates, not 125.
2. `Tonkinese` search pollutes with historical "Tonkin/Tonk" non-cat results — title filter only partially guards; the two-reviewer pass must reject non-cat false positives.
3. The three collect runs hit shell timeouts (slow API + conservative throttles) but are idempotent (resume/top-up with same command).

## Next actions (gated)

1. Two-reviewer visual checklist pass on all 125 (Manx tail-visibility admission rule; Siamese specimen/multi-subject filename tokens).
2. Promote verified rows only to `train`/`val`; keep `test` canonical (existing 86 + new verified to 40/breed).
3. Expand to remaining 17 breeds only after review sign-off; no training until 230/breed net-verified + leakage audit passes.
