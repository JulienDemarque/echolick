import os
import json
import logging

from langfuse.openai import OpenAI

from app.models import GeneratedLick, GenerateLickRequest
from app.services.fallback_licks import build_fallback_lick
from app.services.prompt import build_generation_prompt

logger = logging.getLogger(__name__)


def _validate_generated_lick(lick: GeneratedLick) -> None:
    if not (1 <= len(lick.notes) <= 12):
        raise ValueError("notes length must be between 1 and 12")

    bend_count = 0
    vibrato_count = 0

    for note in lick.notes:
        if note.start + note.duration > 4:
            raise ValueError("note ends after beat 4")

        if note.bend is not None:
            bend_count += 1
            if note.bend.start >= note.bend.end:
                raise ValueError("bend start must be before bend end")
            if note.bend.end > note.duration:
                raise ValueError("bend end exceeds note duration")

        if note.vibrato is not None:
            vibrato_count += 1
            if note.vibrato.start > note.duration:
                raise ValueError("vibrato start exceeds note duration")

    if bend_count > 1:
        raise ValueError("at most one bend is allowed")
    if vibrato_count > 2:
        raise ValueError("at most two vibrato markings are allowed")


def _generate_with_openai(payload: GenerateLickRequest, api_key: str) -> GeneratedLick:
    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    prompt = build_generation_prompt(payload)
    schema = GeneratedLick.model_json_schema()

    response = client.responses.create(
        model=model,
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "generated_lick",
                "schema": schema,
                "strict": True,
            }
        },
    )

    raw = (response.output_text or "").strip()
    if not raw:
        raise ValueError("LLM returned empty output")

    parsed = json.loads(raw)
    lick = GeneratedLick.model_validate(parsed)
    _validate_generated_lick(lick)
    return lick


def generate_lick(payload: GenerateLickRequest) -> GeneratedLick:
    llm_key = os.getenv("OPENAI_API_KEY")
    if not llm_key:
        return build_fallback_lick(payload)

    try:
        return _generate_with_openai(payload, llm_key)
    except Exception as exc:
        logger.warning("LLM lick generation failed, using fallback: %s", exc)
    return build_fallback_lick(payload)
