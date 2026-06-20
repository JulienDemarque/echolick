import type { LickNote } from '../../types/music'

export const getActiveLickMidisAtBeat = (notes: LickNote[], beat: number): number[] => {
  if (beat < 0) return []
  const active = new Set<number>()
  notes.forEach((note) => {
    const noteEnd = note.start + note.duration
    if (beat >= note.start && beat < noteEnd) {
      active.add(Math.round(note.midi))
    }
  })
  return Array.from(active)
}
