# EchoLick Chunked TODO (v2)

Use this file as the shared handoff anchor between chat threads.

## Current Chunk

- [x] CHUNK-UX-V7-THIRD-HIGHLIGHT-FIX-A: Add degree-7 support so V7 chord third is visible in level-3.

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
