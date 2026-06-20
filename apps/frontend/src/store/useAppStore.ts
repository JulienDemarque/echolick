import { create } from 'zustand'
import type { GenerateLickResponse } from '../api/client'
import {
  DEGREE_LEVEL_PRESETS,
  type BluesFormId,
  type DegreeOptionId,
  type GeneratorLevelId,
  type NoteName,
  type OctaveSpanId,
} from '../features/practice/musicGenerator'
import { advanceBar } from '../music/progression'

type AppState = {
  barIndex: number
  setBarIndex: (value: number) => void
  nextBar: () => void
  resetProgression: () => void
  activeKeyRoot: NoteName
  setActiveKeyRoot: (value: NoteName) => void
  bluesFormId: BluesFormId
  setBluesFormId: (value: BluesFormId) => void
  generatorLevel: GeneratorLevelId
  setGeneratorLevel: (value: GeneratorLevelId) => void
  enabledDegrees: DegreeOptionId[]
  setEnabledDegrees: (value: DegreeOptionId[]) => void
  includeMajorNotes: boolean
  setIncludeMajorNotes: (value: boolean) => void
  allowBend: boolean
  setAllowBend: (value: boolean) => void
  includeChordTones: boolean
  setIncludeChordTones: (value: boolean) => void
  octaveSpan: OctaveSpanId
  setOctaveSpan: (value: OctaveSpanId) => void
  generatedLickByBar: Record<number, GenerateLickResponse>
  setGeneratedLickForBar: (barIndex: number, lick: GenerateLickResponse) => void
  clearGeneratedLicks: () => void
}

export const useAppStore = create<AppState>((set) => ({
  barIndex: 0,
  setBarIndex: (value) => set({ barIndex: value }),
  nextBar: () => set((state) => ({ barIndex: advanceBar(state.barIndex) })),
  resetProgression: () => set({ barIndex: 0 }),
  activeKeyRoot: 'E',
  setActiveKeyRoot: (value) => set({ activeKeyRoot: value }),
  bluesFormId: 'all-dominant',
  setBluesFormId: (value) => set({ bluesFormId: value }),
  generatorLevel: 'level-1',
  setGeneratorLevel: (value) => set({ generatorLevel: value }),
  enabledDegrees: DEGREE_LEVEL_PRESETS['level-1'],
  setEnabledDegrees: (value) => set({ enabledDegrees: value }),
  includeMajorNotes: true,
  setIncludeMajorNotes: (value) => set({ includeMajorNotes: value }),
  allowBend: false,
  setAllowBend: (value) => set({ allowBend: value }),
  includeChordTones: true,
  setIncludeChordTones: (value) => set({ includeChordTones: value }),
  octaveSpan: 1,
  setOctaveSpan: (value) => set({ octaveSpan: value }),
  generatedLickByBar: {},
  setGeneratedLickForBar: (barIndex, lick) =>
    set((state) => ({ generatedLickByBar: { ...state.generatedLickByBar, [barIndex]: lick } })),
  clearGeneratedLicks: () => set({ generatedLickByBar: {} }),
}))
