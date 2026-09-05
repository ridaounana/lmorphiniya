import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fetchLyricsPage, extractLyrics, sleep } from "./lib/scrape-lyrics.js";

const OUT_DIR = "data/lyrics-raw";
const DELAY_MS = 750; // be polite — this is a one-time personal data pull, not a crawler

const catalog = JSON.parse(readFileSync("data/genius-catalog.json", "utf8"));

// Optional: `node scripts/genius-lyrics.js 3442515` scrapes just one song
// (handy for re-checking a single page). No args scrapes everything not
// already saved in data/lyrics-raw/, so a partial/failed run can resume.
const onlyId = process.argv[2] ? Number(process.argv[2]) : null;
const targets = onlyId ? catalog.filter((s) => s.geniusId === onlyId) : catalog;

mkdirSync(OUT_DIR, { recursive: true });

let scraped = 0;
let skipped = 0;
let empty = 0;
let failed = 0;

for (const song of targets) {
  const outPath = `${OUT_DIR}/${song.geniusId}.json`;
  if (!onlyId && existsSync(outPath)) {
    skipped++;
    continue;
  }

  try {
    const html = await fetchLyricsPage(song.geniusUrl);
    const lines = extractLyrics(html);

    const isEmpty = !lines || lines.length === 0;
    writeFileSync(
      outPath,
      JSON.stringify(
        { geniusId: song.geniusId, title: song.title, geniusUrl: song.geniusUrl, lines: lines ?? [] },
        null,
        2,
      ),
    );

    if (isEmpty) {
      console.log(`(no lyrics container) ${song.title}`);
      empty++;
    } else {
      console.log(`ok  (${lines.length} lines)  ${song.title}`);
      scraped++;
    }
  } catch (err) {
    console.log(`FAILED  ${song.title}  —  ${err.message}`);
    failed++;
  }

  await sleep(DELAY_MS);
}

console.log(`\n${scraped} scraped, ${skipped} already had a file, ${empty} had no lyrics, ${failed} failed.`);
if (failed > 0) console.log("Re-run the same command — it skips anything already saved, so it only retries what's missing.");
