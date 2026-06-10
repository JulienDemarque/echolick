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
- `LANGFUSE_HOST` (defaults to `https://cloud.langfuse.com`)

## Docs and planning

- Roadmap: `docs/echolick_blues_poc_roadmap.md`
- Stack decision: `docs/stack_and_repo_decision.md`
- Chunked TODO + thread handoff log: `docs/TODO.md`
