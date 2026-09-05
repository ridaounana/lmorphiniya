import type { AnyHit, SearchHit, SearchResponse, Song, UntimedHit, UntimedSong } from "../types";

const WORD_RE = /[\p{L}\p{N}]+/gu;

// Diacritics to strip after NFKD decomposition, expressed as numeric
// code-point ranges (not a regex literal) so no combining glyphs need to
// live in this source file: Latin combining accents, then the Arabic
// tashkeel/harakat blocks that show up when lyrics are entered fully vowelled.
const DIACRITIC_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0300, 0x036f],
  [0x0610, 0x061a],
  [0x064b, 0x065f],
  [0x0670, 0x0670],
  [0x06d6, 0x06ed],
];

function isDiacritic(codePoint: number): boolean {
  return DIACRITIC_RANGES.some(([lo, hi]) => codePoint >= lo && codePoint <= hi);
}

function stripDiacritics(s: string): string {
  return [...s].filter((ch) => !isDiacritic(ch.codePointAt(0) ?? 0)).join("");
}

/** Case/diacritic-insensitive key so surface variants of the same word collide. */
export function normalize(raw: string): string {
  return stripDiacritics(raw.normalize("NFKD")).toLowerCase().trim();
}

interface Token {
  word: string;
  start: number;
  end: number;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(WORD_RE)) {
    tokens.push({ word: match[0], start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }
  return tokens;
}

function interpolateTime(startTime: number, endTime: number, charMid: number, lineLength: number): number {
  const duration = Math.max(endTime - startTime, 0.1);
  const ratio = lineLength > 0 ? Math.min(charMid / lineLength, 0.95) : 0;
  return Math.round((startTime + duration * ratio) * 10) / 10;
}

export interface SearchIndex {
  exact: Map<string, SearchHit[]>;
  /** One representative original-case word per normalized key, for "surprise me". */
  vocabulary: string[];
}

const FALLBACK_LINE_DURATION = 4;

export function buildIndex(songs: Song[]): SearchIndex {
  const exact = new Map<string, SearchHit[]>();
  const vocabSeen = new Map<string, string>();

  for (const song of songs) {
    song.lines.forEach((line, i) => {
      const nextTimestamp = song.lines[i + 1]?.timestamp ?? line.timestamp + FALLBACK_LINE_DURATION;
      const tokens = tokenize(line.text);

      for (const token of tokens) {
        const key = normalize(token.word);
        if (!key) continue;

        const wordTimestamp = interpolateTime(
          line.timestamp,
          nextTimestamp,
          (token.start + token.end) / 2,
          line.text.length,
        );

        const hit: SearchHit = {
          kind: "timed",
          song,
          line,
          wordTimestamp,
          matchedWord: token.word,
          matchStart: token.start,
          matchEnd: token.end,
        };

        const bucket = exact.get(key);
        if (bucket) bucket.push(hit);
        else exact.set(key, [hit]);

        if (!vocabSeen.has(key)) vocabSeen.set(key, token.word);
      }
    });
  }

  return { exact, vocabulary: [...vocabSeen.values()] };
}

export interface UntimedIndex {
  exact: Map<string, UntimedHit[]>;
  vocabulary: string[];
}

export function buildUntimedIndex(songs: UntimedSong[]): UntimedIndex {
  const exact = new Map<string, UntimedHit[]>();
  const vocabSeen = new Map<string, string>();

  for (const song of songs) {
    for (const lineText of song.lines) {
      for (const token of tokenize(lineText)) {
        const key = normalize(token.word);
        if (!key) continue;

        const hit: UntimedHit = {
          kind: "untimed",
          song,
          lineText,
          matchedWord: token.word,
          matchStart: token.start,
          matchEnd: token.end,
        };

        const bucket = exact.get(key);
        if (bucket) bucket.push(hit);
        else exact.set(key, [hit]);

        if (!vocabSeen.has(key)) vocabSeen.set(key, token.word);
      }
    }
  }

  return { exact, vocabulary: [...vocabSeen.values()] };
}

const MAX_RESULTS = 25;
// Below this length, near-every short function word ("a", "in", "is") is a
// substring of whatever was typed, so it would drown out real suggestions.
const MIN_SUGGESTION_LENGTH = 3;

/**
 * Edit distance with adjacent-transposition support (the "optimal string
 * alignment" variant of Damerau-Levenshtein): counts insertions, deletions,
 * substitutions, and swapped-adjacent-letters as one edit each. Those four
 * operations cover the large majority of real typos ("Ronnaldo" -> "Ronaldo"
 * is one deletion; "Ronlado" -> "Ronaldo" is one transposition) — a plain
 * Levenshtein distance would still work but would score a transposition as
 * two edits instead of one, understating how close the words really are.
 *
 * Deliberately a plain O(a.length * b.length) table scan against every
 * vocabulary word, not an indexed structure like a BK-tree: this app's
 * vocabulary tops out in the low thousands of unique words, and it only
 * runs once per search (not per keystroke) — the extra machinery a real
 * search engine needs at millions-of-terms scale buys nothing here.
 */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost); // transposition
      }
    }
  }
  return dp[m][n];
}

// How many edits still count as "probably a typo" — fixed thresholds are
// wrong here: distance 1 on a 3-letter word is nearly a different word,
// while distance 2 on a 10-letter word is a trivial slip. Scales with the
// length of what was actually typed.
function maxTypoDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 9) return 2;
  return 3;
}

function closestVocabWord(key: string, index: Map<string, { matchedWord: string }[]>): string | null {
  const threshold = maxTypoDistance(key.length);
  let best: { word: string; distance: number } | null = null;

  for (const [entryKey, hits] of index) {
    if (entryKey.length < MIN_SUGGESTION_LENGTH) continue;
    const distance = editDistance(key, entryKey);
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = { word: hits[0].matchedWord, distance };
      if (distance === 0) break; // can't do better than an exact hit (shouldn't happen here, but cheap to guard)
    }
  }

  return best?.word ?? null;
}

/**
 * Exact match against timed songs first (best: precise jump-to-bar), then
 * exact match against everything already scraped but not yet timed (still
 * useful: "it's in this song"), then — if the typed word doesn't exist
 * anywhere at all — the closest real word by edit distance, offered as a
 * "did you mean" rather than shown directly, so a genuine typo doesn't
 * silently search for the wrong thing. Only once nothing is close enough to
 * call a typo does it fall back to plain substring matches, so a
 * deliberately partial/truncated word still surfaces something.
 */
export function search(query: string, timed: SearchIndex, untimed: UntimedIndex): SearchResponse {
  const key = normalize(query);
  if (!key) return { tier: "exact", hits: [] };

  const timedHits = timed.exact.get(key);
  if (timedHits?.length) {
    return { tier: "exact", hits: timedHits.slice(0, MAX_RESULTS) };
  }

  const untimedHits = untimed.exact.get(key);
  if (untimedHits?.length) {
    return { tier: "untimed", hits: untimedHits.slice(0, MAX_RESULTS) };
  }

  if (key.length >= MIN_SUGGESTION_LENGTH) {
    // Timed vocabulary checked first: a suggestion that lands on an already
    // -timed song is strictly more useful (exact jump) than one that lands
    // on an untimed one, so it wins even if the untimed match happens to be
    // marginally closer in raw edit distance.
    const suggestion = closestVocabWord(key, timed.exact) ?? closestVocabWord(key, untimed.exact);
    if (suggestion) {
      return { tier: "suggestion", hits: [], suggestion };
    }
  }

  const partialHits: AnyHit[] = [];
  for (const [entryKey, hits] of timed.exact) {
    if (entryKey.length < MIN_SUGGESTION_LENGTH) continue;
    if (entryKey.includes(key) || key.includes(entryKey)) {
      partialHits.push(...hits);
      if (partialHits.length >= MAX_RESULTS) break;
    }
  }

  return { tier: "partial", hits: partialHits.slice(0, MAX_RESULTS) };
}

/** Picks from timed + untimed vocabulary combined — much more to discover. */
export function randomWord(timed: SearchIndex, untimed: UntimedIndex): string | undefined {
  const pool = timed.vocabulary.length > 0 || untimed.vocabulary.length > 0
    ? [...timed.vocabulary, ...untimed.vocabulary]
    : [];
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
