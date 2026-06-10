import { create } from 'zustand'
import { advanceBar } from '../music/progression'

type AppState = {
  barIndex: number
  setBarIndex: (value: number) => void
  nextBar: () => void
  resetProgression: () => void
}

export const useAppStore = create<AppState>((set) => ({
  barIndex: 0,
  setBarIndex: (value) => set({ barIndex: value }),
  nextBar: () => set((state) => ({ barIndex: advanceBar(state.barIndex) })),
  resetProgression: () => set({ barIndex: 0 }),
}))
