# EchoLick Chunked TODO (v2)

Use this file as the shared handoff anchor between chat threads.

## Current Chunk

- [x] CHUNK-UX-BACKGROUND-ROTATION-ASSET-UPDATE-A: Add newly created pixel-art assets to rotating top-left background list.

## Next Chunks

- [ ] CHUNK-CLEANUP-02: Trim test-only re-exports from `musicGenerator.ts` and import shape helpers directly from `shapeResolver` in tests.
- [ ] CHUNK-UX-FRETBOARD-CHORDTONE-HIGHLIGHT-B: Add dedicated visual accent for chord-tone notes in the fretboard.
- [ ] CHUNK-CLEANUP-03: Split `App.tsx` practice loop and mic-capture logic into smaller feature modules.

## Session Handoff Log

Copy this template for each chunk update:

```md
### YYYY-MM-DD HH:mm - CHUNK-XX
- Status: done | in_progress | blocked
- Completed:
  - ...
- Files changed:
  - ...
- Next best step:
  - ...
- Risks/blockers:
  - ...
```

### 2026-06-20 21:50 - CHUNK-GEN-RANGE-SEPARATION-CLEANUP-A
- Status: done
- Completed:
  - Removed MIDI-range filtering from UI shape resolution so first-box low-E anchors are preserved.
  - Kept generation register filtering (`50..82`) in permutation lick generation only.
  - Added/updated regression tests to cover both the UI anchor notes and generator range safety.
- Files changed:
  - `apps/frontend/src/features/practice/musicGenerator/shapeResolver.ts`
  - `apps/frontend/src/features/practice/musicGenerator.ts`
  - `apps/frontend/src/features/practice/musicGenerator.test.ts`
  - `apps/frontend/src/features/practice/musicGenerator/shapeResolver.test.ts`
- Next best step:
  - Do a focused dead-export cleanup in `musicGenerator.ts`.
- Risks/blockers:
  - If future UX requires full-range generation from selected box notes, generator register bounds should become level-configurable.

### 2026-06-20 21:56 - CHUNK-GEN-RANGE-SIMPLIFY-B
- Status: done
- Completed:
  - Removed all generator min/max MIDI filtering and deleted related constants.
  - Removed octave-span logic from generation and deleted the octave-span UI control.
  - Removed octave-span state from Zustand store and cleaned related types/props.
  - Updated tests to match the simplified API and re-ran targeted generator/shape suites successfully.
- Files changed:
  - `apps/frontend/src/features/practice/musicGenerator.ts`
  - `apps/frontend/src/features/practice/musicGenerator.test.ts`
  - `apps/frontend/src/features/practice/musicGenerator/types.ts`
  - `apps/frontend/src/features/practice/components/ConfigurationCard.tsx`
  - `apps/frontend/src/store/useAppStore.ts`
  - `apps/frontend/src/App.tsx`
  - `docs/TODO2.md`
- Next best step:
  - Decide whether to reintroduce octave/register constraints via per-level policy rather than hardcoded globals.
- Risks/blockers:
  - With no register/span constraints, generated licks may occasionally jump to wider ranges; evaluate musicality after live playtesting.

### 2026-06-20 21:59 - CHUNK-UX-V7-THIRD-HIGHLIGHT-TEST-A
- Status: done
- Completed:
  - Added regression test for key `A`, `all-dominant`, bar 9 (`V7 = E7`), level-3 asserting the chord third (`G#`) should be visible as degree `7`.
  - Ran targeted generator tests and confirmed the new test fails with current output missing `7` from visible degrees.
- Files changed:
  - `apps/frontend/src/features/practice/musicGenerator.test.ts`
  - `docs/TODO2.md`
- Next best step:
  - Implement degree-7 support in core degree types/maps and chord-tone visibility flow.
- Risks/blockers:
  - `DegreeOptionId` currently excludes `7`, so even valid major-7 chord tones cannot be represented or highlighted as degree labels.

### 2026-06-20 22:01 - CHUNK-UX-V7-THIRD-HIGHLIGHT-FIX-A
- Status: done
- Completed:
  - Added `7` to `DegreeOptionId` so major-7 chord-tone labeling is representable in typed degree flows.
  - Extended semitone-to-degree mapping in `shapeResolver` to include semitone `11 -> 7`.
  - Extended `DEGREE_OPTIONS` with `7 (ti)` and updated root-scale weights to include the new degree key.
  - Re-ran targeted tests; the new V7+level-3 regression now passes.
- Files changed:
  - `apps/frontend/src/features/practice/musicGenerator/types.ts`
  - `apps/frontend/src/features/practice/musicGenerator/shapeResolver.ts`
  - `apps/frontend/src/features/practice/musicGenerator.ts`
  - `docs/TODO2.md`
- Next best step:
  - Add an explicit UI test around fretboard label rendering for `7` when V7 is active.
- Risks/blockers:
  - `7` is now available in global degree typing; if you later want strict pedagogical limits per level, enforce that only through level/chord visibility policy (not via type exclusion).

### 2026-06-20 22:21 - CHUNK-DEFAULTS-KEY-BOX-A
- Status: done
- Completed:
  - Updated app defaults so practice starts in key `A`.
  - Updated default CAGED position to `1-e-shape` (1st box).
- Files changed:
  - `apps/frontend/src/store/useAppStore.ts`
  - `docs/TODO2.md`
- Next best step:
  - Add a lightweight UI smoke test asserting initial configuration defaults in rendered controls.
- Risks/blockers:
  - Existing user-saved state (if persisted elsewhere in future) could override these defaults at runtime.

### 2026-06-20 22:23 - CHUNK-LEVEL-PRESETS-UPDATE-A
- Status: done
- Completed:
  - Updated level presets so `level-1` is full minor pentatonic (`1, b3, 4, 5, b7`).
  - Updated `level-2` to minor pentatonic + blue note (`1, b3, 4, b5, 5, b7`).
  - Updated level labels/descriptions to match the new behavior.
  - Updated level-constraint tests and verified targeted test suite passes.
- Files changed:
  - `apps/frontend/src/features/practice/musicGenerator.ts`
  - `apps/frontend/src/features/practice/musicGenerator.test.ts`
  - `docs/TODO2.md`
- Next best step:
  - Add one explicit assertion that `b5` appears in level-2 output across repeated runs (probabilistic with retries).
- Risks/blockers:
  - Since generation is weighted/random, presence of `b5` in a single short run is not guaranteed; tests should check allowed set and use multiple samples for coverage.

### 2026-06-20 22:34 - CHUNK-GEN-INTERVAL-WALK-A
- Status: done
- Completed:
  - Replaced per-note independent weighted target picking with an interval-pattern walk over the sorted candidate-note pool.
  - Added weighted interval-pattern selection favoring small steps and weighted start-note selection.
  - Added boundary reflection so interval walking stays inside the selected note pool without out-of-range wrapping jumps.
  - Added regression coverage to assert generated adjacent melodic jumps stay within one octave.
- Files changed:
  - `apps/frontend/src/features/practice/musicGenerator.ts`
  - `apps/frontend/src/features/practice/musicGenerator.test.ts`
  - `docs/TODO2.md`
- Next best step:
  - Tune interval-step weights and pattern length per level (e.g. tighter level-1, looser level-3) based on playtesting feel.
- Risks/blockers:
  - In very sparse selected-note pools, reflected index walking can create repetitive back-and-forth contours; consider occasional pattern reseeding per bar if needed.

### 2026-06-20 22:37 - CHUNK-GEN-MODULE-SPLIT-A
- Status: done
- Completed:
  - Extracted weighted random helpers into `musicGenerator/randomUtils.ts`.
  - Extracted interval-walk generation and index reflection helpers into `musicGenerator/intervalWalk.ts`.
  - Extracted rhythm/strong-beat helpers into `musicGenerator/rhythm.ts`.
  - Extracted melodic scoring and root-scale weights into `musicGenerator/melodicScoring.ts`.
  - Refactored `musicGenerator.ts` to consume extracted modules without changing the public generator API.
  - Added direct tests for interval-walk and rhythm helper modules.
- Files changed:
  - `apps/frontend/src/features/practice/musicGenerator.ts`
  - `apps/frontend/src/features/practice/musicGenerator/randomUtils.ts`
  - `apps/frontend/src/features/practice/musicGenerator/intervalWalk.ts`
  - `apps/frontend/src/features/practice/musicGenerator/rhythm.ts`
  - `apps/frontend/src/features/practice/musicGenerator/melodicScoring.ts`
  - `apps/frontend/src/features/practice/musicGenerator/intervalWalk.test.ts`
  - `apps/frontend/src/features/practice/musicGenerator/rhythm.test.ts`
  - `docs/TODO2.md`
- Next best step:
  - Split chord/form-resolution helpers out of `musicGenerator.ts` into a `harmony` module and add focused tests.
- Risks/blockers:
  - Cross-module boundaries are now cleaner, but the top-level file still owns both orchestration and multiple exported APIs; further split should preserve import ergonomics.

### 2026-06-20 22:41 - CHUNK-UX-FRETBOARD-OVERLAYS-A
- Status: done
- Completed:
  - Added two optional UI checkboxes in configuration: show current chord tones and show lick notes during playback.
  - Added Zustand flags/setters for both toggles with non-intrusive defaults (`false`).
  - Added chord-tone fretboard overlay styling (orange) driven by current bar chord pitch classes.
  - Added active playback overlay styling (green) by tracking currently sounding lick notes during listen-phase playback.
  - Added pure helper `getActiveLickMidisAtBeat` and tests for timing boundaries/dedup behavior.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `apps/frontend/src/store/useAppStore.ts`
  - `apps/frontend/src/features/practice/components/ConfigurationCard.tsx`
  - `apps/frontend/src/features/practice/components/FretboardMap.tsx`
  - `apps/frontend/src/features/practice/fretboardPlayback.ts`
  - `apps/frontend/src/features/practice/fretboardPlayback.test.ts`
  - `docs/TODO2.md`
- Next best step:
  - Add a lightweight component test for fretboard style precedence (playing note > selected > chord tone > base).
- Risks/blockers:
  - Playback overlay timing is synced to UI/metronome start delay; browser scheduling jitter can still make highlights slightly ahead/behind audio on slower devices.

### 2026-06-20 23:45 - CHUNK-UX-BACKGROUND-ROTATION-A
- Status: done
- Completed:
  - Added rotating background image support in `App.tsx` using pixel-art assets from `public`.
  - Configured a one-minute background switch interval cycling through `tbonewalker`, `hendrix`, and `bbking`.
  - Applied a dark gradient overlay on top of backgrounds to preserve readability of existing UI cards/text.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO2.md`
- Next best step:
  - Add a user-facing toggle (or settings control) for fixed vs rotating background and rotation speed.
- Risks/blockers:
  - Very large background images may increase first-load memory usage on lower-end devices.

### 2026-06-20 23:51 - CHUNK-UX-BACKGROUND-CORNER-PLACEMENT-A
- Status: done
- Completed:
  - Changed app shell background treatment from full-page image to a top-left decorative panel.
  - Kept the same one-minute rotating image behavior and smooth transition between assets.
  - Preserved readability by keeping main page background dark and content layered above the decorative panel.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO2.md`
- Next best step:
  - Add a compact control to set decorative panel size/opacity from UI preferences.
- Risks/blockers:
  - On very small viewports, the decorative panel may visually overlap heading area more prominently than on desktop.

### 2026-06-20 23:47 - CHUNK-UX-BACKGROUND-ROTATION-ASSET-UPDATE-A
- Status: done
- Completed:
  - Added `freddieking.png` to the rotating top-left decorative background assets.
  - Kept existing one-minute rotation behavior unchanged.
- Files changed:
  - `apps/frontend/src/App.tsx`
  - `docs/TODO2.md`
- Next best step:
  - Consider sorting/curating rotation order based on visual balance across consecutive images.
- Risks/blockers:
  - Additional high-resolution assets can further increase memory pressure on low-end devices.
