from app.models import GenerateLickRequest


def build_generation_prompt(payload: GenerateLickRequest) -> str:
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
- Prefer notes from the A {payload.flavor} blues scale
- Target chord tones of the current chord on strong beats when possible
- Include at most one bend
- Include at most two vibrato markings
- Keep it playable on guitar
- Avoid large random jumps
- Make it sound like a short call-and-response phrase

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
      "technique": "normal"
    }}
  ]
}}
""".strip()
