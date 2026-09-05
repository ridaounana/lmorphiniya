# Sending lyrics data to Morphinia

**Current path:** run the Genius pipeline (`npm run genius:songs`, then
`genius:lyrics`, `genius:details`, `genius:build-csv` — see
[scripts/README.md](../scripts/README.md)) to generate
`data/timing-worksheet.csv`, already filled in with song titles, years,
lyric lines, and most YouTube links straight from Genius. Open that file and
you're just adding a `timestamp` per row (and a `youtube_url` on the rows
Genius didn't have a link for) — everything below still describes the
columns and rules, they just mostly get filled in for you now.

[lyrics_template.csv](./lyrics_template.csv) is the blank version of the same
format — for adding a song by hand if one's ever missing from Genius. Same
columns, same rules, either way. One row = one lyric line — not one song,
not one word.

## Columns

| Column | Required | Notes |
|---|---|---|
| `song_title` | yes | Must be spelled identically across every row of the same song. |
| `album` | no | |
| `year` | no | Release year. |
| `youtube_url` | yes | The song's YouTube link (playback seeks to the timestamp in this video). `genius:details` fills most of these in from Genius already; paste the full URL by hand for whatever's left blank. |
| `timestamp` | yes | The moment this line **starts**, as `m:ss` (e.g. `1:04`) or plain seconds (`64`). Watch the video and jot down when each line begins — that's it, no need to time individual words. |
| `line_text` | yes | The line itself, in whatever script fans actually type when they search (see the script question in chat). |
| `line_translation` | no | English or French translation — helps non-Darija speakers, and doubles as a second searchable version of the line. |
| `line_transliteration` | no | Latin-script version if `line_text` is in Arabic script, or vice versa. Fills the gap if a fan searches the "wrong" script. |

## Why only line-level timestamps?

You don't need to time every word by hand. Morphinia indexes every word in a
line and estimates each word's exact moment by its position inside the line
(a word near the end of a 6-second line lands a couple seconds in, one near
the start lands almost immediately) — good enough to drop a listener right
next to the right bar. If we ever want frame-perfect word timestamps later,
that's a separate pass (forced audio alignment) and isn't needed to launch.

## Rules that matter

- **Keep a song's rows in order**, top to bottom, the way they're sung. The
  next row's timestamp is what tells Morphinia when the current line ends.
- **One row per line**, even short ones (ad-libs, hooks, repeated lines all
  get their own row so they're each searchable and jumpable).
- Empty cells are fine for anything marked "no" above — just leave them blank,
  don't write "N/A".

## Sending it back

Whichever is easiest for you:
- Attach the filled CSV/XLSX directly in chat.
- Paste the rows as plain text/a table in chat.
- Share a Google Sheet with the same columns — send the link and make sure
  it's viewable by anyone with the link.

Send it in batches if that's easier (a few songs at a time) — no need to wait
until the whole discography is done before sending the first batch.
