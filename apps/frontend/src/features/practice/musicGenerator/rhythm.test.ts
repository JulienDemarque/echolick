import { describe, expect, it } from 'vitest'

import { buildRhythmPattern, isStrongBeat } from './rhythm'

describe('rhythm helpers', () => {
  it('builds a one-bar rhythm with allowed durations only', () => {
    for (let i = 0; i < 24; i += 1) {
      const pattern = buildRhythmPattern([0.5, 1])
      const sum = pattern.reduce((acc, duration) => acc + duration, 0)
      expect(pattern.every((duration) => [0.5, 1].includes(duration))).toBe(true)
      expect(sum).toBe(4)
    }
  })

  it('detects strong beats on 1 and 3', () => {
    expect(isStrongBeat(0)).toBe(true)
    expect(isStrongBeat(2)).toBe(true)
    expect(isStrongBeat(1)).toBe(false)
    expect(isStrongBeat(1.5)).toBe(false)
  })
})
