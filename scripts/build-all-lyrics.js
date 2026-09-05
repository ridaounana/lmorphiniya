import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Turns every already-scraped song (data/lyrics-raw/*.json — 263 songs, no
// timestamps needed) into public/data/allLyrics.json — fetched by the app at
// runtime, not bundled. A full-text index so a word can be found ("it's in
// this song") even before that song has been timed. Deliberately separate
// from songs.json, which stays "only what's precisely timed" for the real
// search+jump experience. Unlike songs.json, nothing regenerates this one
// automatically — it only changes when the scraped catalog itself grows, a
// separate, much rarer step (see scripts/README.md).

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
    geniusUrl: song.geniusUrl,
    lines: realLines,
  });
}

mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/allLyrics.json", JSON.stringify(allLyrics));

const totalLines = allLyrics.reduce((sum, s) => sum + s.lines.length, 0);
console.log(`Wrote public/data/allLyrics.json: ${allLyrics.length} song(s), ${totalLines} line(s) — full-text, no timestamps.`);
