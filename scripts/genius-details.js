import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "./lib/env.js";
import { geniusFetch } from "./lib/genius.js";
import { sleep } from "./lib/scrape-lyrics.js";

loadEnv();

const OUT_DIR = "data/song-details";
const DELAY_MS = 500;

const catalog = JSON.parse(readFileSync("data/genius-catalog.json", "utf8"));

// Same resume pattern as genius-lyrics.js: `node scripts/genius-details.js
// 3442515` re-fetches one song; no args fetches everything not already saved.
const onlyId = process.argv[2] ? Number(process.argv[2]) : null;
const targets = onlyId ? catalog.filter((s) => s.geniusId === onlyId) : catalog;

mkdirSync(OUT_DIR, { recursive: true });

let fetched = 0;
let skipped = 0;
let failed = 0;
let withYoutube = 0;

for (const song of targets) {
  const outPath = `${OUT_DIR}/${song.geniusId}.json`;
  if (!onlyId && existsSync(outPath)) {
    skipped++;
    continue;
  }

  try {
    const data = await geniusFetch(`/songs/${song.geniusId}`);
    const s = data.response.song;
    const media = s.media ?? [];
    const youtube = media.find((m) => m.provider === "youtube");

    writeFileSync(
      outPath,
      JSON.stringify(
        {
          geniusId: song.geniusId,
          title: s.title,
          album: s.album?.name ?? null,
          youtubeUrl: youtube?.url ?? null,
          media,
        },
        null,
        2,
      ),
    );

    if (youtube) withYoutube++;
    console.log(`ok${youtube ? "  [youtube]" : "           "}  ${song.title}`);
    fetched++;
  } catch (err) {
    console.log(`FAILED  ${song.title}  —  ${err.message}`);
    failed++;
  }

  await sleep(DELAY_MS);
}

console.log(`\n${fetched} fetched (${withYoutube} with a YouTube link), ${skipped} already had a file, ${failed} failed.`);
if (failed > 0) console.log("Re-run the same command — it skips anything already saved.");
