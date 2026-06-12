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

const buildDegreeMidiCandidates = (keyRoot: NoteName, degreeId: DegreeOptionId): number[] => {
  const rootMidi = 60 + NOTE_ORDER.indexOf(keyRoot)
  const semitones = DEGREE_OPTION_MAP[degreeId].semitones
  const candidates: number[] = []
  for (let octave = -1; octave <= 1; octave += 1) {
    candidates.push(rootMidi + semitones + octave * 12)
  }
  return candidates.filter((midi) => midi >= 50 && midi <= 82)
}

const chooseClosestMidi = (candidates: number[], targetMidi: number): number =>
  candidates.reduce((best, candidate) =>
    Math.abs(candidate - targetMidi) < Math.abs(best - targetMidi) ? candidate : best,
  )

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

  const sequence: DegreeOptionId[] = []
  while (sequence.length < durations.length) {
    const shuffled = [...effectiveDegrees].sort(() => Math.random() - 0.5)
    sequence.push(...shuffled)
  }
  const targetDegrees = sequence.slice(0, durations.length)

  let cursor = 0
  let previousMidi = chordRootMidi
  const spanLimit = octaveSpan * 12
  let lickMinMidi: number | null = null
  let lickMaxMidi: number | null = null
  targetDegrees.forEach((degreeId, index) => {
    const duration = durations[index] ?? 1
    const candidates = buildDegreeMidiCandidates(keyRoot, degreeId)
    const constrainedCandidates =
      lickMinMidi === null || lickMaxMidi === null
        ? candidates
        : candidates.filter((candidate) => {
            const nextMin = Math.min(lickMinMidi, candidate)
            const nextMax = Math.max(lickMaxMidi, candidate)
            return nextMax - nextMin <= spanLimit
          })
    const candidatePool = constrainedCandidates.length > 0 ? constrainedCandidates : candidates
    const midi = candidatePool.length > 0 ? chooseClosestMidi(candidatePool, previousMidi) : previousMidi
    previousMidi = midi
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

  if (includeBend && effectiveDegrees.includes('b3') && effectiveDegrees.includes('3')) {
    const candidateIndexes = notes
      .map((note, index) => ({ note, index }))
      .filter((entry, index) => targetDegrees[index] === 'b3' && entry.note.duration >= 1)
      .map((entry) => entry.index)
    if (candidateIndexes.length > 0) {
      const targetIndex = pickRandom(candidateIndexes)
      const targetNote = notes[targetIndex]
      const bendTargetMidi = targetNote.midi + 0.5
      targetNote.technique = 'bend'
      targetNote.bend = {
        toMidi: bendTargetMidi,
        start: 0.12,
        end: Math.min(0.65, Math.max(0.35, targetNote.duration - 0.15)),
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
