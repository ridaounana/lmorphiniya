import { createServer } from "node:http";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { loadEnv } from "./lib/env.js";

loadEnv();

const PORT = Number(process.env.PORT) || 4321;
const ROOT = "tools";
const WORKSHEET_PATH = "data/timing-worksheet.csv";
const WORKSHEET_BACKUP_PATH = "data/timing-worksheet.csv.bak";
const EXPECTED_HEADER =
  "song_title,album,year,youtube_url,timestamp,line_text,line_translation,line_transliteration";
const USERNAME = process.env.TIMER_USERNAME ?? "";
const PASSWORD = process.env.TIMER_PASSWORD ?? "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Lengths must match for timingSafeEqual — pad instead of short-circuiting
  // on length so a wrong-length guess doesn't return faster than a right one.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function isAuthorized(req) {
  if (!USERNAME && !PASSWORD) return true; // protection is opt-in via .env

  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Basic ")) return false;

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);
  return safeEqual(user, USERNAME) && safeEqual(pass, PASSWORD);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleGetWorksheet(res) {
  try {
    const body = await readFile(WORKSHEET_PATH, "utf8");
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("data/timing-worksheet.csv doesn't exist yet — run the genius: build scripts first.");
  }
}

async function handleSaveWorksheet(req, res) {
  const body = await readBody(req);

  // This file holds irreplaceable manual timing work — refuse anything that
  // doesn't even look like the right CSV rather than silently clobbering it.
  if (!body.startsWith(EXPECTED_HEADER)) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Rejected: body doesn't start with the expected CSV header.");
    return;
  }

  if (existsSync(WORKSHEET_PATH)) {
    await copyFile(WORKSHEET_PATH, WORKSHEET_BACKUP_PATH);
  }
  await writeFile(WORKSHEET_PATH, body, "utf8");
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("saved");
}

const server = createServer(async (req, res) => {
  if (!isAuthorized(req)) {
    res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Morphinia timing tool"' });
    res.end("Authentication required.");
    return;
  }

  if (req.url === "/api/worksheet") {
    if (req.method === "GET") return handleGetWorksheet(res);
    if (req.method === "POST") return handleSaveWorksheet(req, res);
  }

  const path = req.url === "/" ? "/timer.html" : req.url;
  const filePath = join(ROOT, decodeURIComponent(path.split("?")[0]));

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Timing tool: http://localhost:${PORT}`);
  console.log(
    USERNAME || PASSWORD
      ? `Password-protected (set TIMER_USERNAME / TIMER_PASSWORD in .env to change).`
      : `No password set — anyone who can reach this port can open it. Set TIMER_USERNAME / TIMER_PASSWORD in .env to protect it.`,
  );
});
