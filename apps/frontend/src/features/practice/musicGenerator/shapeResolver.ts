import type { CagedPositionId, DegreeOptionId, NoteName, ResolvedShapeNote, ShapeTemplateNoteE } from './types'

const E_REFERENCE_NOTE: NoteName = 'E'
const STRING_OPEN_MIDI_LOW_TO_HIGH = [40, 45, 50, 55, 59, 64] as const
const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const TEMPLATE_OCTAVE_SHIFTS = [-12, 0, 12] as const
const MIN_PLAYABLE_FRET = 0
const MAX_PLAYABLE_FRET = 17
const MIN_PLAYABLE_MIDI = 50
const MAX_PLAYABLE_MIDI = 82

const STRING_IDS_LOW_TO_HIGH = ['E6', 'A', 'D', 'G', 'B', 'E1'] as const
const DEGREE_SEMITONE_MAP: Array<{ id: DegreeOptionId; semitones: number }> = [
  { id: '1', semitones: 0 },
  { id: '2', semitones: 2 },
  { id: 'b3', semitones: 3 },
  { id: '3', semitones: 4 },
  { id: '4', semitones: 5 },
  { id: 'b5', semitones: 6 },
  { id: '5', semitones: 7 },
  { id: '6', semitones: 9 },
  { id: 'b7', semitones: 10 },
]
const CHROMATIC_DEGREE_LABELS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', '#5', '6', 'b7', '7'] as const

const CAGED_SHAPE_TEMPLATE_POSITIONS_E: Record<CagedPositionId, Array<{ stringIndexFromLowE: number; positions: number[] }>> = {
  '1-e-shape': [
    { stringIndexFromLowE: 0, positions: [0, 1, 2, 3] },
    { stringIndexFromLowE: 1, positions: [0, 1, 2] },
    { stringIndexFromLowE: 2, positions: [0, 1, 2] },
    { stringIndexFromLowE: 3, positions: [0, 1, 2] },
    { stringIndexFromLowE: 4, positions: [0, 1, 2, 3] },
    { stringIndexFromLowE: 5, positions: [0, 1, 2, 3] },
  ],
  '2-d-shape': [
    { stringIndexFromLowE: 0, positions: [2, 3, 4, 5] },
    { stringIndexFromLowE: 1, positions: [2, 3, 4, 5] },
    { stringIndexFromLowE: 2, positions: [2, 3, 4] },
    { stringIndexFromLowE: 3, positions: [2, 3, 4] },
    { stringIndexFromLowE: 4, positions: [3, 4, 5] },
    { stringIndexFromLowE: 5, positions: [2, 3, 4, 5] },
  ],
  '3-c-shape-bb-king': [
    { stringIndexFromLowE: 0, positions: [5, 6, 7] },
    { stringIndexFromLowE: 1, positions: [5, 6, 7] },
    { stringIndexFromLowE: 2, positions: [4, 5, 6, 7] },
    { stringIndexFromLowE: 3, positions: [4, 5, 6, 7] },
    { stringIndexFromLowE: 4, positions: [5, 6, 7, 8] },
    { stringIndexFromLowE: 5, positions: [5, 6, 7] },
  ],
  '4-a-shape': [
    { stringIndexFromLowE: 0, positions: [7, 8, 9, 10] },
    { stringIndexFromLowE: 1, positions: [7, 8, 9, 10] },
    { stringIndexFromLowE: 2, positions: [7, 8, 9] },
    { stringIndexFromLowE: 3, positions: [7, 8, 9] },
    { stringIndexFromLowE: 4, positions: [8, 9, 10] },
    { stringIndexFromLowE: 5, positions: [7, 8, 9, 10] },
  ],
  '5-g-shape': [
    { stringIndexFromLowE: 0, positions: [10, 11, 12] },
    { stringIndexFromLowE: 1, positions: [10, 11, 12] },
    { stringIndexFromLowE: 2, positions: [9, 10, 11, 12] },
    { stringIndexFromLowE: 3, positions: [9, 10, 11, 12] },
    { stringIndexFromLowE: 4, positions: [10, 11, 12, 13] },
    { stringIndexFromLowE: 5, positions: [10, 11, 12] },
  ],
}

const noteNameToPitchClass = (note: NoteName): number => NOTE_NAMES.indexOf(note)
const midiToPitchClass = (midi: number): number => ((Math.round(midi) % 12) + 12) % 12
const midiToNoteNameWithOctave = (midi: number): string => {
  const pitchClass = midiToPitchClass(midi)
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[pitchClass] ?? 'C'}${octave}`
}

const semitoneToDegreeId = (semitone: number): DegreeOptionId | null => {
  const normalized = ((Math.round(semitone) % 12) + 12) % 12
  return DEGREE_SEMITONE_MAP.find((entry) => entry.semitones === normalized)?.id ?? null
}

const buildTemplateNoteE = (stringIndexFromLowE: number, fretOffsetFromShapeRoot: number): ShapeTemplateNoteE => {
  const midi = (STRING_OPEN_MIDI_LOW_TO_HIGH[stringIndexFromLowE] ?? STRING_OPEN_MIDI_LOW_TO_HIGH[0]) + fretOffsetFromShapeRoot
  const chromaticSemitoneFromE = (midiToPitchClass(midi) - noteNameToPitchClass(E_REFERENCE_NOTE) + 12) % 12
  return {
    stringId: STRING_IDS_LOW_TO_HIGH[stringIndexFromLowE] ?? 'E6',
    stringIndexFromLowE,
    fretOffsetFromShapeRoot,
    noteNameInE: midiToNoteNameWithOctave(midi),
    chromaticSemitoneFromE,
    chromaticDegreeLabel: CHROMATIC_DEGREE_LABELS[chromaticSemitoneFromE] ?? '1',
  }
}

export const CAGED_SHAPE_TEMPLATE_NOTES_E: Record<CagedPositionId, ShapeTemplateNoteE[]> = Object.fromEntries(
  Object.entries(CAGED_SHAPE_TEMPLATE_POSITIONS_E).map(([shapeId, stringRows]) => [
    shapeId,
    stringRows.flatMap((row) => row.positions.map((position) => buildTemplateNoteE(row.stringIndexFromLowE, position))),
  ]),
) as Record<CagedPositionId, ShapeTemplateNoteE[]>

export const getSemitoneShiftFromE = (keyRoot: NoteName): number =>
  ((noteNameToPitchClass(keyRoot) - noteNameToPitchClass(E_REFERENCE_NOTE)) % 12 + 12) % 12

export const resolveShapeNotesForKey = (keyRoot: NoteName, cagedPositionId: CagedPositionId): ResolvedShapeNote[] => {
  const semitoneShift = getSemitoneShiftFromE(keyRoot)
  const keyPitchClass = noteNameToPitchClass(keyRoot)
  const templateNotes = CAGED_SHAPE_TEMPLATE_NOTES_E[cagedPositionId]
  const resolved: ResolvedShapeNote[] = []

  templateNotes.forEach((templateNote) => {
    const openMidi = STRING_OPEN_MIDI_LOW_TO_HIGH[templateNote.stringIndexFromLowE] ?? STRING_OPEN_MIDI_LOW_TO_HIGH[0]
    TEMPLATE_OCTAVE_SHIFTS.forEach((octaveShift) => {
      const fret = templateNote.fretOffsetFromShapeRoot + semitoneShift + octaveShift
      if (fret < MIN_PLAYABLE_FRET || fret > MAX_PLAYABLE_FRET) return
      const midi = openMidi + fret
      if (midi < MIN_PLAYABLE_MIDI || midi > MAX_PLAYABLE_MIDI) return
      const chromaticSemitoneFromKey = (midiToPitchClass(midi) - keyPitchClass + 12) % 12
      resolved.push({
        stringId: templateNote.stringId,
        stringIndexFromLowE: templateNote.stringIndexFromLowE,
        fret,
        midi,
        noteName: midiToNoteNameWithOctave(midi),
        chromaticSemitoneFromKey,
        chromaticDegreeLabel: CHROMATIC_DEGREE_LABELS[chromaticSemitoneFromKey] ?? '1',
        degreeId: semitoneToDegreeId(chromaticSemitoneFromKey),
      })
    })
  })

  const deduped = new Map<string, ResolvedShapeNote>()
  resolved.forEach((note) => {
    deduped.set(`${note.stringIndexFromLowE}-${note.fret}`, note)
  })
  return Array.from(deduped.values()).sort((a, b) => a.midi - b.midi || a.fret - b.fret)
}
