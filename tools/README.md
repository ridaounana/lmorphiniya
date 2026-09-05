# Timing tool

A tap-to-mark timer for turning `data/timing-worksheet.csv` into real
timestamps — the piece nothing can automate reliably (see the discussion in
chat: YouTube's own auto-captions exist but are too unreliable for Darija to
trust). This doesn't guess; it just makes doing it by hand fast.

## Run it

```bash
npm run timer
```

Opens at `http://localhost:4321`. Click **Load CSV** and pick
`data/timing-worksheet.csv`.

## How it works

1. Pick a song from the dropdown (defaults to the first one with untimed lines).
2. Hit play on the embedded video.
3. The line about to be timed is shown large, with the previous and next
   lines dimmed above/below for context.
4. The instant that line starts, hit **Space** — it captures the video's
   current time, stamps it, and moves to the next line automatically without
   pausing playback. Keep tapping in rhythm with the song.
5. **Backspace** undoes the last mark if your timing was off, so you can
   redo it. **←/→** nudge the video 3 seconds either way; **K** plays/pauses.
   Clicking any line in the right-hand list jumps straight to it.
6. **Export CSV** whenever — downloads the full file (every song, not just
   the one you're on) with whatever timestamps you've filled in so far.

Progress autosaves to this browser as you go (nothing is uploaded anywhere —
it's a static page, no server-side state). If you reload the page and load
the same file again, it'll offer to restore where you left off. That
autosave lives only in this browser though, so **export and send back the
CSV periodically** rather than relying on it as your only copy.

You don't have to finish the whole catalog in one sitting, and you don't
have to go in order — timing a handful of your favorite songs first and
sending that batch back works fine.
