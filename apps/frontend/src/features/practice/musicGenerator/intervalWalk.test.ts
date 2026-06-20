import { describe, expect, it } from 'vitest'

import { buildIntervalPattern, buildIntervalWalkCandidateIndexes, reflectIndex } from './intervalWalk'

describe('intervalWalk helpers', () => {
  it('reflects indexes that overflow bounds', () => {
    expect(reflectIndex(-1, 4)).toBe(1)
    expect(reflectIndex(5, 4)).toBe(3)
    expect(reflectIndex(9, 4)).toBe(1)
  })

  it('walks candidate indexes by repeating interval pattern', () => {
    const indexes = buildIntervalWalkCandidateIndexes({
      totalNotes: 6,
      candidateCount: 5,
      startingIndex: 2,
      intervalPattern: [-2, 3],
    })
    expect(indexes).toEqual([2, 0, 3, 1, 4, 2])
  })

  it('generates bounded interval patterns', () => {
    for (let i = 0; i < 40; i += 1) {
      const pattern = buildIntervalPattern()
      expect(pattern.length).toBeGreaterThanOrEqual(2)
      expect(pattern.length).toBeLessThanOrEqual(4)
      expect(pattern.every((step) => [-3, -2, -1, 1, 2, 3].includes(step))).toBe(true)
    }
  })
})
