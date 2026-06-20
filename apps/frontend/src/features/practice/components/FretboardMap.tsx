import { Fragment } from "react";
import {
  DEGREE_OPTIONS,
  type DegreeOptionId,
  type NoteName,
} from "../musicGenerator";

type FretboardMapProps = {
  activeKeyRoot: NoteName;
  enabledDegrees: DegreeOptionId[];
  noteOrder: readonly NoteName[];
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
  enabledDegrees,
  noteOrder,
}: FretboardMapProps) {
  const rootPitchClass = noteOrder.indexOf(activeKeyRoot);
  const enabledSet = new Set(enabledDegrees);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-200">Fretboard (preview)</p>
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
            .map((openString) => {
              const openPitchClass = noteOrder.indexOf(openString);
              return (
                <Fragment key={openString}>
                  <div
                    key={`label-${openString}`}
                    className="flex items-center text-[10px] font-semibold text-zinc-400"
                  >
                    {openString}
                  </div>
                  {Array.from({ length: FRET_COUNT }, (_, fret) => {
                    const pitchClass = (openPitchClass + fret) % 12;
                    const semitone = pitchClassDistance(
                      rootPitchClass,
                      pitchClass,
                    );
                    const degreeId = semitoneToDegreeMap.get(semitone);
                    const isEnabled = degreeId
                      ? enabledSet.has(degreeId)
                      : false;
                    const isRoot = degreeId === "1";
                    const markerVisible = FRET_MARKERS.has(fret) && !isEnabled;
                    const label = degreeId
                      ? (degreeLabelMap.get(degreeId) ?? degreeId)
                      : "";
                    return (
                      <div
                        key={`${openString}-${fret}`}
                        className={`relative flex h-7 items-center justify-center rounded border text-[10px] ${
                          isEnabled
                            ? isRoot
                              ? "border-amber-300 bg-amber-400/25 text-amber-100"
                              : "border-sky-400 bg-sky-500/20 text-sky-100"
                            : "border-zinc-800 bg-zinc-900/80 text-zinc-600"
                        }`}
                        title={`${openString} string, fret ${fret}${label ? `: ${label}` : ""}`}
                      >
                        {isEnabled ? label : null}
                        {markerVisible ? (
                          <span className="absolute h-1.5 w-1.5 rounded-full bg-zinc-600" />
                        ) : null}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
        </div>
      </div>
      <p className="text-[11px] text-zinc-500">
        Enabled notes are highlighted from the current key. Root tones are
        amber; other enabled tones are blue.
      </p>
    </div>
  );
}
