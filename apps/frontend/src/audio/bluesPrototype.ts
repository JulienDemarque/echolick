import type { LickNote } from '../types/music'

const CHORD_A7_MIDI = [57, 61, 64, 67]

export const HARDCODED_A_MINOR_LICK: LickNote[] = [
  { midi: 69, noteName: 'A4', start: 0, duration: 1, velocity: 0.82, technique: 'normal' },
  { midi: 72, noteName: 'C5', start: 1, duration: 1, velocity: 0.86, technique: 'normal' },
  {
    midi: 74,
    noteName: 'D5',
    start: 2,
    duration: 1,
    velocity: 0.9,
    technique: 'bend',
    bend: { toMidi: 76, start: 0.12, end: 0.56 },
  },
  {
    midi: 69,
    noteName: 'A4',
    start: 3,
    duration: 1,
    velocity: 0.84,
    technique: 'vibrato',
    vibrato: { depthSemitones: 0.2, rateHz: 5.6, start: 0.2 },
  },
]

let sharedAudioContext: AudioContext | null = null
let springImpulseCache: AudioBuffer | null = null

const midiToFreq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12)

const getAudioContext = async (): Promise<AudioContext> => {
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContext()
  }
  if (sharedAudioContext.state === 'suspended') {
    await sharedAudioContext.resume()
  }
  return sharedAudioContext
}

const makeOverdriveCurve = (amount: number, samples = 2048) => {
  const curve = new Float32Array(new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT))
  const k = Math.max(1, amount)
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x))
  }
  return curve
}

const makeSpringImpulse = (ctx: AudioContext): AudioBuffer => {
  if (springImpulseCache && springImpulseCache.sampleRate === ctx.sampleRate) {
    return springImpulseCache
  }

  const durationSec = 1.8
  const sampleCount = Math.floor(ctx.sampleRate * durationSec)
  const impulse = ctx.createBuffer(2, sampleCount, ctx.sampleRate)

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < sampleCount; i += 1) {
      const t = i / ctx.sampleRate
      const decay = Math.exp(-3.2 * t)
      const noise = (Math.random() * 2 - 1) * decay
      // Add metallic spring-ish resonances.
      const ringA = Math.sin(2 * Math.PI * 420 * t) * 0.25 * Math.exp(-5.5 * t)
      const ringB = Math.sin(2 * Math.PI * 860 * t) * 0.14 * Math.exp(-7.2 * t)
      data[i] = noise * 0.7 + ringA + ringB
    }
  }

  springImpulseCache = impulse
  return impulse
}

type MixBuses = {
  rhythmInput: GainNode
  leadInput: GainNode
}

const createMixBuses = (ctx: AudioContext, startTime: number): MixBuses => {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, startTime - 0.02)
  master.gain.linearRampToValueAtTime(0.9, startTime + 0.02)
  master.connect(ctx.destination)

  const rhythmInput = ctx.createGain()
  const rhythmTone = ctx.createBiquadFilter()
  rhythmTone.type = 'lowpass'
  rhythmTone.frequency.setValueAtTime(1550, startTime)
  rhythmTone.Q.setValueAtTime(0.9, startTime)

  const rhythmComp = ctx.createDynamicsCompressor()
  rhythmComp.threshold.setValueAtTime(-24, startTime)
  rhythmComp.knee.setValueAtTime(20, startTime)
  rhythmComp.ratio.setValueAtTime(2, startTime)
  rhythmComp.attack.setValueAtTime(0.01, startTime)
  rhythmComp.release.setValueAtTime(0.3, startTime)

  const rhythmLevel = ctx.createGain()
  rhythmLevel.gain.setValueAtTime(0.24, startTime)

  rhythmInput.connect(rhythmTone)
  rhythmTone.connect(rhythmComp)
  rhythmComp.connect(rhythmLevel)
  rhythmLevel.connect(master)

  const leadInput = ctx.createGain()
  const leadPreEq = ctx.createBiquadFilter()
  leadPreEq.type = 'highpass'
  leadPreEq.frequency.setValueAtTime(170, startTime)
  leadPreEq.Q.setValueAtTime(0.7, startTime)

  const leadCompressor = ctx.createDynamicsCompressor()
  leadCompressor.threshold.setValueAtTime(-28, startTime)
  leadCompressor.knee.setValueAtTime(24, startTime)
  leadCompressor.ratio.setValueAtTime(4.2, startTime)
  leadCompressor.attack.setValueAtTime(0.003, startTime)
  leadCompressor.release.setValueAtTime(0.16, startTime)

  const overdrive = ctx.createWaveShaper()
  overdrive.curve = makeOverdriveCurve(22)
  overdrive.oversample = '4x'

  const cabinet = ctx.createBiquadFilter()
  cabinet.type = 'lowpass'
  cabinet.frequency.setValueAtTime(2900, startTime)
  cabinet.Q.setValueAtTime(0.65, startTime)

  const leadDryLevel = ctx.createGain()
  leadDryLevel.gain.setValueAtTime(0.35, startTime)

  const fxSend = ctx.createGain()
  fxSend.gain.setValueAtTime(0.55, startTime)

  const delay = ctx.createDelay(1.4)
  delay.delayTime.setValueAtTime(0.24, startTime)
  const delayFeedback = ctx.createGain()
  delayFeedback.gain.setValueAtTime(0.32, startTime)
  const delayLowpass = ctx.createBiquadFilter()
  delayLowpass.type = 'lowpass'
  delayLowpass.frequency.setValueAtTime(2400, startTime)

  const springReverb = ctx.createConvolver()
  springReverb.buffer = makeSpringImpulse(ctx)
  const springTone = ctx.createBiquadFilter()
  springTone.type = 'highpass'
  springTone.frequency.setValueAtTime(220, startTime)
  const springLevel = ctx.createGain()
  springLevel.gain.setValueAtTime(0.16, startTime)

  const delayLevel = ctx.createGain()
  delayLevel.gain.setValueAtTime(0.18, startTime)

  const leadOutLevel = ctx.createGain()
  leadOutLevel.gain.setValueAtTime(0.95, startTime)

  leadInput.connect(leadPreEq)
  leadPreEq.connect(leadCompressor)
  leadCompressor.connect(overdrive)
  overdrive.connect(cabinet)

  cabinet.connect(leadDryLevel)
  leadDryLevel.connect(leadOutLevel)

  cabinet.connect(fxSend)
  fxSend.connect(delay)
  fxSend.connect(springReverb)

  delay.connect(delayLowpass)
  delayLowpass.connect(delayFeedback)
  delayFeedback.connect(delay)
  delayLowpass.connect(delayLevel)
  delayLevel.connect(leadOutLevel)

  springReverb.connect(springTone)
  springTone.connect(springLevel)
  springLevel.connect(leadOutLevel)

  leadOutLevel.connect(master)

  return { rhythmInput, leadInput }
}

const playChord = (
  ctx: AudioContext,
  startTime: number,
  durationSec: number,
  midiNotes: number[],
  output: AudioNode,
) => {
  const chordAmp = ctx.createGain()
  chordAmp.gain.setValueAtTime(0.0001, startTime)
  chordAmp.gain.linearRampToValueAtTime(0.14, startTime + 0.1)
  chordAmp.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec)
  chordAmp.connect(output)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1350, startTime)
  filter.Q.setValueAtTime(0.9, startTime)
  filter.connect(chordAmp)

  midiNotes.forEach((midi) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(midiToFreq(midi), startTime)
    osc.connect(filter)
    osc.start(startTime)
    osc.stop(startTime + durationSec + 0.05)
  })
}

const playLeadNote = (
  ctx: AudioContext,
  note: LickNote,
  barStart: number,
  beatSeconds: number,
  output: AudioNode,
) => {
  const noteStart = barStart + note.start * beatSeconds
  const durationSec = note.duration * beatSeconds
  const noteEnd = noteStart + durationSec
  const baseFreq = midiToFreq(note.midi)

  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(baseFreq, noteStart)

  const noteGain = ctx.createGain()
  const peak = Math.min(0.2, Math.max(0.04, note.velocity * 0.22))
  noteGain.gain.setValueAtTime(0.0001, noteStart)
  noteGain.gain.linearRampToValueAtTime(peak, noteStart + 0.015)
  noteGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2400, noteStart)
  filter.Q.setValueAtTime(2, noteStart)

  osc.connect(filter)
  filter.connect(noteGain)
  noteGain.connect(output)

  if (note.bend) {
    const bendStart = noteStart + note.bend.start * beatSeconds
    const bendEnd = noteStart + note.bend.end * beatSeconds
    const bendToFreq = midiToFreq(note.bend.toMidi)
    osc.frequency.setValueAtTime(baseFreq, bendStart)
    osc.frequency.linearRampToValueAtTime(bendToFreq, bendEnd)
  }

  let vibratoOsc: OscillatorNode | null = null
  let vibratoGain: GainNode | null = null
  if (note.vibrato) {
    const vibratoStart = noteStart + note.vibrato.start * beatSeconds
    const cents = note.vibrato.depthSemitones * 100
    vibratoOsc = ctx.createOscillator()
    vibratoGain = ctx.createGain()
    vibratoOsc.type = 'sine'
    vibratoOsc.frequency.setValueAtTime(note.vibrato.rateHz, vibratoStart)
    vibratoGain.gain.setValueAtTime(cents, vibratoStart)
    vibratoOsc.connect(vibratoGain)
    vibratoGain.connect(osc.detune)
    vibratoOsc.start(vibratoStart)
    vibratoOsc.stop(noteEnd)
  }

  osc.start(noteStart)
  osc.stop(noteEnd + 0.03)

  osc.onended = () => {
    vibratoOsc?.disconnect()
    vibratoGain?.disconnect()
    noteGain.disconnect()
    filter.disconnect()
  }
}

export const playStaticPrototype = async (tempo = 76): Promise<void> => {
  const ctx = await getAudioContext()
  const beatSeconds = 60 / tempo
  const barDurationSec = beatSeconds * 4
  const start = ctx.currentTime + 0.06
  const mix = createMixBuses(ctx, start)

  playChord(ctx, start, barDurationSec, CHORD_A7_MIDI, mix.rhythmInput)
  HARDCODED_A_MINOR_LICK.forEach((note) =>
    playLeadNote(ctx, note, start, beatSeconds, mix.leadInput),
  )
}
