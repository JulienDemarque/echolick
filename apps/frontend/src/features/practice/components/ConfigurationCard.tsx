import { Card, CardTitle } from '../../../components/ui/card'
import {
  BLUES_FORM_OPTIONS,
  DEGREE_OPTIONS,
  type BluesFormId,
  type DegreeOptionId,
  type GeneratorLevelId,
  type NoteName,
} from '../musicGenerator'

type ConfigurationCardProps = {
  activeKeyRoot: NoteName
  onKeyChange: (note: NoteName) => void
  bluesFormId: BluesFormId
  onBluesFormChange: (id: BluesFormId) => void
  selectedBluesFormDescription: string
  generatorLevel: GeneratorLevelId
  onGeneratorLevelChange: (level: GeneratorLevelId) => void
  effectiveIncludeMajorNotes: boolean
  onIncludeMajorNotesChange: (checked: boolean) => void
  isMajorBlues: boolean
  allowBend: boolean
  onAllowBendChange: (checked: boolean) => void
  enabledDegrees: DegreeOptionId[]
  isMajorExtensionDegree: (degreeId: DegreeOptionId) => boolean
  onToggleDegree: (degreeId: DegreeOptionId) => void
  noteOrder: readonly NoteName[]
}

export function ConfigurationCard({
  activeKeyRoot,
  onKeyChange,
  bluesFormId,
  onBluesFormChange,
  selectedBluesFormDescription,
  generatorLevel,
  onGeneratorLevelChange,
  effectiveIncludeMajorNotes,
  onIncludeMajorNotesChange,
  isMajorBlues,
  allowBend,
  onAllowBendChange,
  enabledDegrees,
  isMajorExtensionDegree,
  onToggleDegree,
  noteOrder,
}: ConfigurationCardProps) {
  return (
    <Card className="flex h-full flex-col space-y-3">
      <CardTitle>Configuration</CardTitle>
      <p className="text-xs text-zinc-400">Blues form + note pool controls for local permutation generation.</p>
      <label className="flex flex-col gap-1 text-xs text-zinc-300">
        <span className="font-medium text-zinc-200">Key</span>
        <select
          value={activeKeyRoot}
          onChange={(event) => onKeyChange(event.target.value as NoteName)}
          className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
        >
          {noteOrder.map((note) => (
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
        <span className="text-[11px] text-zinc-400">{selectedBluesFormDescription}</span>
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
          onChange={(event) => onAllowBendChange(event.target.checked)}
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
                onClick={() => onToggleDegree(option.id)}
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
  )
}
