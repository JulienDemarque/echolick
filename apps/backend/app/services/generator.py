import os

from app.models import GeneratedLick, GenerateLickRequest
from app.services.fallback_licks import build_fallback_lick


def generate_lick(payload: GenerateLickRequest) -> GeneratedLick:
    # Keep this as a stable placeholder until LLM integration is added.
    # If a key exists later, this function can branch into provider code.
    _llm_key = os.getenv("OPENAI_API_KEY")
    return build_fallback_lick(payload)
