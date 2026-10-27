#!/usr/bin/env node
/**
 * Single source of truth for `vercel.json`'s response headers.
 *
 * The Content-Security-Policy has to carry a sha256 hash for every inline
 * <script> in `index.html` (there is one: the JSON-LD block). Vercel reads
 * `vercel.json` from the repo, *not* from the build output, so the hash cannot
 * be injected at build time — it has to be committed. That makes it easy for
 * the header and the HTML to drift apart silently, so:
 *
 *   npm run headers          rewrite vercel.json from this file
 *   npm run headers:check    fail if vercel.json is stale (local/CI check)
 *
 * After editing an inline <script> in index.html (which invalidates the CSP
 * hash), run `npm run headers` and commit the result.
 *
 * NOTE: intentionally NOT wired into `npm run build`. Vercel's `vercel build`
 * normalizes vercel.json before the build command runs, so a byte-exact
 * `--check` reports a false "out of date" on Vercel even when the committed
 * file is correct — gating the build on it breaks deploys. Run it locally.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HTML = resolve(ROOT, "index.html");
const VERCEL_JSON = resolve(ROOT, "vercel.json");

/** sha256-<base64> for every inline <script> in the document, in order. */
function inlineScriptHashes(html) {
  const hashes = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const [, attrs, body] = m;
    if (/\ssrc\s*=/i.test(attrs)) continue; // external, covered by 'self'
    hashes.push(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return hashes;
}

/**
 * Hosts the app actually talks to. Keep in sync with the code:
 *   - api.github.com          GitHubRepos demo panel
 *   - *.supabase.co (+ wss)   shared photobook + visitor log, incl. realtime
 *   - fonts.googleapis.com    the webfont stylesheet in index.html
 *   - fonts.gstatic.com       the woff2 files that stylesheet points at
 *   - va.vercel-scripts.com   @vercel/analytics (prod serves it same-origin,
 *     /vitals.vercel-insights   but the debug build and beacons use these)
 */
function contentSecurityPolicy(scriptHashes) {
  return [
    "default-src 'self'",
    // The inline JSON-LD is hash-pinned, so no 'unsafe-inline' for scripts.
    // 'unsafe-eval' IS required though: hydra-synth's live-coding wallpaper runs
    // every sketch through globalThis.eval() (node_modules/hydra-synth/src/lib/
    // sandbox.js), so without it the WebGL background silently dies to the CSS
    // fallback. This is inherent to hydra-synth and cannot be hashed away.
    `script-src 'self' 'unsafe-eval' ${scriptHashes.join(" ")} https://va.vercel-scripts.com`,
    // React, GSAP and Lenis all write inline style attributes; 'unsafe-inline'
    // is unavoidable here and is a far weaker capability than inline script.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Photobook rows are anonymously insertable, and /gallery still points at
    // Unsplash, so remote images stay open — but only over TLS.
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: data: blob:",
    "connect-src 'self' https://api.github.com https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    // The retro browser panel and the calendar embed frame arbitrary https URLs.
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "child-src 'self' https: blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function securityHeaders(csp) {
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Photobooth is the only capability the site legitimately needs. The
    // motion sensors are `(self)` rather than `()` only because p5 attaches
    // deviceorientation/devicemotion listeners unconditionally and a bare `()`
    // makes it log a policy violation on every load; `(self)` still denies
    // every iframe, which is where the toy browser panel makes it matter.
    {
      key: "Permissions-Policy",
      value: [
        "camera=(self)",
        "accelerometer=(self)",
        "gyroscope=(self)",
        "microphone=()",
        "geolocation=()",
        "payment=()",
        "usb=()",
        "midi=()",
        "serial=()",
        "bluetooth=()",
        "magnetometer=()",
        "display-capture=()",
        "interest-cohort=()",
      ].join(", "),
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ];
}

/** Static assets are content-hashed by Vite, so they can be cached forever. */
const STATIC_ASSET_ROUTE = "/assets/(.*)";
// `llms.txt` was removed on purpose (2026-10): it was a hand-written summary
// for AI crawlers, which is the opposite of the current posture. If you add a
// root-level file here, also add it to the SPA rewrite exclusion below.
const ROOT_FILES =
  "favicon\\.svg|apple-touch-icon\\.png|og-cover\\.png|robots\\.txt|sitemap\\.xml|site\\.webmanifest|humans\\.txt|\\.well-known/security\\.txt";
const ROOT_FILE_ROUTE = `/(${ROOT_FILES})`;
/**
 * Everything that is *not* one of the two routes above. Written as a negative
 * lookahead rather than a bare `/(.*)` on purpose: when several `headers` rules
 * match one request, Vercel applies them all and the later `Cache-Control`
 * silently wins — so a catch-all sitting below `/assets/(.*)` is what decides
 * whether hashed assets are immutable or `max-age=0`. Non-overlapping sources
 * mean the answer never depends on rule order.
 */
const APP_SHELL_ROUTE = `/((?!assets/|${ROOT_FILES}).*)`;

function buildConfig(html) {
  const csp = contentSecurityPolicy(inlineScriptHashes(html));
  return {
    $schema: "https://openapi.vercel.sh/vercel.json",
    headers: [
      {
        source: STATIC_ASSET_ROUTE,
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        source: ROOT_FILE_ROUTE,
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // index.html for every SPA route: never cache the shell, always carry
        // the full security header set.
        source: APP_SHELL_ROUTE,
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          // Not a standard, but the de-facto opt-out that several crawlers
          // (and the Content-Signal spec) understand. Real enforcement is the
          // Vercel WAF; this is the polite, machine-readable layer. Google
          // ignores unrecognized values, so Search is unaffected.
          { key: "X-Robots-Tag", value: "noai, noimageai" },
          ...securityHeaders(csp),
        ],
      },
    ],
    redirects: [
      // RFC 9116 says the canonical location is /.well-known/security.txt, but
      // the /security.txt alias is still what a lot of tooling probes for.
      {
        source: "/security.txt",
        destination: "/.well-known/security.txt",
        permanent: true,
      },
      // llms.txt was removed. Without this the SPA rewrite would answer it with
      // index.html and a 200, which is exactly the wrong signal to an AI
      // crawler; point it at the file that actually states the policy.
      {
        source: "/llms.txt",
        destination: "/robots.txt",
        permanent: true,
      },
    ],
    rewrites: [
      {
        source: `/((?!assets/|api/|${ROOT_FILES}).*)`,
        destination: "/index.html",
      },
    ],
  };
}

const expected = `${JSON.stringify(buildConfig(readFileSync(HTML, "utf8")), null, 2)}\n`;

if (process.argv.includes("--check")) {
  let actual = "";
  try {
    actual = readFileSync(VERCEL_JSON, "utf8");
  } catch {
    /* missing file → stale */
  }
  if (actual !== expected) {
    console.error(
      "\n✗ vercel.json is out of date with scripts/security-headers.mjs.\n" +
        "  (Most likely you edited an inline <script> in index.html, which\n" +
        "  invalidates the CSP hash.)  Fix it with:\n\n    npm run headers\n",
    );
    process.exit(1);
  }
  console.log("✓ vercel.json security headers are up to date");
} else {
  writeFileSync(VERCEL_JSON, expected);
  console.log("✓ wrote vercel.json");
}
