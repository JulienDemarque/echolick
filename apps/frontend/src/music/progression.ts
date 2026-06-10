export type Degree = 'I' | 'IV' | 'V'

export const BLUES_PROGRESSION: Degree[] = [
  'I',
  'IV',
  'I',
  'I',
  'IV',
  'IV',
  'I',
  'I',
  'V',
  'IV',
  'I',
  'V',
]

export const CHORDS_BY_DEGREE: Record<Degree, string> = {
  I: 'A7',
  IV: 'D7',
  V: 'E7',
}

export const getCurrentDegree = (barIndex: number): Degree =>
  BLUES_PROGRESSION[barIndex % BLUES_PROGRESSION.length]

export const advanceBar = (barIndex: number): number =>
  (barIndex + 1) % BLUES_PROGRESSION.length
