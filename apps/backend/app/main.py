from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import GeneratedChorus, GeneratedLick, GenerateChorusRequest, GenerateLickRequest
from app.services.generator import generate_chorus, generate_lick

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
