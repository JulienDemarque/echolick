import { Button } from '../../../components/ui/button'
import { Card, CardTitle } from '../../../components/ui/card'

type MetronomeCardProps = {
  micStatus: 'off' | 'ready' | 'capturing'
  activeBeat: number | null
  practicePhase: 'idle' | 'listen' | 'your-turn'
  onEnableMic: () => void
  onDisableMic: () => void
}

export function MetronomeCard({
  micStatus,
  activeBeat,
  practicePhase,
  onEnableMic,
  onDisableMic,
}: MetronomeCardProps) {
  return (
    <Card className="flex h-full flex-col space-y-3">
      <CardTitle>Metronome + Turn</CardTitle>
      <p className="text-xs text-zinc-400">
        First bar is listen/playback, second bar is your turn to sing or play the phrase. Click track runs through both bars.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onEnableMic} disabled={micStatus !== 'off'}>
          {micStatus === 'off' ? 'Enable Mic Capture' : 'Mic Ready'}
        </Button>
        <Button onClick={onDisableMic} disabled={micStatus === 'off'}>
          Disable Mic
        </Button>
        <span className="text-xs text-zinc-400">
          Mic status:{' '}
          <strong className="text-zinc-200">
            {micStatus === 'capturing' ? 'capturing bends' : micStatus === 'ready' ? 'ready' : 'off'}
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
          {practicePhase === 'listen' ? 'Listen' : practicePhase === 'your-turn' ? 'Your turn' : 'Idle'}
        </span>
      </div>
    </Card>
  )
}
