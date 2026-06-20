export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

export type GeneratorLevelId = 'level-1' | 'level-2' | 'level-3'
export type DegreeOptionId = '1' | '2' | 'b3' | '3' | '4' | 'b5' | '5' | '6' | 'b7' | '7'
export type BluesFormId = 'all-dominant' | 'all-minor' | 'minor-iv-major' | 'minor-v-dominant' | 'same-old-blues'
export type CagedPositionId = '1-e-shape' | '2-d-shape' | '3-c-shape-bb-king' | '4-a-shape' | '5-g-shape'

export type GuitarStringId = 'E6' | 'A' | 'D' | 'G' | 'B' | 'E1'

export type ShapeTemplateNoteE = {
  stringId: GuitarStringId
  stringIndexFromLowE: number
  fretOffsetFromShapeRoot: number
  noteNameInE: string
  chromaticSemitoneFromE: number
  chromaticDegreeLabel: string
}

export type ResolvedShapeNote = {
  stringId: GuitarStringId
  stringIndexFromLowE: number
  fret: number
  midi: number
  noteName: string
  chromaticSemitoneFromKey: number
  chromaticDegreeLabel: string
  degreeId: DegreeOptionId | null
}

export type MelodicCandidate = {
  stringId: GuitarStringId
  stringIndexFromLowE: number
  fret: number
  midi: number
  noteName: string
  chromaticSemitoneFromKey: number
  degreeId: DegreeOptionId
  isChordTone: boolean
}

export type CandidatePool = {
  baseCandidates: MelodicCandidate[]
  narrowedBaseCandidates: MelodicCandidate[]
  chordToneAugmentationCandidates: MelodicCandidate[]
  finalCandidates: MelodicCandidate[]
}

export type GeneratorLevelPolicy = {
  allowedDegrees: DegreeOptionId[]
  includeChordTones: boolean
  weightFlavor: 'major' | 'minor'
}
