import { describe, expect, it } from 'vitest'
import { CAGED_SHAPE_TEMPLATE_NOTES_E, getSemitoneShiftFromE, resolveShapeNotesForKey } from './shapeResolver'

describe('shapeResolver', () => {
  it('has explicit E-reference templates for each shape', () => {
    const shapeIds = Object.keys(CAGED_SHAPE_TEMPLATE_NOTES_E)
    expect(shapeIds.length).toBe(5)
    shapeIds.forEach((shapeId) => {
      const entries = CAGED_SHAPE_TEMPLATE_NOTES_E[shapeId as keyof typeof CAGED_SHAPE_TEMPLATE_NOTES_E]
      expect(entries.length).toBeGreaterThan(0)
      expect(entries.every((entry) => entry.noteNameInE.length > 0)).toBe(true)
    })
  })

  it('computes semitone shifts relative to E', () => {
    expect(getSemitoneShiftFromE('E')).toBe(0)
    expect(getSemitoneShiftFromE('F')).toBe(1)
    expect(getSemitoneShiftFromE('A')).toBe(5)
    expect(getSemitoneShiftFromE('D#')).toBe(11)
  })

  it('resolves concrete shape notes in playable range for a key', () => {
    const notes = resolveShapeNotesForKey('A', '1-e-shape')
    expect(notes.length).toBeGreaterThan(0)
    expect(notes.every((note) => note.fret >= 0 && note.fret <= 17)).toBe(true)
    expect(notes.every((note) => note.midi >= 50 && note.midi <= 82)).toBe(true)
    expect(notes.every((note) => note.chromaticSemitoneFromKey >= 0 && note.chromaticSemitoneFromKey <= 11)).toBe(true)
  })
})
