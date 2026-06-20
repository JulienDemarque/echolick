import type { DegreeOptionId } from './types'

export const ROOT_SCALE_WEIGHTS: Record<'major' | 'minor', Record<DegreeOptionId, number>> = {
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
    '7': 0.96,
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
    '7': 0.72,
  },
}

export const scoreDegreeCandidate = ({
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
  chordQuality: 'dominant7' | 'minor7' | 'major7' | 'dim7'
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
