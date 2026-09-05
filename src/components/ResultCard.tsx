import type { AnyHit } from "../types";
import { formatTimestamp } from "../lib/search";

interface ResultCardProps {
  hit: AnyHit;
  active: boolean;
  onPlay: (hit: AnyHit) => void;
}

export function ResultCard({ hit, active, onPlay }: ResultCardProps) {
  const { song, matchStart, matchEnd } = hit;
  const lineText = hit.kind === "timed" ? hit.line.text : hit.lineText;

  return (
    <li>
      <button
        type="button"
        onClick={() => onPlay(hit)}
        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
          active ? "border-amber/70 bg-amber/10" : "border-cream/10 bg-shell-light/40 hover:border-cream/25"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-medium text-cream">{song.title}</span>
          {hit.kind === "timed" ? (
            <span className="shrink-0 font-mono text-sm text-amber">{formatTimestamp(hit.wordTimestamp)}</span>
          ) : (
            <span className="shrink-0 text-[10px] uppercase tracking-wide text-cream/35">not timed yet</span>
          )}
        </div>
        <p className="mt-1 text-sm leading-snug text-cream/70">
          {lineText.slice(0, matchStart)}
          <mark className="rounded bg-red/30 px-0.5 text-cream">{lineText.slice(matchStart, matchEnd)}</mark>
          {lineText.slice(matchEnd)}
        </p>
        {song.album && (
          <p className="mt-1 text-xs text-cream/40">
            {song.album}
            {song.year ? ` · ${song.year}` : ""}
          </p>
        )}
      </button>
    </li>
  );
}
