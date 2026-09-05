import { readFileSync, existsSync } from "node:fs";

/** Minimal .env loader so the scripts need no extra dependency. */
export function loadEnv(path = ".env") {
  if (!existsSync(path)) return;

  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);

    if (!(key in process.env)) process.env[key] = value;
  }
}
