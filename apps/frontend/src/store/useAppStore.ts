import { create } from 'zustand'
import type { GenerateLickResponse } from '../api/client'
import {
  type BluesFormId,
  type GeneratorLevelId,
  type NoteName,
  type CagedPositionId,
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
  cagedPositionId: CagedPositionId
  setCagedPositionId: (value: CagedPositionId) => void
  selectedFretboardMidis: number[]
  setSelectedFretboardMidis: (value: number[]) => void
  toggleSelectedFretboardMidi: (value: number) => void
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
  cagedPositionId: '3-c-shape-bb-king',
  setCagedPositionId: (value) => set({ cagedPositionId: value }),
  selectedFretboardMidis: [],
  setSelectedFretboardMidis: (value) => set({ selectedFretboardMidis: value }),
  toggleSelectedFretboardMidi: (value) =>
    set((state) => ({
      selectedFretboardMidis: state.selectedFretboardMidis.includes(value)
        ? state.selectedFretboardMidis.filter((midi) => midi !== value)
        : [...state.selectedFretboardMidis, value],
    })),
  generatedLickByBar: {},
  setGeneratedLickForBar: (barIndex, lick) =>
    set((state) => ({ generatedLickByBar: { ...state.generatedLickByBar, [barIndex]: lick } })),
  clearGeneratedLicks: () => set({ generatedLickByBar: {} }),
}))
