# Genius API scripts

Pulls L'Morphine's entire catalog — titles, lyrics, YouTube links — from
Genius so almost none of it has to be typed by hand. Confirmed working live:
**264 credits (239 as primary artist, 25 features), lyrics scraped from each
song's Genius page, YouTube links pulled wherever Genius has one attached.**

## Setup

Nothing required to get started — every script below except `genius:search`
hits `genius.com/api/*`, the unauthenticated endpoint the genius.com website
itself uses. Only `genius:search` needs a token (see `.env.example`), since
`/search` only exists on the official, authenticated `api.genius.com`.

## The pipeline

Run in this order. Each step is resumable — re-running it skips whatever's
already saved, so a partial run or a failure partway through is fine to just
run again.

```bash
# 1. Song list -> data/genius-catalog.json + data/genius-catalog.csv
npm run genius:songs
npm run genius:csv          # spreadsheet version, sorted by year, for eyeballing the catalog

# 2. Lyrics, scraped from each song's Genius page -> data/lyrics-raw/<id>.json
npm run genius:lyrics       # takes a few minutes — 264 pages at a polite pace

# 3. Album + YouTube link per song, from Genius's own metadata -> data/song-details/<id>.json
npm run genius:details

# 4. Merge all three into the worksheet you actually fill in:
npm run genius:build-csv    # -> data/timing-worksheet.csv
```

`data/timing-worksheet.csv` has one row per lyric line — song title, album,
year, lyric text, and (where Genius had one) the YouTube link, all pre-filled.
What's left for a human: the `timestamp` column always (Genius has no concept
of audio timing), and `youtube_url` on whatever rows Genius didn't have a
link for. See [data/README.md](../data/README.md).

Other commands:

```bash
npm run genius:song -- 3442515      # full detail on one song, printed to the terminal
npm run genius:artist                # artist profile (defaults to L'Morphine, id 309616)
npm run genius:search -- "some artist"  # look up a different artist's id (needs a token)
```

## How the lyrics scraper works

`scripts/lib/scrape-lyrics.js` fetches the song's Genius page and parses the
`[data-lyrics-container]` block(s) out of the HTML with cheerio — the same
markup the page renders lyrics into. It strips the page-chrome Genius embeds
inside that block (contributor count, the "<Title> Lyrics" heading — present
in the DOM but meant to be CSS-hidden) and turns `<br>`/`<p>` boundaries into
line breaks, since raw text content otherwise runs everything together.

Worth knowing:
- **This isn't the official API** — genius.com doesn't publish lyrics in any
  JSON response (by design), so this reads the same HTML a browser would.
  Scraping a page like this sits outside Genius's Terms of Service even
  though it's just a plain GET request to a public page — common for
  fan-made tools, but worth knowing. `genius:lyrics` paces itself
  (750ms between requests) rather than hammering the site.
- **Section tags stay in the raw scrape** (`[Couplet 1]`, `[Refrain]`, etc.)
  in `data/lyrics-raw/`, for fidelity — `genius:build-csv` filters lines that
  are *only* a bracketed tag back out when building the worksheet, since
  nobody's going to search for the word "Refrain".
- **Some pages may have no `[data-lyrics-container]` at all** (rare — usually
  means lyrics aren't transcribed yet) — those get a `lines: []` file and are
  logged as "no lyrics container" so `genius:build-csv` skips them cleanly.
