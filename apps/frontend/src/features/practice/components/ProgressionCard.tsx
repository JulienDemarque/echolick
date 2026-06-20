import { Button } from '../../../components/ui/button'
import { Card, CardTitle } from '../../../components/ui/card'
import type { FormBarResponse, GenerateLickResponse } from '../../../api/client'

type ProgressionCardProps = {
  activeKeyRoot: string
  selectedBluesFormLabel: string
  safeBarIndex: number
  barCount: number
  currentDegree: string
  currentChord: string
  activeBars: FormBarResponse[]
  lickByBar: Record<number, GenerateLickResponse>
  onSelectBar: (index: number) => void
  onStartStopAuto: () => void
  onHearNext: () => void
  isGenerating: boolean
  isAutoPracticeActive: boolean
  hasSelectedLick: boolean
  requestError: string
}

export function ProgressionCard({
  activeKeyRoot,
  selectedBluesFormLabel,
  safeBarIndex,
  barCount,
  currentDegree,
  currentChord,
  activeBars,
  lickByBar,
  onSelectBar,
  onStartStopAuto,
  onHearNext,
  isGenerating,
  isAutoPracticeActive,
  hasSelectedLick,
  requestError,
}: ProgressionCardProps) {
  return (
    <Card className="space-y-3">
      <CardTitle>Progression</CardTitle>
      <p className="text-sm text-zinc-300">
        Key <strong>{activeKeyRoot}</strong> - {selectedBluesFormLabel}
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
              onClick={() => onSelectBar(index)}
              className={`rounded-md border p-2 text-left text-xs transition ${
                isSelected
                  ? 'border-blue-400 bg-blue-500/10 text-blue-100'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Bar {index + 1}</span>
                <span className={`h-2 w-2 rounded-full ${hasLick ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              </div>
              <div className="mt-1 text-zinc-400">
                {bar.degree} - {bar.chord_symbol}
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onStartStopAuto} disabled={isGenerating}>
          {isAutoPracticeActive ? 'Stop' : 'Start'}
        </Button>
        <Button onClick={onHearNext} variant="primary" disabled={isGenerating}>
          Next
        </Button>
        <span className="self-center text-xs text-zinc-400">
          Tip: <kbd className="rounded border border-zinc-700 px-1 py-0.5 text-[10px]">Space</kbd> start/stop auto loop,{' '}
          <kbd className="rounded border border-zinc-700 px-1 py-0.5 text-[10px]">←</kbd>/
          <kbd className="rounded border border-zinc-700 px-1 py-0.5 text-[10px]">→</kbd> select bars.
        </span>
      </div>
      {!hasSelectedLick ? (
        <p className="text-xs text-zinc-500">No lick for this bar yet. Click Start to begin looping practice.</p>
      ) : null}
      {requestError ? <p className="text-sm text-red-400">{requestError}</p> : null}
    </Card>
  )
}
