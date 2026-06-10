# EchoLick

POC stack:

- Frontend: React + Vite (`apps/frontend`)
- UI: Tailwind CSS + reusable Tailwind UI components (`apps/frontend/src/components/ui`)
- Backend: FastAPI (`apps/backend`)
- Local orchestration: Docker Compose

## Run with Docker Compose

1. Copy env file:
   - `cp .env.example .env`
2. Build and start:
   - `docker compose up --build`
3. Open:
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

## Docs and planning

- Roadmap: `docs/echolick_blues_poc_roadmap.md`
- Stack decision: `docs/stack_and_repo_decision.md`
- Chunked TODO + thread handoff log: `docs/TODO.md`
