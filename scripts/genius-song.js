import { loadEnv } from "./lib/env.js";
import { geniusFetch } from "./lib/genius.js";

loadEnv();

const songId = process.argv[2];
if (!songId) {
  console.error("Usage: npm run genius:song -- <song_id>");
  process.exit(1);
}

const data = await geniusFetch(`/songs/${songId}`);
const s = data.response.song;

console.log(`title:        ${s.title}`);
console.log(`album:        ${s.album?.name ?? "(none)"}`);
console.log(`release date: ${s.release_date_for_display ?? "(unknown)"}`);
console.log(`url:          ${s.url}`);
console.log(`\nFull response:\n${JSON.stringify(s, null, 2)}`);
