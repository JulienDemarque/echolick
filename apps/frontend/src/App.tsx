import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type GenerateLickResponse } from './api/client'
import { playLickOverChord } from './audio/bluesPrototype'
import { ConfigurationCard } from './features/practice/components/ConfigurationCard'
import { MetronomeCard } from './features/practice/components/MetronomeCard'
import { ProgressionCard } from './features/practice/components/ProgressionCard'
import { SelectedLickCard } from './features/practice/components/SelectedLickCard'
import { TimelineCard } from './features/practice/components/TimelineCard'
import {
  BLUES_FORM_MAP,
  DEGREE_LEVEL_PRESETS,
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
  const generateForBarRef = useRef<(targetBar: number) => void>(() => {})
  const safeBarIndexRef = useRef<number>(0)
  const barCountRef = useRef<number>(0)

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

  useEffect(() => {
    safeBarIndexRef.current = safeBarIndex
  }, [safeBarIndex])

  useEffect(() => {
    barCountRef.current = barCount
  }, [barCount])

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

  const generateForBar = useCallback(
    (targetBar: number) => {
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
      startPracticeCycleRef.current(generated.tempo)
      void playLickOverChord({
        tempo: generated.tempo,
        chordMidi: resolveChordMidi(generated.chord),
        notes: normalizeLickNotes(generated.notes),
      }).catch((e) => {
        setAudioError(e instanceof Error ? e.message : 'Failed to play generated lick')
      })
    },
    [
      activeBars,
      activeKeyRoot,
      allowBend,
      bluesFormId,
      effectiveIncludeMajorNotes,
      enabledDegrees,
      generatorLevel,
    ],
  )

  const goToNextBarAndGenerate = () => {
    const nextIndex = (safeBarIndex + 1) % Math.max(barCount, 1)
    setBarIndex(nextIndex)
    generateForBar(nextIndex)
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

  const playSelectedBar = () => {
    if (selectedLick) {
      replaySelectedBar()
      return
    }
    generateForBar(safeBarIndex)
  }

  useEffect(() => {
    generateForBarRef.current = generateForBar
  }, [generateForBar])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable) {
        return
      }

      if (event.code === 'Space') {
        if (isGeneratingRef.current) return
        event.preventDefault()
        const lick = selectedLickRef.current
        if (lick) {
          setAudioError('')
          startPracticeCycleRef.current(lick.tempo)
          void playLickOverChord({
            tempo: lick.tempo,
            chordMidi: resolveChordMidi(lick.chord),
            notes: normalizeLickNotes(lick.notes),
          }).catch((e) => {
            setAudioError(e instanceof Error ? e.message : 'Failed to replay selected bar lick')
          })
          return
        }
        generateForBarRef.current(safeBarIndexRef.current)
        return
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault()
        const nextIndex = (safeBarIndexRef.current + 1) % Math.max(barCountRef.current, 1)
        setBarIndex(nextIndex)
        return
      }

      if (event.code === 'ArrowLeft') {
        event.preventDefault()
        const prevIndex =
          (safeBarIndexRef.current - 1 + Math.max(barCountRef.current, 1)) % Math.max(barCountRef.current, 1)
        setBarIndex(prevIndex)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [setBarIndex])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">EchoLick Blues POC</h1>
        <p className="text-sm text-zinc-400">
          Select a bar, pick training degrees, and hear a locally generated permutation lick.
        </p>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[1.8fr_1fr]">
        <div className="flex h-full flex-col gap-4">
          <ProgressionCard
            activeKeyRoot={activeKeyRoot}
            selectedBluesFormLabel={selectedBluesForm.label}
            safeBarIndex={safeBarIndex}
            barCount={barCount}
            currentDegree={currentDegree}
            currentChord={currentChord}
            activeBars={activeBars}
            lickByBar={lickByBar}
            onSelectBar={setBarIndex}
            onPlay={playSelectedBar}
            onHearNext={goToNextBarAndGenerate}
            isGenerating={isGenerating}
            hasSelectedLick={Boolean(selectedLick)}
            requestError={requestError}
          />

          <div className="flex-1">
            <MetronomeCard
              micStatus={micStatus}
              activeBeat={activeBeat}
              practicePhase={practicePhase}
              onEnableMic={() => void enableMicrophone()}
              onDisableMic={() => void stopAndDisposeMicrophone()}
            />
          </div>
        </div>

        <div className="h-full">
          <ConfigurationCard
            activeKeyRoot={activeKeyRoot}
            onKeyChange={(nextKey) => {
              setActiveKeyRoot(nextKey)
              setGeneratedLickByBar({})
              setBarIndex(0)
            }}
            bluesFormId={bluesFormId}
            onBluesFormChange={onBluesFormChange}
            selectedBluesFormDescription={selectedBluesForm.description}
            generatorLevel={generatorLevel}
            onGeneratorLevelChange={onGeneratorLevelChange}
            effectiveIncludeMajorNotes={effectiveIncludeMajorNotes}
            onIncludeMajorNotesChange={onIncludeMajorNotesChange}
            isMajorBlues={isMajorBlues}
            allowBend={allowBend}
            onAllowBendChange={setAllowBend}
            enabledDegrees={enabledDegrees}
            isMajorExtensionDegree={isMajorExtensionDegree}
            onToggleDegree={toggleDegree}
            noteOrder={NOTE_ORDER}
          />
        </div>
      </div>
      <TimelineCard
        score={score}
        noteMatches={noteMatches}
        targetPitchSegments={targetPitchSegments}
        userPitchFeedbackPoints={userPitchFeedbackPoints}
        pitchRange={pitchRange}
      />

      <SelectedLickCard selectedLick={selectedLick} />
    </main>
  )
}

export default App
