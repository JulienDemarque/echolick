# EchoLick Chunked TODO

Use this file as the shared handoff anchor between chat threads.

## Current Chunk

- [x] CHUNK-01: Implement roadmap Phase 1 (static chord + hardcoded lick playback in frontend)

## Next Chunks

- [x] CHUNK-02: Implement roadmap Phase 2 (12-bar progression state and UI)
- [x] CHUNK-02A: Adopt Zustand (state) + TanStack Query (server state) in frontend
- [x] CHUNK-02B: Adopt Tailwind CSS + reusable Tailwind UI component layer
- [x] CHUNK-05A: Improve guitar tone with separated rhythm/lead buses and FX chain
- [x] CHUNK-05B: Tie progression and lick generation (Next Bar -> generate + play on next chord)
- [x] CHUNK-03: Implement roadmap Phase 3 (`POST /api/generate-lick` real LLM path + placeholder fallback)
- [ ] CHUNK-04: Implement roadmap Phase 4 (strict validation + fallback on invalid outputs)
- [ ] CHUNK-05: Implement roadmap Phase 5 (play chord + generated lick together)
- [ ] CHUNK-06: Implement roadmap Phase 6 (major/minor toggle wired end-to-end)
- [ ] CHUNK-07: Implement roadmap Phase 7 (musicality constraints and prompt tuning)
- [ ] CHUNK-CLEANUP-01: Frontend cleanup pass (remove dead API client paths, split `App.tsx`, simplify types/state)

## Session Handoff Log

Copy this template for each chunk update:

```md
### YYYY-MM-DD HH:mm - CHUNK-XX
- Status: done | in_progress | blocked
- Completed:
  - ...
- Files changed:
  - ...
- Next best step:
  - ...
- Risks/blockers:
  - ...
```

### 2026-06-10 23:21 - CHUNK-01
- Status: done
- Completed:
  - Added Web Audio playback for a one-bar static prototype with A7 chord pad.
  - Added hardcoded A minor blues lick playback including one bend and one vibrato.
  - Added frontend UI control to trigger the static prototype and display lick note names.
- Files changed:
  - `apps/frontend/src/audio/bluesPrototype.ts`
  - `apps/frontend/src/types/music.ts`
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/App.css`
- Next best step:
  - Start CHUNK-02 by adding 12-bar progression state (`I IV I I IV IV I I V IV I V`) and UI controls for bar/chord advancement.
- Risks/blockers:
  - Audio timbre is intentionally simple for POC; expressive guitar realism is deferred.

### 2026-06-10 23:25 - CHUNK-02
- Status: done
- Completed:
  - Added 12-bar blues progression state with `I IV I I IV IV I I V IV I V`.
  - Added UI showing current bar, degree, and mapped chord (A7/D7/E7).
  - Added `Next Bar` and `Reset Progression` controls.
  - Updated generate payload to use the active progression degree/chord instead of hardcoded values.
- Files changed:
  - `apps/frontend/src/music/progression.ts`
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/App.css`
- Next best step:
  - Start CHUNK-03: implement real LLM backend path in `POST /api/generate-lick` while preserving fallback behavior.
- Risks/blockers:
  - Phase 2 currently advances progression via explicit button only; automatic advance-on-generate can be aligned in CHUNK-03/05.

### 2026-06-10 23:37 - CHUNK-02A
- Status: done
- Completed:
  - Added Zustand store for progression state (`barIndex`, `nextBar`, `resetProgression`).
  - Added TanStack Query provider at app root.
  - Migrated health check and lick generation calls in UI to TanStack Query (`useQuery` + `useMutation`).
  - Extracted API client helpers for typed fetch logic.
- Files changed:
  - `apps/frontend/src/store/useAppStore.ts`
  - `apps/frontend/src/api/client.ts`
  - `apps/frontend/src/main.tsx`
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/package.json`
  - `apps/frontend/package-lock.json`
- Next best step:
  - Continue CHUNK-03 by implementing real LLM integration in backend while preserving fallback behavior.
- Risks/blockers:
  - Health query is manual (`enabled: false`) by design; auto polling can be added later if needed.

### 2026-06-10 23:40 - CHUNK-02A-HOTFIX
- Status: done
- Completed:
  - Fixed Docker frontend dependency sync issue causing Vite import resolution failure for `@tanstack/react-query`.
  - Updated Compose frontend command to run dependency install before dev server startup.
  - Recreated frontend container and verified logs show clean startup.
- Files changed:
  - `docker-compose.yml`
  - `docs/TODO.md`
- Next best step:
  - Continue CHUNK-03 backend LLM path implementation.
- Risks/blockers:
  - `npm install` now runs at frontend container startup, which adds a small startup delay in dev.

### 2026-06-10 23:45 - CHUNK-02B
- Status: done
- Completed:
  - Integrated Tailwind CSS into the Vite pipeline (`@tailwindcss/vite` + Tailwind import in global CSS).
  - Refactored the main screen to Tailwind utility classes.
  - Added reusable Tailwind UI primitives (`Button`, `Card`) and a small class helper utility.
  - Updated project docs to reflect Tailwind UI adoption.
- Files changed:
  - `apps/frontend/package.json`
  - `apps/frontend/package-lock.json`
  - `apps/frontend/vite.config.ts`
  - `apps/frontend/src/index.css`
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/components/ui/button.tsx`
  - `apps/frontend/src/components/ui/card.tsx`
  - `apps/frontend/src/lib/cn.ts`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - Continue CHUNK-03 backend LLM path implementation.
- Risks/blockers:
  - Legacy file `apps/frontend/src/App.css` is now unused and can be removed in a cleanup pass.

### 2026-06-10 23:52 - CHUNK-05A
- Status: done
- Completed:
  - Refactored audio playback into separated rhythm and lead buses.
  - Added lead FX chain: compressor -> overdrive -> cabinet EQ, with delay and spring-style reverb sends.
  - Kept bend and vibrato articulation on lead notes while routing through the new chain.
  - Updated UI copy to reflect the new tone architecture.
- Files changed:
  - `apps/frontend/src/audio/bluesPrototype.ts`
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Continue CHUNK-03 for real backend LLM generation path.
- Risks/blockers:
  - FX levels are currently hardcoded for a musical baseline; expose controls later if you want interactive tone shaping.

### 2026-06-11 00:04 - CHUNK-05B
- Status: done
- Completed:
  - Wired progression and lick together so `Next Bar + Generate` advances to the next bar, requests a lick for that next degree/chord, and immediately plays chord + generated lick.
  - Added chord MIDI mapping by degree and reusable playback function for arbitrary generated licks.
  - Kept manual `Generate Current Bar Lick` for testing without progression advance.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/audio/bluesPrototype.ts`
  - `apps/frontend/src/music/progression.ts`
  - `apps/frontend/src/api/client.ts`
  - `docs/TODO.md`
- Next best step:
  - Start CHUNK-03 backend LLM integration behind `OPENAI_API_KEY`, while preserving fallback.
- Risks/blockers:
  - If user clicks very fast, generated playback can overlap (acceptable for now; can add transport cancel/queue later).

### 2026-06-11 00:10 - CHUNK-03
- Status: done
- Completed:
  - Added OpenAI-backed lick generation path in backend when `OPENAI_API_KEY` is present.
  - Added strict post-generation validation checks (bar bounds, bend/vibrato limits, timing constraints).
  - Kept guaranteed fallback behavior: any LLM/JSON/validation failure logs warning and returns procedural lick.
  - Added reusable prompt builder and configurable `OPENAI_MODEL` env.
  - Updated Compose backend to load `apps/backend/.env` via `env_file`.
  - Rebuilt backend container to install `openai` package and verified endpoint returns valid payload.
- Files changed:
  - `apps/backend/requirements.txt`
  - `apps/backend/app/services/generator.py`
  - `apps/backend/app/services/prompt.py`
  - `docker-compose.yml`
  - `.env.example`
  - `docs/TODO.md`
- Next best step:
  - Start CHUNK-04: formalize schema-level validators/tests and fallback coverage for malformed LLM payloads.
- Risks/blockers:
  - LLM call currently uses SDK default timeout/retry behavior; tune explicit timeout/retry strategy if latency spikes.

### 2026-06-11 00:14 - CHUNK-05C
- Status: done
- Completed:
  - Simplified frontend control flow to the requested two actions: `Next Bar + Generate` and `Replay`.
  - Removed extra API/debug controls from the main UX (health check and separate current-bar generation controls).
  - Wired replay to play the last successfully generated lick/chord without bar advancement.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-04 validation hardening/tests for malformed LLM output handling.
- Risks/blockers:
  - Progression reset action is no longer exposed in UI; can re-add if needed later.

### 2026-06-11 00:22 - CHUNK-03A
- Status: done
- Completed:
  - Added frontend OpenAPI codegen workflow (`@hey-api/openapi-ts`) and generated typed SDK from backend `/openapi.json`.
  - Replaced manual frontend API calls with generated SDK wrappers and runtime base URL config.
  - Added normalization layer so generated nullable note fields map cleanly to audio playback types.
  - Updated backend OpenAI call to request strict JSON Schema-constrained output from the model.
- Files changed:
  - `apps/frontend/package.json`
  - `apps/frontend/package-lock.json`
  - `apps/frontend/src/api/client.ts`
  - `apps/frontend/src/api/generated/*`
  - `apps/frontend/src/App.tsx`
  - `apps/backend/app/services/generator.py`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-04: add backend tests covering invalid model payloads and fallback paths.
- Risks/blockers:
  - Generated SDK defaults include a hardcoded base URL in generated file; runtime wrapper overrides it per request.

### 2026-06-11 00:30 - CHUNK-OBS-LANGFUSE
- Status: done
- Completed:
  - Added Langfuse SDK dependency to backend and integrated OpenAI client through `langfuse.openai` wrapper for tracing.
  - Added Langfuse environment variables to Compose backend service and `.env.example`.
  - Documented Langfuse setup in `README.md`.
  - Recreated backend and verified `/api/generate-lick` still returns valid payload.
- Files changed:
  - `apps/backend/requirements.txt`
  - `apps/backend/app/services/generator.py`
  - `docker-compose.yml`
  - `.env.example`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - Set real `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY` in `apps/backend/.env` and verify traces in Langfuse UI.
- Risks/blockers:
  - Without Langfuse credentials configured, tracing is disabled by SDK (no data sent).

### 2026-06-11 00:35 - CHUNK-OBS-LOCAL-LANGFUSE
- Status: done
- Completed:
  - Added optional local self-hosted Langfuse overlay (`docker-compose.langfuse.yml`) based on Langfuse official multi-service compose stack.
  - Added local env template for backend (`apps/backend/.env.langfuse.local.example`) with required values and defaults.
  - Added README run instructions for local observability profile.
  - Validated compose merge and successfully started local stack (`langfuse-web`, `langfuse-worker`, `clickhouse`, `postgres`, `redis`, `minio`).
  - Verified local Langfuse web responds on `http://localhost:3000` (HTTP 200).
- Files changed:
  - `docker-compose.langfuse.yml`
  - `apps/backend/.env.langfuse.local.example`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - Create a project in local Langfuse UI, copy project public/secret keys into `apps/backend/.env`, and generate a test lick to confirm traces appear.
- Risks/blockers:
  - Local self-host adds 6 additional infrastructure containers (heavier than cloud mode).

### 2026-06-10 23:58 - CHUNK-OPS-IGNORE
- Status: done
- Completed:
  - Added root `.gitignore` with env, Node, Python, and log ignore rules.
  - Added `cursorignore` with matching ignore patterns for secrets and generated artifacts.
  - Removed stray empty `gitignore` file.
- Files changed:
  - `.gitignore`
  - `cursorignore`
  - `docs/TODO.md`
- Next best step:
  - Continue CHUNK-03 (backend LLM generation path).
- Risks/blockers:
  - Creating dot-prefixed Cursor ignore files (`.cursorignore`) is blocked by local permissions policy in this workspace.

### 2026-06-11 00:40 - CHUNK-OBS-LANGFUSE-SKILL
- Status: done
- Completed:
  - Installed the official Langfuse agent skill via `npx skills add langfuse/skills --skill "langfuse"`.
  - Audited existing tracing against skill baseline requirements (trace naming, span hierarchy, sensitive input scope, fallback visibility).
  - Added explicit root span tracing around `generate_lick` with descriptive `trace_name`, request tags, and constrained trace input/output payloads.
  - Added graceful fallback when Langfuse tracing itself errors so observability cannot break lick generation.
  - Added `LANGFUSE_BASE_URL` compatibility to Compose/env templates and updated README with verification guidance.
- Files changed:
  - `apps/backend/app/services/generator.py`
  - `docker-compose.yml`
  - `.env.example`
  - `apps/backend/.env.langfuse.local.example`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - Run one end-to-end request with valid Langfuse keys and inspect traces filtered by `feature:lick-generation` to confirm expected tags/output fields.
- Risks/blockers:
  - If Langfuse Python SDK API changes for `propagate_attributes` or observation update fields, tracing metadata may need small follow-up adjustments.

### 2026-06-11 01:10 - CHUNK-OBS-LANGFUSE-CONNECTIVITY
- Status: done
- Completed:
  - Restarted/rebuilt backend container to reload env (`docker compose up -d --build backend`).
  - Fixed Compose env precedence bug by removing backend `environment:` overrides that were forcing empty values over `apps/backend/.env`.
  - Verified backend now receives non-empty OpenAI/Langfuse API keys from `apps/backend/.env`.
  - Updated backend Langfuse endpoint from `localhost` to Docker service hostname (`http://langfuse-web:3000`).
  - Removed NextAuth/bootstrap variables from backend env template to keep backend-only config focused.
  - Re-ran Langfuse SDK auth check from backend container; result is `True`.
  - Verified request logs no longer show `localhost:3000` export failures.
- Files changed:
  - `docker-compose.yml`
  - `apps/backend/.env`
  - `apps/backend/.env.langfuse.local.example`
  - `docs/TODO.md`
- Next best step:
  - Optionally move Langfuse self-host infra bootstrap vars (NextAuth/DB/Redis/MinIO credentials) into a dedicated root env template for observability profile overrides.
- Risks/blockers:
  - None for connectivity; current fallback logs are from model output validation and are expected when generated note bends violate constraints.

### 2026-06-11 01:12 - CHUNK-04A-OPENAI-STRICT-SCHEMA
- Status: done
- Completed:
  - Diagnosed OpenAI Responses API strict schema failure (`additionalProperties` / `required`) from terminal logs.
  - Added JSON schema normalization for OpenAI strict mode in backend (`additionalProperties: false` on object nodes and `required` aligned to all object properties).
  - Re-tested `POST /api/generate-lick`; strict schema API error is gone and backend now reaches content validation/fallback path instead.
  - Normalized Langfuse metadata value type for `tempo` to string to avoid dropped metadata warnings.
- Files changed:
  - `apps/backend/app/services/generator.py`
  - `docs/TODO.md`
- Next best step:
  - Decide whether to keep strict schema mode or simplify by removing strict response schema and relying on Pydantic validation + fallback.
- Risks/blockers:
  - Strict schema normalization depends on OpenAI’s current validator behavior and may need revisiting if API requirements change.

### 2026-06-11 01:15 - CHUNK-OBS-LOCAL-ONLY-CONFIG
- Status: done
- Completed:
  - Confirmed backend is using local Langfuse endpoint (`LANGFUSE_BASE_URL=http://langfuse-web:3000`) and not cloud.
  - Updated docs/env defaults to local self-hosted Langfuse references (removed cloud default wording from active project config docs).
  - Verified backend Langfuse client connectivity remains healthy after updates (`auth_check: True`).
- Files changed:
  - `README.md`
  - `.env.example`
  - `docs/TODO.md`
- Next best step:
  - Optionally add a dedicated `.env.observability.example` at repo root for Langfuse infra bootstrap variables used by `docker-compose.langfuse.yml`.
- Risks/blockers:
  - None.

### 2026-06-11 01:24 - CHUNK-07A-PROMPT-QUALITY-MODEL
- Status: done
- Completed:
  - Strengthened generation prompt constraints to explicitly require note-local timing for bend/vibrato fields.
  - Added post-parse normalization for articulation timing to recover common bar-time outputs before validation.
  - Switched default backend model target to GPT-5 mini (`OPENAI_MODEL=gpt-5-mini`) for quality-first testing.
  - Updated env templates and local backend env to include explicit `OPENAI_MODEL`.
  - Benchmarked API latency after change: ~33-40s per generation in current environment.
- Files changed:
  - `apps/backend/app/services/prompt.py`
  - `apps/backend/app/services/generator.py`
  - `.env.example`
  - `apps/backend/.env.langfuse.local.example`
  - `apps/backend/.env`
  - `docs/TODO.md`
- Next best step:
  - Compare quality/latency tradeoffs across `gpt-5-mini` vs faster alternatives (for example `gpt-4.1-mini`) and pick default per UX target.
- Risks/blockers:
  - GPT-5 mini improves quality potential but is significantly slower for this endpoint in current setup.

### 2026-06-11 01:58 - CHUNK-01-CLEANUP
- Status: done
- Completed:
  - Removed the Phase 1 static prototype UI card and playback button from the main app screen.
  - Deleted dead frontend code for hardcoded static prototype exports no longer used by current flow.
  - Removed unused legacy stylesheet (`App.css`) left over from pre-Tailwind iteration.
  - Added safe degree-to-chord MIDI resolution helper for replay/generate playback path.
  - Verified frontend compiles successfully after cleanup (`npm run build`).
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/audio/bluesPrototype.ts`
  - `apps/frontend/src/App.css` (deleted)
  - `docs/TODO.md`
- Next best step:
  - Continue CHUNK-04 by adding backend tests for invalid model payloads and fallback behavior.
- Risks/blockers:
  - None.

### 2026-06-11 02:03 - CHUNK-07B-THEORY-INFORMED-PROMPT
- Status: done
- Completed:
  - Enhanced backend prompt with theory reference injection for major-blues generation:
    - key-degree references relative to A root
    - per-note interval labels relative to current chord root
    - explicit chord-tone vs color-note role guidance
    - focused major blues pools for A7 and D7 bars
  - Added prompt instruction emphasis to blend chord tones with blue-note color in major blues.
  - Updated frontend generate payload default flavor from `minor` to `major` for current testing direction.
  - Verified backend Python compile and frontend build pass.
- Files changed:
  - `apps/backend/app/services/prompt.py`
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Observe new traces and compare note-choice quality on I vs IV bars (A7 vs D7), then tune pool/chord-tone weighting as needed.
- Risks/blockers:
  - Prompt-only improvements can still produce occasional outliers; fallback remains required.

### 2026-06-11 09:43 - CHUNK-UX-12BAR-GRID-A
- Status: done
- Completed:
  - Added interactive 12-bar grid UI with selectable bars showing degree/chord labels and per-bar generation status indicator.
  - Refactored generation flow to support generating by explicit bar index while preserving existing API payload.
  - Added `Generate Selected Bar`, `Next Bar + Generate`, and `Replay Selected Bar` controls.
  - Updated lick panel to display JSON for the currently selected bar instead of last global generation.
  - Verified frontend build succeeds after UI/state refactor.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-UX-12BAR-GRID-B: add beat-level metronome/playhead visualization (`1-2-3-4`) synced to bar playback and include a short "your turn" phase indicator.
- Risks/blockers:
  - Current generation still requests one bar at a time; full 12-bar pre-generation API remains a follow-up chunk.

### 2026-06-11 10:02 - CHUNK-CHORUS-12BAR-BATCH
- Status: done
- Completed:
  - Added backend `POST /api/generate-chorus` endpoint to generate a full 12-bar blues chorus in one request.
  - Introduced chorus request/response models (`GenerateChorusRequest`, `GeneratedChorus`) and wired service orchestration over `I IV I I IV IV I I V IV I V`.
  - Regenerated frontend OpenAPI SDK and added `postGenerateChorus` client wrapper.
  - Updated frontend progression controls with `Generate Full 12 Bars` action that fills per-bar lick cache for immediate bar selection/replay.
  - Verified backend Python compile and frontend build pass.
- Files changed:
  - `apps/backend/app/models.py`
  - `apps/backend/app/services/generator.py`
  - `apps/backend/app/main.py`
  - `apps/frontend/src/api/generated/*`
  - `apps/frontend/src/api/client.ts`
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-UX-12BAR-GRID-B: add metronome/playhead + "your turn" state now that bar library cache can be preloaded.
- Risks/blockers:
  - Full-chorus generation can be slow/costly with current model since it performs 12 serial generations.

### 2026-06-11 11:06 - CHUNK-CHORUS-SINGLE-CALL
- Status: done
- Completed:
  - Reworked chorus generation backend path to use one OpenAI call for the full 12-bar payload (`GeneratedChorus`) instead of 12 per-bar calls.
  - Added dedicated chorus prompt builder with explicit progression-level constraints and output schema guidance.
  - Added chorus-level validation + normalization pass and chorus-level Langfuse tracing (`api.generate-chorus`).
  - Kept robust fallback behavior by returning a full procedural 12-bar chorus if single-call generation fails.
  - Smoke-tested inside backend container: valid 12-bar chorus returned (`bars=12`).
- Files changed:
  - `apps/backend/app/services/prompt.py`
  - `apps/backend/app/services/generator.py`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-UX-12BAR-GRID-B: add beat-level metronome/playhead + "your turn" indicator synced to selected bar playback.
- Risks/blockers:
  - Single-call chorus with current GPT-5 model can still be high latency (tested ~154s end-to-end in this environment).

### 2026-06-11 11:22 - CHUNK-UX-12BAR-GRID-B
- Status: done
- Completed:
  - Added beat-level metronome UI (`1-2-3-4`) that runs in a two-bar practice cycle whenever selected-bar playback starts.
  - Added explicit phase indicator (`Listen` then `Your turn`) to support call-and-response practice flow.
  - Added a pitch timeline panel with time on X axis and MIDI pitch on Y axis.
  - Plotted generated lick notes as target bars in the timeline and scaffolded a user-pitch overlay layer for next-step mic capture.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Start CHUNK-UX-PITCH-CAPTURE-A: capture live user pitch from microphone, map it to MIDI over time, and render green points into the existing timeline overlay.
- Risks/blockers:
  - Metronome is currently visual-only (no click sound), and user pitch capture layer is scaffolded but not yet wired to microphone input.

### 2026-06-11 11:29 - CHUNK-UX-PITCH-CAPTURE-A
- Status: done
- Completed:
  - Added live microphone capture controls in frontend (`Enable Mic Capture` / `Disable Mic`).
  - Implemented real-time pitch detection from mic input using normalized autocorrelation over time-domain audio frames.
  - Added continuous MIDI smoothing and plotting during the `Your turn` bar so bends are represented as gradual pitch motion in the timeline.
  - Wired capture window timing to the practice cycle so user pitch points align to beat time (X axis in beats).
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Add bend-aware target overlay (expanded from note-level bend metadata) and simple pitch deviation scoring against user capture.
- Risks/blockers:
  - Browser mic quality/noise and room acoustics can still cause jitter or missed detections; threshold/smoothing constants may need per-device tuning.

### 2026-06-11 11:35 - CHUNK-UX-PITCH-CAPTURE-B
- Status: done
- Completed:
  - Replaced flat target-note rendering with a generated pitch contour derived from note articulation metadata.
  - Added bend visualization by interpolating MIDI over bend span (`bend.start` to `bend.end`).
  - Added vibrato visualization by applying sinusoidal semitone modulation using note vibrato rate/depth and bar tempo.
  - Kept base note blocks in the timeline as reference while overlaying the blue contour path for true target shape.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Add a simple alignment score by nearest-time pitch distance between user capture points and target contour.
- Risks/blockers:
  - Vibrato shape is currently modeled as pure sine; real playing may have asymmetry and attack lag not represented in the target curve.

### 2026-06-11 11:39 - CHUNK-UX-PITCH-CAPTURE-C
- Status: done
- Completed:
  - Simplified pitch timeline target rendering to show only the articulation contour (bend/vibrato curve).
  - Removed flat target note blocks to keep the chart focused on the most correct target pitch description.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Add alignment scoring against the contour and optional tolerance bands (for example +/- 25 cents) to guide practice feedback.
- Risks/blockers:
  - Pure contour view is cleaner, but some users may still want optional note-block references for note onset visibility.

### 2026-06-11 11:46 - CHUNK-UX-SCORING-A
- Status: done
- Completed:
  - Added first-pass user playback scoring in frontend with forgiving matching rules.
  - Implemented per-note match logic: a note is counted correct if at least one user pitch point is near it in time and pitch.
  - Scoring compares user points to the articulation contour (bend/vibrato) at nearby times, with wide default tolerances for early usability.
  - Added score display (`matched/total` + percentage) in the pitch timeline card.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Add adjustable scoring sensitivity controls (time and pitch tolerance sliders) and evaluate defaults.
- Risks/blockers:
  - This forgiving metric can over-score sparse captures; later iterations should include coverage and sustained-intonation checks.

### 2026-06-11 11:49 - CHUNK-UX-METRONOME-AUDIO-A
- Status: done
- Completed:
  - Added audible metronome click track in frontend synchronized to the 8-beat practice cycle.
  - Kept click track active through both bars: target lick playback (listen) and user capture (your turn).
  - Added bar-accent behavior (strong click on beat 1 of each bar) for easier phrase orientation.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Add optional metronome controls (mute/volume and accent level) to adapt to different practice setups.
- Risks/blockers:
  - WebAudio scheduling via `setTimeout` is sufficient for now but can drift slightly under heavy main-thread load.

### 2026-06-11 11:53 - CHUNK-UX-SCORING-B
- Status: done
- Completed:
  - Added point-level correctness classification for captured user pitch points against the target contour.
  - Updated timeline rendering to color user pitch points by correctness (`green=correct`, `red=incorrect`).
  - Added per-note hit/miss badges (`N1 OK`, `N2 MISS`, etc.) based on existing forgiving note matching logic.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Add optional confidence/margins visualization (for example yellow "near miss" points) and expose tolerance controls in UI.
- Risks/blockers:
  - Point-level nearest-contour matching can mark noisy off-time captures as incorrect even when nearby note-level match is satisfied.

### 2026-06-11 12:00 - CHUNK-UX-PROGRESSION-STAGES-A
- Status: done
- Completed:
  - Added a practice-stage dropdown in frontend to prototype progressive gameplay paths.
  - Implemented stage behavior:
    - `Starter`: limits generated lick to 4 notes, snaps notes to 3 target tones (1-2-3 relative to chord root), removes bend/vibrato.
    - `Add bends`: keeps full generated phrase articulation in a single flavor flow.
    - `Mix major/minor`: keeps full phrase and randomly requests major or minor flavor per generation.
  - Added keyboard UX shortcut: `Space` replays selected bar (with guards to avoid triggering while typing in form fields).
  - Added replay keyboard hint next to controls.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - Replace stage dropdown with real gamification progression logic (unlocks, automatic stage advancement, and reward feedback).
- Risks/blockers:
  - Starter-stage note snapping is heuristic and can alter melodic contour; backend-aware staged generation would produce cleaner pedagogical phrases.

### 2026-06-11 16:12 - CHUNK-DB-01-SUPABASE-SCHEMA
- Status: done
- Completed:
  - Added a dedicated Supabase planning/spec doc covering:
    - relational schema (`licks`, `lick_notes`, `practice_attempts`, `generation_runs`)
    - enum strategy and constraints
    - difficulty model and stage mapping
    - initial library generation + quality filtering strategy
    - baseline RLS/access approach
  - Added Supabase env placeholders to `.env.example`.
  - Linked Supabase schema doc and setup notes from `README.md`.
- Files changed:
  - `docs/supabase_schema.md`
  - `.env.example`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-02: create first SQL migration for enums + `licks` + `lick_notes` + indexes, then run it in Supabase SQL Editor.
- Risks/blockers:
  - RLS policies are documented but not yet applied; actual table exposure depends on Supabase dashboard/API settings until migration is executed.

### 2026-06-11 16:31 - CHUNK-DB-SEMANTICS-ALIGN-A
- Status: done
- Completed:
  - Reworked Supabase schema documentation to a minimal semantic model agreed in chat:
    - `forms` (full chord grid container)
    - `form_bars` (bar-level chord context)
    - `licks` (bar-linked phrase + `note_policy` + `notes_json`)
    - optional `lick_notes` for later SQL analytics
  - Simplified theory vocabulary by collapsing overlapping concepts into one `note_policy`.
  - Documented what remains derived (`difficulty_level`, app stage logic) vs persisted in v1.
- Files changed:
  - `docs/supabase_schema.md`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-02-MINIMAL-MIGRATION: write and run Supabase SQL migration for `forms`, `form_bars`, `licks` (+ optional `lick_notes` toggle).
- Risks/blockers:
  - `bar_index` versus `forms.bar_count` consistency is app-validated in v1; DB-level trigger enforcement can be added later.

### 2026-06-11 16:37 - CHUNK-DB-DIAGRAM-A
- Status: done
- Completed:
  - Added a Mermaid ER diagram to `docs/supabase_schema.md` for quick visual review of core v1 entities and relationships.
  - Cleaned duplicated legacy schema section from the same doc to keep a single authoritative version.
- Files changed:
  - `docs/supabase_schema.md`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-02-MINIMAL-MIGRATION: convert diagram/entities into executable Supabase SQL migration.
- Risks/blockers:
  - Mermaid rendering depends on editor/support; if unsupported, keep an ASCII fallback diagram in docs.

### 2026-06-11 16:49 - CHUNK-OPS-ENV-ALIGN-A
- Status: done
- Completed:
  - Added `apps/backend/.env.example` as backend runtime env template (OpenAI, Langfuse, Supabase keys).
  - Reduced root `.env.example` to compose-level variable(s) only (`VITE_API_BASE_URL`) to avoid confusion with backend runtime env.
  - Updated README startup instructions to use `apps/backend/.env` as required backend env source and clarified root `.env` as optional compose interpolation.
- Files changed:
  - `apps/backend/.env.example`
  - `.env.example`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-02-MINIMAL-MIGRATION: create and run Supabase SQL migration for `forms`, `form_bars`, `licks`.
- Risks/blockers:
  - Existing local setup may still have stale assumptions/scripts expecting backend secrets in root `.env`; those scripts should be updated if present.

### 2026-06-11 16:58 - CHUNK-DB-CLIENT-A
- Status: done
- Completed:
  - Added backend Supabase client helper using `supabase-py` (`get_supabase_client()` with cache).
  - Wired env resolution to prefer `SUPABASE_SERVICE_ROLE_KEY` and support `SUPABASE_KEY` as compatibility alias.
  - Added `supabase` dependency to backend requirements.
  - Updated backend env example with optional `SUPABASE_KEY` alias note.
- Files changed:
  - `apps/backend/app/services/supabase_client.py`
  - `apps/backend/requirements.txt`
  - `apps/backend/.env.example`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-02-MINIMAL-MIGRATION: create `forms`/`form_bars`/`licks` tables in Supabase and add first read/write endpoint integration.
- Risks/blockers:
  - Backend container must be rebuilt to install the new `supabase` package before using the client at runtime.

### 2026-06-11 17:07 - CHUNK-DB-02-MINIMAL-MIGRATION
- Status: done
- Completed:
  - Added Supabase SQL migration for minimal v1 schema:
    - `forms`
    - `form_bars`
    - `licks`
    - indexes + RLS enable defaults
  - Added Supabase seed SQL for initial 12-bar forms in keys `E`, `A`, `B`, `C` with bar-by-bar chord mapping.
  - Updated README with explicit SQL execution order for schema + seed.
  - Cleaned and re-normalized `docs/supabase_schema.md` to remove duplicate sections and keep one authoritative minimal spec.
- Files changed:
  - `db/supabase/001_init_minimal_schema.sql`
  - `db/supabase/002_seed_forms_eabc.sql`
  - `docs/supabase_schema.md`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-03-REPO-INTEGRATION: add backend repository helpers and first endpoints to read forms and save generated licks to Supabase.
- Risks/blockers:
  - With RLS enabled and no anon/auth policies yet, table access is backend service-role only (intended for now).

### 2026-06-11 17:19 - CHUNK-DB-SEED-A
- Status: done
- Completed:
  - Added backend seed script (`apps/backend/scripts/seed_licks.py`) to generate and insert initial licks into Supabase from active seeded forms.
  - Script supports configurable source tag, tempo, policy set, and optional cleanup (`--clear-existing`) for repeatable reseeding.
  - Documented seed command and options in README.
- Files changed:
  - `apps/backend/scripts/seed_licks.py`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-03-REPO-INTEGRATION: add backend endpoints/repository for reading forms and loading licks by form/bar/policy.
- Risks/blockers:
  - Current seed generation uses existing `GenerateLickRequest` contract (`key="A"` literal in model); form-specific key semantics are currently represented by form/bar chord context.

### 2026-06-11 17:18 - CHUNK-DB-RUN-MIGRATIONS-A
- Status: done
- Completed:
  - Applied Supabase migrations via MCP:
    - `001_init_minimal_schema`
    - `002_seed_forms_eabc`
    - `003_grant_service_role_privileges` (grants table privileges to `service_role`)
  - Rebuilt backend container and ran lick seed script successfully with fallback generation mode for faster initialization.
  - Verified Supabase row counts after run: `forms=4`, `form_bars=48`, `licks=145`.
- Files changed:
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-03-REPO-INTEGRATION: expose backend read endpoints for seeded forms/licks and wire frontend fetch.
- Risks/blockers:
  - Full LLM-based seeding with current model is slow; fallback-based seed is fast but lower musical variety.

### 2026-06-11 18:31 - CHUNK-DB-03-REPO-INTEGRATION
- Status: done
- Completed:
  - Added Supabase-backed repository module for library reads (`forms`, `form_bars`, `licks`).
  - Added backend response models for form summaries, form bar context, and stored licks with embedded generated lick payload.
  - Added new FastAPI endpoints:
    - `GET /api/forms`
    - `GET /api/forms/{form_id}/bars`
    - `GET /api/licks` (filterable by `form_id`, `bar_index`, `note_policy`, plus `limit`)
  - Wired defensive HTTP 500 error wrapping for data-access failures.
- Files changed:
  - `apps/backend/app/services/library_repo.py`
  - `apps/backend/app/models.py`
  - `apps/backend/app/main.py`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-04-FRONTEND-LIBRARY-READ: regenerate frontend API client and integrate form/library fetch UI in practice flow.
- Risks/blockers:
  - `GeneratedLick` model currently fixes `key="A"` in schema; stored lick payload remains compatible now but broader key support will need model update later.

### 2026-06-11 20:36 - CHUNK-DB-04-FRONTEND-LIBRARY-READ
- Status: done
- Completed:
  - Regenerated frontend OpenAPI SDK to include new library endpoints (`/api/forms`, `/api/forms/{form_id}/bars`, `/api/licks`).
  - Extended frontend API client wrappers to fetch forms, form bars, and stored licks.
  - Integrated `React Query` library reads in `App.tsx`:
    - loads active forms from Supabase-backed API
    - loads bar grid for selected form
    - loads library licks by selected form + stage note policy
  - Added form selector UI and switched progression grid rendering to DB-provided form bars (with static fallback safety).
  - Auto-hydrates per-bar lick cache from fetched library rows while preserving existing playback/practice UX.
- Files changed:
  - `apps/frontend/src/api/generated/index.ts`
  - `apps/frontend/src/api/generated/sdk.gen.ts`
  - `apps/frontend/src/api/generated/types.gen.ts`
  - `apps/frontend/src/api/client.ts`
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-DB-05-FRONTEND-FLOW-POLISH: simplify controls to emphasize DB library practice flow (load/replay/next) and reduce generation-only bias.
- Risks/blockers:
  - `GenerateLickRequest` is still constrained to key `A` in backend model, so generation semantics are not yet fully key-aware even when form roots differ.

### 2026-06-11 17:16 - CHUNK-DB-KEY-COMPAT-A
- Status: done
- Completed:
  - Updated backend Supabase client env resolution to prefer `SUPABASE_API_KEY` and keep legacy fallbacks (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_KEY`).
  - Updated backend env template and README Supabase section to reflect modern key naming.
- Files changed:
  - `apps/backend/app/services/supabase_client.py`
  - `apps/backend/.env.example`
  - `README.md`
  - `docs/TODO.md`
- Next best step:
  - Rebuild backend and rerun lick seed script using new `SUPABASE_API_KEY` env value.
- Risks/blockers:
  - If provided Supabase API key lacks required privileges, writes may still fail despite successful client auth.

### 2026-06-11 21:50 - CHUNK-KEY-RHYTHM-A
- Status: done
- Completed:
  - Fixed key-awareness end-to-end for generation/playback flow so selected form key is sent to backend instead of hardcoded `A`.
  - Removed A-locked chord playback assumptions in frontend by deriving chord voicings from chord symbols (for example `E7`, `A7`, `B7`).
  - Filtered stale library rows whose stored generated key does not match active form key to avoid wrong-key auto-hydration.
  - Updated backend models/prompts/chorus validation to support all chromatic keys and dynamic I/IV/V dominant chord mapping.
  - Tightened rhythm constraints for generated licks to straight values only (`start` on 0.5-beat grid; `duration` in `{0.5, 1, 2}`).
  - Updated fallback and seed generation to follow chord/form key context instead of fixed A-shape notes.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/api/client.ts`
  - `apps/backend/app/models.py`
  - `apps/backend/app/services/generator.py`
  - `apps/backend/app/services/prompt.py`
  - `apps/backend/app/services/fallback_licks.py`
  - `apps/backend/scripts/seed_licks.py`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-KEY-RHYTHM-B: regenerate Supabase library rows per form key (clear + reseed) so DB-backed practice has consistent in-key content for all forms.
- Risks/blockers:
  - Existing Supabase seeded rows may still contain older A-centric content until reseeded; runtime filtering now skips obvious key mismatches.

### 2026-06-11 23:48 - CHUNK-PERMUTATION-UX-A
- Status: done
- Completed:
  - Removed frontend dependency on generation/library endpoints for lick creation and switched to local permutation-based lick simulation.
  - Replaced old endpoint action controls with ear-training controls:
    - `Hear Next`
    - `Hear Selected Bar`
    - `Hear Again`
  - Added generator level selector with preset degree pools:
    - Level 1: `1,3,5`
    - Level 2: `1,2,3,5,6`
    - Level 3: `1,2,b3,3,4,b5,5,6,b7`
  - Added clickable degree pool toggles (relative to song key) for custom note inclusion.
  - Added optional bend toggle with constrained "sensible" behavior (`b3` bent toward `3`, max one bend/bar, duration guard).
  - Kept existing metronome, playback, and pitch scoring pipeline intact while using locally generated licks.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/api/client.ts`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-PERMUTATION-UX-B: add adaptive drill progression (auto-unlock levels/degrees based on score consistency) and persist user settings/progress.
- Risks/blockers:
  - Local generator currently prioritizes simple contour continuity; it is pedagogical-first and not yet a stylistic blues phrase engine.

### 2026-06-12 00:54 - CHUNK-BLUES-FORMS-CONFIG-A
- Status: done
- Completed:
  - Added selectable blues form presets for local generation:
    - all dominant
    - all minor
    - minor with major IV (dorian color)
    - minor with dominant V
    - "Same Old Blues" turnaround variant
  - Added side configuration panel for:
    - song key context source
    - blues form selection
    - level selection
    - degree pool toggles
    - major-note inclusion toggle
    - bend toggle
  - Updated local generation defaults to minor pentatonic-first across forms; major extension notes (`2, 3, 6`) are only addable on major-blues forms.
  - Added quarter-bend behavior on `b3` (toward `3`) with max one bend per bar.
  - Kept metronome/mic/scoring flow unchanged while using updated chord context per selected blues form.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-BLUES-FORMS-CONFIG-B: add per-form progression presets persisted per user session and tighten generated phrase targets for non-I/IV/V turnaround bars.
- Risks/blockers:
  - "Same Old Blues" currently uses simplified local chord labels for ear training and not a strict transcription of every canonical variation.

### 2026-06-12 01:08 - CHUNK-UX-KEY-FORM-SIMPLIFY-A
- Status: done
- Completed:
  - Simplified configuration model to two independent controls:
    - `Key` selector (chromatic root)
    - `Blues Form` selector
  - Removed confusing coupling to fetched "song key context" form records that could contradict selected blues form.
  - Updated local chord-grid generation to use selected key + selected blues form only.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-BLUES-FORMS-CONFIG-B: expose quick preset buttons for common practice combos (for example `E + all-dominant`, `A + all-minor`) and persist last selection.
- Risks/blockers:
  - Backend form records are now intentionally unused in frontend local-generation mode; remove unused API client paths during cleanup chunk.

### 2026-06-12 01:12 - CHUNK-UX-GRID-LAYOUT-A
- Status: done
- Completed:
  - Increased main app container width to improve progression grid density.
  - Updated progression bar grid layout to 4 columns on medium+ screens so 12 bars render as 3 rows x 4 bars.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-BLUES-FORMS-CONFIG-B: expose quick preset buttons and persist last key/form selection.
- Risks/blockers:
  - On very narrow mobile widths, grid still collapses to fewer columns by design.

### 2026-06-12 01:16 - CHUNK-CLEANUP-01A-APP-SPLIT
- Status: done
- Completed:
  - Split large frontend page logic by extracting pure generation/theory helpers from `App.tsx` into:
    - `apps/frontend/src/features/practice/musicGenerator.ts`
    - `apps/frontend/src/features/practice/pitchUtils.ts`
  - Moved blues form definitions, degree pools, permutation generation, and chord resolution into dedicated module.
  - Moved pitch contour + pitch detection utilities into dedicated module.
  - Reduced `App.tsx` to focus on orchestration/UI state and event handlers.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/features/practice/musicGenerator.ts`
  - `apps/frontend/src/features/practice/pitchUtils.ts`
  - `docs/TODO.md`
- Next best step:
  - CHUNK-CLEANUP-01B: split `App.tsx` UI sections into reusable components (`ProgressionCard`, `ConfigurationCard`, `MetronomeCard`, `TimelineCard`) to further reduce page complexity.
- Risks/blockers:
  - No functional change intended; module boundaries are currently utility-focused and can be refined during component extraction.
