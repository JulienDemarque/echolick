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
