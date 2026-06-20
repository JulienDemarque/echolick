import { pickWeightedRandom } from './randomUtils'

const INTERVAL_PATTERN_LENGTH_OPTIONS: Array<{ value: number; weight: number }> = [
  { value: 2, weight: 1.45 },
  { value: 3, weight: 1.2 },
  { value: 4, weight: 0.8 },
]

const INTERVAL_STEP_OPTIONS: Array<{ value: number; weight: number }> = [
  { value: -3, weight: 0.45 },
  { value: -2, weight: 0.88 },
  { value: -1, weight: 1.75 },
  { value: 1, weight: 1.75 },
  { value: 2, weight: 0.88 },
  { value: 3, weight: 0.45 },
]

export const reflectIndex = (index: number, maxIndex: number): number => {
  if (maxIndex <= 0) return 0
  let reflected = index
  while (reflected < 0 || reflected > maxIndex) {
    reflected = reflected < 0 ? -reflected : maxIndex - (reflected - maxIndex)
  }
  return reflected
}

export const buildIntervalPattern = (): number[] => {
  const length = pickWeightedRandom(INTERVAL_PATTERN_LENGTH_OPTIONS)
  const pattern: number[] = []
  for (let i = 0; i < length; i += 1) {
    pattern.push(pickWeightedRandom(INTERVAL_STEP_OPTIONS))
  }
  return pattern
}

export const buildIntervalWalkCandidateIndexes = ({
  totalNotes,
  candidateCount,
  startingIndex,
  intervalPattern,
}: {
  totalNotes: number
  candidateCount: number
  startingIndex: number
  intervalPattern: number[]
}): number[] => {
  if (totalNotes <= 0 || candidateCount <= 0) return []
  const maxIndex = candidateCount - 1
  const indexes: number[] = [reflectIndex(startingIndex, maxIndex)]
  let cursor = indexes[0]!
  for (let i = 1; i < totalNotes; i += 1) {
    const step = intervalPattern[(i - 1) % intervalPattern.length] ?? 0
    cursor = reflectIndex(cursor + step, maxIndex)
    indexes.push(cursor)
  }
  return indexes
}
