import type { LickNote } from '../../types/music'

export type PitchPoint = {
  time: number
  midi: number
}

export type PitchSegment = PitchPoint[]

const TARGET_CONTOUR_STEP_BEATS = 0.03
const MIN_PITCH_HZ = 70
const MAX_PITCH_HZ = 1000

export const SCORE_TIME_TOLERANCE_BEATS = 0.4
export const SCORE_PITCH_TOLERANCE_SEMITONES = 1.8
export const MAX_CAPTURE_BEATS = 4

const clampBeat = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

export const frequencyToMidi = (frequencyHz: number): number => 69 + 12 * Math.log2(frequencyHz / 440)

const buildNotePitchContour = (note: LickNote, tempo: number): PitchSegment => {
  const durationBeats = Math.max(note.duration, 0)
  if (durationBeats <= 0) return []

  const beatSeconds = 60 / Math.max(tempo, 1)
  const points: PitchSegment = []

  for (
    let localBeat = 0;
    localBeat <= durationBeats + TARGET_CONTOUR_STEP_BEATS * 0.5;
    localBeat += TARGET_CONTOUR_STEP_BEATS
  ) {
    const clampedBeat = clampBeat(localBeat, 0, durationBeats)
    let midi = note.midi

    if (note.bend && clampedBeat >= note.bend.start) {
      const bendStart = clampBeat(note.bend.start, 0, durationBeats)
      const bendEnd = clampBeat(note.bend.end, bendStart, durationBeats)

      if (bendEnd > bendStart) {
        if (clampedBeat <= bendEnd) {
          const bendProgress = (clampedBeat - bendStart) / (bendEnd - bendStart)
          midi = note.midi + (note.bend.toMidi - note.midi) * bendProgress
        } else {
          midi = note.bend.toMidi
        }
      } else {
        midi = note.bend.toMidi
      }
    }

    if (note.vibrato && clampedBeat >= note.vibrato.start) {
      const vibratoElapsedBeats = clampedBeat - note.vibrato.start
      const vibratoElapsedSeconds = vibratoElapsedBeats * beatSeconds
      midi += Math.sin(2 * Math.PI * note.vibrato.rateHz * vibratoElapsedSeconds) * note.vibrato.depthSemitones
    }

    points.push({
      time: note.start + clampedBeat,
      midi,
    })
  }

  return points
}

export const buildTargetPitchSegments = (notes: LickNote[], tempo: number): PitchSegment[] =>
  notes.map((note) => buildNotePitchContour(note, tempo)).filter((segment) => segment.length > 0)

export const getClosestContourMidi = (segment: PitchSegment, time: number): number | null => {
  if (segment.length === 0) return null
  let bestMidi = segment[0].midi
  let bestDistance = Math.abs(segment[0].time - time)
  for (let i = 1; i < segment.length; i += 1) {
    const distance = Math.abs(segment[i].time - time)
    if (distance < bestDistance) {
      bestDistance = distance
      bestMidi = segment[i].midi
    }
  }
  return bestMidi
}

export const detectPitchHz = (buffer: Float32Array<ArrayBuffer>, sampleRate: number): number | null => {
  let rms = 0
  for (let i = 0; i < buffer.length; i += 1) {
    rms += buffer[i] * buffer[i]
  }
  rms = Math.sqrt(rms / buffer.length)
  if (rms < 0.008) return null

  const minLag = Math.floor(sampleRate / MAX_PITCH_HZ)
  const maxLag = Math.floor(sampleRate / MIN_PITCH_HZ)
  let bestLag = -1
  let bestScore = 0

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sumXY = 0
    let sumX2 = 0
    let sumY2 = 0
    const limit = buffer.length - lag

    for (let i = 0; i < limit; i += 1) {
      const x = buffer[i]
      const y = buffer[i + lag]
      sumXY += x * y
      sumX2 += x * x
      sumY2 += y * y
    }

    const denom = Math.sqrt(sumX2 * sumY2)
    if (denom <= 1e-7) continue
    const score = sumXY / denom
    if (score > bestScore) {
      bestScore = score
      bestLag = lag
    }
  }

  if (bestLag <= 0 || bestScore < 0.82) return null
  return sampleRate / bestLag
}
