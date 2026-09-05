// Pure CSV-worksheet -> Song[] transform, shared by:
//  - scripts/build-song-data.js (CLI, for local dev/rebuild)
//  - scripts/timer-server.js (auto-regenerates on every save, in prod)
// Keeping this in one place means the two never drift out of sync with
// each other, which is exactly the kind of gap that caused songs to go
// missing from the live app after being timed in the prod timestamper.

export function parseCsv(text) {
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

/**
 * @param {string} csvText - raw data/timing-worksheet.csv content
 * @param {Array<{title: string, geniusUrl?: string}>} catalogEntries - from
 *   data/genius-catalog.json, for the "genius" easter-egg link. Pass [] if
 *   that file isn't available — songs just come out without geniusUrl.
 */
export function buildSongsFromWorksheet(csvText, catalogEntries = []) {
  const geniusUrlByTitle = new Map(catalogEntries.map((s) => [s.title, s.geniusUrl]));

  const csvRows = parseCsv(csvText);
  const header = csvRows[0];
  const rows = csvRows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));

  const bySong = new Map();
  for (const row of rows) {
    if (!row.timestamp) continue; // untimed — not usable yet
    if (!bySong.has(row.song_title)) bySong.set(row.song_title, []);
    bySong.get(row.song_title).push(row);
  }

  return [...bySong.entries()].map(([title, songRows]) => {
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
}
