import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildSongsFromWorksheet } from "./lib/build-songs.js";

// Turns data/timing-worksheet.csv into public/data/songs.json — fetched by
// the app at runtime (not bundled), so the prod timestamper can regenerate
// it on save and the live app picks it up on next load with no rebuild.
// Only rows with a timestamp are included; a song with zero timed lines
// isn't useful to the search feature, so it's skipped entirely.

const catalog = existsSync("data/genius-catalog.json")
  ? JSON.parse(readFileSync("data/genius-catalog.json", "utf8"))
  : [];

const songs = buildSongsFromWorksheet(readFileSync("data/timing-worksheet.csv", "utf8"), catalog);

mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/songs.json", JSON.stringify(songs));

const totalLines = songs.reduce((sum, s) => sum + s.lines.length, 0);
console.log(`Wrote public/data/songs.json: ${songs.length} song(s), ${totalLines} timed line(s).`);
for (const s of songs) console.log(`  - ${s.title} (${s.lines.length} lines)${s.youtubeId ? "" : "  [no youtube id!]"}`);
