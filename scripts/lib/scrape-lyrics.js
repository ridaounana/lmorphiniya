import * as cheerio from "cheerio";

// Honest, descriptive UA rather than pretending to be a browser — this is a
// personal fan-project data pull, not something trying to look like anything
// else. Genius's markup has changed shape over the years; [data-lyrics-container]
// is the current one (mid-2020s), with a couple of older fallbacks just in case.
const USER_AGENT = "Morphinia-fan-app/1.0 (personal lyrics data collection, non-commercial)";

export async function fetchLyricsPage(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`);
  return res.text();
}

/** Returns an array of lyric lines, or null if no lyrics container was found. */
export function extractLyrics(html) {
  const $ = cheerio.load(html);

  let containers = $("[data-lyrics-container]");
  if (containers.length === 0) containers = $(".lyrics"); // pre-2021 pages

  if (containers.length === 0) return null;

  const lines = [];
  containers.each((_, el) => {
    const $container = $(el);
    // Genius embeds page chrome (contributor count, "<Title> Lyrics" heading)
    // inside the lyrics container itself, marked for CSS-only hiding rather
    // than actually removed from the DOM — drop it before reading text.
    $container.find("[data-exclude-from-selection]").remove();
    $container.find("br").replaceWith("\n");
    // .text() concatenates sibling <p> blocks with no separator at all (that's
    // only ever added at render time, never in raw text content) — without
    // this, the last line of one paragraph runs straight into the next.
    $container.find("p").append("\n");
    for (const line of $container.text().split("\n")) {
      const trimmed = line.trim();
      if (trimmed) lines.push(trimmed);
    }
  });

  return lines;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
