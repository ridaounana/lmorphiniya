import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Turns every already-scraped song (data/lyrics-raw/*.json — 263 songs, no
// timestamps needed) into src/data/allLyrics.json: a full-text index so a
// word can be found ("it's in this song") even before that song has been
// timed. This is deliberately separate from src/data/songs.json, which
// stays "only what's precisely timed" for the real search+jump experience.

const SECTION_TAG_RE = /^\[.+\]$/;
const GENIUS_CREDIT_LINE_RE = /^paroles de .*morphine/i;

function isBoilerplate(line) {
  const trimmed = line.trim();
  return SECTION_TAG_RE.test(trimmed) || GENIUS_CREDIT_LINE_RE.test(trimmed);
}

function extractVideoId(url) {
  const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : undefined;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

const catalog = JSON.parse(readFileSync("data/genius-catalog.json", "utf8"));

const allLyrics = [];
for (const song of catalog) {
  const lyricsPath = `data/lyrics-raw/${song.geniusId}.json`;
  if (!existsSync(lyricsPath)) continue;

  const { lines } = JSON.parse(readFileSync(lyricsPath, "utf8"));
  const realLines = lines.filter((line) => !isBoilerplate(line));
  if (realLines.length === 0) continue;

  const detailsPath = `data/song-details/${song.geniusId}.json`;
  const details = existsSync(detailsPath) ? JSON.parse(readFileSync(detailsPath, "utf8")) : null;

  allLyrics.push({
    id: slugify(song.title),
    title: song.title,
    album: details?.album?.trim() || undefined,
    year: song.year ?? undefined,
    youtubeId: extractVideoId(details?.youtubeUrl),
    lines: realLines,
  });
}

writeFileSync("src/data/allLyrics.json", JSON.stringify(allLyrics, null, 2));

const totalLines = allLyrics.reduce((sum, s) => sum + s.lines.length, 0);
console.log(`Wrote src/data/allLyrics.json: ${allLyrics.length} song(s), ${totalLines} line(s) — full-text, no timestamps.`);
