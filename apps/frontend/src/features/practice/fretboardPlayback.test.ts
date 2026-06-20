import { describe, expect, it } from 'vitest'

import type { LickNote } from '../../types/music'
import { getActiveLickMidisAtBeat } from './fretboardPlayback'

const makeNote = (midi: number, start: number, duration: number): LickNote => ({
  midi,
  noteName: `N${midi}`,
  start,
  duration,
  velocity: 0.8,
  technique: 'normal',
})

describe('getActiveLickMidisAtBeat', () => {
  it('returns active midi notes at a given beat', () => {
    const notes = [makeNote(64, 0, 1), makeNote(67, 1, 0.5), makeNote(69, 1, 1)]
    expect(getActiveLickMidisAtBeat(notes, 0.25)).toEqual([64])
    expect(getActiveLickMidisAtBeat(notes, 1.25).sort((a, b) => a - b)).toEqual([67, 69])
  })

  it('treats note end as exclusive and deduplicates mids', () => {
    const notes = [makeNote(64, 0, 1), makeNote(64.4, 0.5, 1), makeNote(70, 1, 1)]
    expect(getActiveLickMidisAtBeat(notes, 1)).toEqual([64, 70])
    expect(getActiveLickMidisAtBeat(notes, 2)).toEqual([])
  })

  it('returns empty list for negative beat values', () => {
    expect(getActiveLickMidisAtBeat([makeNote(64, 0, 1)], -0.1)).toEqual([])
  })
})
