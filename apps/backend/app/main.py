from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    FormBarContext,
    FormSummary,
    GeneratedChorus,
    GeneratedLick,
    GenerateChorusRequest,
    GenerateLickRequest,
    StoredLick,
)
from app.services.generator import generate_chorus, generate_lick
from app.services.library_repo import list_form_bars, list_forms, list_licks

app = FastAPI(title="EchoLick API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/generate-lick", response_model=GeneratedLick)
def generate_lick_route(payload: GenerateLickRequest) -> GeneratedLick:
    return generate_lick(payload)


@app.post("/api/generate-chorus", response_model=GeneratedChorus)
def generate_chorus_route(payload: GenerateChorusRequest) -> GeneratedChorus:
    return generate_chorus(payload)


@app.get("/api/forms", response_model=list[FormSummary])
def list_forms_route() -> list[FormSummary]:
    try:
        return list_forms()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forms: {exc}") from exc


@app.get("/api/forms/{form_id}/bars", response_model=list[FormBarContext])
def list_form_bars_route(form_id: str) -> list[FormBarContext]:
    try:
        return list_form_bars(form_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch form bars: {exc}") from exc


@app.get("/api/licks", response_model=list[StoredLick])
def list_licks_route(
    form_id: str | None = Query(default=None),
    bar_index: int | None = Query(default=None, ge=0),
    note_policy: str | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
) -> list[StoredLick]:
    try:
        return list_licks(
            form_id=form_id,
            bar_index=bar_index,
            note_policy=note_policy,
            limit=limit,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch licks: {exc}") from exc
