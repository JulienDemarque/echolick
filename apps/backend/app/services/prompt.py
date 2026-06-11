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
    chord_tones = set()
    for interval in [0, 4, 7, 10]:
        semitone = (chord_root_semitone + interval) % 12
        chord_tones.add(next(note for note, value in NOTE_TO_SEMITONE.items() if value == semitone))

    # Major blues pool formula: 1 2 b3 3 5 6
    key_semitone = NOTE_TO_SEMITONE.get(payload.key, NOTE_TO_SEMITONE["A"])
    pool = []
    for interval in [0, 2, 3, 4, 7, 9]:
        pool.append(next(note for note, semitone in NOTE_TO_SEMITONE.items() if semitone == (key_semitone + interval) % 12))

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

    pool_reference = "\n".join(pool_reference_lines)

    return f"""
Theory references for MAJOR blues (use these intentionally):
- Active note pool for this bar (major blues pool) in key {payload.key}:
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
- Rhythm should be simple and straight (minimal syncopation)
- Allowed starts: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5
- Allowed durations only: 0.5, 1, 2
- All notes must fit within 0 <= start < 4
- No note may end after beat 4
- If note has bend: bend.start and bend.end are offsets within the note duration (NOT bar time)
- If note has vibrato: vibrato.start is an offset within the note duration (NOT bar time)
- bend.start and bend.end must satisfy 0 <= bend.start < bend.end <= note.duration
- vibrato.start must satisfy 0 <= vibrato.start <= note.duration
- Prefer notes from the {payload.key} {payload.flavor} blues scale
- Target chord tones of the current chord on strong beats when possible
- Include at most one bend
- Include at most two vibrato markings
- Keep it playable on guitar
- Avoid large random jumps
- Make it sound like a short call-and-response phrase
{reference_block}

Return this exact JSON shape:
{{
  "key": "{payload.key}",
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
    note_order = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    key_index = note_order.index(payload.key) if payload.key in note_order else note_order.index("A")
    i_chord = f"{note_order[key_index]}7"
    iv_chord = f"{note_order[(key_index + 5) % 12]}7"
    v_chord = f"{note_order[(key_index + 7) % 12]}7"

    return f"""
You are generating a 12-bar blues chorus for an ear-training app.

Return valid JSON only. No markdown. No explanation.

Global constraints:
- Key: {payload.key}
- Flavor: {payload.flavor}
- Tempo: {payload.tempo}
- Time signature: 4/4
- Generate exactly 12 bars with this progression:
  1:I({i_chord}), 2:IV({iv_chord}), 3:I({i_chord}), 4:I({i_chord}), 5:IV({iv_chord}), 6:IV({iv_chord}),
  7:I({i_chord}), 8:I({i_chord}), 9:V({v_chord}), 10:IV({iv_chord}), 11:I({i_chord}), 12:V({v_chord})
- Keep each bar musically cohesive and make phrase continuity across bars
- For each bar, use 4 to 8 notes
- Rhythm should be simple and straight (minimal syncopation)
- Allowed starts: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5
- Allowed durations only: 0.5, 1, 2
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
  "key": "{payload.key}",
  "flavor": "{payload.flavor}",
  "tempo": {payload.tempo},
  "bars": [
    {{
      "key": "{payload.key}",
      "degree": "I",
      "chord": "{i_chord}",
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
