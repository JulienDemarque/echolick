import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchHealth, postGenerateLick } from './api/client'
import { HARDCODED_A_MINOR_LICK, playStaticPrototype } from './audio/bluesPrototype'
import { Button } from './components/ui/button'
import { Card, CardTitle } from './components/ui/card'
import { CHORDS_BY_DEGREE, getCurrentDegree } from './music/progression'
import { useAppStore } from './store/useAppStore'

function App() {
  const barIndex = useAppStore((state) => state.barIndex)
  const nextBar = useAppStore((state) => state.nextBar)
  const resetProgression = useAppStore((state) => state.resetProgression)

  const [loadingAudio, setLoadingAudio] = useState(false)
  const [audioError, setAudioError] = useState<string>('')

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    [],
  )
  const currentDegree = getCurrentDegree(barIndex)
  const currentChord = CHORDS_BY_DEGREE[currentDegree]

  const healthQuery = useQuery({
    queryKey: ['health', apiBaseUrl],
    queryFn: () => fetchHealth(apiBaseUrl),
    enabled: false,
    retry: false,
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      postGenerateLick(apiBaseUrl, {
        key: 'A',
        degree: currentDegree,
        chord: currentChord,
        flavor: 'minor',
        tempo: 76,
      }),
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

  const health = healthQuery.data?.status ?? 'unknown'
  const requestError =
    (healthQuery.error as Error | null)?.message ??
    (generateMutation.error as Error | null)?.message ??
    audioError

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">EchoLick Blues POC</h1>
        <p className="text-sm text-zinc-400">Frontend: React + Vite | Backend: FastAPI</p>
      </div>

      <Card className="space-y-3">
        <CardTitle>Phase 2 - Progression State</CardTitle>
        <p className="text-sm text-zinc-300">12-bar form: I IV I I IV IV I I V IV I V</p>
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
          <Button onClick={nextBar}>Next Bar</Button>
          <Button onClick={resetProgression}>Reset Progression</Button>
        </div>
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
        <CardTitle>Backend Connectivity</CardTitle>
        <p className="text-sm text-zinc-300">API base URL: {apiBaseUrl}</p>
        <p className="text-sm text-zinc-300">Health: {health}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              void healthQuery.refetch()
            }}
            disabled={healthQuery.isFetching}
          >
            {healthQuery.isFetching ? 'Checking...' : 'Check Health'}
          </Button>
          <Button
            onClick={() => {
              generateMutation.reset()
              generateMutation.mutate()
            }}
            disabled={generateMutation.isPending}
            variant="primary"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Lick'}
          </Button>
        </div>
        {requestError ? <p className="text-sm text-red-400">{requestError}</p> : null}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Latest Lick JSON</CardTitle>
        <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200">
          {generateMutation.data
            ? JSON.stringify(generateMutation.data, null, 2)
            : 'No lick generated yet.'}
        </pre>
      </Card>
    </main>
  )
}

export default App
