import { useEffect, useMemo, useRef, useState } from 'react'
import { type GenerateLickResponse } from './api/client'
import { playLickOverChord } from './audio/bluesPrototype'
import { Button } from './components/ui/button'
import { Card, CardTitle } from './components/ui/card'
import {
  BLUES_FORM_MAP,
  BLUES_FORM_OPTIONS,
  DEGREE_LEVEL_PRESETS,
  DEGREE_OPTIONS,
  NOTE_ORDER,
  buildBarContextFromForm,
  buildRecommendedDegreePool,
  createPermutationLick,
  isMajorExtensionDegree,
  normalizeLickNotes,
  resolveChordMidi,
  resolvePracticeDegreeFromLabel,
  type BluesFormId,
  type DegreeOptionId,
  type GeneratorLevelId,
  type NoteName,
} from './features/practice/musicGenerator'
import {
  MAX_CAPTURE_BEATS,
  SCORE_PITCH_TOLERANCE_SEMITONES,
  SCORE_TIME_TOLERANCE_BEATS,
  buildTargetPitchSegments,
  detectPitchHz,
  frequencyToMidi,
  getClosestContourMidi,
  type PitchPoint,
} from './features/practice/pitchUtils'
import { useAppStore } from './store/useAppStore'

type PracticePhase = 'idle' | 'listen' | 'your-turn'

const PLAYBACK_START_DELAY_MS = 60

type MicStatus = 'off' | 'ready' | 'capturing'
type UserPitchFeedbackPoint = PitchPoint & {
  isCorrect: boolean
}

function App() {
  const barIndex = useAppStore((state) => state.barIndex)
  const setBarIndex = useAppStore((state) => state.setBarIndex)

  const [audioError, setAudioError] = useState<string>('')
  const [generatedLickByBar, setGeneratedLickByBar] = useState<Record<number, GenerateLickResponse>>({})
  const [activeKeyRoot, setActiveKeyRoot] = useState<NoteName>('E')
  const [activeBeat, setActiveBeat] = useState<number | null>(null)
  const [practicePhase, setPracticePhase] = useState<PracticePhase>('idle')
  const [bluesFormId, setBluesFormId] = useState<BluesFormId>('all-dominant')
  const [generatorLevel, setGeneratorLevel] = useState<GeneratorLevelId>('level-1')
  const [enabledDegrees, setEnabledDegrees] = useState<DegreeOptionId[]>(DEGREE_LEVEL_PRESETS['level-1'])
  const [includeMajorNotes, setIncludeMajorNotes] = useState<boolean>(true)
  const [allowBend, setAllowBend] = useState<boolean>(false)
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
  const selectedLickRef = useRef<GenerateLickResponse | null>(null)
  const isGeneratingRef = useRef<boolean>(false)
  const startPracticeCycleRef = useRef<(tempo: number) => void>(() => {})

  const selectedBluesForm = BLUES_FORM_MAP[bluesFormId]
  const isMajorBlues = selectedBluesForm.isMajorBlues
  const activeBars = selectedBluesForm.bars.map((_, index) =>
    buildBarContextFromForm(index, activeKeyRoot, bluesFormId),
  )
  const barCount = activeBars.length
  const safeBarIndex = Math.min(barIndex, Math.max(0, barCount - 1))
  const currentBarContext = activeBars[safeBarIndex] ?? buildBarContextFromForm(0, activeKeyRoot, bluesFormId)
  const currentDegree = currentBarContext.degree
  const currentChord = currentBarContext.chord_symbol
  const lickByBar = generatedLickByBar
  const selectedLick = lickByBar[safeBarIndex] ?? null
  const selectedLickNotes = useMemo(
    () => (selectedLick ? normalizeLickNotes(selectedLick.notes) : []),
    [selectedLick],
  )
  const targetPitchSegments = useMemo(
    () => buildTargetPitchSegments(selectedLickNotes, selectedLick?.tempo ?? 76),
    [selectedLick?.tempo, selectedLickNotes],
  )

  useEffect(() => {
    if (barIndex !== safeBarIndex) {
      setBarIndex(safeBarIndex)
    }
  }, [barIndex, safeBarIndex, setBarIndex])

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
  useEffect(() => {
    startPracticeCycleRef.current = startPracticeCycle
  })

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

  const requestError = micError || audioError
  const isGenerating = false

  useEffect(() => {
    selectedLickRef.current = selectedLick
  }, [selectedLick])

  useEffect(() => {
    isGeneratingRef.current = isGenerating
  }, [isGenerating])

  const effectiveIncludeMajorNotes = isMajorBlues && includeMajorNotes

  const onBluesFormChange = (nextFormId: BluesFormId) => {
    const nextForm = BLUES_FORM_MAP[nextFormId]
    setBluesFormId(nextFormId)
    setIncludeMajorNotes(nextForm.isMajorBlues)
    setEnabledDegrees(buildRecommendedDegreePool(generatorLevel, nextForm.isMajorBlues, nextForm.isMajorBlues))
    setAllowBend(false)
    setGeneratedLickByBar({})
    setBarIndex(0)
  }

  const onGeneratorLevelChange = (level: GeneratorLevelId) => {
    setGeneratorLevel(level)
    setEnabledDegrees(buildRecommendedDegreePool(level, isMajorBlues, effectiveIncludeMajorNotes))
    if (level === 'level-1') {
      setAllowBend(false)
    }
  }

  const onIncludeMajorNotesChange = (checked: boolean) => {
    if (!isMajorBlues) return
    setIncludeMajorNotes(checked)
    setEnabledDegrees(buildRecommendedDegreePool(generatorLevel, true, checked))
  }

  const toggleDegree = (degreeId: DegreeOptionId) => {
    if (!isMajorBlues && isMajorExtensionDegree(degreeId)) {
      return
    }
    setEnabledDegrees((prev) => {
      const isEnabled = prev.includes(degreeId)
      if (isEnabled) {
        if (prev.length === 1) return prev
        return prev.filter((degree) => degree !== degreeId)
      }
      return [...prev, degreeId]
    })
  }

  const generateForBar = (targetBar: number) => {
    const context = activeBars[targetBar] ?? buildBarContextFromForm(targetBar, activeKeyRoot, bluesFormId)
    const degree = resolvePracticeDegreeFromLabel(context.degree)
    const chord = context.chord_symbol

    setAudioError('')
    const generated = createPermutationLick({
      keyRoot: activeKeyRoot,
      chordSymbol: chord,
      degree,
      flavor: effectiveIncludeMajorNotes ? 'major' : 'minor',
      tempo: 76,
      level: generatorLevel,
      enabledDegrees,
      includeBend: allowBend && enabledDegrees.includes('b3'),
    })
    setGeneratedLickByBar((prev) => ({ ...prev, [targetBar]: generated }))
    startPracticeCycle(generated.tempo)
    void playLickOverChord({
      tempo: generated.tempo,
      chordMidi: resolveChordMidi(generated.chord),
      notes: normalizeLickNotes(generated.notes),
    }).catch((e) => {
      setAudioError(e instanceof Error ? e.message : 'Failed to play generated lick')
    })
  }

  const goToNextBarAndGenerate = () => {
    const nextIndex = (safeBarIndex + 1) % Math.max(barCount, 1)
    setBarIndex(nextIndex)
    generateForBar(nextIndex)
  }

  const generateSelectedBar = () => {
    generateForBar(safeBarIndex)
  }

  const replaySelectedBar = () => {
    if (!selectedLick) return
    setAudioError('')
    startPracticeCycle(selectedLick.tempo)
    void playLickOverChord({
      tempo: selectedLick.tempo,
      chordMidi: resolveChordMidi(selectedLick.chord),
      notes: normalizeLickNotes(selectedLick.notes),
    }).catch((e) => {
      setAudioError(e instanceof Error ? e.message : 'Failed to replay selected bar lick')
    })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable) {
        return
      }
      const lick = selectedLickRef.current
      if (!lick || isGeneratingRef.current) return
      event.preventDefault()
      setAudioError('')
      startPracticeCycleRef.current(lick.tempo)
      void playLickOverChord({
        tempo: lick.tempo,
        chordMidi: resolveChordMidi(lick.chord),
        notes: normalizeLickNotes(lick.notes),
      }).catch((e) => {
        setAudioError(e instanceof Error ? e.message : 'Failed to replay selected bar lick')
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">EchoLick Blues POC</h1>
        <p className="text-sm text-zinc-400">
          Select a bar, pick training degrees, and hear a locally generated permutation lick.
        </p>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-4">
          <Card className="space-y-3">
            <CardTitle>Progression</CardTitle>
            <p className="text-sm text-zinc-300">
              Key <strong>{activeKeyRoot}</strong> - {selectedBluesForm.label}
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm text-zinc-200 sm:grid-cols-3">
              <p>
                Current bar: <strong>{safeBarIndex + 1}</strong> / {barCount}
              </p>
              <p>
                Current degree: <strong>{currentDegree}</strong>
              </p>
              <p>
                Current chord: <strong>{currentChord}</strong>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {activeBars.map((bar) => {
                const index = bar.bar_index
                const isSelected = index === safeBarIndex
                const hasLick = Boolean(lickByBar[index])
                return (
                  <button
                    key={`${index}-${bar.id}`}
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
                      {bar.degree} - {bar.chord_symbol}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={goToNextBarAndGenerate} variant="primary" disabled={isGenerating}>
                Hear Next
              </Button>
              <Button onClick={generateSelectedBar} disabled={isGenerating}>
                Hear Selected Bar
              </Button>
              <Button onClick={replaySelectedBar} disabled={!selectedLick || isGenerating}>
                Hear Again
              </Button>
              <span className="self-center text-xs text-zinc-400">
                Tip: press <kbd className="rounded border border-zinc-700 px-1 py-0.5 text-[10px]">Space</kbd> to replay.
              </span>
            </div>
            {!selectedLick ? (
              <p className="text-xs text-zinc-500">No lick for this bar yet. Click Hear Selected Bar.</p>
            ) : null}
            {requestError ? <p className="text-sm text-red-400">{requestError}</p> : null}
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
        </div>

        <div className="h-full">
          <Card className="flex h-full flex-col space-y-3">
            <CardTitle>Configuration</CardTitle>
            <p className="text-xs text-zinc-400">Blues form + note pool controls for local permutation generation.</p>
            <label className="flex flex-col gap-1 text-xs text-zinc-300">
              <span className="font-medium text-zinc-200">Key</span>
              <select
                value={activeKeyRoot}
                onChange={(event) => {
                  setActiveKeyRoot(event.target.value as NoteName)
                  setGeneratedLickByBar({})
                  setBarIndex(0)
                }}
                className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              >
                {NOTE_ORDER.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-300">
              <span className="font-medium text-zinc-200">Blues Form</span>
              <select
                value={bluesFormId}
                onChange={(event) => onBluesFormChange(event.target.value as BluesFormId)}
                className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              >
                {BLUES_FORM_OPTIONS.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-zinc-400">{selectedBluesForm.description}</span>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-300">
              <span className="font-medium text-zinc-200">Level</span>
              <select
                value={generatorLevel}
                onChange={(event) => onGeneratorLevelChange(event.target.value as GeneratorLevelId)}
                className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              >
                <option value="level-1">Level 1: root-minor3-fifth</option>
                <option value="level-2">Level 2: add 4 and b7</option>
                <option value="level-3">Level 3: add b5 and 2-beat rhythm values</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={effectiveIncludeMajorNotes}
                onChange={(event) => onIncludeMajorNotesChange(event.target.checked)}
                disabled={!isMajorBlues}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
              />
              Add major-blues notes (2, 3, 6)
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={allowBend}
                onChange={(event) => setAllowBend(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
              />
              Include quarter bend on b3 (max one per bar)
            </label>
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-200">Degree Pool (relative to song key)</p>
              <div className="grid grid-cols-2 gap-2">
                {DEGREE_OPTIONS.map((option) => {
                  const isEnabled = enabledDegrees.includes(option.id)
                  const isBlocked = !isMajorBlues && isMajorExtensionDegree(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleDegree(option.id)}
                      disabled={isBlocked}
                      className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                        isEnabled
                          ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                      } ${isBlocked ? 'cursor-not-allowed opacity-45' : ''}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

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

      <Card className="space-y-3">
        <CardTitle>Selected Bar Lick</CardTitle>
        <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200">
          {selectedLick ? JSON.stringify(selectedLick, null, 2) : 'No lick generated for this bar yet.'}
        </pre>
      </Card>
    </main>
  )
}

export default App
