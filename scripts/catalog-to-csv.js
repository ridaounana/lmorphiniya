import { readFileSync, writeFileSync } from "node:fs";
import { toCsv } from "./lib/csv.js";

// Turns data/genius-catalog.json (one row per song, from genius:songs) into
// a spreadsheet-friendly checklist: data/genius-catalog.csv. This is a
// reference sheet for deciding what to include, not the app's data format —
// that's data/lyrics_template.csv, one row per lyric *line*.

const songs = JSON.parse(readFileSync("data/genius-catalog.json", "utf8"));
songs.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title));

const header = ["title", "year", "is_primary_artist", "featured_artists", "genius_url"];
const rows = songs.map((s) => [s.title, s.year ?? "", s.isPrimaryArtist, s.featuredArtists.join("; "), s.geniusUrl]);

writeFileSync("data/genius-catalog.csv", toCsv(header, rows));
console.log(`Wrote data/genius-catalog.csv (${songs.length} rows) — open it to decide what to include.`);
