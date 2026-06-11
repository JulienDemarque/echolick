import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  postGenerateChorus,
  postGenerateLick,
  type GenerateChorusRequest,
  type GenerateLickRequest,
  type GenerateLickResponse,
} from './api/client'
import { playLickOverChord } from './audio/bluesPrototype'
import { Button } from './components/ui/button'
import { Card, CardTitle } from './components/ui/card'
import {
  BLUES_PROGRESSION,
  CHORD_MIDI_BY_DEGREE,
  CHORDS_BY_DEGREE,
  advanceBar,
  getCurrentDegree,
} from './music/progression'
import { useAppStore } from './store/useAppStore'
import type { LickNote } from './types/music'

const normalizeLickNotes = (notes: GenerateLickResponse['notes']): LickNote[] =>
  notes.map((note) => ({
    ...note,
    bend: note.bend ?? undefined,
    vibrato: note.vibrato ?? undefined,
  }))

const resolveChordMidi = (degree: string): number[] => {
  if (degree === 'I' || degree === 'IV' || degree === 'V') {
    return CHORD_MIDI_BY_DEGREE[degree]
  }
  return CHORD_MIDI_BY_DEGREE.I
}

type PracticePhase = 'idle' | 'listen' | 'your-turn'

type PitchPoint = {
  time: number
  midi: number
}

const PLAYBACK_START_DELAY_MS = 60
const MIN_PITCH_HZ = 70
const MAX_PITCH_HZ = 1000
const MAX_CAPTURE_BEATS = 4

type MicStatus = 'off' | 'ready' | 'capturing'
type PitchSegment = PitchPoint[]
type UserPitchFeedbackPoint = PitchPoint & {
  isCorrect: boolean
}

const TARGET_CONTOUR_STEP_BEATS = 0.03
const SCORE_TIME_TOLERANCE_BEATS = 0.4
const SCORE_PITCH_TOLERANCE_SEMITONES = 1.8

const frequencyToMidi = (frequencyHz: number): number => 69 + 12 * Math.log2(frequencyHz / 440)

const clampBeat = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

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

const buildTargetPitchSegments = (notes: LickNote[], tempo: number): PitchSegment[] =>
  notes.map((note) => buildNotePitchContour(note, tempo)).filter((segment) => segment.length > 0)

const getClosestContourMidi = (segment: PitchSegment, time: number): number | null => {
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

const detectPitchHz = (buffer: Float32Array<ArrayBuffer>, sampleRate: number): number | null => {
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

function App() {
  const barIndex = useAppStore((state) => state.barIndex)
  const setBarIndex = useAppStore((state) => state.setBarIndex)

  const [audioError, setAudioError] = useState<string>('')
  const [lickByBar, setLickByBar] = useState<Record<number, GenerateLickResponse>>({})
  const [activeBeat, setActiveBeat] = useState<number | null>(null)
  const [practicePhase, setPracticePhase] = useState<PracticePhase>('idle')
  const [micStatus, setMicStatus] = useState<MicStatus>('off')
  const [micError, setMicError] = useState<string>('')
  const [userPitchPoints, setUserPitchPoints] = useState<PitchPoint[]>([])
  const metronomeTimeoutsRef = useRef<number[]>([])
  const micStreamRef = useRef<MediaStream | null>(null)
  const micAudioContextRef = useRef<AudioContext | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const micFrameBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const captureWindowStartMsRef = useRef<number | null>(null)
  const captureBeatMsRef = useRef<number>(0)
  const smoothedMidiRef = useRef<number | null>(null)
  const pitchCaptureRafRef = useRef<number | null>(null)
  const metronomeAudioContextRef = useRef<AudioContext | null>(null)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const currentDegree = getCurrentDegree(barIndex)
  const currentChord = CHORDS_BY_DEGREE[currentDegree]
  const selectedLick = lickByBar[barIndex] ?? null
  const selectedLickNotes = useMemo(
    () => (selectedLick ? normalizeLickNotes(selectedLick.notes) : []),
    [selectedLick],
  )
  const targetPitchSegments = useMemo(
    () => buildTargetPitchSegments(selectedLickNotes, selectedLick?.tempo ?? 76),
    [selectedLick?.tempo, selectedLickNotes],
  )
  const flattenedTargetContour = useMemo(() => targetPitchSegments.flat(), [targetPitchSegments])
  const noteMatches = useMemo(() => {
    if (selectedLickNotes.length === 0) return []

    return selectedLickNotes.map((note, index) => {
      const segment = targetPitchSegments[index] ?? []
      const windowStart = Math.max(0, note.start - SCORE_TIME_TOLERANCE_BEATS)
      const windowEnd = Math.min(4, note.start + note.duration + SCORE_TIME_TOLERANCE_BEATS)

      const candidatePoints = userPitchPoints.filter(
        (point) => point.time >= windowStart && point.time <= windowEnd,
      )

      if (candidatePoints.length === 0) return false

      return candidatePoints.some((point) => {
        const expectedMidi = getClosestContourMidi(segment, point.time) ?? note.midi
        return Math.abs(point.midi - expectedMidi) <= SCORE_PITCH_TOLERANCE_SEMITONES
      })
    })
  }, [selectedLickNotes, targetPitchSegments, userPitchPoints])

  const score = useMemo(() => {
    const total = selectedLickNotes.length
    if (total === 0) {
      return { total: 0, matched: 0, percentage: 0 }
    }
    const matched = noteMatches.filter(Boolean).length
    const percentage = Math.round((matched / total) * 100)
    return { total, matched, percentage }
  }, [noteMatches, selectedLickNotes.length])
  const userPitchFeedbackPoints = useMemo<UserPitchFeedbackPoint[]>(() => {
    if (flattenedTargetContour.length === 0 || userPitchPoints.length === 0) return []

    return userPitchPoints.map((point) => {
      let nearest: PitchPoint | null = null
      let nearestDistance = Number.POSITIVE_INFINITY

      for (let i = 0; i < flattenedTargetContour.length; i += 1) {
        const candidate = flattenedTargetContour[i]
        const distance = Math.abs(candidate.time - point.time)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = candidate
        }
      }

      if (!nearest || nearestDistance > SCORE_TIME_TOLERANCE_BEATS) {
        return { ...point, isCorrect: false }
      }

      const isCorrect = Math.abs(point.midi - nearest.midi) <= SCORE_PITCH_TOLERANCE_SEMITONES
      return { ...point, isCorrect }
    })
  }, [flattenedTargetContour, userPitchPoints])

  const stopPitchCaptureLoop = () => {
    if (pitchCaptureRafRef.current !== null) {
      window.cancelAnimationFrame(pitchCaptureRafRef.current)
      pitchCaptureRafRef.current = null
    }
    captureWindowStartMsRef.current = null
    smoothedMidiRef.current = null
    setMicStatus(micAnalyserRef.current ? 'ready' : 'off')
  }

  const ensureMetronomeAudioContext = () => {
    if (!metronomeAudioContextRef.current) {
      metronomeAudioContextRef.current = new AudioContext()
    }
    if (metronomeAudioContextRef.current.state === 'suspended') {
      void metronomeAudioContextRef.current.resume()
    }
    return metronomeAudioContextRef.current
  }

  const playMetronomeClick = (accent: boolean) => {
    const ctx = ensureMetronomeAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const tone = ctx.createBiquadFilter()
    tone.type = 'highpass'
    tone.frequency.setValueAtTime(600, now)

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(accent ? 1450 : 980, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(accent ? 0.22 : 0.15, now + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055)

    osc.connect(tone)
    tone.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.065)
  }

  const capturePitchFrame = (frameTimeMs: number) => {
    const analyser = micAnalyserRef.current
    const ctx = micAudioContextRef.current
    const frameBuffer = micFrameBufferRef.current
    const captureWindowStartMs = captureWindowStartMsRef.current

    if (!analyser || !ctx || !frameBuffer || captureWindowStartMs === null) {
      stopPitchCaptureLoop()
      return
    }

    analyser.getFloatTimeDomainData(frameBuffer)
    const detectedHz = detectPitchHz(frameBuffer, ctx.sampleRate)

    if (detectedHz) {
      const rawMidi = frequencyToMidi(detectedHz)
      const previousMidi = smoothedMidiRef.current
      const smoothedMidi =
        previousMidi === null ? rawMidi : previousMidi + 0.32 * (rawMidi - previousMidi)
      smoothedMidiRef.current = smoothedMidi

      const elapsedMs = frameTimeMs - captureWindowStartMs
      const timeInBeats = elapsedMs / captureBeatMsRef.current
      if (timeInBeats >= 0 && timeInBeats <= MAX_CAPTURE_BEATS) {
        setUserPitchPoints((prev) => {
          const next = [...prev, { time: timeInBeats, midi: smoothedMidi }]
          return next.length > 260 ? next.slice(next.length - 260) : next
        })
      }
    }

    pitchCaptureRafRef.current = window.requestAnimationFrame(capturePitchFrame)
  }

  const startPitchCaptureWindow = (beatMs: number) => {
    if (!micAnalyserRef.current) return
    captureBeatMsRef.current = beatMs
    captureWindowStartMsRef.current = window.performance.now()
    smoothedMidiRef.current = null
    setMicStatus('capturing')
    if (pitchCaptureRafRef.current === null) {
      pitchCaptureRafRef.current = window.requestAnimationFrame(capturePitchFrame)
    }
  }

  const ensureMicrophoneReady = async () => {
    if (micAnalyserRef.current) return

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })

    const micCtx = new AudioContext()
    const source = micCtx.createMediaStreamSource(stream)
    const analyser = micCtx.createAnalyser()
    analyser.fftSize = 4096
    analyser.smoothingTimeConstant = 0.06
    source.connect(analyser)

    micStreamRef.current = stream
    micAudioContextRef.current = micCtx
    micSourceRef.current = source
    micAnalyserRef.current = analyser
    micFrameBufferRef.current = new Float32Array(
      new ArrayBuffer(analyser.fftSize * Float32Array.BYTES_PER_ELEMENT),
    )
    setMicStatus('ready')
  }

  const stopAndDisposeMicrophone = async () => {
    stopPitchCaptureLoop()
    micSourceRef.current?.disconnect()
    micAnalyserRef.current?.disconnect()
    micSourceRef.current = null
    micAnalyserRef.current = null
    micFrameBufferRef.current = null
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micStreamRef.current = null
    if (micAudioContextRef.current) {
      await micAudioContextRef.current.close()
    }
    micAudioContextRef.current = null
    setMicStatus('off')
  }

  const enableMicrophone = async () => {
    try {
      setMicError('')
      await ensureMicrophoneReady()
    } catch (error) {
      setMicError(error instanceof Error ? error.message : 'Microphone access failed')
      setMicStatus('off')
    }
  }

  const clearMetronome = () => {
    metronomeTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
    metronomeTimeoutsRef.current = []
    stopPitchCaptureLoop()
    setActiveBeat(null)
    setPracticePhase('idle')
  }

  const startPracticeCycle = (tempo: number) => {
    clearMetronome()
    setUserPitchPoints([])
    const beatMs = (60 / tempo) * 1000
    const totalBeats = 8

    for (let beat = 0; beat < totalBeats; beat += 1) {
      const timeoutId = window.setTimeout(() => {
        setPracticePhase(beat < 4 ? 'listen' : 'your-turn')
        setActiveBeat(beat % 4)
        playMetronomeClick(beat % 4 === 0)
      }, PLAYBACK_START_DELAY_MS + beat * beatMs)
      metronomeTimeoutsRef.current.push(timeoutId)
    }

    const captureStartId = window.setTimeout(() => {
      startPitchCaptureWindow(beatMs)
    }, PLAYBACK_START_DELAY_MS + 4 * beatMs)
    metronomeTimeoutsRef.current.push(captureStartId)

    const captureStopId = window.setTimeout(() => {
      stopPitchCaptureLoop()
    }, PLAYBACK_START_DELAY_MS + 8 * beatMs)
    metronomeTimeoutsRef.current.push(captureStopId)

    const doneId = window.setTimeout(() => {
      setActiveBeat(null)
      setPracticePhase('idle')
      metronomeTimeoutsRef.current = []
    }, PLAYBACK_START_DELAY_MS + totalBeats * beatMs)
    metronomeTimeoutsRef.current.push(doneId)
  }

  useEffect(
    () => () => {
      metronomeTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      metronomeTimeoutsRef.current = []
      stopPitchCaptureLoop()
      micSourceRef.current?.disconnect()
      micAnalyserRef.current?.disconnect()
      micSourceRef.current = null
      micAnalyserRef.current = null
      micFrameBufferRef.current = null
      micStreamRef.current?.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
      if (micAudioContextRef.current) {
        void micAudioContextRef.current.close()
      }
      micAudioContextRef.current = null
      if (metronomeAudioContextRef.current) {
        void metronomeAudioContextRef.current.close()
      }
      metronomeAudioContextRef.current = null
    },
    [],
  )

  const pitchRange = useMemo(() => {
    if (selectedLickNotes.length === 0 && userPitchPoints.length === 0 && targetPitchSegments.length === 0) {
      return { minMidi: 55, maxMidi: 80 }
    }

    const allMidis = [
      ...selectedLickNotes.map((note) => note.midi),
      ...targetPitchSegments.flatMap((segment) => segment.map((point) => point.midi)),
      ...userPitchPoints.map((point) => point.midi),
    ]
    const minMidi = Math.min(...allMidis) - 2
    const maxMidi = Math.max(...allMidis) + 2
    return { minMidi, maxMidi }
  }, [selectedLickNotes, targetPitchSegments, userPitchPoints])

  const chorusMutation = useMutation({
    mutationFn: (payload: GenerateChorusRequest) => postGenerateChorus(apiBaseUrl, payload),
    onSuccess: (data) => {
      const nextByBar: Record<number, GenerateLickResponse> = {}
      data.bars.forEach((bar, index) => {
        nextByBar[index] = bar
      })
      setLickByBar(nextByBar)
      setAudioError('')
    },
  })

  const generateMutation = useMutation({
    mutationFn: ({ payload }: { bar: number; payload: GenerateLickRequest }) =>
      postGenerateLick(apiBaseUrl, payload),
    onSuccess: (data, variables) => {
      setLickByBar((prev) => ({ ...prev, [variables.bar]: data }))
      startPracticeCycle(data.tempo)
      void playLickOverChord({
        tempo: data.tempo,
        chordMidi: resolveChordMidi(data.degree),
        notes: normalizeLickNotes(data.notes),
      }).catch((e) => {
        setAudioError(e instanceof Error ? e.message : 'Failed to play generated lick')
      })
    },
  })

  const requestError =
    (chorusMutation.error as Error | null)?.message ||
    (generateMutation.error as Error | null)?.message ||
    micError ||
    audioError
  const isGenerating = generateMutation.isPending || chorusMutation.isPending

  const generateForBar = (targetBar: number) => {
    const degree = getCurrentDegree(targetBar)
    const chord = CHORDS_BY_DEGREE[degree]

    setAudioError('')
    generateMutation.reset()
    generateMutation.mutate({
      bar: targetBar,
      payload: {
        key: 'A',
        degree,
        chord,
        flavor: 'major',
        tempo: 76,
      },
    })
  }

  const goToNextBarAndGenerate = () => {
    const nextIndex = advanceBar(barIndex)
    setBarIndex(nextIndex)
    generateForBar(nextIndex)
  }

  const generateFullChorus = () => {
    setAudioError('')
    chorusMutation.reset()
    generateMutation.reset()
    chorusMutation.mutate({
      key: 'A',
      flavor: 'major',
      tempo: 76,
    })
  }

  const generateSelectedBar = () => {
    generateForBar(barIndex)
  }

  const replaySelectedBar = () => {
    if (!selectedLick) return
    setAudioError('')
    startPracticeCycle(selectedLick.tempo)
    void playLickOverChord({
      tempo: selectedLick.tempo,
      chordMidi: resolveChordMidi(selectedLick.degree),
      notes: normalizeLickNotes(selectedLick.notes),
    }).catch((e) => {
      setAudioError(e instanceof Error ? e.message : 'Failed to replay selected bar lick')
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">EchoLick Blues POC</h1>
        <p className="text-sm text-zinc-400">
          Select a bar in the grid, generate for that bar, and replay to practice.
        </p>
      </div>

      <Card className="space-y-3">
        <CardTitle>Progression</CardTitle>
        <p className="text-sm text-zinc-300">
          12-bar form: I IV I I IV IV I I V IV I V
        </p>
        <div className="grid grid-cols-1 gap-2 text-sm text-zinc-200 sm:grid-cols-3">
          <p>
            Current bar: <strong>{barIndex + 1}</strong> / 12
          </p>
          <p>
            Current degree: <strong>{currentDegree}</strong>
          </p>
          <p>
            Current chord: <strong>{currentChord}</strong>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {BLUES_PROGRESSION.map((degree, index) => {
            const chord = CHORDS_BY_DEGREE[degree]
            const isSelected = index === barIndex
            const hasLick = Boolean(lickByBar[index])
            return (
              <button
                key={`${index}-${degree}`}
                type="button"
                onClick={() => setBarIndex(index)}
                className={`rounded-md border p-2 text-left text-xs transition ${
                  isSelected
                    ? 'border-blue-400 bg-blue-500/10 text-blue-100'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Bar {index + 1}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${hasLick ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                  />
                </div>
                <div className="mt-1 text-zinc-400">
                  {degree} - {chord}
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateFullChorus} variant="primary" disabled={isGenerating}>
            {chorusMutation.isPending ? 'Generating 12 Bars...' : 'Generate Full 12 Bars'}
          </Button>
          <Button onClick={generateSelectedBar} disabled={isGenerating}>
            {generateMutation.isPending ? 'Generating...' : 'Generate Selected Bar'}
          </Button>
          <Button onClick={goToNextBarAndGenerate} disabled={isGenerating}>
            {generateMutation.isPending ? 'Generating...' : 'Next Bar + Generate'}
          </Button>
          <Button onClick={replaySelectedBar} disabled={!selectedLick || isGenerating}>
            Replay Selected Bar
          </Button>
        </div>
        {!selectedLick ? (
          <p className="text-xs text-zinc-500">
            No lick for this bar yet. Click Generate Selected Bar.
          </p>
        ) : null}
        {requestError ? <p className="text-sm text-red-400">{requestError}</p> : null}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Selected Bar Lick</CardTitle>
        <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200">
          {selectedLick ? JSON.stringify(selectedLick, null, 2) : 'No lick generated for this bar yet.'}
        </pre>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Metronome + Turn</CardTitle>
        <p className="text-xs text-zinc-400">
          First bar is listen/playback, second bar is your turn to sing or play the phrase. Click track runs through both bars.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void enableMicrophone()} disabled={micStatus !== 'off'}>
            {micStatus === 'off' ? 'Enable Mic Capture' : 'Mic Ready'}
          </Button>
          <Button onClick={() => void stopAndDisposeMicrophone()} disabled={micStatus === 'off'}>
            Disable Mic
          </Button>
          <span className="text-xs text-zinc-400">
            Mic status:{' '}
            <strong className="text-zinc-200">
              {micStatus === 'capturing'
                ? 'capturing bends'
                : micStatus === 'ready'
                  ? 'ready'
                  : 'off'}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((beat) => {
            const isActive = beat === activeBeat
            return (
              <div
                key={beat}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                  isActive
                    ? 'border-indigo-300 bg-indigo-500/25 text-indigo-100'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                }`}
              >
                {beat + 1}
              </div>
            )
          })}
          <span className="ml-2 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
            {practicePhase === 'listen'
              ? 'Listen'
              : practicePhase === 'your-turn'
                ? 'Your turn'
                : 'Idle'}
          </span>
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Pitch Timeline (Time X / Pitch Y)</CardTitle>
        <p className="text-xs text-zinc-400">
          Blue contour shows target pitch. User points are green when correct, red when off target.
        </p>
        <p className="text-sm text-zinc-200">
          Score:{' '}
          <strong>
            {score.matched}/{score.total} ({score.percentage}%)
          </strong>
          <span className="ml-2 text-xs text-zinc-400">
            (forgiving mode: one close capture per note is enough)
          </span>
        </p>
        {noteMatches.length > 0 ? (
          <div className="flex flex-wrap gap-1 text-xs">
            {noteMatches.map((isMatch, index) => (
              <span
                key={`note-hit-${index}`}
                className={`rounded border px-2 py-1 ${
                  isMatch
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-rose-500/60 bg-rose-500/15 text-rose-300'
                }`}
              >
                N{index + 1} {isMatch ? 'OK' : 'MISS'}
              </span>
            ))}
          </div>
        ) : null}
        <svg
          viewBox="0 0 1000 240"
          className="h-56 w-full rounded-lg border border-zinc-800 bg-zinc-950"
          role="img"
          aria-label="Pitch timeline"
        >
          {[0, 1, 2, 3, 4].map((beat) => (
            <line
              key={beat}
              x1={beat * 250}
              y1={0}
              x2={beat * 250}
              y2={240}
              stroke="#27272a"
              strokeWidth={1}
            />
          ))}

          {targetPitchSegments.map((segment, segmentIndex) => {
            const points = segment
              .map((point) => {
                const x = (point.time / 4) * 1000
                const ratio =
                  (point.midi - pitchRange.minMidi) / (pitchRange.maxMidi - pitchRange.minMidi || 1)
                const y = 220 - ratio * 200
                return `${x},${y}`
              })
              .join(' ')

            return (
              <polyline
                key={`target-segment-${segmentIndex}`}
                points={points}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })}

          {userPitchFeedbackPoints.map((point, index) => {
            const x = (point.time / 4) * 1000
            const ratio = (point.midi - pitchRange.minMidi) / (pitchRange.maxMidi - pitchRange.minMidi || 1)
            const y = 220 - ratio * 200
            return (
              <circle
                key={`${point.time}-${index}`}
                cx={x}
                cy={y}
                r={3}
                fill={point.isCorrect ? '#34d399' : '#f43f5e'}
              />
            )
          })}
        </svg>
      </Card>
    </main>
  )
}

export default App
