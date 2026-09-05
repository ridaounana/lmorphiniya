import type { Song } from "../types";
import generated from "./songs.json";

// Generated from data/timing-worksheet.csv by `npm run build:songs` — run
// that after new songs get timed to pick up the latest data. Only songs
// with at least one timed line make it in; see scripts/build-song-data.js.
export const songs: Song[] = generated as Song[];
