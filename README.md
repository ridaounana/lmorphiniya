# Morphinia

Type one word. Get the exact Morphine song and the exact second he says it.

Built as a cassette: the input is the tape window, the left reel searches,
the right reel drops a random word from the catalog so you can discover bars
you didn't know to look for.

## Status

UI, search engine, and YouTube-timestamp playback are wired up and tested
end to end — currently running on placeholder demo lyrics
([src/data/songs.ts](./src/data/songs.ts)). Swapping in the real catalog is
the next step; see [data/README.md](./data/README.md) for the format.

## Run it

```bash
npm install
npm run dev
```

Opens at the printed `localhost` URL. `npm run build` produces a static
`dist/` (no backend — everything runs client-side against the bundled song
data).

## How search works

- `src/lib/search.ts` tokenizes every lyric line into words at startup and
  builds an in-memory index (word → every song/line/timestamp it appears in).
- A search first looks for an exact word match; if there isn't one, it falls
  back to showing words that partially match, so typos and half-remembered
  words still surface something.
- Each word's timestamp is estimated from its character position inside its
  line, interpolated between that line's timestamp and the next line's — see
  [data/README.md](./data/README.md) for why that's enough precision without
  hand-timing every word.

## Project layout

```
src/
  components/   Cassette shell, spinning reel buttons, results list, YouTube player
  data/         Song catalog (placeholder demo data for now)
  lib/search.ts Indexing + search + timestamp interpolation
  types.ts      Song / lyric line / search result shapes
data/           Template + instructions for supplying the real lyrics catalog
scripts/        Genius API pipeline: songs, lyrics, YouTube links (see scripts/README.md)
postman/        Importable Postman collection for testing the Genius API by hand
tools/          Tap-to-mark timing tool for turning lyrics into real timestamps (see tools/README.md)
```
