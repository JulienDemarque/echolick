export const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

export const pickWeightedRandom = <T,>(items: Array<{ value: T; weight: number }>): T => {
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0)
  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)]!.value
  }
  let cursor = Math.random() * totalWeight
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]!
    cursor -= Math.max(0, item.weight)
    if (cursor <= 0) return item.value
  }
  return items[items.length - 1]!.value
}
