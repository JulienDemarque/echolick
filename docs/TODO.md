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
