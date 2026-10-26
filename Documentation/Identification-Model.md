# Identification Model — Setup, Contract, and Limitations

This document describes the real identification stack that replaced the old
hash-based development heuristic. It records what was verified with the actual
weights, what is still unverified, and how to reproduce the setup.

## 1. What runs

| Role | Model | Source | Licence | Runtime file |
| --- | --- | --- | --- | --- |
| Species ranker | BioCLIP ViT-B/16 | [imageomics/bioclip](https://huggingface.co/imageomics/bioclip) | MIT | `backend/models/bioclip_vit_b16_vision.onnx` |
| Species text prompts | 41 catalog species + 8 non-feline prompts | Generated from `species_catalog.json` | MIT (derived) | `backend/app/data/bioclip_text_embeddings.npz` |
| Independent feline gate | MobileNetV2-12 (ImageNet-1k) | [ONNX Model Zoo](https://github.com/onnx/models) | Apache-2.0 | `backend/models/mobilenetv2-12.onnx` |
| Gate labels | ImageNet-1k class names | PyTorch hub / ONNX Model Zoo | BSD-style | `backend/app/data/imagenet_classes.txt` |

Runtime requirements are only `onnxruntime`, `numpy`, and `pillow` (already in
`backend/requirements.txt`). `torch` and `open_clip_torch` are needed **only** to
regenerate the BioCLIP ONNX export and are listed separately in
`backend/requirements-models.txt`.

### Why BioCLIP

BioCLIP is trained on TreeOfLife-10M (450k+ taxa). On the curated catalog images
it ranked wildcats far better than ImageNet, whose relevant classes are limited
to `tiger`, `lion`, `jaguar`, `leopard`, `snow leopard`, `cheetah`, `cougar`,
`lynx`, and five domestic-cat coat classes. ImageNet cannot represent margay,
ocelot, serval, caracal, Pallas's cat, and most small wildcats, so it is used
only as an independent content gate and as a degraded fallback.

### Why a separate gate

A species model that is asked "which cat is this?" will still return a cat for a
dog. The MobileNetV2 ImageNet model is trained differently and is asked a
different question: "does this look like a feline at all?". Both models must
agree before a feline result is accepted. On disagreement the pipeline returns
`unable_to_identify` and records the conflict in `feline_gate`/`uncertainty_note`.

## 2. Reproducing the weights

Weights are gitignored (`models/*.onnx`). The gate is downloadable directly; the
BioCLIP export needs a temporary environment with PyTorch.

### Gate only (works in the API venv)

```powershell
backend\.venv\Scripts\python.exe backend\scripts\setup_identification_models.py --imagenet
```

Pinned checksums:

| File | SHA-256 |
| --- | --- |
| `mobilenetv2-12.onnx` | `c0c3f76d93fa3fd6580652a45618618a220fced18babf65774ed169de0432ad5` |
| `imagenet_classes.txt` | `1f386e0d1cb6e28b9c2dac651c3dea6801e98ad1b41a14ce6bb1a093d72069f5` |

### Full stack (BioCLIP export)

```powershell
# 1. Temporary export environment (not the API venv)
python -m venv .model-export
.model-export\Scripts\python.exe -m pip install --upgrade pip
.model-export\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.model-export\Scripts\python.exe -m pip install -r backend\requirements-models.txt

# 2. Download the gate and export BioCLIP + text embeddings
.model-export\Scripts\python.exe backend\scripts\setup_identification_models.py --all

# 3. Verify what is installed
backend\.venv\Scripts\python.exe backend\scripts\setup_identification_models.py --check
```

The export takes a few minutes and downloads ~350 MB of model weights from
Hugging Face. The exported ONNX file is about 345 MB. Its SHA-256 depends on the
PyTorch/ONNX exporter version, so it is **not** pinned; the script prints the
digest it produced and verifies ONNX output against PyTorch when
`onnxruntime` is available in the export environment.

The precomputed text embeddings are small (about 97 KB) and are tracked in
`backend/app/data/` because they are deterministic derived data, not weights.

### Regenerating after a taxonomy change

The species prompts come from `backend/app/data/species_catalog.json`. After
adding or renaming a species, rebuild the catalog and re-run the BioCLIP step:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\build_catalog.py
.model-export\Scripts\python.exe backend\scripts\setup_identification_models.py --bioclip --force
```

## 3. Provider selection

`CLASSIFIER_PROVIDER` accepts:

| Value | Behaviour |
| --- | --- |
| `auto` (default) | BioCLIP + ImageNet gate if installed; otherwise ImageNet-only; otherwise `model_unavailable`. **Never** falls back to the mock. |
| `bioclip` | BioCLIP required; returns `model_unavailable` if missing. Gate is used when installed. |
| `imagenet` | ImageNet-only fallback. Supports domestic cats and a few big cats only. |
| `consensus` | BioCLIP + gate required; unavailable if either is missing. |
| `dev_mock` | Explicit development simulation. Always `is_mock: true`, always `development_simulation`, never awards XP. |

`GET /api/health` reports `provider`, `provider_kind`, `model_available`,
`is_mock`, model metadata, and `capabilities` (including `non_feline_gate` and
`discovery_eligible`).

## 4. Processing pipeline

1. **Upload validation** — MIME, size, decodability, dimensions, EXIF
   orientation, RGB conversion. This establishes a valid image, not a feline.
2. **Quality gate** — Laplacian-variance sharpness, brightness, and contrast.
   Degraded images are allowed to abstain; they never produce a forced species.
3. **Feline relevance** — BioCLIP non-feline prompt margin plus the independent
   ImageNet gate. Disagreement becomes `unable_to_identify`.
4. **Candidate ranking** — BioCLIP image embedding × 49 precomputed text
   embeddings. Species results are cosine similarities.
5. **Taxonomy handling** — hybrids are dropped; breeds are downgraded to
   `Felis catus` with an advisory; domestic and wild categories are preserved.
6. **Acceptance / abstention** — similarity floor and top-vs-runner-up margin,
   plus special handling for lynx species and domestic-vs-small-wildcat
   conflicts.

### Thresholds

Configured in `backend/app/config.py` and overridable by environment variables:

| Setting | Default | Meaning |
| --- | --- | --- |
| `BIOCLIP_MIN_WILD_SIMILARITY` | `0.32` | Minimum top cosine similarity for a wild species |
| `BIOCLIP_MIN_WILD_MARGIN` | `0.030` | Minimum lead over the runner-up |
| `BIOCLIP_MIN_DOMESTIC_SIMILARITY` | `0.30` | Minimum similarity for the domestic cat |
| `BIOCLIP_MIN_DOMESTIC_MARGIN` | `0.015` | Minimum lead for the domestic cat |
| `FELINE_MARGIN_THRESHOLD` | `0.04` | BioCLIP cat-vs-non-cat prompt margin |
| `QUALITY_BLUR_THRESHOLD` | `12.0` | Laplacian variance floor |
| `QUALITY_BRIGHTNESS_MIN/MAX` | `18 / 238` | Mean luminance bounds |
| `QUALITY_CONTRAST_MIN` | `8.0` | Grayscale standard-deviation floor |

These are **abstention** thresholds selected against the 41 curated catalog
reference images plus dog, crocodile, car, landscape, person, building, food, and
bird negatives. They are not calibrated probabilities and were not fitted on a
held-out benchmark. The API therefore reports `is_calibrated: false`,
`entropy: null`, and an explicit `score_semantics` string.

## 5. Response contract

Statuses:

- `identified_wild_species` — a wild species cleared similarity and margin.
- `identified_domestic_cat` — domestic cat at species level; breed not asserted.
- `identified_domestic_breed` — defined for completeness; the current provider
  never emits it.
- `non_feline_detected` — no feline content with sufficient evidence.
- `unable_to_identify` — feline content but weak, conflicting, degraded, or
  genus-level evidence. Candidates may be listed for comparison, but
  `top_candidate` is `null`.
- `model_unavailable` — no real model installed. No predictions are produced.
- `processing_error` — the provider failed during inference.
- `development_simulation` — the explicit mock provider is active.

Reward eligibility:

- `is_discovery_eligible` is **server-computed**.
- Only `identified_wild_species` and `identified_domestic_cat` are eligible.
- Mock, uncertain, non-feline, breed, failed, and unavailable results are never
  eligible.
- `xp_reward` comes from the catalog record and is `0` when ineligible.
- `image_fingerprint` is the SHA-256 of the uploaded bytes.

The frontend treats the server contract as authoritative and passes
`xp_reward`/`image_fingerprint` to an idempotent client store. A species is
rewarded once; a different photo of an already-discovered species is logged as a
`new_photo` with no XP; the same fingerprint is a `repeat_photo` no-op.

## 6. Verification record (2026-10-25, re-run 2026-10-26)

Latest full run: **55 backend tests passed** (7 of them real-weight tests against the
actual ONNX files), **22 frontend tests passed**, and `npm run build --prefix
frontend` succeeded. The mocked and real-model suites are reported separately
below because they prove different things.

### Verified with the real BioCLIP + ImageNet models

The regression fixtures in `backend/tests/fixtures/` are real Wikimedia Commons
photographs (see the README there for authors and licences). Running
`backend/tests/test_real_provider.py` loads the actual ONNX weights and asserts:

| Fixture | Observed status | Top result | XP | Gate |
| --- | --- | --- | --- | --- |
| `tiger.jpg` | `identified_wild_species` | Tiger (36%) | 350 | `tiger` 99.6% feline mass |
| `ragdoll.jpg` | `identified_domestic_cat` | Domestic Cat (34%) | 50 | `tabby` 85.6% feline mass |
| `serval.jpg` | `identified_wild_species` | Serval (36%) | 230 | `lynx` 97.1% feline mass |
| `chihuahua.jpg` | `non_feline_detected` | none | 0 | `Chihuahua` |
| `crocodile.jpg` | `non_feline_detected` | none | 0 | `African crocodile` |
| `chihuahua_with_crocodile.jpg` | `non_feline_detected` | none | 0 | `dhole` |

The exact percentages can vary by a point or two across exporter versions; the
tests assert statuses, taxonomy, eligibility, and XP, not brittle percentages.
The real-model tests skip automatically when the weights are absent.

Additional manual probes during implementation:

- Blurred tiger → `unable_to_identify` (quality gate plus gate disagreement).
- Solid grey image → `non_feline_detected`.
- Ragdoll → `Felis catus`, not margay or any wildcat.
- Chihuahua with a crocodilian → never a serval.

### Verified with the stub provider

`backend/tests/test_identification.py` uses a deterministic in-memory provider to
test every branch without weights: non-feline rejection, tiger/domestic results,
breed downgrade, close domestic-vs-wildcat abstention, invalid uploads,
low-quality abstention, ambiguous top-two candidates, `model_unavailable`,
repeated submissions, content conflict, and the development simulation. Mocked
tests prove pipeline behaviour; they do **not** prove model accuracy.

### Not verified

- Top-1 accuracy across all 40 wild species on an independent, held-out dataset.
- Breed identification. The current model does not support it.
- Calibration of cosine similarities into probabilities.
- Field photographs with heavy occlusion, night-time flash, or extreme crops.
- CPU latency at scale, concurrent request throughput, or memory ceilings.
- Remote model providers. The iNaturalist computer-vision endpoint was tested and
  returned HTTP 401 without credentials, so it was not selected.
- The ONNX export's numerical equivalence on platforms other than this Windows
  x86-64 machine.

## 7. Known failure modes

- **Small wildcats** — margay, ocelot, oncilla, Pallas's cat, jungle cat,
  black-footed cat, and Geoffroy's cat overlap visually and with domestic cats.
- **Rosetted big cats** — snow leopard and clouded leopard can be confused with
  each other or with other rosetted cats.
- **Lynx genus** — the pipeline refuses to choose among Eurasian, Canada,
  Iberian, and bobcat when the top two candidates are both lynx.
- **Domestic breeds** — breed cues are downgraded to `Felis catus`; a breed is
  never asserted from a single image.
- **Hybrids** — never in the vocabulary, never returned.
- **ImageNet fallback** — only domestic cats and a handful of big cats are
  representable. It is honest about that in its capability metadata.
- **Missing weights** — `/api/identify` returns `model_unavailable`; it does not
  guess and does not silently switch to the mock.

## 8. Troubleshooting

| Symptom | Check |
| --- | --- |
| `model_unavailable` | Run `setup_identification_models.py --check`; confirm paths in `backend/app/config.py` or the `BIOCLIP_*`/`IMAGENET_*` env vars. |
| `provider_kind: "imagenet"` under `auto` | BioCLIP ONNX or embeddings are missing. Re-run the BioCLIP export. |
| Every image is `unable_to_identify` | Check the gate is installed; inspect `feline_gate` and `quality` in the response. |
| `is_mock: true` | `CLASSIFIER_PROVIDER=dev_mock` is set. Unset it for real inference. |
| Health says `degraded` | No real provider is available. This is the intended honest state. |
