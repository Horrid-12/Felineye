# Domestic Cat Breed Dataset — Audit

**Date:** 2026-11-10 · **Status:** Audit only; no training, no production change.
**Reproduce:** `backend\.venv\Scripts\python.exe backend\scripts\audit_breed_dataset.py` → `backend/tests/fixtures/breed-validation/dataset_audit.json` (gitignored, regenerable). Counts below are measured, not estimated.

## 1. What exists today

| Source | Path | Tracked? | Role |
|---|---|---|---|
| Catalogue reference images | `backend/app/data/species_catalog.json` → `image_url` (1 per breed, 22) | Yes (URLs + attribution) | Curated portrait; easiest examples |
| Breed validation fixtures | `backend/tests/fixtures/breed-validation/images/` (95 files) + `manifest.json` + `audit.json` | Images gitignored; manifest+audit tracked | Weak-label Commons test set, **not a training set** |
| Real-weight regression photos | `backend/tests/fixtures/*.jpg` (british-shorthair, ragdoll, domestic-shorthair, tiger…) | Yes | Pipeline regression, 1 photo each |
| Model weights | `backend/models/*.onnx` (gitignored) | No | Inference only |
| Training data/scripts | — **none in repo** | — | No fine-tuning dataset exists |

Label mappings: `backend/app/data/cat_breed_labels.json` (48 classes → 22 CFA breeds + 10 generic + 16 unmapped). `backend/scripts/setup_identification_models.py` (`BREED_LABEL_MAP`) is the generator; `validate_breed_coverage.py` samples up to 4 Commons photos/breed + catalogue image, throttles 2.5 s/API call, skips logos/maps/artwork, requires ≥400×400.

Validation pipeline: 95 raw → 7 human-audited exclusions → 88 → 2 SHA-256 duplicates dropped → **86 scored** (Breed-Validation.md: 53.5% top-1, 75.6% top-3, 100% precision @ 20.9% coverage at 0.90/0.10).

## 2. Per-breed inventory (measured)

Raw = manifest rows; Unique = distinct SHA-256; Usable = raw − audited-out, then deduped. Resolution buckets: ≥1000×≥1000, 800px-class (≥800 wide & ≥600 tall), 400–799px, <400px.

| Breed | Raw | Unique | Audited out | Usable unique | Dup files | Resolution (usable) | Sources | Model-supported |
|---|---:|---:|---:|---:|---:|---|---|---|
| Abyssinian | 5 | 5 | 0 | **5** | 0 | 1×≥1k, 3×800, 1×400–799 | 1 catalog + 4 Commons | Yes |
| American Shorthair | 5 | 5 | 0 | **5** | 0 | 3×800, 2×400–799 | 1 + 4 | Yes |
| Balinese | 4 | 4 | 1 (Birman mislabel) | **3** | 0 | 2×800, 1×400–799 | 1 + 2 | Yes |
| Bengal | 5 | 5 | 0 | **5** | 0 | 1×≥1k, 3×800, 1×400–799 | 1 + 4 | Yes |
| Birman | 3 | 3 | 0 | **3** | 0 | 1×800, 2×400–799 | 1 + 2 | Yes |
| Bombay | 5 | 4 | 0 | **4** | **1** (catalog ≡ Commons `93669…`) | 3×800, 2×400–799 | 1 + 4 | Yes |
| British Shorthair | 5 | 5 | 1 (multi-subject) | **4** | 0 | 1×≥1k, 3×800 | 1 + 3 | Yes |
| Burmese | 5 | 5 | 0 | **5** | 0 | 3×800, 2×400–799 | 1 + 4 | Yes |
| Devon Rex | 5 | 5 | 0 | **5** | 0 | 1×≥1k, 3×800, 1×400–799 | 1 + 4 | Yes |
| Egyptian Mau | 5 | 5 | 0 | **5** | 0 | 5×800 | 1 + 4 | Yes |
| Maine Coon | 5 | 5 | 0 | **5** | 0 | 3×800, 2×400–799 | 1 + 4 | Yes |
| Manx | 3 | 3 | 1 (tail invisible) | **2** | 0 | 1×800, 1×400–799 | 1 + 1 | Yes |
| Norwegian Forest Cat | 1 | 1 | 0 | **1** | 0 | 1×400–799 (711×417) | **1 catalog only** | Yes |
| Persian | 5 | 5 | 0 | **5** | 0 | 3×800, 1×400–799, 1×<400 (357×500) | 1 + 4 | Yes |
| Ragdoll | 5 | 5 | 0 | **5** | 0 | 4×800, 1×400–799 | 1 + 4 | Yes |
| Russian Blue | 5 | 5 | 0 | **5** | 0 | 3×800, 2×400–799 | 1 + 4 | Yes |
| Scottish Fold | 5 | 5 | 0 | **5** | 0 | 3×800, 2×400–799 | 1 + 4 | Yes |
| Siamese | 5 | 5 | **3** (specimen, Sphynx mislabel, multi-subject+dog) | **2** | 0 | 1×800, 1×400–799 | 1 + 1 | Yes (×2: `Siamese`+`Applehead Siamese`) |
| Siberian | 3 | 2 | 0 | **2** | **1** (catalog ≡ Commons `8bad4…`) | 3×800 | 1 + 2 | Yes |
| Sphynx | 5 | 5 | 0 | **5** | 0 | 1×≥1k, 3×800, 1×400–799 | 1 + 4 | Yes |
| Tonkinese | 3 | 3 | 1 (hand-held kitten) | **2** | 0 | 1×≥1k, 1×800 | 1 + 1 | Yes |
| Turkish Angora | 3 | 3 | 0 | **3** | 0 | 2×800, 1×400–799 | 1 + 2 | Yes |

**Global:** 95 raw, 93 unique (2 duplicate groups), 7 audited out, **86 usable unique**. Per-breed usable range **1–5** (imbalance ratio 5.0×). Median file size 83–593 KB (≈1 image×18 KB outlier Turkish Angora `2570af…`). Global usable resolutions: **56×800px-class, 25×400–799, 6×≥1000, 1×<400**. 93/95 files are 400px+ (2×PNG: Balinese catalog, Birman Commons); all 95 decodable.

## 3. Label quality

- **Weak labels only.** Commons category membership ≠ pedigree. Human audit (7/95 excluded) removed museum specimens, mislabelled categories (Birman-as-Balinese, Sphynx-as-Siamese), multi-subject scenes, and tail-invisible Manx. Remaining 86 are *assumed* correct but unverified at pedigree level.
- **Licences (all 95):** catalog blank ×22 (attribution in catalog record), CC BY-SA 4.0 ×20, CC BY-SA 3.0 ×19, CC BY-SA 2.0 ×9, CC BY 4.0 ×8, Public domain ×5, CC0 ×4, CC BY 2.0 ×3, CC BY 3.0 ×2, Attribution ×1, CC BY 2.0 de ×1, No restrictions ×1. No NC/ND licences currently used — collection must keep it that way.
- **Catalogue "blank" is not missing:** every `catalog_*` row carries `image_attribution` in `species_catalog.json`; rights string is empty in manifest but attribution exists.

## 4. Class imbalance & missing/unsupported

- Only 15/22 breeds have ≥4 usable; **1 breed has 1 image (Norwegian Forest), 4 breeds have ≤2 (Manx, Siamese, Siberian, Tonkinese), 3 have 3 (Balinese, Birman, Turkish Angora)**. No breed is missing from the fixtures, but **Norwegian Forest is catalogue-only** (no external validation image).
- **Model-supported: 22/22 CFA breeds** representable in the 48-class head. `Himalayan` (class 23) is `unmapped` (not in CFA-22) and correctly abstains; 10 generic coat classes (Calico, DLH/DMH/DSH, Tabby, Tuxedo…) are abstention, not breeds. No CFA breed is unsupported by the head — shortage is *sample count*, not vocabulary.
- Domestic Longhair/Shorthair are **not CFA breeds** and have zero fixtures; they are generic abstention classes, not collection targets.

## 5. Weak-breed analysis (genuine failure vs ambiguous image)

Baseline (TTA, 86 images; report.json + benchmark_ferdifdi.json):

| Breed (n) | Top-1 | Asserted@0.80 | Evidence | Verdict |
|---|---|---|---|---|
| American Shorthair (5) | **0/5** | 0 | Mean top score 28%; top-1 errors → `Tuxedo` generic ×2. Model card F1 0.09 (worst class). Ferdifdi also 0/5. | **Genuine model failure**, not label noise (no audit exclusions). Likely DSH-coat overlap — photos indistinguishable from domestic short hair without pedigree. |
| Manx (2) | 1/2 | 0 | 1/3 raw excluded (tail invisible — audit); n=2 after dedupe. Card F1 0.18. | **Mixed:** tail-visibility ambiguity + tiny sample + weak head. Needs tail-visible positives. |
| Balinese (3) | **0/3** | 0 | 1/4 excluded (Birman gloves mislabel). Mean top 40%. | **Mixed:** 1 mislabel removed, remaining 3 still never correct. Genuine Balinese↔Siamese/Birman confusion + thin sample. |
| Siamese (2) | 1/2 | 1 correct | **3/5 excluded** (specimen, Sphynx mislabel, dog multi-subject). FP=5 from Burmese→Siamese×3. | **Contaminated sample.** Post-audit n=2 is meaningless; the high FP rate is genuine Burmese/Siamese overlap. |
| Birman (3) | 1/3 | **1 wrong assert** (of 2 asserted) | Mean top 88% (overconfident wrong); Ragdoll→Birman×2. | **Genuine overconfidence failure** in the Ragdoll/Birman/Siamese cluster. |
| Persian (5) | 3/5 | 2 correct | Errors → `American Bobtail`/`American Curl` unmapped ×2. Ferdifdi regressed to 2/5. | **Genuine**; Persian↔Exotic/Himalayan boundary. |
| Ragdoll (5) | 3/5 | 3 asserted, 1 wrong | Ragdoll→Birman×2; earlier ~78%→85% with TTA. | **Genuine cluster confusion**, TTA helps but doesn't fix. |
| Maine Coon (5) | **4/5 top-1** | **0 asserted** | Mean top score **39%** — ranking works, confidence fails the 0.90 floor. Siberian→Maine Coon×2 (reverse). | **Confidence/calibration failure**, not ranking. Lowest-risk fix (threshold/calibration) once more data arrives. |

Pattern: Siamese/Balinese/Birman/Ragdoll/Persian form one long-haired pointy cluster; American Shorthair is a generic-coat sink; Maine Coon is a confidence sink. Ambiguity (Manx tail, Siamese mislabels) was already audited out — residual n=2 breeds cannot support any rate estimate (±50% per image).

## 6. Conclusion

Current holdings: **86 usable unique weak-label images** (1–5/breed). No training set, no verified labels, no splits. Shortfall to 200–300 net verified/breed is **90–98% per breed**. Fine-tuning is not advisable until the collection plan is executed; see `Breed-Dataset-Collection-Plan.md`.
