import type { AnyHit, SearchTier } from "../types";
import { ResultCard } from "./ResultCard";

interface ResultsListProps {
  query: string;
  tier: SearchTier;
  hits: AnyHit[];
  activeHit: AnyHit | null;
  onPlay: (hit: AnyHit) => void;
}

export function ResultsList({ query, tier, hits, activeHit, onPlay }: ResultsListProps) {
  if (hits.length === 0) {
    return (
      <div className="mx-auto mt-6 max-w-md text-center text-sm text-cream/50">
        Nothing on any tape says "{query}" yet. Try another word, or hit the dice.
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md">
      {tier === "untimed" && (
        <p className="mb-2 px-1 text-xs uppercase tracking-wide text-cream/40">
          Found it — just not timed to the video yet:
        </p>
      )}
      {tier === "partial" && (
        <p className="mb-2 px-1 text-xs uppercase tracking-wide text-cream/40">
          No exact match — closest words on tape:
        </p>
      )}
      <ul className="space-y-2">
        {hits.map((hit, i) => (
          <ResultCard key={`${hit.song.id}-${i}`} hit={hit} active={activeHit === hit} onPlay={onPlay} />
        ))}
      </ul>
    </div>
  );
}
