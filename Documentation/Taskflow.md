# Taskflow — Roadmap

> AI-powered feline identification and wildlife discovery platform.
>
> **Status:** Alpha v0.1.0. Real BioCLIP + ImageNet identification is integrated with conservative abstention, and discovery rewards are server-authoritative and idempotent. Weights are gitignored and reproduced with `backend/scripts/setup_identification_models.py`.
>
> **Last verified:** 2026-10-25 — 55 backend tests (7 of them against the real ONNX weights), 21 frontend tests, frontend build passing.

## How to Use This File

- Work on phases in order unless a task is explicitly marked parallelizable.
- Mark a checkbox `[x]` only after the task is implemented and verified.
- If a task is blocked, record the reason next to it and continue with independent work.
- Keep mock data and simulated AI predictions clearly labelled as development-only.
- Never claim a test, integration, model capability, or deployment succeeded unless it was actually verified.
- After every behaviour, command, architecture, or roadmap-relevant change, update this file (see `AGENTS.md`).

## Roadmap at a Glance

| Horizon         | Focus                                                           | State       |
| :-------------- | :-------------------------------------------------------------- | :---------- |
| **Now**   | Calibration benchmark, breed support, security hardening        | In progress |
| **Next**  | CI, automated quality gates, accessibility, data-quality tests  | Planned     |
| **Later** | Release readiness, deployment, deep-linkable URLs               | Planned     |

## Phase 0 — Reconnaissance and Planning

- [X] Inspect the repository, dependencies, and current Git state.
- [X] Confirm the FastAPI + React/Vite architecture and package boundaries.
- [X] Document the provider-independent classifier strategy and mock fallback.
- [X] Document data sources, attribution, and conservation constraints.
- [X] Record architecture decisions and constraints in `Documentation/Decisions.md`.
- [X] Establish this roadmap with phases, checkboxes, and exit criteria.

**Exit criteria:** Architecture, risks, data sources, and implementation sequence are documented. No unverified model capability is presented as fact.

## Phase 1 — Foundation and Design System

- [X] Set up React 18, TypeScript, Vite 5, and Tailwind CSS 3.
- [X] Set up the Python/FastAPI backend skeleton and requirements.
- [X] Add `.env.example` and ignore local secrets and model weights.
- [X] Add root launchers: `start.py`, `start.ps1`, `start.bat`.
- [X] Add `GET /api/health` with provider and catalog status.
- [X] Define the pink-gray `felid-*` design tokens, typography, and layout.
- [X] Build reusable cards, badges, modal, loading, empty, and error patterns.
- [X] Add basic focus styles, aria labels, and semantic layout landmarks.
- [X] Implement responsive navbar, mobile menu, and footer.
- [X] Remove navbar duplication: entries that mirrored another control were dropped — `Paw Scanner` and the `SCAN` shortcut (both duplicated the home hero "Scan a Cat Photo" CTA), `Expedition Log` (duplicated the rank capsule, which already opens the collection page), and `Cat Haven` (duplicated the `FELIDLENS` brand button, which returns home).
- [X] Implement state-driven page switching (`ActivePage` in `App.tsx`).
- [X] Scaffold Home, Identify, Atlas, Detail, Collection, Observations, and Methodology pages.

**Exit criteria:** Frontend and backend start locally; pages render; design tokens and shared patterns are reusable.

## Phase 2 — Home Dashboard

- [X] Build the hero section and primary identification call to action.
- [X] Compact the hero (tighter padding, smaller display type, shorter metrics strip) so the fold shows the featured feline sooner.
- [X] Drop the "Scientific Rigor & Feline Protection" card strip from the home page; that material lives on the Methodology page.
- [X] Add the featured feline of the day.
- [X] Add discovery progress, rank, and XP summaries.
- [X] Add entry points to the Species Atlas and Collection.
- [ ] Add a home-page entry point to the Observation Explorer.
- [ ] Add a "recently discovered" section.
- [X] Use licensed imagery with attribution (Wikimedia Commons lead image per species, author + license recorded).
- [X] Make the displayed species count derive from the catalog instead of hardcoded copy.
- [ ] Add an explicit error/retry state when the featured-species request fails.
- [ ] Add automated responsive/visual regression coverage.

**Exit criteria:** The home page is polished, responsive, and its scientific claims match the actual catalog.

## Phase 3 — Identification Experience and API Contract

### Frontend

- [X] Implement drag-and-drop upload, file picker, and mobile camera capture.
- [X] Preview and remove the selected image.
- [X] Validate file type and size before upload.
- [X] Display upload, scanning, success, uncertain, non-feline, model-unavailable, and processing-error states.
- [X] Display ranked candidate cards with explicit score semantics and model rationales (no `CONFIRMED` label).
- [X] Add retry and upload-another-image actions.
- [X] Show a persistent warning when `is_mock` is true.
- [X] Show an explicit "model unavailable" panel instead of a fake prediction, with the setup hint from the server.
- [X] Surface the independent feline gate result and the uncalibrated-score disclosure.
- [X] Award XP only from the server's `is_discovery_eligible` / `xp_reward` fields, with new-species, new-photo, and repeat-image notices.
- [ ] Make the dropzone fully keyboard-operable and add a complete accessibility pass.
- [ ] Add a frontend test for the full identify flow (success, uncertain, non-feline, model-unavailable, API error, reward notices). Current tests cover the card and collection store, not the page.

### Backend

- [X] Implement `POST /api/identify`.
- [X] Define typed request/response schemas and explicit identification states.
- [X] Validate actual image content, MIME type, dimensions, and size with Pillow.
- [X] Process uploads in memory; do not persist temporary image files.
- [X] Normalize EXIF orientation and convert to RGB before inference.
- [X] Add a provider interface (`BaseClassifier`) and pipeline.
- [X] Implement the development simulation provider and propagate `is_mock`.
- [X] Replace the hash/thumbnail heuristic and the silent mock fallback: `auto` never falls back to the mock, and an explicit `dev_mock` is required for simulation.
- [X] Return the eight substantive outcomes: wild species, domestic cat, domestic breed, non-feline, unable to identify, model unavailable, processing error, and development simulation.
- [X] Integrate BioCLIP ViT-B/16 as the zero-shot species ranker and MobileNetV2-12 ImageNet as an independent feline/non-feline gate.
- [X] Add a deterministic quality gate (Laplacian sharpness, brightness, contrast) that can abstain but never fabricates a species.
- [X] Report candidate scores honestly: `score_semantics` is a cosine similarity, `is_calibrated: false`, and `entropy: null` because no categorical distribution is produced.
- [X] Enforce category-aware identification: hybrids are never returned, and a breed-level cue is downgraded to the domestic cat species with an explicit breed-uncertainty note.
- [X] Add structured 4xx errors and a global safe 500 handler.
- [X] Cover validation, status handling, and API contracts with tests, including ten named regression cases.
- [X] Add real-photo fixtures and a separate test module that exercises the actual ONNX weights (skips when the weights are absent).
- [X] Validate that MIME acceptance alone is insufficient: a decodable image can still be rejected as non-feline.
- [ ] Add per-request inference timeouts.
- [ ] Add rate limiting and a server-level upload size limit.
- [ ] Stop returning raw exception text in `/api/identify` 500 responses.
- [ ] Replace the BioCLIP non-feline prompt margin with a dedicated out-of-domain detector if one proves materially better.

**Exit criteria:** Upload flows are robust, predictions are never misrepresented, and all identification tests pass from the repository root.

## Phase 4 — Species Atlas

- [X] Implement `GET /api/species` with search, subfamily, lineage, IUCN, wild/domestic, habitat, and pagination support.
- [X] Build the atlas grid with search, subfamily, wild/domestic, and IUCN filters.
- [X] Implement species detail profiles with morphology, diet, behaviour, range, and similar taxa.
- [X] Add the comparative morphology modal for lookalike species.
- [X] Add the daily featured species endpoint and UI.
- [X] Complete the wild catalog to the 2017 CatSG set: 40 wild species plus the domestic cat. The audit of the previous 37 entries found no duplicates and no per-entry binomial errors, but four CatSG species were missing (`Leopardus tigrinus`, `Leopardus guttulus`, `Leopardus colocolo`, `Prionailurus javanensis`).
- [X] Replace remaining hardcoded "41 species" UI copy with values derived from the catalog.
- [ ] Surface lineage and habitat filters in the frontend.
- [X] Add a schema-validation test for catalog IDs, required fields, and duplicate keys (`backend/tests/test_catalog.py` plus generator assertions).
- [X] Re-source every species image from Wikimedia Commons; the earlier Unsplash URLs were mismatched (cheetah, snow leopard, clouded leopards, Asian golden cat and others showed unrelated subjects).
- [ ] Verify IUCN statuses and taxon IDs for every record (image attribution is now verified for all 41 species records; the four newest species intentionally omit external taxon IDs where databases split the CatSG treatment).
- [X] Re-verify every image URL with rate-limit-safe pacing. All 110 unique catalog image URLs returned HTTP 200 on 2026-10-25; the earlier 14 failures were Wikimedia HTTP 429 throttling, not missing files.

### Taxonomy split: wild species, domestic breeds, and hybrids

- [X] Audit the existing 41-species claim before changing counts; keep every valid record.
- [X] Model explicit categories: `wild_species`, `domestic_species`, `domestic_breed`, `hybrid`, with `rank` and `parent_id` on each record.
- [X] Regenerate `species_catalog.json` as `{taxonomy, species, breeds, hybrids}` and enforce counts in `build_catalog.py` (40 wild, 1 domestic, 22 breeds, 4 hybrids, unique IDs, parent links, registry URLs, images, provenance).
- [X] Curate 22 CFA-verified domestic breeds, including all eight required breeds (Ragdoll, Persian, Siamese, Maine Coon, Bengal, Sphynx, British Shorthair, Scottish Fold). TICA was blocked (403) and is not claimed; Exotic and Oriental Shorthair were excluded because their CFA URLs returned 404.
- [X] Keep hybrids (Liger, Tigon, Leopon, Pumapard) in a separate collection excluded from species and breed counts.
- [X] Add `/api/breeds`, `/api/breeds/{slug}`, `/api/catalog/meta`, `/api/catalog/hybrids`, and unified `/api/taxa/{slug}`; add a `category` filter to `/api/species`.
- [X] Add a Domestic Cats section under the Species Atlas “Domestic Cat” filter: domestic species card, searchable CFA breed grid, hybrids, and taxonomy note. The earlier standalone page and navbar entry were removed so there is one canonical route to breeds; the home CTA opens the atlas with that filter active.
- [X] Add separate counts on Home, Atlas, Collection, and Methodology, plus category-aware candidate badges.
- [X] Keep the collection roster species-only; breeds are not discoverable and never inflate progress totals.
- [X] Document the taxonomy authority, CFA registry, hybrid exclusion, and breed-uncertainty rule in `Decisions.md` and the Methodology page.
- [ ] Decide whether the breed roster should expand toward the full CFA list or stay a representative subset.
- [ ] Add a documented refresh procedure for CFA URLs and registry verification dates.

**Exit criteria:** The atlas matches the curated catalog exactly, wild species and breeds are counted separately, and tests prevent count/schema drift.

## Phase 5 — Responsible Observations

- [X] Fetch research-grade feline observations from iNaturalist.
- [X] Generalize locations and always set `coordinates_obscured: true`.
- [X] Provide curated fallback records when the external API fails.
- [X] Add source links and attribution in the observations UI.
- [X] Add loading, empty, and error states.
- [X] Cache successful responses in memory.
- [ ] Fix caching so the TTL is tracked per query key rather than globally.
- [ ] Either use `GbifService` for taxonomy verification or remove it from the codebase.
- [ ] Add tests that mock both iNaturalist success and failure (no live network in unit tests).
- [ ] Add a regression test asserting that no latitude/longitude fields are exposed.

**Exit criteria:** Observations are resilient offline, tested without network access, and cannot leak precise coordinates.

## Phase 6 — Collection and Gamification

- [X] Persist discoveries, XP, and rank progress in `localStorage`.
- [X] Implement rank tiers and progression.
- [X] Implement badge evaluation, progress display, and unlock feedback.
- [X] Add confetti, journal visuals, and clear-progress support.
- [X] Cover discovery de-duplication and rank-up behaviour with tests.
- [X] Keep the collection roster species-only; domestic breeds are catalogue-only and never unlock discoveries or XP.
- [X] Award XP only when the server marks a real, successful species-level result as discovery-eligible; mock, uncertain, non-feline, failed, and unavailable results never reward.
- [X] Distinguish new-species discovery, new-photo-of-known-species (no XP), and repeat-image no-op, keyed by server image fingerprint.
- [X] Make reward updates atomic and idempotent with a shared module store (`useSyncExternalStore`), an injectable clock, and XP recomputed from persisted records.
- [X] Use the catalog `xp_reward` instead of the old fixed 150/100 rule.
- [X] Normalize legacy localStorage records and recompute totals during load.
- [ ] Consolidate badge and rank definitions so backend and frontend cannot drift.
- [ ] Add an explicit versioned schema migration path (beyond best-effort normalization) for the localStorage key.
- [ ] Add a frontend test that mounts the identify page and asserts rewards are only recorded for eligible results.

**Exit criteria:** Collection state has a single documented source of truth and survives schema changes safely.

## Phase 7 — Methodology and Responsible AI

- [X] Document the real inference pipeline and the abstention policy (similarities, not entropy or calibrated probabilities).
- [X] Document the conservation and coordinate-obscuring protocol.
- [X] Add data provenance and taxonomy citations.
- [X] Document the separate wild/domestic/breed/hybrid categories, the CFA registry source, and the breed-uncertainty disclosure.
- [X] Disclose the development simulation in the identification UI.
- [X] Publish model provenance, licences (BioCLIP MIT, MobileNetV2 Apache-2.0), thresholds, limitations, and the real-vs-mocked verification record in `Documentation/Identification-Model.md` and the Methodology page.
- [ ] Calibrate the abstention thresholds on an independent, held-out evaluation set and publish accuracy/coverage per species.
- [ ] Add breed support only with evidence appropriate to breed-level claims (and keep abstention when evidence is weak).

**Exit criteria:** The methodology page accurately describes the implementation, including its limits.

## Phase 8 — Real Inference Integration

- [X] Select a Felidae-capable model and document its license, input contract, and class set (BioCLIP ViT-B/16, MIT; 41 species prompts + 8 non-feline prompts).
- [X] Export the BioCLIP vision encoder to ONNX and precompute text embeddings so runtime needs only `onnxruntime`, `numpy`, and `pillow`; verify ONNX output against PyTorch.
- [X] Define model artifact naming, placement (`backend/models/`), checksums, and a reproducible setup script (`backend/scripts/setup_identification_models.py`).
- [X] Add an independent MobileNetV2-12 ImageNet feline gate and require both models to agree before accepting a feline result.
- [X] Add preprocessing and inference smoke tests with real fixtures, plus weight-gated real-provider regression tests.
- [X] Add out-of-domain handling for the real model path (BioCLIP non-feline prompts + independent gate + quality gate).
- [X] Pass a real species mapping into the classifier; `species_idx_N` placeholders were removed with the old `OnnxClassifier`.
- [X] Verify `/api/health` reports a non-mock provider and `/api/identify` returns `is_mock: false` with the local weights installed.
- [X] Publish model limitations and failure modes in the Methodology page and `Documentation/Identification-Model.md`.
- [ ] Calibrate confidence and similarity thresholds on a held-out evaluation set (current thresholds are conservative abstention settings tuned on the curated catalog plus negatives).
- [ ] Publish accuracy/coverage metrics per species and a confusion matrix.
- [ ] Add a per-request inference timeout and bounded concurrency for CPU inference.
- [ ] Add automated checksum verification (or a CI cache) for the reproducible weight setup.

**Exit criteria:** A real model runs end-to-end with verified catalog mappings, documented metrics, and honest uncertainty reporting.

## Phase 9 — Hardening and Quality Gates

- [ ] Load `.env` explicitly (or document exported variables) and make CORS origins environment-driven.
- [ ] Delete or reinstate `components/layout/Footer.tsx`, which is not rendered by `App.tsx` (dead code today).
- [ ] Add catalog schema validation to startup or CI (the generator validates counts and links, but nothing enforces it at runtime or in CI).
- [ ] Add frontend test setup for jest-dom and accessibility assertions.
- [ ] Add error boundaries and reduced-motion support.
- [ ] Configure linting and formatting, and document the commands.
- [ ] Add CI that runs backend tests, frontend tests, typecheck, and build.
- [ ] Add a minimal end-to-end smoke test for the full-stack flow.
- [ ] Add coverage baselines and a performance budget for the frontend bundle.

**Exit criteria:** CI is the source of truth for correctness, and unit tests do not depend on live external services.

## Phase 10 — Release Readiness

- [X] Organize project documentation in `Documentation/`.
- [X] Define the roadmap and keep it updated after changes.
- [X] Keep `AGENTS.md` at the root for coding-agent discovery.
- [X] Provide interactive API documentation via FastAPI `/docs`.
- [X] Correct the README environment setup (`.env` is not auto-loaded) and document the real model setup path.
- [X] Link the identification-model documentation from the README and Methodology page.
- [ ] Choose and document a deployment target and production serving model.
- [ ] Define versioning and release checklist (changelog, screenshots, license, attribution).
- [ ] Decide whether deep-linkable URLs are required; if so, replace state navigation with a router.
- [ ] Decide whether the Home, Identify, and Collection pages need nav entries or active-state mappings now that their navbar shortcuts were removed (Home: highlight the brand button; Identify: map to Home; Collection: the rank capsule/drawer status row already opens it).
- [ ] Complete a manual accessibility, responsive, and performance pass.

**Exit criteria:** A new maintainer can set up, verify, deploy, and release from the documentation alone.
