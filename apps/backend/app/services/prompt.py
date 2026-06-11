from app.models import GenerateChorusRequest, GenerateLickRequest


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

INTERVAL_LABELS = {
    0: "1",
    1: "b2",
    2: "2",
    3: "b3",
    4: "3",
    5: "4",
    6: "#4/b5",
    7: "5",
    8: "#5/b6",
    9: "6",
    10: "b7",
    11: "7",
}

KEY_A_REFERENCE = [
    ("A", "1"),
    ("B", "2"),
    ("C", "b3"),
    ("C#", "3"),
    ("D", "4"),
    ("E", "5"),
    ("F#", "6"),
    ("G", "b7"),
]

A_MAJOR_BLUES_POOL = ["A", "B", "C", "C#", "E", "F#"]
D_MAJOR_BLUES_POOL = ["D", "E", "F", "F#", "A", "B"]

CHORD_TONES_BY_CHORD = {
    "A7": ["A", "C#", "E", "G"],
    "D7": ["D", "F#", "A", "C"],
    "E7": ["E", "G#", "B", "D"],
}


def _get_chord_root(chord: str) -> str:
    if len(chord) >= 2 and chord[1] in {"#", "b"}:
        return chord[:2]
    return chord[:1]


def _build_reference_context(payload: GenerateLickRequest) -> str:
    if payload.flavor != "major":
        return ""

    chord = payload.chord
    chord_root = _get_chord_root(chord)
    chord_root_semitone = NOTE_TO_SEMITONE.get(chord_root, NOTE_TO_SEMITONE["A"])
    chord_tones = set(CHORD_TONES_BY_CHORD.get(chord, []))

    if chord == "D7":
        pool = D_MAJOR_BLUES_POOL
    else:
        # Default major-blues pool anchored on A for I and V in this POC.
        pool = A_MAJOR_BLUES_POOL

    key_reference_lines = "\n".join(
        [f"- {note}: degree vs key A = {degree}" for note, degree in KEY_A_REFERENCE]
    )

    pool_reference_lines = []
    for note in pool:
        note_semitone = NOTE_TO_SEMITONE.get(note)
        if note_semitone is None:
            continue
        interval = (note_semitone - chord_root_semitone) % 12
        interval_label = INTERVAL_LABELS[interval]
        chord_role = "chord-tone" if note in chord_tones else "color/approach"
        pool_reference_lines.append(
            f"- {note}: interval vs {chord_root} = {interval_label}, role vs {chord} = {chord_role}"
        )

    pool_name = "D major blues pool" if chord == "D7" else "A major blues pool"
    pool_reference = "\n".join(pool_reference_lines)

    return f"""
Theory references for MAJOR blues (use these intentionally):
- Key-center note degrees relative to A:
{key_reference_lines}
- Active note pool for this bar ({pool_name}):
{pool_reference}
- Prioritize chord-tones on strong beats (1 and 3), then mix in color notes on weak beats.
- In major blues, occasionally use b3 as a blue-note passing tone resolving to 3.
""".strip()


def build_generation_prompt(payload: GenerateLickRequest) -> str:
    reference_context = _build_reference_context(payload)
    reference_block = f"\n\n{reference_context}" if reference_context else ""

    return f"""
You are generating a one-bar blues guitar lick for an ear-training app.

Return valid JSON only. No markdown. No explanation.

Constraints:
- Key: {payload.key}
- Current chord degree: {payload.degree}
- Current chord: {payload.chord}
- Flavor: {payload.flavor}
- Tempo: {payload.tempo}
- Time signature: 4/4
- Bar length: exactly 4 beats
- Style: BB King-inspired electric blues
- Difficulty: beginner/intermediate
- Use 4 to 8 notes
- Use start and duration in beats
- All notes must fit within 0 <= start < 4
- No note may end after beat 4
- If note has bend: bend.start and bend.end are offsets within the note duration (NOT bar time)
- If note has vibrato: vibrato.start is an offset within the note duration (NOT bar time)
- bend.start and bend.end must satisfy 0 <= bend.start < bend.end <= note.duration
- vibrato.start must satisfy 0 <= vibrato.start <= note.duration
- Prefer notes from the A {payload.flavor} blues scale
- Target chord tones of the current chord on strong beats when possible
- Include at most one bend
- Include at most two vibrato markings
- Keep it playable on guitar
- Avoid large random jumps
- Make it sound like a short call-and-response phrase
{reference_block}

Return this exact JSON shape:
{{
  "key": "A",
  "degree": "{payload.degree}",
  "chord": "{payload.chord}",
  "flavor": "{payload.flavor}",
  "tempo": {payload.tempo},
  "timeSignature": "4/4",
  "notes": [
    {{
      "midi": 69,
      "noteName": "A4",
      "start": 0,
      "duration": 0.5,
      "velocity": 0.8,
      "bend": {{
        "toMidi": 71,
        "start": 0.05,
        "end": 0.3
      }},
      "vibrato": {{
        "depthSemitones": 0.2,
        "rateHz": 5.0,
        "start": 0.15
      }},
      "technique": "normal"
    }}
  ]
}}
""".strip()


def build_chorus_generation_prompt(payload: GenerateChorusRequest) -> str:
    return f"""
You are generating a 12-bar blues chorus for an ear-training app.

Return valid JSON only. No markdown. No explanation.

Global constraints:
- Key: {payload.key}
- Flavor: {payload.flavor}
- Tempo: {payload.tempo}
- Time signature: 4/4
- Generate exactly 12 bars with this progression:
  1:I(A7), 2:IV(D7), 3:I(A7), 4:I(A7), 5:IV(D7), 6:IV(D7),
  7:I(A7), 8:I(A7), 9:V(E7), 10:IV(D7), 11:I(A7), 12:V(E7)
- Keep each bar musically cohesive and make phrase continuity across bars
- For each bar, use 4 to 8 notes
- All notes must fit within 0 <= start < 4 and end by beat 4
- Articulation timing must be note-local:
  - bend.start and bend.end are offsets within note duration
  - vibrato.start is offset within note duration
  - 0 <= bend.start < bend.end <= note.duration
  - 0 <= vibrato.start <= note.duration
- Include at most one bend and at most two vibrato markings per bar
- Prioritize chord tones on strong beats while mixing major/minor blues color tones
- Keep it playable on guitar and avoid random large jumps

Return this exact JSON shape:
{{
  "key": "A",
  "flavor": "{payload.flavor}",
  "tempo": {payload.tempo},
  "bars": [
    {{
      "key": "A",
      "degree": "I",
      "chord": "A7",
      "flavor": "{payload.flavor}",
      "tempo": {payload.tempo},
      "timeSignature": "4/4",
      "notes": [
        {{
          "midi": 69,
          "noteName": "A4",
          "start": 0,
          "duration": 0.5,
          "velocity": 0.8,
          "bend": null,
          "vibrato": null,
          "technique": "normal"
        }}
      ]
    }}
  ]
}}
""".strip()
