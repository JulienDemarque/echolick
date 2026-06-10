from app.models import GeneratedLick, GenerateLickRequest, LickNote


def build_fallback_lick(payload: GenerateLickRequest) -> GeneratedLick:
    # Simple, safe phrase that always fits in one 4/4 bar.
    notes = [
        LickNote(
            midi=69,
            noteName="A4",
            start=0.0,
            duration=1.0,
            velocity=0.82,
            technique="normal",
        ),
        LickNote(
            midi=72,
            noteName="C5",
            start=1.0,
            duration=1.0,
            velocity=0.86,
            technique="normal",
        ),
        LickNote(
            midi=74,
            noteName="D5",
            start=2.0,
            duration=1.0,
            velocity=0.9,
            technique="bend",
            bend={"toMidi": 76, "start": 0.1, "end": 0.5},
        ),
        LickNote(
            midi=69,
            noteName="A4",
            start=3.0,
            duration=1.0,
            velocity=0.84,
            technique="vibrato",
            vibrato={"depthSemitones": 0.2, "rateHz": 5.5, "start": 0.25},
        ),
    ]

    return GeneratedLick(
        key=payload.key,
        degree=payload.degree,
        chord=payload.chord,
        flavor=payload.flavor,
        tempo=payload.tempo,
        notes=notes,
    )
