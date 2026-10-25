# FelidLens 
### AI-Powered Feline Identification & Wildlife Discovery Platform

[![Status: Alpha](https://img.shields.io/badge/Status-Alpha%20(v0.1.0)-f472b6.svg)](https://github.com/Horrid-12/felidlens)
[![License: MIT](https://img.shields.io/badge/License-MIT-pink.svg)](https://opensource.org/licenses/MIT)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend: React-18](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61DAFB.svg)](https://vitejs.dev/)
[![Taxonomy: Felidae](https://img.shields.io/badge/Taxonomy-Felidae%20(41%20Species)-f472b6.svg)](https://www.iucnredlist.org/)

> [!IMPORTANT]
> **Alpha Release Notice:**
> FelidLens is currently in **Alpha** (v0.1.0-alpha). Features, neural inference models, and taxonomic mappings are in active development. Identification runs a local BioCLIP + ImageNet stack and reports visual-similarity estimates — **not calibrated probabilities**. Weak or conflicting evidence produces an explicit abstention rather than a forced species.

> [!NOTE]
> **Original Concept & Attribution:**
> FelidLens was inspired by the original idea and architecture of **[BirdLens](https://github.com/sdprojects12/birdlens)** by [sdprojects12](https://github.com/sdprojects12). Reimagined and built from the ground up for the entire cat family (**Felidae**), FelidLens introduces a pinky-gray velvet feline aesthetic, responsible wildlife coordinate obscuration, abstention-aware local inference, and a curated multi-lineage cat taxonomy.

---

**FelidLens** is an immersive wildlife discovery platform and AI field guide dedicated to the entire cat family (**Felidae**). Spanning 40 wild species plus the domestic cat (*Felis catus*), 22 CFA-verified breeds, and 4 informational hybrids, the application pairs local computer vision with honest uncertainty reporting, ethical wildlife conservation protocols, and a gamified naturalist expedition journal.

---

##  Key Features

1. **AI Feline Paw Scanner**:
   - Drag-and-drop, file picker, and mobile camera capture.
   - Pillow-based MIME, file size (up to 15MB), format, and EXIF sanitization.
   - Local inference: BioCLIP ViT-B/16 ranks 41 species prompts, and an independent MobileNetV2-12 ImageNet gate checks feline content.
   - Ranked candidate similarities with explicit score semantics and model rationales.
   - **Honest Abstention**: Weak margins, degraded images, or gate disagreement return `unable_to_identify` instead of guessing. Domestic breeds are reported as *Felis catus* with a breed-uncertainty note.
   - **Out-of-Domain Detection**: Non-feline images (dogs, reptiles, landscapes, vehicles) are rejected without returning deceptive predictions.
   - **No Silent Mock Fallback**: If the real weights are missing, the API returns `model_unavailable`. The simulation provider requires an explicit `CLASSIFIER_PROVIDER=dev_mock` and cannot award XP.
   - See [Identification Model](Documentation/Identification-Model.md) for setup, thresholds, and limitations.

2. **Comparative Morphology Analyzer**:
   - Side-by-side diagnostic comparisons between lookalike species (e.g. Jaguar vs. Leopard, Margay vs. Ocelot, Bobcat vs. Canada Lynx).

3. **Curated Felidae Species Atlas**:
   - 40 wild felids plus the domestic cat cataloged with peer-reviewed data based on Kitchener et al. (IUCN Cat Specialist Group), alongside 22 CFA breeds and 4 hybrids.
   - Filterable by subfamily (*Pantherinae* / *Felinae*), ecology (wild vs. domestic), and IUCN Red List status (CR, EN, VU, NT, LC, Domesticated).
   - Detailed species profiles with morphometrics, size, weight, diet, behavior, range, habitats, and links to iNaturalist and GBIF.

4. **Expedition Journal & Gamification**:
   - LocalStorage persistent progress for anonymous users.
   - Discovery XP, ranks (*Kitten Scout* up to *Supreme Felid Sovereign*), and milestone badges (*Roar of the Ancients*, *Shadows of the North*, *Guardian of the Wild*).
   - Rewards are server-authoritative and idempotent: a species pays XP once, a new photo of a known species is logged without XP, and the same image fingerprint is a no-op.
   - Visual catalog tracking logged vs. undiscovered felid silhouettes with celebratory confetti.

5. **Responsible Wildlife Observations**:
   - Research-grade feline sightings integrated from the iNaturalist Network API.
   - **Strict Conservation Safety**: All coordinates are generalized to prevent the disturbance or illegal poaching of endangered wildlife.

6. **Provider-Independent Architecture**:
   - Abstract `BaseClassifier` interface with a replaceable provider pipeline (BioCLIP + gate, ImageNet-only fallback, or explicit development simulation), and honest capability metadata on `/api/health`.

---

##  Quick Start Guide

### ⚡ One-Command Full-Stack Launch (Backend + Frontend)

Start both the FastAPI backend and Vite frontend concurrently with unified logging and graceful shutdown:

```bash
# Windows (PowerShell):
.\start.ps1

# Windows (Command Prompt / Double-Click):
start.bat

# Cross-Platform (Python):
python start.py
```

This launches:
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

Press `Ctrl+C` in the terminal to stop both services cleanly.

---

### Prerequisites
- **Node.js** >= v18.0.0
- **Python** >= 3.10 (Python 3.12 recommended; `uv` supported)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (using uv or python venv)
uv venv --python 3.12 .venv
# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
# (or: pip install -r requirements.txt)

# Run backend tests from the REPOSITORY ROOT (they import backend.app.*)
cd ..
backend\.venv\Scripts\python.exe -m pytest backend/tests -q

# Start FastAPI development server
backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

> [!IMPORTANT]
> **Configuration is read from OS environment variables at import time.** `.env` is **not** loaded automatically (no `python-dotenv`, no `--env-file`), and CORS origins are currently hardcoded. Export variables in your shell or pass uvicorn flags. See `.env.example` for the available names.

#### Install the identification weights

The default `CLASSIFIER_PROVIDER=auto` looks for local weights in `backend/models/`. They are intentionally gitignored. Without them the API returns `model_unavailable` — it does **not** fake a prediction.

```powershell
# Independent ImageNet feline gate (downloads ~13 MB)
backend\.venv\Scripts\python.exe backend\scripts\setup_identification_models.py --imagenet

# Full stack: export BioCLIP to ONNX + precompute text embeddings (~345 MB).
# This step needs a temporary environment with torch and open_clip_torch.
python -m venv .model-export
.model-export\Scripts\python.exe -m pip install --upgrade pip
.model-export\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.model-export\Scripts\python.exe -m pip install -r backend\requirements-models.txt
.model-export\Scripts\python.exe backend\scripts\setup_identification_models.py --all

# Verify what is installed
backend\.venv\Scripts\python.exe backend\scripts\setup_identification_models.py --check
```

Full setup details, provider modes, thresholds, and known limitations: [Identification Model](Documentation/Identification-Model.md).

The backend API will be available at:
- **API Root**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **System Health**: `http://127.0.0.1:8000/api/health`

---

### 2. Frontend Setup

```bash
# In a new terminal window, navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Build for production verification
npm run build

# Start Vite development server
npm run dev
```

The frontend application will be running at:
- **Web App**: `http://localhost:5173`

Vite is preconfigured to reverse-proxy `/api` requests directly to `http://127.0.0.1:8000`.

---

##  Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, active provider, model availability, and indexed species count |
| `POST` | `/api/identify` | Multipart image upload with validation, feline gating, ranking, and abstention |
| `GET` | `/api/species` | Search and filter Felidae species (subfamily, lineage, IUCN, wild/domestic) |
| `GET` | `/api/species/featured/today` | Daily featured iconic felid species |
| `GET` | `/api/species/{slug}` | Comprehensive species profile, traits, diet, and similar taxa |
| `GET` | `/api/breeds` | CFA breed catalogue (never counted as species) |
| `GET` | `/api/breeds/{slug}` | Breed profile linked to the domestic cat species |
| `GET` | `/api/catalog/hybrids` | Informational hybrid crosses (never returned by identification) |
| `GET` | `/api/catalog/meta` | Separate wild/domestic/breed/hybrid counts and provenance |
| `GET` | `/api/taxa/{slug}` | Unified species, breed, or hybrid detail |
| `GET` | `/api/observations` | Public feline observations with obscured conservation coordinates |
| `GET` | `/api/collection/species` | Roster checklist, discovery badges, and rank tiers |

---

##  AI Identification & Abstention Handling

### Pipeline

```
upload → content validation → quality gate → feline relevance
      → candidate ranking → taxonomy handling → confidence/uncertainty
      → presentation (or an explicit non-identification outcome)
```

| Role | Model | Licence |
| :--- | :--- | :--- |
| Species ranker | BioCLIP ViT-B/16 (`imageomics/bioclip`) | MIT |
| Feline gate | MobileNetV2-12, ImageNet-1k (ONNX Model Zoo) | Apache-2.0 |

The runtime needs only `onnxruntime`, `numpy`, and `pillow`. BioCLIP's vision encoder is exported to ONNX and the 49 species/non-feline text prompts are precomputed, so inference is fully local.

### Provider modes (`CLASSIFIER_PROVIDER`)

1. **`auto`** (default): BioCLIP + ImageNet gate when installed; otherwise ImageNet-only; otherwise `model_unavailable`. It never falls back to the mock.
2. **`bioclip`**: BioCLIP required; unavailable if missing.
3. **`imagenet`**: Degraded fallback for domestic cats and a handful of big cats only.
4. **`consensus`**: BioCLIP + gate required.
5. **`dev_mock`**: Explicit development simulation. Always `is_mock: true`, always `development_simulation`, never awards XP.

### Scores are not probabilities

BioCLIP produces a **cosine similarity** between the image embedding and a scientific-name prompt such as `a photo of a Panthera tigris.` The API therefore reports:

- `score_semantics: "bioclip_image_text_cosine_similarity"`
- `is_calibrated: false`
- `entropy: null` (no categorical distribution is produced)

A wild species is accepted only when its similarity clears a floor **and** separates from the runner-up by a margin. Defaults are `0.32` / `0.030` for wild species and `0.30` / `0.015` for the domestic cat. Those are conservative abstention settings tuned on the curated catalog plus negative images, **not** a calibration benchmark. Lynx genus ambiguity, domestic-vs-small-wildcat conflicts, gate disagreement, and poor image quality all produce `unable_to_identify`.

### Outcomes

| Status | Meaning | Discovery XP |
| :--- | :--- | :--- |
| `identified_wild_species` | Wild species cleared similarity and margin | Catalog reward |
| `identified_domestic_cat` | *Felis catus*; breed not asserted | Catalog reward |
| `identified_domestic_breed` | Reserved; the current provider never emits it | None |
| `non_feline_detected` | No feline content with sufficient evidence | None |
| `unable_to_identify` | Weak, conflicting, degraded, or genus-level evidence | None |
| `model_unavailable` | No real model installed; no prediction attempted | None |
| `processing_error` | Provider failed during inference | None |
| `development_simulation` | Explicit mock provider | None |

`is_discovery_eligible` and `xp_reward` are computed by the server. The frontend never derives rewards from presentation status.

For model setup, thresholds, the real-vs-mocked verification record, and known failure modes, see [Identification Model](Documentation/Identification-Model.md).

---

##  Responsible Wildlife Data Protocol

FelidLens strictly adheres to biodiversity conservation ethics:
- **No Precise GPS Coordinates**: Observations retrieved from the iNaturalist API have their latitude and longitude generalized to broad regional boundaries.
- **Anti-Poaching Protection**: Vulnerable, endangered, and critically endangered species (such as *Panthera tigris*, *Panthera uncia*, *Leopardus jacobita*) are shielded from precise location harvesting.
- **Wildlife Viewing Ethics**: Prominent in-app advisories remind users that past sighting records do not imply present animal location, and wild animals should never be disturbed in their natural habitats.

---

##  Testing

### Backend Test Suite
Run all tests from the **repository root** (tests import `backend.app.*`):
```bash
backend\.venv\Scripts\python.exe -m pytest backend/tests -q
```
This covers image validation, all identification outcomes, taxonomy filters, API contracts, and the atomic/idempotent collection store. Seven additional tests load the **real BioCLIP + ImageNet weights** from `backend/tests/fixtures/`; they skip automatically when the gitignored weights are absent, so run the model setup first to exercise them.

### Frontend Tests & Build
```bash
npm test --prefix frontend
npm run build --prefix frontend      # tsc -b && vite build
```

**Verified on 2026-10-25:** 55 backend tests passed (including the 7 real-weight tests), 21 frontend tests passed, and the production build succeeded.

---

##  Project Documentation

- [Taskflow](Documentation/Taskflow.md) — living roadmap with phase status, completed work, and next priorities.
- [Architecture Decisions](Documentation/Decisions.md) — decision log and the constraints each decision creates.
- [Identification Model](Documentation/Identification-Model.md) — real model setup, response contract, verification record, and limitations.
- [Agent Instructions](AGENTS.md) — repo-specific guidance for coding agents.

---

##  License & Attribution

- **Software**: MIT License
- **Original Inspiration**: [BirdLens](https://github.com/sdprojects12/birdlens) by [sdprojects12](https://github.com/sdprojects12)
- **Identification Models**: [BioCLIP](https://huggingface.co/imageomics/bioclip) (Imageomics Institute, MIT) and [MobileNetV2-12](https://github.com/onnx/models) (ONNX Model Zoo, Apache-2.0)
- **Taxonomic Classification**: Kitchener et al. (2017) IUCN SSC Cat Specialist Group
- **Observational Data**: [iNaturalist Network](https://www.inaturalist.org) (CC BY-NC 4.0)
- **Taxonomic Backbone**: [GBIF](https://www.gbif.org)
- **Conservation Classifications**: [IUCN Red List](https://www.iucnredlist.org)
