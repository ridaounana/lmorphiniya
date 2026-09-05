import type { AnyHit } from "../types";
import { formatTimestamp } from "../lib/search";
import { RunawayGeniusButton } from "./RunawayGeniusButton";

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
      <div
        className={`rounded-xl border transition ${
          active ? "border-amber/70 bg-amber/10" : "border-cream/10 bg-shell-light/40 hover:border-cream/25"
        }`}
      >
        <button type="button" onClick={() => onPlay(hit)} className="block w-full px-4 py-3 text-left">
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
        </button>

        {(song.album || song.geniusUrl) && (
          // Same row as the album text, but the button gets its own lane
          // (flex-1, to the right of the text) rather than roaming across
          // the text's own space — same line, no overlap either way.
          // Sibling to the button above, not nested inside it: an <a> can't
          // legally live inside a <button>, and this one needs to be its
          // own focusable/clickable element anyway.
          <div className="flex items-center gap-2 px-4 pb-3">
            {song.album && (
              <p className="max-w-[55%] shrink-0 truncate text-xs text-cream/40">
                {song.album}
                {song.year ? ` · ${song.year}` : ""}
              </p>
            )}
            {song.geniusUrl && (
              <div className="relative h-6 flex-1">
                <RunawayGeniusButton href={song.geniusUrl} />
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
