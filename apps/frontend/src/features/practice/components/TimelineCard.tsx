import { Card, CardTitle } from '../../../components/ui/card'
import type { PitchPoint } from '../pitchUtils'

type TimelineCardProps = {
  score: { total: number; matched: number; percentage: number }
  noteMatches: boolean[]
  targetPitchSegments: Array<PitchPoint[]>
  userPitchFeedbackPoints: Array<PitchPoint & { isCorrect: boolean }>
  pitchRange: { minMidi: number; maxMidi: number }
}

export function TimelineCard({
  score,
  noteMatches,
  targetPitchSegments,
  userPitchFeedbackPoints,
  pitchRange,
}: TimelineCardProps) {
  return (
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
        <span className="ml-2 text-xs text-zinc-400">(forgiving mode: one close capture per note is enough)</span>
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
          <line key={beat} x1={beat * 250} y1={0} x2={beat * 250} y2={240} stroke="#27272a" strokeWidth={1} />
        ))}

        {targetPitchSegments.map((segment, segmentIndex) => {
          const points = segment
            .map((point) => {
              const x = (point.time / 4) * 1000
              const ratio = (point.midi - pitchRange.minMidi) / (pitchRange.maxMidi - pitchRange.minMidi || 1)
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
          return <circle key={`${point.time}-${index}`} cx={x} cy={y} r={3} fill={point.isCorrect ? '#34d399' : '#f43f5e'} />
        })}
      </svg>
    </Card>
  )
}
