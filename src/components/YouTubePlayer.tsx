import { useEffect, useRef, useState } from "react";
import { formatTimestamp } from "../lib/search";
import type { LyricLine, SearchHit } from "../types";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: { onReady?: () => void };
        },
      ) => YouTubePlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerInstance {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
  destroy: () => void;
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    if (!document.getElementById("youtube-iframe-api")) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
  });

  return apiPromise;
}

/** Index of the last line whose timestamp has passed — "what's playing now". */
function currentLineIndexAt(lines: LyricLine[], time: number): number {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].timestamp <= time) idx = i;
    else break;
  }
  return idx;
}

interface YouTubePlayerProps {
  hit: SearchHit;
}

export function YouTubePlayer({ hit }: YouTubePlayerProps) {
  const { song, line: matchedLine, matchStart, matchEnd, wordTimestamp } = hit;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [lineIndex, setLineIndex] = useState(() => currentLineIndexAt(song.lines, wordTimestamp));

  const isDemo = !song.youtubeId || song.youtubeId.startsWith("demo");

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setReady(false);

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: song.youtubeId!,
        playerVars: { start: Math.floor(wordTimestamp), rel: 0, playsinline: 1 },
        events: { onReady: () => setReady(true) },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // Player is recreated only when the video itself changes; seeking within
    // the same video is handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.youtubeId, isDemo]);

  useEffect(() => {
    if (!ready) return;
    playerRef.current?.seekTo(wordTimestamp, true);
    playerRef.current?.playVideo();
    setLineIndex(currentLineIndexAt(song.lines, wordTimestamp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordTimestamp, ready]);

  // Follows actual playback rather than the searched line, so scrubbing,
  // continued playback, or the user seeking within YouTube's own controls
  // all keep the displayed lyric in sync instead of freezing on the result.
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      const time = playerRef.current?.getCurrentTime();
      if (typeof time !== "number") return;
      setLineIndex((prev) => {
        const next = currentLineIndexAt(song.lines, time);
        return next === prev ? prev : next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [ready, song.lines]);

  if (isDemo) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cream/20 bg-black/30 px-6 text-center">
        <p className="text-sm font-medium text-cream/70">"{song.title}" has no YouTube link yet</p>
        <p className="max-w-xs text-xs text-cream/40">
          Add a youtubeId to this song and it'll open here cued to {formatTimestamp(wordTimestamp)}.
        </p>
      </div>
    );
  }

  const prevLine = lineIndex > 0 ? song.lines[lineIndex - 1] : null;
  const currentLine = song.lines[lineIndex] ?? null;
  const nextLine = lineIndex < song.lines.length - 1 ? song.lines[lineIndex + 1] : null;
  const showMatchHighlight = currentLine === matchedLine;

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="aspect-video w-full overflow-hidden rounded-xl bg-black" />
      <div className="rounded-xl bg-shell px-4 py-3 text-center">
        <p className="truncate text-xs text-cream/30">{prevLine?.text ?? " "}</p>
        <p className="mt-1 text-base font-medium leading-snug text-cream">
          {showMatchHighlight ? (
            <>
              {currentLine!.text.slice(0, matchStart)}
              <mark className="rounded bg-red/30 px-0.5 text-cream">{currentLine!.text.slice(matchStart, matchEnd)}</mark>
              {currentLine!.text.slice(matchEnd)}
            </>
          ) : (
            (currentLine?.text ?? " ")
          )}
        </p>
        <p className="mt-1 truncate text-xs text-cream/30">{nextLine?.text ?? " "}</p>
      </div>
    </div>
  );
}
