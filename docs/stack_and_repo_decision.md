# EchoLick POC Stack and Repository Decision

## Decision Summary

For the POC, use:

- **Frontend:** React + Vite + TypeScript
- **Backend:** Python + FastAPI
- **Containerization:** Docker + Docker Compose for local orchestration
- **Audio Engine:** Web Audio API in the browser frontend
- **LLM Integration:** FastAPI endpoint with strict response validation + fallback
- **Validation:** Pydantic on backend response contracts
- **Testing:** Vitest (frontend unit) + `pytest` (backend unit)

This keeps iteration fast while giving clean API boundaries that will still fit when React Native is introduced later.

---

## Why This Stack

- Vite gives the fastest frontend feedback loop for UI/audio experiments.
- FastAPI gives a simple typed backend for `/api/generate-lick`.
- Python backend makes LLM integrations and validation straightforward.
- Docker Compose gives one-command local startup for the full system.
- This naturally evolves to `web + mobile` clients sharing one backend.

---

## Repository Shape

Use a **multi-app layout now** because we already know we will add React Native later.

- `apps/frontend` for web
- `apps/backend` for API
- optional shared packages later (music logic contracts/types)

This avoids a disruptive restructure when mobile starts.

---

## Proposed Initial Structure

```text
echolick/
  apps/
    frontend/                  # React + Vite
      src/
      public/
      Dockerfile
      nginx.conf
      package.json
    backend/                   # FastAPI
      app/
        main.py
        models.py
        services/
          fallback_licks.py
          generator.py
      tests/
      requirements.txt
      Dockerfile

  docker-compose.yml
  .env.example
  README.md
```

Notes:
- Keep deterministic music rules in backend services so web and future mobile consume the same behavior.
- Keep frontend focused on UI state, playback, and user interaction.
- Place API request/response schemas in backend models and mirror types in frontend if needed.

---

## Docker Compose Local Run

Services:

- `backend` on `http://localhost:8000`
- `frontend` on `http://localhost:5173`

Networking:

- Frontend calls backend via internal hostname `backend` in Docker network.
- For browser runtime, expose backend URL through `VITE_API_BASE_URL`.

Default local command:

```bash
docker compose up --build
```

---

## Guardrails

- Never trust raw LLM output; always validate before returning to frontend.
- Keep POC key hardcoded to A as planned.
- Keep POC scope: generation + progression + playback only.
- Defer auth, payments, microphone scoring, and mobile implementation.

---

## React Native Later

When mobile starts:

- add `apps/mobile` (React Native / Expo)
- reuse backend endpoints unchanged
- progressively extract shared music logic into `packages/music-core` if needed

---

## Immediate Next Steps

1. Scaffold frontend and backend app folders.
2. Add Dockerfiles for each app and wire `docker-compose.yml`.
3. Add a health endpoint and a placeholder `/api/generate-lick` in FastAPI.
4. Wire frontend to backend with env-based API URL.
5. Validate `docker compose up --build` end-to-end.

