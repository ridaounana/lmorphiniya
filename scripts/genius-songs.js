import { writeFileSync, mkdirSync } from "node:fs";
import { loadEnv } from "./lib/env.js";
import { geniusFetch } from "./lib/genius.js";

loadEnv();

const LMORPHINE_ARTIST_ID = "309616";
const artistId = process.argv[2] ?? LMORPHINE_ARTIST_ID;

const songs = [];
let page = 1;

// Endpoint + pagination confirmed by hand: genius.com/api/artists/309616/songs?page=X&per_page=50
for (;;) {
  const data = await geniusFetch(`/artists/${artistId}/songs`, { page, per_page: 50 });

  const results = data.response.songs;
  if (results.length === 0) break; // next_page keeps incrementing past the real last page

  for (const s of results) {
    songs.push({
      geniusId: s.id,
      title: s.title,
      geniusUrl: s.url,
      year: s.release_date_components?.year ?? null,
      releaseDate: s.release_date_for_display ?? null,
      isPrimaryArtist: s.primary_artist?.id === Number(artistId),
      featuredArtists: (s.featured_artists ?? []).map((a) => a.name),
      instrumental: Boolean(s.instrumental),
      lyricsState: s.lyrics_state ?? null,
    });
  }

  console.log(`page ${page}: ${results.length} song(s)`);
  if (!data.response.next_page) break;
  page = data.response.next_page;
}

mkdirSync("data", { recursive: true });
writeFileSync("data/genius-catalog.json", JSON.stringify(songs, null, 2));

const ownTracks = songs.filter((s) => s.isPrimaryArtist).length;
const features = songs.length - ownTracks;
const instrumentals = songs.filter((s) => s.instrumental).length;

console.log(`\nSaved ${songs.length} song(s) to data/genius-catalog.json`);
console.log(`  ${ownTracks} as primary artist, ${features} as a feature on someone else's track`);
console.log(`  ${instrumentals} marked instrumental (no lyrics to search)`);
console.log("Lyrics text and timestamps still need to be added by hand — see data/README.md.");
