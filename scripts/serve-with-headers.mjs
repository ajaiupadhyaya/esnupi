#!/usr/bin/env node
/**
 * Serves `dist/` the way Vercel will: same SPA rewrite, same response headers
 * from `vercel.json`. `vite preview` does neither, which means a broken CSP
 * would only ever show up in production — this is how you catch it locally.
 *
 *   npm run build && npm run preview:headers    # then open http://localhost:4174
 */
import { createReadStream, existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT ?? 4174);

const config = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

/** Vercel `source` patterns are anchored path regexes. */
const matchers = config.headers.map((rule) => ({
  re: new RegExp(`^${rule.source}$`),
  headers: rule.headers,
}));
const rewrites = (config.rewrites ?? []).map((rule) => ({
  re: new RegExp(`^${rule.source}$`),
  destination: rule.destination,
}));

createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname.includes("\\") || pathname.includes("\0")) throw new Error("invalid path");
  } catch {
    res.writeHead(400);
    res.end("bad request");
    return;
  }

  for (const { re, headers } of matchers) {
    if (re.test(pathname)) for (const h of headers) res.setHeader(h.key, h.value);
  }

  let filePath = resolve(DIST, `.${pathname}`);
  const withinDist = (path) => {
    const rel = relative(DIST, path);
    return rel !== ".." && !rel.startsWith("../") && !rel.startsWith("/");
  };
  if (!withinDist(filePath) || (existsSync(filePath) && !withinDist(realpathSync(filePath)))) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  const isFile = existsSync(filePath) && statSync(filePath).isFile();

  // Vercel serves /_vercel/* itself (analytics). Locally it does not exist —
  // 404 rather than handing back index.html, which would otherwise show up as
  // a bogus "MIME type is not executable" console error.
  if (!isFile && pathname.startsWith("/_vercel/")) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found (served by Vercel in production)");
    return;
  }

  if (!isFile) {
    const rewrite = rewrites.find((r) => r.re.test(pathname));
    if (!rewrite) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    filePath = join(DIST, rewrite.destination);
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
    return;
  }

  res.setHeader("Content-Type", TYPES[extname(filePath)] ?? "application/octet-stream");
  res.writeHead(200);
  createReadStream(filePath).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`dist/ + vercel.json headers → http://localhost:${PORT}`);
});
