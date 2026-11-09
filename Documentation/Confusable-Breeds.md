# Confusable Breed Groups

**Status:** Implemented (backend + frontend + regression tests). Production thresholds unchanged (`BREED_MIN_CONFIDENCE 0.80`, `BREED_MIN_MARGIN 0.10`).

## Groups (visual-confusion only, `policy.CONFUSABLE_BREED_GROUPS`)

1. Colourpoint: Tonkinese / Siamese / Balinese
2. Long-haired colourpoint: Ragdoll / Birman
3. Persian / Himalayan (`Himalayan` is an unmapped class; still in group)
4. Large forest-cat: Maine Coon / Norwegian Forest / Siberian

New env-tunable: `BREED_CONFUSABLE_MARGIN=0.20` (inside a group, margins between top and nearest rival below 0.20 withhold the single breed). Scores remain uncalibrated softmax/similarity — never probabilities, never pedigrees.

## API

`IdentificationResult`: `breed_group_name`, `breed_group_candidates` (candidates with `score_percentage`). When uncertain: `breed: null`, group candidates listed, `breed_note` explains the confusable members and pedigree caveat. Breed XP behaviour unchanged (species-level XP only).

## UI

`BreedEstimatePanel` gets `groupName`/`groupCandidates`: renders **BREED GROUP — UNCERTAIN** with distinct ShieldQuestion treatments, never the confirmed-breed card or "Breed Profile" button. IdentifyPage passes the fields through.

## Regression cases (synthetic scores, not ground truth)

- Tonkinese 0.56 vs Siamese 0.50 → withheld + group.
- Siamese 0.84 vs Tonkinese 0.72 → **now withheld** (previously forced).
- Four parametrised pairs; clear winner 0.97 vs 0.02 still asserts.

**Tests:** `backend/tests/test_confusable_breeds.py` (8 new), frontend 37/37, backend 101/101, build OK.
