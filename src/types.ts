export interface LyricLine {
  /** Seconds from the start of the track where this line begins. */
  timestamp: number;
  text: string;
  translation?: string;
}

export interface Song {
  id: string;
  title: string;
  album?: string;
  year?: number;
  /**
   * YouTube video id. Leave undefined (or prefixed "demo-") to show the
   * "connect a real link" placeholder instead of an embed.
   */
  youtubeId?: string;
  geniusUrl?: string;
  lines: LyricLine[];
}

/** A song we have real lyrics for but haven't timed against the video yet. */
export interface UntimedSong {
  id: string;
  title: string;
  album?: string;
  year?: number;
  youtubeId?: string;
  geniusUrl?: string;
  lines: string[];
}

export interface SearchHit {
  kind: "timed";
  song: Song;
  line: LyricLine;
  /** Interpolated position (seconds) of the matched word within the line. */
  wordTimestamp: number;
  matchedWord: string;
  /** Character offsets of the match within line.text, for highlighting. */
  matchStart: number;
  matchEnd: number;
}

/** A match found in the full lyrics text, before that song has been timed. */
export interface UntimedHit {
  kind: "untimed";
  song: UntimedSong;
  lineText: string;
  matchedWord: string;
  matchStart: number;
  matchEnd: number;
}

export type AnyHit = SearchHit | UntimedHit;

export type SearchTier = "exact" | "untimed" | "partial" | "suggestion";

export interface SearchResponse {
  tier: SearchTier;
  hits: AnyHit[];
  /** Set only when tier is "suggestion" — the closest real word by edit distance. */
  suggestion?: string;
}
