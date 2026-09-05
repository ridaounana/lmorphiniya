import { useMemo, useState } from "react";
import { Cassette } from "./components/Cassette";
import { ResultsList } from "./components/ResultsList";
import { YouTubePlayer } from "./components/YouTubePlayer";
import { allLyrics } from "./data/allLyrics";
import { songs } from "./data/songs";
import { buildIndex, buildUntimedIndex, randomWord, search } from "./lib/search";
import type { AnyHit, SearchResponse } from "./types";

function App() {
  const timedIndex = useMemo(() => buildIndex(songs), []);
  const untimedIndex = useMemo(() => buildUntimedIndex(allLyrics), []);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [activeHit, setActiveHit] = useState<AnyHit | null>(null);

  const runSearch = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    const result = search(trimmed, timedIndex, untimedIndex);
    setResponse(result);
    setActiveHit(result.hits[0] ?? null);
  };

  const handleSurprise = () => {
    const word = randomWord(timedIndex, untimedIndex);
    if (!word) return;
    setQuery(word);
    runSearch(word);
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col px-4 py-8 sm:py-12">
      <Cassette value={query} onChange={setQuery} onSearch={runSearch} onSurprise={handleSurprise} />

      {activeHit?.kind === "timed" && (
        <div className="mx-auto mt-6 w-full max-w-md">
          <YouTubePlayer hit={activeHit} />
        </div>
      )}

      {activeHit?.kind === "untimed" && (
        <div className="mx-auto mt-6 w-full max-w-md rounded-xl border border-dashed border-cream/20 bg-black/20 px-4 py-3 text-center">
          <p className="text-sm text-cream/60">
            "{activeHit.song.title}" isn't timed yet, so there's no exact moment to jump to.
          </p>
          {activeHit.song.youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${activeHit.song.youtubeId}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-amber underline underline-offset-2"
            >
              Watch it on YouTube
            </a>
          )}
        </div>
      )}

      {response && (
        <ResultsList query={query} tier={response.tier} hits={response.hits} activeHit={activeHit} onPlay={setActiveHit} />
      )}

      <footer className="mt-auto pt-10 text-center text-[11px] text-cream/30">
        {songs.length} song{songs.length === 1 ? "" : "s"} timed so far, {allLyrics.length} more with lyrics in
      </footer>
    </div>
  );
}

export default App;
