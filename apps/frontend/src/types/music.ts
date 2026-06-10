export type Bend = {
  toMidi: number
  start: number
  end: number
}

export type Vibrato = {
  depthSemitones: number
  rateHz: number
  start: number
}

export type LickNote = {
  midi: number
  noteName: string
  start: number
  duration: number
  velocity: number
  bend?: Bend
  vibrato?: Vibrato
  technique?: 'normal' | 'bend' | 'slide' | 'hammer_on' | 'pull_off' | 'vibrato'
}
