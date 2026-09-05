import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { toCsv } from "./lib/csv.js";

// Merges genius-catalog.json + data/lyrics-raw/*.json + data/song-details/*.json
// into data/timing-worksheet.csv — one row per lyric line, matching
// data/lyrics_template.csv's columns, with everything Genius can supply
// pre-filled. Only `timestamp` (always manual) and `youtube_url` (when Genius
// didn't have a link attached) are left for you to fill in by hand.

const SECTION_TAG_RE = /^\[.+\]$/; // whole-line "[Couplet 1]" / "[Refrain]" style tags
// Genius auto-generates a `Paroles de <artist> "<title>"` credit line as the
// first line of literally every song's lyrics container — not sung content.
const GENIUS_CREDIT_LINE_RE = /^paroles de .*morphine/i;

function isBoilerplate(line) {
  const trimmed = line.trim();
  return SECTION_TAG_RE.test(trimmed) || GENIUS_CREDIT_LINE_RE.test(trimmed);
}

const catalog = JSON.parse(readFileSync("data/genius-catalog.json", "utf8"));
catalog.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title));

const rows = [];
let songsIncluded = 0;
let songsNotYetScraped = 0;
let songsWithNoLyricLines = 0;

for (const song of catalog) {
  const lyricsPath = `data/lyrics-raw/${song.geniusId}.json`;
  if (!existsSync(lyricsPath)) {
    songsNotYetScraped++;
    continue;
  }

  const { lines } = JSON.parse(readFileSync(lyricsPath, "utf8"));
  const lyricLines = lines.filter((line) => !isBoilerplate(line));
  if (lyricLines.length === 0) {
    songsWithNoLyricLines++;
    continue;
  }

  const detailsPath = `data/song-details/${song.geniusId}.json`;
  const details = existsSync(detailsPath) ? JSON.parse(readFileSync(detailsPath, "utf8")) : null;
  const album = details?.album?.trim() ?? "";
  const youtubeUrl = details?.youtubeUrl ?? "";

  for (const line of lyricLines) {
    rows.push([song.title, album, song.year ?? "", youtubeUrl, "", line, "", ""]);
  }
  songsIncluded++;
}

const header = [
  "song_title",
  "album",
  "year",
  "youtube_url",
  "timestamp",
  "line_text",
  "line_translation",
  "line_transliteration",
];

writeFileSync("data/timing-worksheet.csv", toCsv(header, rows));

console.log(`Wrote data/timing-worksheet.csv — ${rows.length} lines across ${songsIncluded} songs.`);
if (songsNotYetScraped > 0) {
  console.log(`${songsNotYetScraped} song(s) not scraped yet. Once genius:lyrics finishes, re-run this to pick them up.`);
}
if (songsWithNoLyricLines > 0) {
  console.log(`${songsWithNoLyricLines} song(s) had a lyrics page but no actual lines (likely not transcribed yet).`);
}
console.log("Every row still needs a timestamp. Rows with a blank youtube_url need that pasted in by hand too.");
