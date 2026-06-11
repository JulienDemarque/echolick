# EchoLick

POC stack:

- Frontend: React + Vite (`apps/frontend`)
- UI: Tailwind CSS + reusable Tailwind UI components (`apps/frontend/src/components/ui`)
- Backend: FastAPI (`apps/backend`)
- Local orchestration: Docker Compose

## Run with Docker Compose

1. Create backend runtime env (required):
   - `cp apps/backend/.env.example apps/backend/.env`
2. (Optional) create root compose override env:
   - `cp .env.example .env`
3. Build and start:
   - `docker compose up --build`
4. Open:
   - Frontend: `http://localhost:5173`
   - Backend docs: `http://localhost:8000/docs`

## What is included

- `GET /health` for backend health check
- `POST /api/generate-lick` placeholder endpoint returning a valid fallback lick
- Frontend UI buttons to call both endpoints and display returned JSON

## Observability (Langfuse)

Set these variables to enable OpenAI call tracing from backend:

- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_HOST` or `LANGFUSE_BASE_URL` (for local Docker: `http://langfuse-web:3000`)

Tracing best-practice defaults in backend:

- Root span is named `generate-lick-request` and trace name is `api.generate-lick`
- Trace input is explicitly scoped to musical request fields only
- Tags are added for filtering (`feature:lick-generation`, `degree:*`, `flavor:*`)
- Trace output captures source (`openai` vs `fallback`) and fallback reason when applicable

### Run Langfuse locally (self-hosted)

1. Create backend env for local Langfuse:
   - `cp apps/backend/.env.langfuse.local.example apps/backend/.env`
2. Start app + local observability stack:
   - `docker compose -f docker-compose.yml -f docker-compose.langfuse.yml --profile observability up -d --build`
3. Open local Langfuse:
   - `http://localhost:3000`

Notes:
- This uses the official multi-service Langfuse Docker Compose stack.
- For local tracing to work, set `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` in `apps/backend/.env` (from your local Langfuse project settings).
- Generate a lick request after startup, then check Langfuse `Traces` and filter by `feature:lick-generation`.
- Root `.env` is only for compose-level variable interpolation; backend service env is loaded from `apps/backend/.env`.

## Docs and planning

- Roadmap: `docs/echolick_blues_poc_roadmap.md`
- Stack decision: `docs/stack_and_repo_decision.md`
- Chunked TODO + thread handoff log: `docs/TODO.md`
- Supabase schema + difficulty/library plan: `docs/supabase_schema.md`

## Supabase (setup prep)

When wiring persistence, set these env vars:

- `SUPABASE_URL`
- `SUPABASE_API_KEY` (recommended; modern secret key)
- `SUPABASE_ANON_KEY`

Notes:

- Keep `SUPABASE_API_KEY` backend-only.
- Prefer backend-mediated writes for now; frontend can remain API-driven.

### Run initial schema + form seed

In Supabase SQL Editor, run in order:

1. `db/supabase/001_init_minimal_schema.sql`
2. `db/supabase/002_seed_forms_eabc.sql`

This creates minimal v1 tables (`forms`, `form_bars`, `licks`) and seeds 12-bar basic forms for keys `E`, `A`, `B`, and `C`.

### Seed initial licks (backend script)

From `apps/backend`:

- `python scripts/seed_licks.py --clear-existing`

Useful options:

- `--tempo 76`
- `--source seed_v1`
- `--policies major_penta_root minor_penta_root mix_major_minor`

Notes:

- Script reads active forms/bars from Supabase and inserts rows into `licks`.
- It uses existing backend generation logic (`generate_lick`), so `OPENAI_API_KEY` behavior/fallbacks apply.
