import { Fragment } from "react";
import {
  buildCagedPositionNotes,
  DEGREE_OPTIONS,
  isDegreeAllowedForLevel,
  type CagedPositionId,
  type DegreeOptionId,
  type NoteName,
} from "../musicGenerator";

type FretboardMapProps = {
  activeKeyRoot: NoteName;
  noteOrder: readonly NoteName[];
  cagedPositionId: CagedPositionId;
  selectedMidis: number[];
  onToggleMidi: (midi: number) => void;
  allowedDegrees: DegreeOptionId[];
  showChordTones: boolean;
  chordTonePitchClasses: Set<number>;
  showPlayingLick: boolean;
  playingLickMidis: number[];
};

const STRINGS_LOW_TO_HIGH: NoteName[] = ["E", "A", "D", "G", "B", "E"];
const FRET_COUNT = 13;
const FRET_MARKERS = new Set([3, 5, 7, 9, 12]);

const semitoneToDegreeMap = new Map<number, DegreeOptionId>(
  DEGREE_OPTIONS.map((option) => [
    ((option.semitones % 12) + 12) % 12,
    option.id,
  ]),
);
const degreeLabelMap = new Map<DegreeOptionId, string>(
  DEGREE_OPTIONS.map((option) => [
    option.id,
    option.label.split(" ")[0] ?? option.id,
  ]),
);

const pitchClassDistance = (from: number, to: number): number =>
  (((to - from) % 12) + 12) % 12;

export function FretboardMap({
  activeKeyRoot,
  noteOrder,
  cagedPositionId,
  selectedMidis,
  onToggleMidi,
  allowedDegrees,
  showChordTones,
  chordTonePitchClasses,
  showPlayingLick,
  playingLickMidis,
}: FretboardMapProps) {
  const rootPitchClass = noteOrder.indexOf(activeKeyRoot);
  const selectedSet = new Set(selectedMidis.map((midi) => Math.round(midi)));
  const playingSet = new Set(playingLickMidis.map((midi) => Math.round(midi)));
  const cagedNotes = buildCagedPositionNotes(activeKeyRoot, cagedPositionId);
  const cagedNoteByPosition = new Map<
    string,
    { midi: number; degreeId: (typeof cagedNotes)[number]["degreeId"] }
  >(
    cagedNotes.map((note) => [
      `${note.stringIndexFromLowE}-${note.fret}`,
      { midi: note.midi, degreeId: note.degreeId },
    ]),
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-200">Fretboard (selected CAGED position)</p>
      <div className="overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
        <div className="grid min-w-[640px] grid-cols-[56px_repeat(13,minmax(0,1fr))] gap-1">
          <div />
          {Array.from({ length: FRET_COUNT }, (_, fret) => (
            <div
              key={`fret-${fret}`}
              className="text-center text-[10px] text-zinc-500"
            >
              {fret}
            </div>
          ))}
          {STRINGS_LOW_TO_HIGH.slice()
            .reverse()
            .map((openString, reverseIndex) => {
              const openPitchClass = noteOrder.indexOf(openString);
              const stringIndexFromLowE = STRINGS_LOW_TO_HIGH.length - 1 - reverseIndex;
              const stringLabel =
                stringIndexFromLowE === 0
                  ? "E6"
                  : stringIndexFromLowE === STRINGS_LOW_TO_HIGH.length - 1
                    ? "E1"
                    : openString;
              return (
                <Fragment key={`${openString}-${reverseIndex}`}>
                  <div
                    key={`label-${openString}-${reverseIndex}`}
                    className="flex items-center text-[10px] font-semibold text-zinc-400"
                  >
                    {stringLabel}
                  </div>
                  {Array.from({ length: FRET_COUNT }, (_, fret) => {
                    const pitchClass = (openPitchClass + fret) % 12;
                    const semitone = pitchClassDistance(
                      rootPitchClass,
                      pitchClass,
                    );
                    const degreeId = semitoneToDegreeMap.get(semitone);
                    const cagedData =
                      cagedNoteByPosition.get(`${stringIndexFromLowE}-${fret}`) ?? null;
                    const isInCagedPosition = cagedData !== null;
                    const effectiveDegree = cagedData?.degreeId ?? degreeId ?? null;
                    const isBlockedByLevel =
                      isInCagedPosition &&
                      !isDegreeAllowedForLevel(effectiveDegree, allowedDegrees);
                    const isSelected = cagedData
                      ? selectedSet.has(Math.round(cagedData.midi))
                      : false;
                    const roundedMidi = cagedData ? Math.round(cagedData.midi) : null;
                    const isPlaying = showPlayingLick && roundedMidi !== null && playingSet.has(roundedMidi);
                    const isChordTone =
                      showChordTones &&
                      cagedData !== null &&
                      chordTonePitchClasses.has(((Math.round(cagedData.midi) % 12) + 12) % 12);
                    const isRoot = effectiveDegree === "1";
                    const markerVisible = FRET_MARKERS.has(fret) && !isInCagedPosition;
                    const label = effectiveDegree
                      ? (degreeLabelMap.get(effectiveDegree) ?? effectiveDegree)
                      : "";
                    return (
                      <button
                        key={`${openString}-${fret}`}
                        type="button"
                        onClick={() => {
                          if (cagedData && !isBlockedByLevel) {
                            onToggleMidi(cagedData.midi);
                          }
                        }}
                        disabled={!cagedData || isBlockedByLevel}
                        className={`relative flex h-7 items-center justify-center rounded border text-[10px] ${
                          isBlockedByLevel && isInCagedPosition
                            ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                          :
                          isPlaying && isInCagedPosition
                            ? "border-emerald-300 bg-emerald-500/30 text-emerald-50"
                          : isSelected && isInCagedPosition
                            ? isRoot
                              ? "border-amber-300 bg-amber-400/25 text-amber-100"
                              : "border-sky-400 bg-sky-500/20 text-sky-100"
                            : isChordTone && isInCagedPosition
                              ? "border-amber-400 bg-amber-500/20 text-amber-100"
                            : isInCagedPosition
                              ? "border-violet-500/80 bg-violet-500/15 text-violet-100"
                            : "border-zinc-800 bg-zinc-900/80 text-zinc-600"
                        } ${cagedData && !isBlockedByLevel ? "cursor-pointer" : "cursor-default"}`}
                        title={`${stringLabel} string, fret ${fret}${label ? `: ${label}` : ""}${isInCagedPosition ? " (in selected box)" : ""}`}
                      >
                        {isInCagedPosition ? label : null}
                        {markerVisible ? (
                          <span className="absolute h-1.5 w-1.5 rounded-full bg-zinc-600" />
                        ) : null}
                      </button>
                    );
                  })}
                </Fragment>
              );
            })}
        </div>
      </div>
      <p className="text-[11px] text-zinc-500">
        Purple notes are inside the selected CAGED position. Click notes to
        select the allowed generation pool (blue/amber). Gray notes are locked
        by the current learning level. Orange notes are chord tones. Green notes
        are active during lick playback.
      </p>
    </div>
  );
}
