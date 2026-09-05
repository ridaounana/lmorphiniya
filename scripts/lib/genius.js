// genius.com/api/* is the unauthenticated internal API the genius.com
// website itself calls (no Client Access Token needed). api.genius.com is
// the official public Developer API, which does need the Bearer token.
export const PUBLIC_WEB_API = "https://genius.com/api";
export const OFFICIAL_API = "https://api.genius.com";

/** Thin fetch wrapper. Attaches a Bearer token only if one is configured. */
export async function geniusFetch(path, searchParams = {}, { baseUrl = PUBLIC_WEB_API } = {}) {
  const token = process.env.GENIUS_ACCESS_TOKEN;

  const url = new URL(baseUrl + path);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Genius API ${res.status} ${res.statusText} for ${url}\n${body}`);
  }

  return res.json();
}
