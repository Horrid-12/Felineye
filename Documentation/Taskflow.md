# Taskflow — Roadmap

> AI-powered feline identification and wildlife discovery platform.
>
> **Status:** Alpha v0.1.0. The app runs end-to-end, but identification is simulated unless a compatible ONNX model is supplied and wired.
>
> **Last verified:** 2026-10-25 — 17 backend tests, 8 frontend tests, frontend build passing.

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
| **Now**   | Real inference wiring, catalog completeness, security hardening | In progress |
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
- [X] Use licensed imagery with attribution.
- [ ] Make the displayed species count derive from the catalog instead of hardcoded copy.
- [ ] Add an explicit error/retry state when the featured-species request fails.
- [ ] Add automated responsive/visual regression coverage.

**Exit criteria:** The home page is polished, responsive, and its scientific claims match the actual catalog.

## Phase 3 — Identification Experience and API Contract

### Frontend

- [X] Implement drag-and-drop upload, file picker, and mobile camera capture.
- [X] Preview and remove the selected image.
- [X] Validate file type and size before upload.
- [X] Display upload, scanning, success, uncertain, non-felid, and failure states.
- [X] Display ranked candidate cards, entropy, score semantics, and rationales.
- [X] Add retry and upload-another-image actions.
- [X] Show a persistent warning when `is_mock` is true.
- [ ] Make the dropzone fully keyboard-operable and add a complete accessibility pass.
- [ ] Add a frontend test for the identify flow (success, uncertain, mock banner, API error).

### Backend

- [X] Implement `POST /api/identify`.
- [X] Define typed request/response schemas and explicit identification states.
- [X] Validate actual image content, MIME type, dimensions, and size with Pillow.
- [X] Process uploads in memory; do not persist temporary image files.
- [X] Normalize EXIF orientation and convert to RGB before inference.
- [X] Add a provider interface (`BaseClassifier`) and pipeline.
- [X] Implement the development simulation provider and propagate `is_mock`.
- [X] Compute Shannon entropy and assign confidence/uncertainty statuses.
- [X] Add structured 4xx errors and a global safe 500 handler.
- [X] Cover validation, status handling, and API contracts with tests.
- [ ] Add per-request inference timeouts.
- [ ] Add rate limiting and a server-level upload size limit.
- [ ] Stop returning raw exception text in `/api/identify` 500 responses.
- [ ] Add a real out-of-domain detector for the ONNX provider.

**Exit criteria:** Upload flows are robust, predictions are never misrepresented, and all identification tests pass from the repository root.

## Phase 4 — Species Atlas

- [X] Implement `GET /api/species` with search, subfamily, lineage, IUCN, wild/domestic, habitat, and pagination support.
- [X] Build the atlas grid with search, subfamily, wild/domestic, and IUCN filters.
- [X] Implement species detail profiles with morphology, diet, behaviour, range, and similar taxa.
- [X] Add the comparative morphology modal for lookalike species.
- [X] Add the daily featured species endpoint and UI.
- [ ] Complete the catalog to all 41 recognized Felidae species (currently 37 entries).
- [ ] Replace remaining hardcoded "41 species" UI copy with values derived from the catalog.
- [ ] Surface lineage and habitat filters in the frontend.
- [ ] Add a schema-validation test for catalog IDs, required fields, and duplicate keys.
- [ ] Verify IUCN statuses, taxon IDs, and image attribution for every record.

**Exit criteria:** The atlas matches the curated catalog exactly, and tests prevent count/schema drift.

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
- [ ] Consolidate badge and rank definitions so backend and frontend cannot drift.
- [ ] Decide whether XP should use the catalog `xp_reward` or the fixed 150/100 rule, then document it.
- [ ] Add an explicit schema/version migration path for the localStorage key.

**Exit criteria:** Collection state has a single documented source of truth and survives schema changes safely.

## Phase 7 — Methodology and Responsible AI

- [X] Document the inference pipeline and entropy-based uncertainty.
- [X] Document the conservation and coordinate-obscuring protocol.
- [X] Add data provenance and taxonomy citations.
- [X] Disclose the development simulation in the identification UI.
- [ ] Update model limitations, evaluation results, and calibration notes after real inference lands.

**Exit criteria:** The methodology page accurately describes the implementation, including its limits.

## Phase 8 — Real Inference Integration

- [ ] Select a Felidae-capable model and document its license, input contract, and class set.
- [ ] Supply a `species_id` mapping and pass it into `OnnxClassifier` (currently outputs `species_idx_N` and is dropped by enrichment).
- [ ] Define model artifact naming, placement (`backend/models/`), and checksum verification.
- [ ] Add preprocessing and inference smoke tests with a fixture model or fixture output.
- [ ] Add out-of-domain handling for the real model path.
- [ ] Calibrate confidence and entropy thresholds on a held-out evaluation set.
- [ ] Verify `/api/health` reports a non-mock provider and `/api/identify` returns `is_mock: false`.
- [ ] Publish evaluation metrics and failure modes in the Methodology page.

**Exit criteria:** A real model runs end-to-end with verified catalog mappings, documented metrics, and honest uncertainty reporting.

## Phase 9 — Hardening and Quality Gates

- [ ] Load `.env` explicitly (or document exported variables) and make CORS origins environment-driven.
- [ ] Delete or reinstate `components/layout/Footer.tsx`, which is not rendered by `App.tsx` (dead code today).
- [ ] Add catalog schema validation to startup or CI.
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
- [ ] Correct the README environment setup (`.env` is not auto-loaded).
- [ ] Choose and document a deployment target and production serving model.
- [ ] Define versioning and release checklist (changelog, screenshots, license, attribution).
- [ ] Decide whether deep-linkable URLs are required; if so, replace state navigation with a router.
- [ ] Decide whether the Home, Identify, and Collection pages need nav entries or active-state mappings now that their navbar shortcuts were removed (Home: highlight the brand button; Identify: map to Home; Collection: the rank capsule/drawer status row already opens it).
- [ ] Complete a manual accessibility, responsive, and performance pass.

**Exit criteria:** A new maintainer can set up, verify, deploy, and release from the documentation alone.
