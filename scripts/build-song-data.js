import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Turns data/timing-worksheet.csv into src/data/songs.json — the real data
// the app actually runs on. Only rows with a timestamp are included; a song
// with zero timed lines isn't useful to the search feature, so it's skipped
// entirely rather than shipped empty.

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ""; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

function parseTimestamp(raw) {
  const parts = raw.trim().split(":").map(Number);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : Number(raw);
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

// title -> genius.com URL, for the "genius" easter-egg button. Missing
// entirely (data/genius-catalog.json not regenerated) just means no link.
const geniusUrlByTitle = new Map();
if (existsSync("data/genius-catalog.json")) {
  for (const s of JSON.parse(readFileSync("data/genius-catalog.json", "utf8"))) {
    geniusUrlByTitle.set(s.title, s.geniusUrl);
  }
}

const csvRows = parseCsv(readFileSync("data/timing-worksheet.csv", "utf8"));
const header = csvRows[0];
const rows = csvRows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));

const bySong = new Map();
for (const row of rows) {
  if (!row.timestamp) continue; // untimed — not usable yet
  if (!bySong.has(row.song_title)) bySong.set(row.song_title, []);
  bySong.get(row.song_title).push(row);
}

const songs = [...bySong.entries()].map(([title, songRows]) => {
  const first = songRows[0];
  return {
    id: slugify(title),
    title,
    album: first.album || undefined,
    year: first.year ? Number(first.year) : undefined,
    youtubeId: extractVideoId(first.youtube_url),
    geniusUrl: geniusUrlByTitle.get(title),
    lines: songRows.map((r) => ({
      timestamp: parseTimestamp(r.timestamp),
      text: r.line_text,
      translation: r.line_translation || undefined,
    })),
  };
});

writeFileSync("src/data/songs.json", JSON.stringify(songs, null, 2));

const totalLines = songs.reduce((sum, s) => sum + s.lines.length, 0);
console.log(`Wrote src/data/songs.json: ${songs.length} song(s), ${totalLines} timed line(s).`);
for (const s of songs) console.log(`  - ${s.title} (${s.lines.length} lines)${s.youtubeId ? "" : "  [no youtube id!]"}`);
