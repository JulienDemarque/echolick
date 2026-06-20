import { pickRandom } from './randomUtils'

export const isStrongBeat = (beatStart: number): boolean => {
  const rounded = Math.round(beatStart)
  const closeToGrid = Math.abs(beatStart - rounded) < 0.001
  return closeToGrid && (rounded === 0 || rounded === 2)
}

export const buildRhythmPattern = (allowedDurations: number[]): number[] => {
  const durations: number[] = []
  let remaining = 4
  while (remaining > 0) {
    const options = allowedDurations.filter((duration) => duration <= remaining + 1e-6)
    if (options.length === 0) break
    const preferred = options.filter((duration) => duration === 1)
    const selected = preferred.length > 0 && Math.random() < 0.55 ? pickRandom(preferred) : pickRandom(options)
    durations.push(selected)
    remaining = Math.max(0, Number((remaining - selected).toFixed(2)))
  }
  return durations
}
