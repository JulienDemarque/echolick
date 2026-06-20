import { describe, expect, it } from 'vitest'
import {
  CAGED_SHAPE_TEMPLATE_NOTES_E,
  DEGREE_LEVEL_PRESETS,
  buildBarContextFromForm,
  buildLevelCandidatePool,
  buildCagedPositionNotes,
  buildShapeChromaticNoteBuckets,
  createPermutationLick,
  degreeIdFromMidi,
  getSemitoneShiftFromE,
  isDegreeAllowedForLevel,
  normalizeLickNotes,
  resolveChordMidi,
  resolveChordTonePitchClassesForSymbol,
  buildFretboardVisibleDegrees,
  resolveGeneratorLevelPolicy,
  resolvePracticeDegreeFromLabel,
  type GeneratorLevelId,
} from './musicGenerator'

const KEY_ROOT = 'E' as const
const CAGED_POSITION = '3-c-shape-bb-king' as const

const degreesFromLick = (level: GeneratorLevelId, selectedPositionMidis: number[] = []) => {
  const config = resolveGeneratorLevelPolicy(level)
  const lick = createPermutationLick({
    keyRoot: KEY_ROOT,
    chordSymbol: 'E7',
    degree: 'I',
    tempo: 76,
    level,
    allowedDegrees: config.allowedDegrees,
    weightFlavor: config.weightFlavor,
    includeBend: false,
    includeChordTones: config.includeChordTones,
    cagedPositionId: CAGED_POSITION,
    selectedPositionMidis,
  })
  return lick.notes
    .map((note) => degreeIdFromMidi(note.midi, KEY_ROOT))
    .filter((degree): degree is NonNullable<typeof degree> => degree !== null)
}

const midiToPitchClass = (midi: number): number => ((Math.round(midi) % 12) + 12) % 12
const CHORD_TONE_PITCH_CLASSES = resolveChordTonePitchClassesForSymbol('E7')

describe('musicGenerator helpers', () => {
  it('resolves chord midi from chord root', () => {
    expect(resolveChordMidi('A7')).toEqual([69, 73, 76, 79])
    expect(resolveChordMidi('C#7')).toEqual([61, 65, 68, 71])
  })

  it('resolves practice degree label from bar label', () => {
    expect(resolvePracticeDegreeFromLabel('I')).toBe('I')
    expect(resolvePracticeDegreeFromLabel('IV')).toBe('IV')
    expect(resolvePracticeDegreeFromLabel('V')).toBe('V')
    expect(resolvePracticeDegreeFromLabel('#IVdim')).toBe('IV')
  })

  it('builds bar context from form for a selected key', () => {
    const bar0 = buildBarContextFromForm(0, 'A', 'all-dominant')
    const bar1 = buildBarContextFromForm(1, 'A', 'all-dominant')
    expect(bar0.chord_symbol).toBe('A7')
    expect(bar0.degree).toBe('I')
    expect(bar1.chord_symbol).toBe('D7')
    expect(bar1.degree).toBe('IV')
  })

  it('computes semitone shift from E reference', () => {
    expect(getSemitoneShiftFromE('E')).toBe(0)
    expect(getSemitoneShiftFromE('F')).toBe(1)
    expect(getSemitoneShiftFromE('A')).toBe(5)
    expect(getSemitoneShiftFromE('D#')).toBe(11)
  })

  it('transposes template notes by key while preserving degree identity', () => {
    const eNotes = buildCagedPositionNotes('E', '1-e-shape')
    const fNotes = buildCagedPositionNotes('F', '1-e-shape')
    const eMajorThird = eNotes.find((note) => note.stringIndexFromLowE === 3 && note.fret === 1)
    expect(eMajorThird?.degreeId).toBe('3')
    const transposed = fNotes.find((note) => note.stringIndexFromLowE === 3 && note.fret === 2)
    expect(transposed?.degreeId).toBe('3')
  })

  it('lists chromatic shape note buckets across 12 semitones', () => {
    const buckets = buildShapeChromaticNoteBuckets('E', '3-c-shape-bb-king')
    expect(Object.keys(buckets).length).toBe(12)
    const populatedBucketCount = Object.values(buckets).filter((notes) => notes.length > 0).length
    expect(populatedBucketCount).toBeGreaterThan(6)
  })

  it('exposes explicit E-reference shape templates with note names', () => {
    const eShapeTemplate = CAGED_SHAPE_TEMPLATE_NOTES_E['1-e-shape']
    expect(eShapeTemplate.length).toBeGreaterThan(0)
    expect(eShapeTemplate.every((entry) => entry.noteNameInE.length > 0)).toBe(true)
    expect(eShapeTemplate.every((entry) => entry.chromaticSemitoneFromE >= 0 && entry.chromaticSemitoneFromE <= 11)).toBe(true)
  })

  it('normalizes nullable articulation fields on notes', () => {
    const normalized = normalizeLickNotes([
      {
        midi: 64,
        noteName: 'E4',
        start: 0,
        duration: 1,
        velocity: 0.8,
        bend: null,
        vibrato: null,
        technique: 'normal',
      },
    ])
    expect(normalized[0]?.bend).toBeUndefined()
    expect(normalized[0]?.vibrato).toBeUndefined()
  })

  it('resolves chord tone pitch classes by chord quality', () => {
    expect(resolveChordTonePitchClassesForSymbol('E7')).toEqual(new Set([4, 8, 11, 2]))
    expect(resolveChordTonePitchClassesForSymbol('Em7')).toEqual(new Set([4, 7, 11, 2]))
    expect(resolveChordTonePitchClassesForSymbol('Emaj7')).toEqual(new Set([4, 8, 11, 3]))
    expect(resolveChordTonePitchClassesForSymbol('Edim7')).toEqual(new Set([4, 7, 10, 1]))
  })

  it('resolves level policy for all active levels', () => {
    const l1 = resolveGeneratorLevelPolicy('level-1')
    const l2 = resolveGeneratorLevelPolicy('level-2')
    const l3 = resolveGeneratorLevelPolicy('level-3')
    expect(l1.includeChordTones).toBe(false)
    expect(l2.includeChordTones).toBe(false)
    expect(l3.includeChordTones).toBe(true)
    expect(l1.allowedDegrees.length).toBeGreaterThan(0)
    expect(l2.allowedDegrees.length).toBeGreaterThanOrEqual(l1.allowedDegrees.length)
  })

  it('buildLevelCandidatePool augments from full shape chord tones in level-3', () => {
    const level3Policy = resolveGeneratorLevelPolicy('level-3')
    const resolvedShape = buildCagedPositionNotes('E', '1-e-shape')
    const selectedDegree4 = resolvedShape.find(
      (note) => note.degreeId === '4' && !CHORD_TONE_PITCH_CLASSES.has(midiToPitchClass(note.midi)),
    )
    expect(selectedDegree4).toBeTruthy()
    const pool = buildLevelCandidatePool({
      resolvedShapeNotes: resolvedShape,
      allowedDegrees: level3Policy.allowedDegrees,
      selectedPositionMidis: selectedDegree4 ? [selectedDegree4.midi] : [],
      includeChordTones: level3Policy.includeChordTones,
      chordTonePitchClasses: CHORD_TONE_PITCH_CLASSES,
    })
    expect(pool.narrowedBaseCandidates.length).toBe(1)
    expect(pool.chordToneAugmentationCandidates.length).toBeGreaterThan(0)
    expect(pool.finalCandidates.length).toBeGreaterThan(pool.narrowedBaseCandidates.length)
    expect(pool.finalCandidates.every((candidate) => candidate.noteName.length > 0)).toBe(true)
    expect(pool.chordToneAugmentationCandidates.some((candidate) => candidate.isChordTone)).toBe(true)
  })

  it('buildLevelCandidatePool does not augment chord tones when disabled', () => {
    const level2Policy = resolveGeneratorLevelPolicy('level-2')
    const resolvedShape = buildCagedPositionNotes('E', '1-e-shape')
    const selectedDegree4 = resolvedShape.find((note) => note.degreeId === '4')
    const pool = buildLevelCandidatePool({
      resolvedShapeNotes: resolvedShape,
      allowedDegrees: level2Policy.allowedDegrees,
      selectedPositionMidis: selectedDegree4 ? [selectedDegree4.midi] : [],
      includeChordTones: level2Policy.includeChordTones,
      chordTonePitchClasses: CHORD_TONE_PITCH_CLASSES,
    })
    expect(pool.chordToneAugmentationCandidates.length).toBe(0)
    expect(pool.finalCandidates).toEqual(pool.narrowedBaseCandidates)
  })

  it('builds chord-tone augmentation from the current chord symbol', () => {
    const level3Policy = resolveGeneratorLevelPolicy('level-3')
    const resolvedShape = buildCagedPositionNotes('E', '1-e-shape')
    const poolE7 = buildLevelCandidatePool({
      resolvedShapeNotes: resolvedShape,
      allowedDegrees: level3Policy.allowedDegrees,
      selectedPositionMidis: [],
      includeChordTones: true,
      chordTonePitchClasses: resolveChordTonePitchClassesForSymbol('E7'),
    })
    const poolAm7 = buildLevelCandidatePool({
      resolvedShapeNotes: resolvedShape,
      allowedDegrees: level3Policy.allowedDegrees,
      selectedPositionMidis: [],
      includeChordTones: true,
      chordTonePitchClasses: resolveChordTonePitchClassesForSymbol('Am7'),
    })
    const e7ChordToneMidis = new Set(poolE7.chordToneAugmentationCandidates.map((candidate) => Math.round(candidate.midi)))
    const am7ChordToneMidis = new Set(poolAm7.chordToneAugmentationCandidates.map((candidate) => Math.round(candidate.midi)))
    expect(e7ChordToneMidis.size).toBeGreaterThan(0)
    expect(am7ChordToneMidis.size).toBeGreaterThan(0)
    const overlapping = Array.from(e7ChordToneMidis).filter((midi) => am7ChordToneMidis.has(midi))
    expect(overlapping.length).toBeLessThan(Math.min(e7ChordToneMidis.size, am7ChordToneMidis.size))
  })

  it('shows major third on fretboard for all-dominant level-3 when bar 1 (I7) is selected', () => {
    const bar1 = buildBarContextFromForm(0, 'A', 'all-dominant')
    expect(bar1.degree).toBe('I')
    expect(bar1.chord_symbol).toBe('A7')

    const level3Policy = resolveGeneratorLevelPolicy('level-3')
    const visibleDegrees = buildFretboardVisibleDegrees({
      keyRoot: 'A',
      allowedDegrees: level3Policy.allowedDegrees,
      includeChordTones: level3Policy.includeChordTones,
      chordSymbol: bar1.chord_symbol,
    })

    expect(level3Policy.allowedDegrees.includes('3')).toBe(false)
    expect(visibleDegrees).toContain('3')
  })

  it('shows IV chord major third in level-3 for A blues and first-box position note', () => {
    const bar2 = buildBarContextFromForm(1, 'A', 'all-dominant')
    expect(bar2.degree).toBe('IV')
    expect(bar2.chord_symbol).toBe('D7')

    const level3Policy = resolveGeneratorLevelPolicy('level-3')
    const visibleDegrees = buildFretboardVisibleDegrees({
      keyRoot: 'A',
      allowedDegrees: level3Policy.allowedDegrees,
      includeChordTones: level3Policy.includeChordTones,
      chordSymbol: bar2.chord_symbol,
    })
    expect(visibleDegrees).toContain('6')

    const firstBoxNotes = buildCagedPositionNotes('A', '1-e-shape')
    const dStringFret4 = firstBoxNotes.find((note) => note.stringIndexFromLowE === 2 && note.fret === 4)
    expect(dStringFret4?.degreeId).toBe('6')
  })

  it('shows V chord third (major 7 relative to key) in level-3 for A blues', () => {
    const bar9 = buildBarContextFromForm(8, 'A', 'all-dominant')
    expect(bar9.degree).toBe('V')
    expect(bar9.chord_symbol).toBe('E7')

    const level3Policy = resolveGeneratorLevelPolicy('level-3')
    const visibleDegrees = buildFretboardVisibleDegrees({
      keyRoot: 'A',
      allowedDegrees: level3Policy.allowedDegrees,
      includeChordTones: level3Policy.includeChordTones,
      chordSymbol: bar9.chord_symbol,
    })
    // For E7 in key A, the chord third is G# (= major 7 degree relative to A).
    expect(visibleDegrees).toContain('7' as (typeof visibleDegrees)[number])
  })

  it('includes E6 fret 7 in first box for key of B', () => {
    const firstBoxNotes = buildCagedPositionNotes('B', '1-e-shape')
    const e6StringFret7 = firstBoxNotes.find((note) => note.stringIndexFromLowE === 0 && note.fret === 7)
    expect(e6StringFret7).toBeTruthy()
    expect(e6StringFret7?.degreeId).toBe('1')
  })

  it('includes E6 fret 5 in first box for key of A', () => {
    const firstBoxNotes = buildCagedPositionNotes('A', '1-e-shape')
    const e6StringFret5 = firstBoxNotes.find((note) => note.stringIndexFromLowE === 0 && note.fret === 5)
    expect(e6StringFret5).toBeTruthy()
    expect(e6StringFret5?.degreeId).toBe('1')
  })

  it('isDegreeAllowedForLevel rejects unsupported chromatic degrees', () => {
    const level1Allowed = DEGREE_LEVEL_PRESETS['level-1']
    expect(isDegreeAllowedForLevel('1', level1Allowed)).toBe(true)
    expect(isDegreeAllowedForLevel('b3', level1Allowed)).toBe(true)
    expect(isDegreeAllowedForLevel(null, level1Allowed)).toBe(false)
  })

  it('filters unsupported degree notes when narrowing from selected midis', () => {
    const level1Policy = resolveGeneratorLevelPolicy('level-1')
    const resolvedShape = buildCagedPositionNotes('E', '1-e-shape')
    const unsupported = resolvedShape.find((note) => note.degreeId === null)
    expect(unsupported).toBeTruthy()
    const pool = buildLevelCandidatePool({
      resolvedShapeNotes: resolvedShape,
      allowedDegrees: level1Policy.allowedDegrees,
      selectedPositionMidis: unsupported ? [unsupported.midi] : [],
      includeChordTones: false,
      chordTonePitchClasses: CHORD_TONE_PITCH_CLASSES,
    })
    expect(pool.baseCandidates.length).toBeGreaterThan(0)
    expect(pool.narrowedBaseCandidates).toEqual(pool.baseCandidates)
    expect(pool.finalCandidates.every((candidate) => candidate.degreeId !== null)).toBe(true)
  })
})

describe('createPermutationLick level constraints', () => {
  it('level-1 only emits 1, b3, 5 degrees', () => {
    const allowed = new Set(DEGREE_LEVEL_PRESETS['level-1'])
    const seen = new Set<string>()

    for (let i = 0; i < 32; i += 1) {
      degreesFromLick('level-1').forEach((degree) => {
        expect(allowed.has(degree as (typeof DEGREE_LEVEL_PRESETS)['level-1'][number])).toBe(true)
        seen.add(degree)
      })
    }

    expect(seen.size).toBeGreaterThan(0)
  })

  it('level-2 only emits minor pentatonic degrees', () => {
    const allowed = new Set(DEGREE_LEVEL_PRESETS['level-2'])

    for (let i = 0; i < 32; i += 1) {
      degreesFromLick('level-2').forEach((degree) => {
        expect(allowed.has(degree as (typeof DEGREE_LEVEL_PRESETS)['level-2'][number])).toBe(true)
      })
    }
  })

  it('level-3 chord-tone augmentation expands candidate pool', () => {
    const level3Policy = resolveGeneratorLevelPolicy('level-3')
    const resolvedShape = buildCagedPositionNotes('E', '1-e-shape')
    const selectedNonChordTone = resolvedShape.find(
      (note) => note.degreeId === '4' && !CHORD_TONE_PITCH_CLASSES.has(midiToPitchClass(note.midi)),
    )
    const pool = buildLevelCandidatePool({
      resolvedShapeNotes: resolvedShape,
      allowedDegrees: level3Policy.allowedDegrees,
      selectedPositionMidis: selectedNonChordTone ? [selectedNonChordTone.midi] : [],
      includeChordTones: true,
      chordTonePitchClasses: CHORD_TONE_PITCH_CLASSES,
    })
    expect(pool.finalCandidates.length).toBeGreaterThan(pool.narrowedBaseCandidates.length)
  })
})
