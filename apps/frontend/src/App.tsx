import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  postGenerateLick,
  type GenerateLickRequest,
  type GenerateLickResponse,
} from './api/client'
import {
  HARDCODED_A_MINOR_LICK,
  playLickOverChord,
  playStaticPrototype,
} from './audio/bluesPrototype'
import { Button } from './components/ui/button'
import { Card, CardTitle } from './components/ui/card'
import {
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

function App() {
  const barIndex = useAppStore((state) => state.barIndex)
  const setBarIndex = useAppStore((state) => state.setBarIndex)

  const [loadingAudio, setLoadingAudio] = useState(false)
  const [audioError, setAudioError] = useState<string>('')
  const [lastGeneratedLick, setLastGeneratedLick] = useState<GenerateLickResponse | null>(null)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const currentDegree = getCurrentDegree(barIndex)
  const currentChord = CHORDS_BY_DEGREE[currentDegree]

  const generateMutation = useMutation({
    mutationFn: (payload: GenerateLickRequest) => postGenerateLick(apiBaseUrl, payload),
    onSuccess: (data) => {
      setLastGeneratedLick(data)
      void playLickOverChord({
        tempo: data.tempo,
        chordMidi: CHORD_MIDI_BY_DEGREE[data.degree],
        notes: normalizeLickNotes(data.notes),
      }).catch((e) => {
        setAudioError(e instanceof Error ? e.message : 'Failed to play generated lick')
      })
    },
  })

  const playPhaseOneDemo = async () => {
    setAudioError('')
    setLoadingAudio(true)
    try {
      await playStaticPrototype(76)
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : 'Failed to play demo audio')
    } finally {
      setLoadingAudio(false)
    }
  }

  const requestError = (generateMutation.error as Error | null)?.message ?? audioError

  const goToNextBarAndGenerate = () => {
    const nextIndex = advanceBar(barIndex)
    const nextDegree = getCurrentDegree(nextIndex)
    const nextChord = CHORDS_BY_DEGREE[nextDegree]

    setAudioError('')
    setBarIndex(nextIndex)
    generateMutation.reset()
    generateMutation.mutate({
      key: 'A',
      degree: nextDegree,
      chord: nextChord,
      flavor: 'minor',
      tempo: 76,
    })
  }

  const replayLastLick = () => {
    if (!lastGeneratedLick) return
    setAudioError('')
    void playLickOverChord({
      tempo: lastGeneratedLick.tempo,
      chordMidi: CHORD_MIDI_BY_DEGREE[lastGeneratedLick.degree],
      notes: normalizeLickNotes(lastGeneratedLick.notes),
    }).catch((e) => {
      setAudioError(e instanceof Error ? e.message : 'Failed to replay last lick')
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">EchoLick Blues POC</h1>
        <p className="text-sm text-zinc-400">Next Bar generates lick. Replay replays last lick.</p>
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
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={goToNextBarAndGenerate}
            variant="primary"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generating...' : 'Next Bar + Generate'}
          </Button>
          <Button onClick={replayLastLick} disabled={!lastGeneratedLick || generateMutation.isPending}>
            Replay
          </Button>
        </div>
        {!lastGeneratedLick ? (
          <p className="text-xs text-zinc-500">No lick yet. Click Next Bar + Generate.</p>
        ) : null}
        {requestError ? <p className="text-sm text-red-400">{requestError}</p> : null}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Phase 1 - Static Audio Prototype</CardTitle>
        <p className="text-sm text-zinc-300">
          Plays separated rhythm and lead chains. Lead now has compressor, overdrive, delay,
          spring-style reverb, plus bend and vibrato phrasing.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={playPhaseOneDemo} disabled={loadingAudio} variant="primary">
            {loadingAudio ? 'Playing...' : 'Play Static Prototype'}
          </Button>
        </div>
        <p className="text-sm font-mono text-zinc-400">
          Notes: {HARDCODED_A_MINOR_LICK.map((note) => note.noteName).join(' ')}
        </p>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Last Generated Lick</CardTitle>
        <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200">
          {lastGeneratedLick ? JSON.stringify(lastGeneratedLick, null, 2) : 'No lick generated yet.'}
        </pre>
      </Card>
    </main>
  )
}

export default App
