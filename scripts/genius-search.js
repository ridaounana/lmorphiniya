import { loadEnv } from "./lib/env.js";
import { geniusFetch, OFFICIAL_API } from "./lib/genius.js";

loadEnv();

// L'Morphine's id is already known (309616) — this script is only useful now
// if you need to look up a different artist. Unlike the other scripts, /search
// only exists on the official API, which needs GENIUS_ACCESS_TOKEN in .env.
if (!process.env.GENIUS_ACCESS_TOKEN) {
  console.error("GENIUS_ACCESS_TOKEN is not set in .env — /search needs the official API token.");
  process.exit(1);
}

const query = process.argv.slice(2).join(" ");
if (!query) {
  console.error(`Usage: npm run genius:search -- "L'Morphine"`);
  process.exit(1);
}

const data = await geniusFetch("/search", { q: query }, { baseUrl: OFFICIAL_API });
const hits = data.response.hits;

if (hits.length === 0) {
  console.log(`No hits for "${query}". Try a different spelling.`);
} else {
  console.log("artist_id\tartist_name\tsong_id\tsong_title\turl");
  for (const hit of hits) {
    const r = hit.result;
    console.log(`${r.primary_artist.id}\t${r.primary_artist.name}\t${r.id}\t"${r.title}"\t${r.url}`);
  }
  console.log(`\n${hits.length} hit(s). Copy the artist_id for the real L'Morphine into genius:songs.`);
}
