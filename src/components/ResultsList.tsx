import type { AnyHit, SearchTier } from "../types";
import { ResultCard } from "./ResultCard";

interface ResultsListProps {
  query: string;
  tier: SearchTier;
  hits: AnyHit[];
  suggestion?: string;
  activeHit: AnyHit | null;
  onPlay: (hit: AnyHit) => void;
  onSuggestionClick: (word: string) => void;
}

export function ResultsList({ query, tier, hits, suggestion, activeHit, onPlay, onSuggestionClick }: ResultsListProps) {
  if (tier === "suggestion" && suggestion) {
    return (
      <div className="mx-auto mt-6 max-w-md text-center text-sm text-cream/60">
        Nothing on any tape says "{query}". Did you mean{" "}
        <button
          type="button"
          onClick={() => onSuggestionClick(suggestion)}
          className="font-semibold text-amber underline underline-offset-2 hover:text-cream"
        >
          {suggestion}
        </button>
        ?
      </div>
    );
  }

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
