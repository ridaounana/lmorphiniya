import { loadEnv } from "./lib/env.js";
import { geniusFetch } from "./lib/genius.js";

loadEnv();

const LMORPHINE_ARTIST_ID = "309616";
const artistId = process.argv[2] ?? LMORPHINE_ARTIST_ID;

const data = await geniusFetch(`/artists/${artistId}`);
console.log(JSON.stringify(data.response.artist, null, 2));
