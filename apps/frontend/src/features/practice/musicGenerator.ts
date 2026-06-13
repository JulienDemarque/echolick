import type { FormBarResponse, GenerateLickResponse } from '../../api/client'
import { BLUES_PROGRESSION } from '../../music/progression'
import type { LickNote } from '../../types/music'

export const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export type NoteName = (typeof NOTE_ORDER)[number]
type ChordQuality = 'dominant7' | 'minor7' | 'major7' | 'dim7'
export type GeneratorLevelId = 'level-1' | 'level-2' | 'level-3'
export type DegreeOptionId = '1' | '2' | 'b3' | '3' | '4' | 'b5' | '5' | '6' | 'b7'
export type BluesFormId = 'all-dominant' | 'all-minor' | 'minor-iv-major' | 'minor-v-dominant' | 'same-old-blues'
export type OctaveSpanId = 1 | 2

const NOTE_SET = new Set<string>(NOTE_ORDER)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MAJOR_EXTENSION_DEGREES: DegreeOptionId[] = ['2', '3', '6']
const ROOT_SCALE_WEIGHTS: Record<'major' | 'minor', Record<DegreeOptionId, number>> = {
  major: {
    '1': 1.55,
    '2': 1.08,
    b3: 0.9,
    '3': 1.28,
    '4': 1.0,
    b5: 0.82,
    '5': 1.42,
    '6': 1.16,
    b7: 1.18,
  },
  minor: {
    '1': 1.55,
    '2': 1.02,
    b3: 1.36,
    '3': 0.74,
    '4': 1.14,
    b5: 1.02,
    '5': 1.4,
    '6': 1.2,
    b7: 1.26,
  },
}

export const DEGREE_OPTIONS: Array<{ id: DegreeOptionId; label: string; semitones: number }> = [
  { id: '1', label: '1 (do)', semitones: 0 },
  { id: '2', label: '2 (re)', semitones: 2 },
  { id: 'b3', label: 'b3 (me)', semitones: 3 },
  { id: '3', label: '3 (mi)', semitones: 4 },
  { id: '4', label: '4 (fa)', semitones: 5 },
  { id: 'b5', label: 'b5 (fi)', semitones: 6 },
  { id: '5', label: '5 (so)', semitones: 7 },
  { id: '6', label: '6 (la)', semitones: 9 },
  { id: 'b7', label: 'b7 (te)', semitones: 10 },
]
const DEGREE_OPTION_MAP = Object.fromEntries(DEGREE_OPTIONS.map((item) => [item.id, item])) as Record<
  DegreeOptionId,
  (typeof DEGREE_OPTIONS)[number]
>
export const DEGREE_LEVEL_PRESETS: Record<GeneratorLevelId, DegreeOptionId[]> = {
  'level-1': ['1', 'b3', '5'],
  'level-2': ['1', 'b3', '4', '5', 'b7'],
  'level-3': ['1', 'b3', '4', 'b5', '5', 'b7'],
}
const LEVEL_DURATIONS: Record<GeneratorLevelId, number[]> = {
  'level-1': [1],
  'level-2': [0.5, 1],
  'level-3': [0.5, 1, 2],
}

export const BLUES_FORM_OPTIONS: Array<{
  id: BluesFormId
  label: string
  description: string
  isMajorBlues: boolean
  bars: Array<{ label: string; interval: number; quality: ChordQuality }>
}> = [
  {
    id: 'all-dominant',
    label: 'All Dominant (Major Blues)',
    description: 'Classic I7-IV7-V7 dominant blues.',
    isMajorBlues: true,
    bars: BLUES_PROGRESSION.map((degree) => ({
      label: degree,
      interval: degree === 'I' ? 0 : degree === 'IV' ? 5 : 7,
      quality: 'dominant7',
    })),
  },
  {
    id: 'all-minor',
    label: 'All Minor',
    description: 'i-7 iv-7 v-7 minor flavor on all three functions.',
    isMajorBlues: false,
    bars: BLUES_PROGRESSION.map((degree) => ({
      label: degree.toLowerCase(),
      interval: degree === 'I' ? 0 : degree === 'IV' ? 5 : 7,
      quality: 'minor7',
    })),
  },
  {
    id: 'minor-iv-major',
    label: 'Minor With Major IV (Dorian Color)',
    description: 'Minor tonic with bright IV7 contrast.',
    isMajorBlues: false,
    bars: BLUES_PROGRESSION.map((degree) => ({
      label: degree === 'I' ? 'i' : degree,
      interval: degree === 'I' ? 0 : degree === 'IV' ? 5 : 7,
      quality: degree === 'IV' ? 'dominant7' : 'minor7',
    })),
  },
  {
    id: 'minor-v-dominant',
    label: 'Minor With Dominant V',
    description: 'Minor tonic/subdominant with classic dominant V pull.',
    isMajorBlues: false,
    bars: BLUES_PROGRESSION.map((degree) => ({
      label: degree === 'I' ? 'i' : degree === 'IV' ? 'iv' : 'V',
      interval: degree === 'I' ? 0 : degree === 'IV' ? 5 : 7,
      quality: degree === 'V' ? 'dominant7' : 'minor7',
    })),
  },
  {
    id: 'same-old-blues',
    label: 'Same Old Blues (Turnaround)',
    description: 'Dominant-blues with a stronger turnaround color.',
    isMajorBlues: true,
    bars: [
      { label: 'I', interval: 0, quality: 'dominant7' },
      { label: 'IV', interval: 5, quality: 'dominant7' },
      { label: 'I', interval: 0, quality: 'dominant7' },
      { label: 'I', interval: 0, quality: 'dominant7' },
      { label: 'IV', interval: 5, quality: 'dominant7' },
      { label: '#IVdim', interval: 6, quality: 'dim7' },
      { label: 'I', interval: 0, quality: 'dominant7' },
      { label: 'VI', interval: 9, quality: 'dominant7' },
      { label: 'II', interval: 2, quality: 'dominant7' },
      { label: 'V', interval: 7, quality: 'dominant7' },
      { label: 'I', interval: 0, quality: 'dominant7' },
      { label: 'V', interval: 7, quality: 'dominant7' },
    ],
  },
]

export const BLUES_FORM_MAP = Object.fromEntries(BLUES_FORM_OPTIONS.map((form) => [form.id, form])) as Record<
  BluesFormId,
  (typeof BLUES_FORM_OPTIONS)[number]
>

const chordRootFromSymbol = (chord: string): NoteName | null => {
  const upper = chord.trim().toUpperCase()
  if (!upper) return null
  const root = upper.length > 1 && upper[1] === '#' ? upper.slice(0, 2) : upper.slice(0, 1)
  return NOTE_SET.has(root) ? (root as NoteName) : null
}

const formatChordSymbol = (root: NoteName, quality: ChordQuality): string => {
  if (quality === 'minor7') return `${root}m7`
  if (quality === 'major7') return `${root}maj7`
  if (quality === 'dim7') return `${root}dim7`
  return `${root}7`
}

const midiToPitchClass = (midi: number): number => ((Math.round(midi) % 12) + 12) % 12
const midiToNoteNameWithOctave = (midi: number): string => {
  const pitchClass = midiToPitchClass(midi)
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[pitchClass] ?? 'C'}${octave}`
}
const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
const pickWeightedRandom = <T,>(items: Array<{ value: T; weight: number }>): T => {
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0)
  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)]!.value
  }
  let cursor = Math.random() * totalWeight
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]!
    cursor -= Math.max(0, item.weight)
    if (cursor <= 0) return item.value
  }
  return items[items.length - 1]!.value
}

const buildDegreeMidiCandidates = (keyRoot: NoteName, degreeId: DegreeOptionId): number[] => {
  const rootMidi = 60 + NOTE_ORDER.indexOf(keyRoot)
  const semitones = DEGREE_OPTION_MAP[degreeId].semitones
  const candidates: number[] = []
  for (let octave = -1; octave <= 1; octave += 1) {
    candidates.push(rootMidi + semitones + octave * 12)
  }
  return candidates.filter((midi) => midi >= 50 && midi <= 82)
}

const constrainCandidatesToSpan = (candidates: number[], minMidi: number, maxMidi: number, spanLimit: number): number[] =>
  candidates.filter((candidate) => {
    const nextMin = Math.min(minMidi, candidate)
    const nextMax = Math.max(maxMidi, candidate)
    return nextMax - nextMin <= spanLimit
  })

const chooseClosestMidi = (candidates: number[], targetMidi: number): number =>
  candidates.reduce((best, candidate) =>
    Math.abs(candidate - targetMidi) < Math.abs(best - targetMidi) ? candidate : best,
  )

const chooseClosestAboveMidi = (candidates: number[], fromMidi: number, maxDelta: number): number | null => {
  const above = candidates
    .filter((candidate) => candidate > fromMidi + 1e-6 && candidate - fromMidi <= maxDelta + 1e-6)
    .sort((a, b) => a - b)
  if (above.length > 0) return above[0]!
  return null
}

const chooseClosestBelowMidi = (candidates: number[], fromMidi: number, maxDelta: number): number | null => {
  const below = candidates
    .filter((candidate) => candidate < fromMidi - 1e-6 && fromMidi - candidate <= maxDelta + 1e-6)
    .sort((a, b) => b - a)
  if (below.length > 0) return below[0]!
  return null
}

const resolveChordQuality = (chordSymbol: string): ChordQuality => {
  const upper = chordSymbol.trim().toUpperCase()
  if (upper.includes('DIM7')) return 'dim7'
  if (upper.includes('MAJ7')) return 'major7'
  if (upper.includes('M7')) return 'minor7'
  return 'dominant7'
}

const resolveChordTonePitchClasses = (chordSymbol: string): Set<number> => {
  const root = chordRootFromSymbol(chordSymbol) ?? 'A'
  const rootMidi = 60 + NOTE_ORDER.indexOf(root)
  const quality = resolveChordQuality(chordSymbol)
  const qualityIntervals =
    quality === 'dim7'
      ? [0, 3, 6, 9]
      : quality === 'major7'
        ? [0, 4, 7, 11]
        : quality === 'minor7'
          ? [0, 3, 7, 10]
          : [0, 4, 7, 10]
  return new Set(qualityIntervals.map((interval) => midiToPitchClass(rootMidi + interval)))
}

const isStrongBeat = (beatStart: number): boolean => {
  const rounded = Math.round(beatStart)
  const closeToGrid = Math.abs(beatStart - rounded) < 0.001
  return closeToGrid && (rounded === 0 || rounded === 2)
}

const scoreDegreeCandidate = ({
  nearestMidi,
  previousMidi,
  previousDirection,
  isChordTone,
  onStrongBeat,
  previousDegree,
  degreeId,
  chordQuality,
  intervalFromChordRoot,
  rootScaleWeight,
}: {
  nearestMidi: number
  previousMidi: number
  previousDirection: -1 | 0 | 1
  isChordTone: boolean
  onStrongBeat: boolean
  previousDegree: DegreeOptionId | null
  degreeId: DegreeOptionId
  chordQuality: ChordQuality
  intervalFromChordRoot: number
  rootScaleWeight: number
}): number => {
  const delta = nearestMidi - previousMidi
  const distance = Math.abs(delta)
  const candidateDirection: -1 | 0 | 1 = delta > 0 ? 1 : delta < 0 ? -1 : 0
  const movementWeight = distance <= 2 ? 2.35 : distance <= 4 ? 1.75 : distance <= 7 ? 1.08 : 0.56
  const directionWeight =
    previousDirection === 0 || candidateDirection === 0
      ? candidateDirection === 0
        ? 0.86
        : 1
      : previousDirection === candidateDirection
        ? distance <= 3
          ? 1.24
          : 0.92
        : distance <= 2
          ? 1.08
          : 0.78
  const chordToneWeight = isChordTone ? (onStrongBeat ? 2.3 : 1.55) : onStrongBeat ? 0.66 : 1.0
  const repeatPenalty = previousDegree === degreeId ? 0.82 : 1
  const avoidWeight =
    chordQuality === 'minor7' && intervalFromChordRoot === 4
      ? 0.08
      : chordQuality === 'dominant7' && intervalFromChordRoot === 11
        ? 0.35
        : chordQuality === 'major7' && intervalFromChordRoot === 10
          ? 0.45
          : chordQuality === 'dim7' && intervalFromChordRoot === 7
            ? 0.6
            : 1
  const colorWeight =
    chordQuality === 'minor7' && intervalFromChordRoot === 9
      ? 1.32
      : chordQuality === 'dominant7' && (intervalFromChordRoot === 3 || intervalFromChordRoot === 6)
        ? 1.15
        : 1
  return movementWeight * directionWeight * chordToneWeight * repeatPenalty * avoidWeight * colorWeight * rootScaleWeight
}

const buildRhythmPattern = (allowedDurations: number[]): number[] => {
  const durations: number[] = []
  let remaining = 4
  while (remaining > 0) {
    const options = allowedDurations.filter((duration) => duration <= remaining + 1e-6)
    if (options.length === 0) break
    const preferred = options.filter((duration) => duration === 1)
    const selected = preferred.length > 0 && Math.random() < 0.55 ? pickRandom(preferred) : pickRandom(options)
    durations.push(selected)
    remaining = Math.max(0, Number((remaining - selected).toFixed(2)))
  }
  return durations
}

export const normalizeLickNotes = (notes: GenerateLickResponse['notes']): LickNote[] =>
  notes.map((note) => ({
    ...note,
    bend: note.bend ?? undefined,
    vibrato: note.vibrato ?? undefined,
  }))

export const resolveChordMidi = (chordSymbol: string): number[] => {
  const root = chordRootFromSymbol(chordSymbol) ?? 'A'
  const rootMidi = 60 + NOTE_ORDER.indexOf(root)
  return [rootMidi, rootMidi + 4, rootMidi + 7, rootMidi + 10]
}

export const buildRecommendedDegreePool = (
  level: GeneratorLevelId,
  isMajorBlues: boolean,
  includeMajorNotes: boolean,
): DegreeOptionId[] => {
  const base = DEGREE_LEVEL_PRESETS[level]
  if (!isMajorBlues || !includeMajorNotes) {
    return base
  }
  const additions = MAJOR_EXTENSION_DEGREES.slice(0, level === 'level-1' ? 1 : level === 'level-2' ? 2 : 3)
  return Array.from(new Set([...base, ...additions]))
}

export const isMajorExtensionDegree = (degreeId: DegreeOptionId): boolean => MAJOR_EXTENSION_DEGREES.includes(degreeId)

export const resolvePracticeDegreeFromLabel = (label: string): 'I' | 'IV' | 'V' => {
  const normalized = label.toUpperCase()
  if (normalized.includes('IV')) return 'IV'
  if (normalized.includes('V')) return 'V'
  return 'I'
}

export const buildBarContextFromForm = (index: number, keyRoot: NoteName, bluesFormId: BluesFormId): FormBarResponse => {
  const form = BLUES_FORM_MAP[bluesFormId]
  const fallbackDegree = BLUES_PROGRESSION[index] ?? 'I'
  const fallbackInterval = fallbackDegree === 'I' ? 0 : fallbackDegree === 'IV' ? 5 : 7
  const spec = form.bars[index] ?? { label: fallbackDegree, interval: fallbackInterval, quality: 'dominant7' }
  const root = NOTE_ORDER[(NOTE_ORDER.indexOf(keyRoot) + spec.interval + 12) % 12]
  return {
    id: `local-${bluesFormId}-${index}`,
    form_id: `local-${bluesFormId}`,
    bar_index: index,
    degree: spec.label,
    chord_symbol: formatChordSymbol(root, spec.quality),
    chord_root: root,
    created_at: new Date(0).toISOString(),
  }
}

export const createPermutationLick = ({
  keyRoot,
  chordSymbol,
  degree,
  flavor,
  tempo,
  level,
  enabledDegrees,
  includeBend,
  octaveSpan,
}: {
  keyRoot: NoteName
  chordSymbol: string
  degree: 'I' | 'IV' | 'V'
  flavor: 'major' | 'minor'
  tempo: number
  level: GeneratorLevelId
  enabledDegrees: DegreeOptionId[]
  includeBend: boolean
  octaveSpan: OctaveSpanId
}): GenerateLickResponse => {
  const effectiveDegrees = enabledDegrees.length > 0 ? enabledDegrees : DEGREE_LEVEL_PRESETS[level]
  const durations = buildRhythmPattern(LEVEL_DURATIONS[level])
  const notes: GenerateLickResponse['notes'] = []
  const chordRootMidi = resolveChordMidi(chordSymbol)[0] ?? 60
  const chordRootPitchClass = midiToPitchClass(chordRootMidi)
  const chordQuality = resolveChordQuality(chordSymbol)
  const chordTonePitchClasses = resolveChordTonePitchClasses(chordSymbol)

  const targetDegrees: DegreeOptionId[] = []

  let cursor = 0
  let previousMidi = chordRootMidi
  let previousDirection: -1 | 0 | 1 = 0
  let previousDegree: DegreeOptionId | null = null
  const spanLimit = octaveSpan * 12
  let lickMinMidi: number | null = null
  let lickMaxMidi: number | null = null
  durations.forEach((duration) => {
    const onStrongBeat = isStrongBeat(cursor)
    const weightedDegrees = effectiveDegrees.map((degreeId) => {
      const candidates = buildDegreeMidiCandidates(keyRoot, degreeId)
      const constrainedCandidates =
        lickMinMidi === null || lickMaxMidi === null
          ? candidates
          : constrainCandidatesToSpan(candidates, lickMinMidi, lickMaxMidi, spanLimit)
      const candidatePool = constrainedCandidates.length > 0 ? constrainedCandidates : candidates
      const nearestMidi =
        candidatePool.length > 0
          ? chooseClosestMidi(candidatePool, previousMidi)
          : candidates.length > 0
            ? chooseClosestMidi(candidates, previousMidi)
            : previousMidi
      const candidateIsChordTone = chordTonePitchClasses.has(midiToPitchClass(nearestMidi))
      const intervalFromChordRoot = (midiToPitchClass(nearestMidi) - chordRootPitchClass + 12) % 12
      const weight = scoreDegreeCandidate({
        nearestMidi,
        previousMidi,
        previousDirection,
        isChordTone: candidateIsChordTone,
        onStrongBeat,
        previousDegree,
        degreeId,
        chordQuality,
        intervalFromChordRoot,
        rootScaleWeight: ROOT_SCALE_WEIGHTS[flavor][degreeId],
      })
      return { value: degreeId, weight }
    })

    const degreeId = pickWeightedRandom(weightedDegrees)
    targetDegrees.push(degreeId)
    const candidates = buildDegreeMidiCandidates(keyRoot, degreeId)
    const constrainedCandidates =
      lickMinMidi === null || lickMaxMidi === null
        ? candidates
        : constrainCandidatesToSpan(candidates, lickMinMidi, lickMaxMidi, spanLimit)
    const candidatePool = constrainedCandidates.length > 0 ? constrainedCandidates : candidates
    const midi = candidatePool.length > 0 ? chooseClosestMidi(candidatePool, previousMidi) : previousMidi
    const delta = midi - previousMidi
    previousDirection = delta > 0 ? 1 : delta < 0 ? -1 : 0
    previousMidi = midi
    previousDegree = degreeId
    lickMinMidi = lickMinMidi === null ? midi : Math.min(lickMinMidi, midi)
    lickMaxMidi = lickMaxMidi === null ? midi : Math.max(lickMaxMidi, midi)
    notes.push({
      midi,
      noteName: midiToNoteNameWithOctave(midi),
      start: cursor,
      duration,
      velocity: 0.78 + Math.random() * 0.16,
      bend: undefined,
      vibrato: undefined,
      technique: 'normal',
    })
    cursor += duration
  })

  if (includeBend) {
    const bendRules: Array<{ from: DegreeOptionId; to: DegreeOptionId; weight: number; minDuration: number; maxDelta: number }> = [
      { from: '4', to: '5', weight: 1.5, minDuration: 1, maxDelta: 2.5 },
      { from: 'b7', to: '1', weight: 1.35, minDuration: 1, maxDelta: 2.5 },
      { from: 'b3', to: '3', weight: 1.15, minDuration: 1, maxDelta: 1.5 },
      { from: 'b5', to: '5', weight: 0.8, minDuration: 0.5, maxDelta: 1.5 },
    ]
    const preBendReleaseRules: Array<{
      target: DegreeOptionId
      preBendFrom: DegreeOptionId
      weight: number
      minDuration: number
      maxDelta: number
    }> = [
      { target: '4', preBendFrom: '5', weight: 1.2, minDuration: 1, maxDelta: 2.5 },
      { target: 'b7', preBendFrom: '1', weight: 1.05, minDuration: 1, maxDelta: 2.5 },
      { target: 'b3', preBendFrom: '3', weight: 0.9, minDuration: 1, maxDelta: 1.5 },
    ]
    const bendCandidates: Array<{
      noteIndex: number
      fromMidi?: number
      toMidi: number
      weight: number
      mode: 'bend_up' | 'prebend_release'
    }> = []
    notes.forEach((note, index) => {
      const degreeId = targetDegrees[index]
      if (!degreeId) return
      const matchingBendRule = bendRules.find(
        (rule) =>
          rule.from === degreeId &&
          note.duration >= rule.minDuration &&
          effectiveDegrees.includes(rule.from) &&
          effectiveDegrees.includes(rule.to),
      )
      if (matchingBendRule) {
        const targetCandidates = buildDegreeMidiCandidates(keyRoot, matchingBendRule.to)
        const toMidi = chooseClosestAboveMidi(targetCandidates, note.midi, matchingBendRule.maxDelta)
        if (toMidi !== null) {
          const beatBias = isStrongBeat(note.start) ? 1.12 : 1
          bendCandidates.push({
            noteIndex: index,
            toMidi,
            weight: matchingBendRule.weight * beatBias,
            mode: 'bend_up',
          })
        }
      }
      const matchingPreBendRule = preBendReleaseRules.find(
        (rule) =>
          rule.target === degreeId &&
          note.duration >= rule.minDuration &&
          effectiveDegrees.includes(rule.target) &&
          effectiveDegrees.includes(rule.preBendFrom),
      )
      if (matchingPreBendRule) {
        const preBendCandidates = buildDegreeMidiCandidates(keyRoot, matchingPreBendRule.preBendFrom)
        const fromMidi = chooseClosestAboveMidi(preBendCandidates, note.midi, matchingPreBendRule.maxDelta)
        if (fromMidi !== null) {
          const releaseTargetMidi = chooseClosestBelowMidi([note.midi], fromMidi, matchingPreBendRule.maxDelta)
          if (releaseTargetMidi !== null) {
            const beatBias = isStrongBeat(note.start) ? 1.08 : 1
            bendCandidates.push({
              noteIndex: index,
              fromMidi,
              toMidi: releaseTargetMidi,
              weight: matchingPreBendRule.weight * beatBias,
              mode: 'prebend_release',
            })
          }
        }
      }
    })
    if (bendCandidates.length > 0) {
      const chosenCandidate = pickWeightedRandom(bendCandidates.map((candidate) => ({ value: candidate, weight: candidate.weight })))
      const targetNote = notes[chosenCandidate.noteIndex]
      if (targetNote) {
        if (chosenCandidate.mode === 'prebend_release' && chosenCandidate.fromMidi !== undefined) {
          targetNote.midi = chosenCandidate.fromMidi
          targetNote.noteName = midiToNoteNameWithOctave(chosenCandidate.fromMidi)
        }
        targetNote.technique = 'bend'
        targetNote.bend = {
          toMidi: chosenCandidate.toMidi,
          start: chosenCandidate.mode === 'prebend_release' ? 0.02 : 0.12,
          end: Math.min(0.82, Math.max(0.32, targetNote.duration - 0.1)),
        }
      }
    }
  }

  return {
    key: keyRoot,
    degree,
    chord: chordSymbol,
    flavor,
    tempo,
    timeSignature: '4/4',
    notes,
  }
}
