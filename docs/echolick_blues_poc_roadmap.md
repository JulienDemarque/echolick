# EchoLick POC Roadmap — Blues Call-and-Response Generator

## Goal

Build a proof-of-concept app for blues ear training.

The app should:

1. Generate a short blues lick using an LLM.
2. Play a backing chord underneath the lick.
3. Move sequentially through a 12-bar blues progression.
4. Generate each lick according to the current chord: I, IV, or V.
5. Support major and minor blues flavor.
6. Play the generated lick with simple but expressive audio: notes, bends, vibrato, rests.
7. Later record the user's response and score correctness.

For the POC, focus on **audio generation and LLM-generated licks**, not microphone scoring yet.

---

# Product Concept

The user is practicing blues call-and-response.

The app behaves like a teacher:

> "Here is a lick over the I chord."
> "Now here is a lick over the IV chord."
> "Now here is a lick over the V chord."

The app walks through a 12-bar blues progression and generates context-aware licks for each bar.

---

# 12-Bar Blues Progression

Use this progression as the core song form:

```ts
const bluesProgression = [
  "I",
  "IV",
  "I",
  "I",
  "IV",
  "IV",
  "I",
  "I",
  "V",
  "IV",
  "I",
  "V"
];
```

Each generated exercise advances one step through the progression.

Example:

```text
Generation 1: I chord
Generation 2: IV chord
Generation 3: I chord
Generation 4: I chord
Generation 5: IV chord
...
Generation 12: V chord
Generation 13: back to I chord
```

---

# Initial Key

Start with A blues.

```ts
const key = "A";
```

Chord mapping:

```ts
const chordsByDegree = {
  I: {
    name: "A7",
    rootMidi: 57,
    chordTones: ["A", "C#", "E", "G"],
    midiNotes: [57, 61, 64, 67]
  },
  IV: {
    name: "D7",
    rootMidi: 62,
    chordTones: ["D", "F#", "A", "C"],
    midiNotes: [62, 66, 69, 72]
  },
  V: {
    name: "E7",
    rootMidi: 64,
    chordTones: ["E", "G#", "B", "D"],
    midiNotes: [64, 68, 71, 74]
  }
};
```

For the POC, hardcode A blues first. Generalize to other keys later.

---

# Blues Flavors

Support two modes:

```ts
type BluesFlavor = "minor" | "major";
```

## Minor Blues Scale in A

```ts
A minor blues = A C D Eb E G
MIDI around 4th/5th octave = [69, 72, 74, 75, 76, 79]
```

## Major Blues Scale in A

```ts
A major blues = A B C C# E F#
MIDI around 4th/5th octave = [69, 71, 72, 73, 76, 78]
```

## Practical POC Rule

Even when the backing chord changes to IV or V, the app can still use the A blues scale for a classic blues sound.

Later, improve by targeting chord tones based on the active chord.

---

# Core State

```ts
type Degree = "I" | "IV" | "V";
type BluesFlavor = "minor" | "major";

type AppState = {
  key: "A";
  tempo: number;
  barIndex: number;
  currentDegree: Degree;
  currentChordName: string;
  flavor: BluesFlavor;
};
```

Progression logic:

```ts
const getCurrentDegree = (barIndex: number): Degree => {
  return bluesProgression[barIndex % bluesProgression.length];
};

const advanceBar = (barIndex: number): number => {
  return (barIndex + 1) % bluesProgression.length;
};
```

---

# Lick Data Model

LLM should return structured JSON only.

```ts
type Bend = {
  toMidi: number;
  start: number; // beats relative to note start
  end: number;   // beats relative to note start
};

type Vibrato = {
  depthSemitones: number;
  rateHz: number;
  start: number; // beats relative to note start
};

type LickNote = {
  midi: number;
  noteName: string;
  start: number;      // beats from beginning of bar
  duration: number;   // beats
  velocity: number;   // 0 to 1
  bend?: Bend;
  vibrato?: Vibrato;
  technique?: "normal" | "bend" | "slide" | "hammer_on" | "pull_off" | "vibrato";
};

type GeneratedLick = {
  key: "A";
  degree: Degree;
  chord: string;
  flavor: BluesFlavor;
  tempo: number;
  timeSignature: "4/4";
  notes: LickNote[];
};
```

---

# Example LLM Output

```json
{
  "key": "A",
  "degree": "I",
  "chord": "A7",
  "flavor": "minor",
  "tempo": 76,
  "timeSignature": "4/4",
  "notes": [
    {
      "midi": 69,
      "noteName": "A4",
      "start": 0,
      "duration": 0.5,
      "velocity": 0.75,
      "technique": "normal"
    },
    {
      "midi": 72,
      "noteName": "C5",
      "start": 0.5,
      "duration": 0.5,
      "velocity": 0.8,
      "technique": "normal"
    },
    {
      "midi": 74,
      "noteName": "D5",
      "start": 1,
      "duration": 1,
      "velocity": 0.95,
      "technique": "bend",
      "bend": {
        "toMidi": 76,
        "start": 0.05,
        "end": 0.45
      },
      "vibrato": {
        "depthSemitones": 0.25,
        "rateHz": 6,
        "start": 0.5
      }
    },
    {
      "midi": 72,
      "noteName": "C5",
      "start": 2.25,
      "duration": 0.5,
      "velocity": 0.7,
      "technique": "normal"
    },
    {
      "midi": 69,
      "noteName": "A4",
      "start": 3,
      "duration": 1,
      "velocity": 0.85,
      "technique": "vibrato",
      "vibrato": {
        "depthSemitones": 0.18,
        "rateHz": 5.5,
        "start": 0.25
      }
    }
  ]
}
```

---

# LLM Prompt

Use a strict JSON prompt.

```text
You are generating a one-bar blues guitar lick for an ear-training app.

Return valid JSON only. No markdown. No explanation.

Constraints:
- Key: A
- Current chord degree: {degree}
- Current chord: {chord}
- Flavor: {minor_or_major}
- Tempo: {tempo}
- Time signature: 4/4
- Bar length: exactly 4 beats
- Style: BB King-inspired electric blues
- Difficulty: beginner/intermediate
- Use 4 to 8 notes
- Use start and duration in beats
- All notes must fit within 0 <= start < 4
- No note may end after beat 4
- Prefer notes from the A {minor_or_major} blues scale
- Target chord tones of the current chord on strong beats when possible
- Include at most one bend
- Include at most two vibrato markings
- Keep it playable on guitar
- Avoid large random jumps
- Make it sound like a short call-and-response phrase

Return this TypeScript-compatible JSON shape:

{
  "key": "A",
  "degree": "{degree}",
  "chord": "{chord}",
  "flavor": "{minor_or_major}",
  "tempo": {tempo},
  "timeSignature": "4/4",
  "notes": [
    {
      "midi": 69,
      "noteName": "A4",
      "start": 0,
      "duration": 0.5,
      "velocity": 0.8,
      "technique": "normal"
    }
  ]
}
```

---

# Validation

Never trust the LLM blindly.

Create a validator:

```ts
function validateGeneratedLick(lick: unknown): GeneratedLick
```

Validation rules:

- Has required fields.
- `notes` length between 1 and 12.
- `start >= 0`.
- `duration > 0`.
- `start + duration <= 4`.
- `midi` between 45 and 84.
- `velocity` between 0 and 1.
- `bend.toMidi` between 45 and 84 if present.
- `vibrato.depthSemitones <= 0.5`.
- `vibrato.rateHz` between 3 and 9.

If validation fails, fallback to a procedural lick.

---

# Fallback Procedural Licks

Create a small library of safe fallback licks.

```ts
const fallbackLicks = {
  I_minor: [...],
  IV_minor: [...],
  V_minor: [...],
  I_major: [...],
  IV_major: [...],
  V_major: [...]
};
```

The app should never fail because of bad LLM output.

---

# Audio Playback POC

Use Web Audio API first.

The POC can be a web app before React Native.

Playback layers:

1. Backing chord pad
2. Generated lead lick

---

# Chord Playback

For each bar, play the active dominant 7 chord.

Example A7:

```ts
[57, 61, 64, 67]
```

Use a soft electric-piano or simple guitar-like pad.

For Web Audio:

- Create oscillators for chord tones.
- Use triangle or sine waves.
- Add low-pass filter.
- Use slow attack and decay.
- Keep volume low.

Chord should start at beat 0 and last 4 beats.

```ts
playChord(chord.midiNotes, startTime, 4 * beatSeconds);
```

---

# Lead Guitar Playback

Use a synthetic guitar-ish voice:

- Plucked attack
- Short decay
- Saw/triangle blend or Karplus-Strong-like noise buffer
- Mild distortion
- Low-pass cabinet filter
- Pitch bend automation
- Vibrato LFO

Main function:

```ts
playLick(lick: GeneratedLick): void
```

Support:

```ts
playNote(note: LickNote): void
playBend(note: LickNote): void
playVibrato(note: LickNote): void
```

---

# UI POC

Single screen:

```text
EchoLick Blues POC

Key: A
Tempo: 76
Flavor: [minor] [major]

Current bar: 1 / 12
Current chord: I - A7

[Generate + Play Next Lick]
[Replay]
[Reset Progression]

Generated notes:
A4 C5 D5 bend to E5 C5 A4
```

Behavior:

- Button click generates lick for current bar.
- App plays chord + lick.
- After generation, increment bar index.
- Replay plays the last generated lick without advancing.
- Reset sets bar index to 0.

---

# Suggested File Structure

```text
src/
  app/
    page.tsx

  lib/
    bluesProgression.ts
    chords.ts
    scales.ts
    prompt.ts
    llm.ts
    validateLick.ts
    fallbackLicks.ts
    audio/
      audioContext.ts
      playChord.ts
      playLeadNote.ts
      playLick.ts
      guitarVoice.ts

  types/
    music.ts
```

---

# Implementation Phases

## Phase 1 — Static Audio Prototype

Build a page that plays:

- A7 backing chord
- Hardcoded A minor blues lick
- One bend
- One vibrato

Done when it sounds acceptable enough for a POC.

---

## Phase 2 — Progression State

Add 12-bar state:

```ts
I IV I I IV IV I I V IV I V
```

Display current bar and chord.

Clicking "Next" advances through the progression.

Done when the UI correctly cycles through the 12-bar form.

---

## Phase 3 — LLM Lick Generation

Add API route:

```text
POST /api/generate-lick
```

Request:

```ts
{
  key: "A",
  degree: "I",
  chord: "A7",
  flavor: "minor",
  tempo: 76
}
```

Response:

```ts
GeneratedLick
```

Use LLM structured output if available.

Done when clicking "Generate" returns a valid lick JSON.

---

## Phase 4 — Validation + Fallback

Validate every LLM output.

If invalid:

- Log the error.
- Use fallback lick for current degree/flavor.
- Continue playback.

Done when bad LLM output cannot break the app.

---

## Phase 5 — Chord + Lick Playback

Play the current chord underneath the generated lick.

Chord duration: 4 beats.

Lead lick duration: up to 4 beats.

Done when each generated lick plays over the correct chord.

---

## Phase 6 — Major/Minor Toggle

Add flavor toggle:

```text
Minor blues / Major blues
```

Send flavor to LLM.

Done when generated licks sound different between major/minor.

---

## Phase 7 — Improve Musicality

Add generation constraints:

- Resolve I licks to A.
- Resolve IV licks to D or A.
- Resolve V licks with tension, often ending on E, D, or leading back to A.
- Prefer chord tones on beats 1 and 3.
- Avoid too many notes.
- Add rests for phrasing.
- Add one expressive technique max.

Done when generated licks feel less random.

---

# POC Non-Goals

Do not build these yet:

- User accounts
- Payments
- Microphone pitch detection
- Scoring
- Mobile app
- Full DAW features
- Realistic sampled guitar engine
- Multi-key support
- Full fretboard visualization

These come later.

---

# Next Version After POC

After this POC works, add:

1. Microphone recording.
2. Pitch detection.
3. User imitation scoring.
4. Adaptive difficulty.
5. React Native mobile port.
6. Better guitar samples.
7. Export MIDI.
8. Daily blues challenge.

---

# Technical Recommendation

Start with a web POC using Next.js + TypeScript.

Reason:

- Faster iteration than React Native.
- Web Audio API is easier to prototype with.
- LLM API route is straightforward.
- Once the musical loop works, port to React Native.

Suggested command:

```bash
npx create-next-app@latest echolick-blues-poc --typescript --tailwind --eslint --app
```

---

# Cursor Task Prompt

Use this as the initial instruction to Cursor Composer:

```text
Build a Next.js TypeScript POC for a blues call-and-response ear-training app.

The app should generate and play one-bar blues licks over a sequential 12-bar blues progression.

Use the progression:
I IV I I IV IV I I V IV I V

Hardcode key A for now.

Map:
I = A7
IV = D7
V = E7

The UI should show:
- current bar number
- current degree
- current chord
- flavor toggle: minor blues / major blues
- Generate + Play Next Lick button
- Replay button
- Reset Progression button
- generated JSON notes

Implement Web Audio playback:
- backing chord lasting 4 beats
- lead lick using MIDI-style note objects
- support bend and vibrato if present

Implement an API route /api/generate-lick that returns structured JSON for a one-bar blues lick.
Use a placeholder function first if no LLM key is configured.
Add validation and fallback licks so playback never breaks.

Do not implement microphone recording or scoring yet.
Focus only on generation, progression, chords, and audio playback.
```
