import type { Song, UntimedSong } from "../types";

// Fetched at runtime from public/data/*.json (plain static files, copied
// as-is into the build — not bundled into the JS) rather than imported as
// modules. That's deliberate: the prod timestamper regenerates songs.json
// on every save, and a runtime fetch means the live app picks up newly
// timed songs on next load with no rebuild or redeploy in between — the
// gap that made songs disappear after being timed straight in prod.
// BASE_URL matches vite.config.ts's `base` ("/lmorphiniya/" in prod, "/" in
// dev), so this resolves correctly in both places without extra config.

async function loadJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/${path}`);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const loadSongs = () => loadJson<Song[]>("songs.json", []);
export const loadAllLyrics = () => loadJson<UntimedSong[]>("allLyrics.json", []);
