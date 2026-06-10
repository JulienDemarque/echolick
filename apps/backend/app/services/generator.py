import os
import json
import logging
import time

from langfuse.openai import OpenAI
from langfuse import get_client, propagate_attributes

from app.models import GeneratedLick, GenerateLickRequest
from app.services.fallback_licks import build_fallback_lick
from app.services.prompt import build_generation_prompt

logger = logging.getLogger(__name__)
langfuse = get_client()


def _to_openai_strict_json_schema(node: object) -> object:
    if isinstance(node, dict):
        converted = {key: _to_openai_strict_json_schema(value) for key, value in node.items()}
        if converted.get("type") == "object" or "properties" in converted:
            properties = converted.get("properties", {})
            if isinstance(properties, dict):
                converted["required"] = list(properties.keys())
            converted.setdefault("additionalProperties", False)
        return converted
    if isinstance(node, list):
        return [_to_openai_strict_json_schema(item) for item in node]
    return node


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


def _normalize_articulation_timing(lick: GeneratedLick) -> GeneratedLick:
    for note in lick.notes:
        if note.bend is not None:
            # Recover common model mistake: bend timing emitted as bar time instead of note-local time.
            if note.bend.start > note.duration and note.bend.start >= note.start:
                note.bend.start = max(0.0, note.bend.start - note.start)
            if note.bend.end > note.duration and note.bend.end >= note.start:
                note.bend.end = max(0.0, note.bend.end - note.start)

        if note.vibrato is not None:
            # Recover common model mistake: vibrato start emitted as bar time.
            if note.vibrato.start > note.duration and note.vibrato.start >= note.start:
                note.vibrato.start = max(0.0, note.vibrato.start - note.start)

    return lick


def _generate_with_openai(payload: GenerateLickRequest, api_key: str) -> GeneratedLick:
    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    prompt = build_generation_prompt(payload)
    schema = _to_openai_strict_json_schema(GeneratedLick.model_json_schema())

    started_at = time.perf_counter()
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
    elapsed_s = time.perf_counter() - started_at
    logger.info("OpenAI lick generation completed in %.2fs with model=%s", elapsed_s, model)

    raw = (response.output_text or "").strip()
    if not raw:
        raise ValueError("LLM returned empty output")

    parsed = json.loads(raw)
    lick = GeneratedLick.model_validate(parsed)
    lick = _normalize_articulation_timing(lick)
    _validate_generated_lick(lick)
    return lick


def _build_trace_input(payload: GenerateLickRequest) -> dict[str, object]:
    return {
        "key": payload.key,
        "degree": payload.degree,
        "chord": payload.chord,
        "flavor": payload.flavor,
        "tempo": payload.tempo,
    }


def _build_trace_output(
    lick: GeneratedLick, source: str, model: str | None = None, fallback_reason: str | None = None
) -> dict[str, object]:
    output: dict[str, object] = {
        "source": source,
        "note_count": len(lick.notes),
        "first_note": lick.notes[0].noteName if lick.notes else None,
    }
    if model is not None:
        output["model"] = model
    if fallback_reason is not None:
        output["fallback_reason"] = fallback_reason
    return output


def generate_lick(payload: GenerateLickRequest) -> GeneratedLick:
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    llm_key = os.getenv("OPENAI_API_KEY")
    trace_input = _build_trace_input(payload)
    trace_tags = [
        "feature:lick-generation",
        f"degree:{payload.degree}",
        f"flavor:{payload.flavor}",
    ]
    trace_metadata = {
        "endpoint": "/api/generate-lick",
        "chord": payload.chord,
        "tempo": str(payload.tempo),
    }

    span_ctx = langfuse.start_as_current_observation(
        as_type="span",
        name="generate-lick-request",
        input=trace_input,
    )
    attrs_ctx = propagate_attributes(
        trace_name="api.generate-lick",
        tags=trace_tags,
        metadata=trace_metadata,
    )

    try:
        with span_ctx as span, attrs_ctx:
            if not llm_key:
                fallback = build_fallback_lick(payload)
                span.update(
                    output=_build_trace_output(
                        fallback,
                        source="fallback",
                        model=model,
                        fallback_reason="missing_openai_api_key",
                    )
                )
                return fallback

            try:
                lick = _generate_with_openai(payload, llm_key)
                span.update(output=_build_trace_output(lick, source="openai", model=model))
                return lick
            except Exception as exc:
                logger.warning("LLM lick generation failed, using fallback: %s", exc)
                fallback = build_fallback_lick(payload)
                span.update(
                    output=_build_trace_output(
                        fallback,
                        source="fallback",
                        model=model,
                        fallback_reason=type(exc).__name__,
                    )
                )
                return fallback
    except Exception as trace_exc:
        logger.warning("Langfuse tracing failed, continuing without tracing: %s", trace_exc)
        if not llm_key:
            return build_fallback_lick(payload)
        try:
            return _generate_with_openai(payload, llm_key)
        except Exception as exc:
            logger.warning("LLM lick generation failed, using fallback: %s", exc)
            return build_fallback_lick(payload)
