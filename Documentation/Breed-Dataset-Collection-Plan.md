# Domestic Cat Breed Dataset — Collection Plan

**Date:** 2026-11-10 · Companion to `Breed-Dataset-Audit.md` (measured counts cited there). **Status:** Plan only; nothing collected or trained.

## 1. Targets

Splits per breed (verified net, after dedupe + audit): **Train 150, Validation 40, Independent Test 40 = 230/breed** (within 200–300). 22 breeds → **5,060 images**. Test fold is the current 86-image set expanded to 40/breed under identical weak-label+human-audit protocol so old results stay comparable; train/val are strictly disjoint (see §4).

## 2. Per-breed shortfall (from measured usable counts)

| Breed | Usable now | Target | Shortage | Source priority | Licensing | Verification |
|---|---:|---:|---:|---|---|---|
| Abyssinian | 5 | 230 | 225 | Commons category `Abyssinian cats` + breeder-shared (written consent) | Commons CC/CC0/PD only; relicence via author email (CC BY-SA 4.0 acceptable, keep attribution) | 2-reviewer visual + tail/coat checklist; pedigree photo if available |
| American Shorthair | 5 | 230 | 225 | Commons `American Shorthair cats` + CFA show photos (permission) | Commons CC/CC0/PD; breeder images require explicit consent; **no NC/ND** | Coat-pattern checklist; reject DSH look-alikes → generic bucket, do not force |
| Balinese | 3 | 230 | 227 | Commons `Balinese cats` + Siamese-club archives | Commons CC/CC0; club images need consent | Blue-eye + long-coat + ear-set checklist; Birman-glove rejection rule |
| Bengal | 5 | 230 | 225 | Commons `Bengal cats` + TICA breeder portfolios | Commons CC/CC0; breeder consent | Rosette-pattern checklist; reject Savannah/Serengeti look-alikes |
| Birman | 3 | 230 | 227 | Commons `Birman cats` + breeder (gloved-paw verified) | Commons CC/CC0 | White-glove + seal/point checklist; Ragdoll-confusion second reviewer |
| Bombay | 4 | 230 | 226 | Commons `Bombay cats` + black-cat rescue archives | Commons CC/CC0 | Solid-black + copper-eye checklist; reject black DSH |
| British Shorthair | 4 | 230 | 226 | Commons `British Shorthair cats` | Commons CC/CC0/PD; N.B. 1 multi-subject already excluded — enforce single-cat rule | Round-face + plush-coat checklist; reject Scottish Fold background |
| Burmese | 5 | 230 | 225 | Commons `Burmese cats` + Burmese clubs | Commons CC/CC0 | Siamese-confusion checklist (Burmese top error ×3) |
| Devon Rex | 5 | 230 | 225 | Commons `Devon Rex` | Commons CC/CC0/PD | Large-ear + wavy-coat checklist |
| Egyptian Mau | 5 | 230 | 225 | Commons `Egyptian Mau` | Commons CC/CC0 | Spotted-coat checklist; strongest current breed — still needs volume for train/test parity |
| Maine Coon | 5 | 230 | 225 | Commons `Maine Coon cats` + rescue portfolios | Commons CC/CC0/PD | Size/ear-tuft + coat checklist; Siberian/Norwegian-Forest discriminator |
| Manx | 2 | 230 | 228 | Commons `Manx cats` + Manx rescue (tail-visibility rule: rump/tail must be visible) | Commons CC/CC0; rescue consent | Tail-visibility is an *admission* criterion; tail-invisible → `ambiguous` bucket, never forced |
| Norwegian Forest Cat | **1** | 230 | **229** | Commons `Norwegian Forest Cat` (category exists, sampled 0 so far) + club archives | Commons CC/CC0 | Tufted-ear + coat checklist; highest priority — only catalogue image today |
| Persian | 5 | 230 | 225 | Commons `Persian cats` + Exotic/Persian breeders (labelling must state Persian, not Exotic) | Commons CC/CC0 | Flat-face + long-coat checklist; reject Exotic/Himalayan |
| Ragdoll | 5 | 230 | 225 | Commons `Ragdoll cats` + breeder | Commons CC/CC0 | Ragdoll/Birman discriminator + eye-colour checklist |
| Russian Blue | 5 | 230 | 225 | Commons `Russian Blue cats` + rescues | Commons CC/CC0 | Solid-blue + green-eye checklist; reject Manx-blue ambiguity |
| Scottish Fold | 5 | 230 | 225 | Commons `Scottish Fold cats` | Commons CC/CC0/PD | Folded-ear checklist; both fold + straight varieties labelled `scottish-fold` |
| Siamese | 2 | 230 | 228 | Commons `Siamese cats` + Siamese clubs | Commons CC/CC0/PD | Point-colour + blue-eye checklist; **exclude museum/multi-subject by filename tokens** |
| Siberian | 2 | 230 | 228 | Commons `Siberian (cat)` + Siberian clubs | Commons CC/CC0 | Maine-Coon discriminator (reverse error ×2) |
| Sphynx | 5 | 230 | 225 | Commons `Sphynx (cat)` + owners (easy supply) | Commons CC/CC0 | Hairless + wrinkle checklist |
| Tonkinese | 2 | 230 | 228 | Commons `Tonkinese` + Tonkinese rescues | Commons CC/CC0 | Adult-only admission (kitten-in-hand exclusion precedent) |
| Turkish Angora | 3 | 230 | 227 | Commons `Turkish Angora` | Commons CC/CC0 | Long-white-coat checklist; discard <400px (1 asset at 550×412) |

**Totals:** 86 usable → **4,974 new net images**. Belgian-style sourcing volumes (Commons categories yielded only 1–4 usable per breed at `per_breed=4`) mean the gap is a **multiple-year accumulation + breeder-consent programme**, not a single scrape. Norwegian Forest, Siamese, Manx, Siberian, Tonkinese are schedule-critical.

**Licensing hard rules:**
- Accept: Public domain, CC0, CC BY (any version), CC BY-SA (any version, attribute + share-alike retained).
- Reject: any NC, ND, or "all rights reserved" / CFA-show-gallery without consent; reject missing attribution. Commons API `LicenseShortName` + `Artist` (author) captured at download.
- Do **not** download copyrighted datasets (Kaggle/Oxford-Pets mirrors, Pinterest, breeder sites) without a licence check dated and recorded per asset.

**Label verification (no silent relabelling):** two independent reviewers per asset against a per-breed visual checklist (ear set, coat/pattern, eye colour, tail visibility, white gloves, fold); disagreements → `label_confidence=low` + `ambiguous` bucket excluded from train; test fold requires *both* reviewers + no `audit_reason`. Generic-coat photos (DLH/DSH/Tabby/Tuxedo) stay in a separate `generic_dsh_dlh` bucket — never relabelled to a CFA breed.

## 3. Reproducible dataset structure (design, not yet populated)

```text
backend/datasets/breed-v1/
  manifest.jsonl        # one row/image: see schema below
  splits.json           # {train:[ids], val:[ids], test:[ids]}
  README.md             # provenance, licences, checksums
  images/{train,val,test}/{breed_id}/{sha256}.jpg   # gitignored except manifest+splits
```

**Manifest row (JSONL):**
```json
{"id":"sha256-hex","breed_id":"ragdoll","split":"train","file":"images/train/ragdoll/<sha256>.jpg",
 "sha256":"…","source":"wikimedia-commons","title":"…","description_url":"…","author":"…",
 "license":"CC BY-SA 4.0","license_url":"…","attribution_required":true,
 "width":960,"height":640,"bytes":123456,"label_confidence":"high|low","reviewers":["A","B"],
 "audit_reason":null,"collected_at":"2026-11-10"}
```
**Leakage prevention:** split by SHA-256 *and* perceptual-hash clusters (re-photographs of same cat/session grouped); exact-byte duplicates dropped globally before splitting; splits frozen in `splits.json`; test ids frozen first (existing 86 usable ids are test-canonical). Current 86-image set becomes `test` seed; train/val must have **zero SHA overlap** with historic benchmark hashes (recorded in `benchmark_ferdifdi.json` `test_set_sha256`).

**Governance gate:** this plan + `Breed-Dataset-Audit.md` reviewed before any acquisition; training begins only after 230/breed net-verified and a leakage audit passes. Production thresholds, XP logic, and UI stay untouched throughout.
