import type { UntimedSong } from "../types";
import generated from "./allLyrics.json";

// Generated from data/lyrics-raw/*.json by `npm run build:all-lyrics` — the
// full scraped catalog, so a word can be found even in a song nobody has
// timed yet. Re-run after scraping more songs. See src/data/songs.ts for
// the smaller "precisely timed" catalog this complements.
export const allLyrics: UntimedSong[] = generated as UntimedSong[];
