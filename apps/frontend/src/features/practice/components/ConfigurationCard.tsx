import { Card, CardTitle } from '../../../components/ui/card'
import { FretboardMap } from './FretboardMap'
import {
  BLUES_FORM_OPTIONS,
  CAGED_POSITION_OPTIONS,
  GENERATOR_LEVEL_OPTIONS,
  type BluesFormId,
  type CagedPositionId,
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
  selectedLevelDescription: string
  cagedPositionId: CagedPositionId
  onCagedPositionChange: (value: CagedPositionId) => void
  selectedFretboardMidis: number[]
  onToggleFretboardMidi: (midi: number) => void
  allowedDegrees: DegreeOptionId[]
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
  selectedLevelDescription,
  cagedPositionId,
  onCagedPositionChange,
  selectedFretboardMidis,
  onToggleFretboardMidi,
  allowedDegrees,
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
          {GENERATOR_LEVEL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-zinc-400">{selectedLevelDescription}</span>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-300">
        <span className="font-medium text-zinc-200">Fretboard Position (CAGED)</span>
        <select
          value={cagedPositionId}
          onChange={(event) => onCagedPositionChange(event.target.value as CagedPositionId)}
          className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
        >
          {CAGED_POSITION_OPTIONS.map((position) => (
            <option key={position.id} value={position.id}>
              {position.label}
            </option>
          ))}
        </select>
      </label>
      <FretboardMap
        activeKeyRoot={activeKeyRoot}
        noteOrder={noteOrder}
        cagedPositionId={cagedPositionId}
        selectedMidis={selectedFretboardMidis}
        onToggleMidi={onToggleFretboardMidi}
        allowedDegrees={allowedDegrees}
      />
    </Card>
  )
}
