from app.models import GeneratedLick, GenerateLickRequest, LickNote


NOTE_TO_SEMITONE = {
    "C": 0,
    "C#": 1,
    "D": 2,
    "D#": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "G": 7,
    "G#": 8,
    "A": 9,
    "A#": 10,
    "B": 11,
}
SEMITONE_TO_NOTE = {value: key for key, value in NOTE_TO_SEMITONE.items()}


def _chord_root(chord: str) -> str:
    if len(chord) >= 2 and chord[1] in {"#", "b"}:
        return chord[:2]
    return chord[:1]


def _note_name_for_midi(midi: int) -> str:
    pitch_class = midi % 12
    octave = (midi // 12) - 1
    return f"{SEMITONE_TO_NOTE[pitch_class]}{octave}"


def build_fallback_lick(payload: GenerateLickRequest) -> GeneratedLick:
    # Simple, safe phrase that always fits in one 4/4 bar and follows chord context.
    root = _chord_root(payload.chord)
    root_pc = NOTE_TO_SEMITONE.get(root, NOTE_TO_SEMITONE["A"])
    root_midi = 60 + root_pc
    b3_midi = root_midi + 3
    fourth_midi = root_midi + 5
    fifth_midi = root_midi + 7

    notes = [
        LickNote(
            midi=root_midi,
            noteName=_note_name_for_midi(root_midi),
            start=0.0,
            duration=1.0,
            velocity=0.82,
            technique="normal",
        ),
        LickNote(
            midi=b3_midi,
            noteName=_note_name_for_midi(b3_midi),
            start=1.0,
            duration=1.0,
            velocity=0.86,
            technique="normal",
        ),
        LickNote(
            midi=fourth_midi,
            noteName=_note_name_for_midi(fourth_midi),
            start=2.0,
            duration=1.0,
            velocity=0.9,
            technique="normal",
        ),
        LickNote(
            midi=fifth_midi,
            noteName=_note_name_for_midi(fifth_midi),
            start=3.0,
            duration=1.0,
            velocity=0.84,
            technique="normal",
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
