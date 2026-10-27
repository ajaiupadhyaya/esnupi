# Security hardening (Oct 2026)

Context for the edge rules, DNS records, and crawler policy that protect
`ajaiupadhyaya.com`. Written after a live scraping/probing incident; everything
here is reproducible from the repo or the Vercel/Porkbun dashboards.

## Why

On **2026-10-27, ~19:00–19:30 UTC**, a single host (`34.118.177.189`, Google
Cloud AS396982, Canada) sent **494 requests in ~30 minutes**, rotating and
spoofing user agents (`ClaudeBot`, `GPTBot`, `OAI-SearchBot`, `Perplexity-User`,
`DeepSeek`, `GrokBot`, `Kimi`, a fake Chrome UA) while probing:

```
/.env  /.env.local  /.env.production  /@fs/.env  /app  /userfiles
/__vite_rsc_findSourceMapURL  /api  /../../../../.env
```

Vercel's DDoS mitigation denied all 494 requests and the AI Bots managed rule
caught 3 more. **There is no evidence of compromise**: `dist/` ships no source
maps or dotfiles, Supabase is paused (its hostname does not resolve), and the
probes only ever reached Vercel's edge.

The lesson is that a personal site still needs an edge posture: bots do not
care that there is nothing to steal.

## Edge posture (Vercel Firewall, Hobby plan)

Hobby allows **3 custom rules (1 of which may be a rate limit)**, **10 IP
blocks**, the AI Bots managed rule, and Bot Protection. There is no IP bypass
list and no OWASP managed ruleset.

| # | Rule | Match | Action |
|---|------|-------|--------|
| 1 | `Deny sensitive-file and scanner paths` | path matches dotfiles, `.env*`, `.git`, `wp-admin`, `wp-login`, `xmlrpc.php`, `phpmyadmin`, `server-status`, `@fs`, `__vite`, `..%2f` traversal, `*.php`, `*.sql`, `*.bak`, `*.map` | Deny |
| 2 | `Deny AI scrapers, hostile methods, hosting ASNs` | UA contains `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`, `Bytespider`, `CCBot`, `Amazonbot`, `Applebot-Extended`, `meta-externalagent`, `Google-Extended`, `Diffbot`, `ImagesiftBot`, `Omgilibot`, `YouBot`, `DeepSeek`, `GrokBot`, `Kimi`, `MistralAI` **OR** method is not `GET`/`HEAD`/`OPTIONS` **OR** ASN is `396982` (GCP), `14061` (DigitalOcean), `16276` (OVH), `24940` (Hetzner), `63949` (Linode), `20473` (Vultr) | Deny |
| 3 | `Rate limit 120 req/min per IP` | all paths | Challenge above 120 requests / 60 s, keyed by client IP |
| — | IP block | `34.118.177.189` | Deny |
| — | Managed: AI Bots | — | Deny |
| — | Bot Protection | — | Challenge |

Notes:

- Blocking whole hosting ASNs is deliberately aggressive. It costs nothing
  here: real visitors come from residential/mobile ISPs and search crawlers run
  on their own ASNs. If a legitimate user ever reports a block, remove that ASN
  first, not the whole rule.
- The rate limit is intentionally generous for a static SPA (one page load is
  tens of asset requests); tightening it starts challenging real browsers on
  slow connections.
- Non-`GET`/`HEAD`/`OPTIONS` are denied at the edge because the site has no
  write API of its own. Supabase traffic goes to Supabase directly and is not
  affected.

### Attack Mode

Vercel **Attack Mode is a temporary switch, not a setting**. It was enabled
during the incident and expires on its own; it must be turned off from an
interactive shell because the CLI classifies it as a dangerous operation:

```bash
vercel firewall attack-mode disable
```

Until it is off, every non-verified client (including `curl` and CI) receives
the Vercel challenge instead of the site, which makes header checks look broken.

## Crawler policy (repo)

- `public/robots.txt` — explicit `Disallow: /` groups for AI training and
  scraper agents, plus a `Content-Signal: search=yes, ai-train=no, ai-input=no`
  line. **`Bingbot` is intentionally not blocked**: it is the real search index
  and blocking it would drop the site from Bing. `Google-Extended` only governs
  AI training, not Search, so it is safe to block.
- `public/llms.txt` — **deleted**. It was a hand-written summary for AI
  crawlers, i.e. the opposite of the current posture.
- `vercel.json` — HTML responses carry `X-Robots-Tag: noai, noimageai`.
  Google ignores unknown values, so Search is unaffected.
- `public/.well-known/security.txt` — RFC 9116 contact point for reports, with
  `/security.txt` permanently redirected to it.

Regenerate `vercel.json` after editing `index.html` or the header script:

```bash
npm run headers         # rewrite
npm run headers:check   # verify
```

(`llms.txt` was also removed from the root-file allowlists in
`scripts/security-headers.mjs`; add new root files there *and* to the SPA
rewrite exclusion, or they will be served `index.html`.)

## DNS (Porkbun)

The domain has no SPF, DMARC, CAA, or DNSSEC. Records to add — Porkbun →
**DNS Records**, host field is relative to `ajaiupadhyaya.com`:

| Type | Host | Answer / Value | TTL |
|------|------|----------------|-----|
| TXT | `@` (blank) | `v=spf1 -all` | 600 |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; pct=100; fo=1; rua=mailto:ajaiupad@gmail.com` | 600 |
| CAA | `@` (blank) | `0 issue "letsencrypt.org"` | 600 |
| CAA | `@` (blank) | `0 issue "pki.goog"` | 600 |
| CAA | `@` (blank) | `0 issuewild "letsencrypt.org"` | 600 |
| CAA | `@` (blank) | `0 issuewild "pki.goog"` | 600 |
| CAA | `@` (blank) | `0 iodef "mailto:ajaiupad@gmail.com"` | 600 |

In Porkbun's CAA editor the fields are **Flags** (`0`), **Tag**
(`issue` / `issuewild` / `iodef`), and **Value** (`letsencrypt.org`,
`pki.goog`, or `mailto:ajaiupad@gmail.com`). CAA is inherited by subdomains, so
one root set covers `www` and the apex.

Why these:

- `v=spf1 -all` — the domain sends no mail. `-all` (hard fail) tells receivers
  to reject anything claiming to be from it. Receiving still works: MX points at
  Porkbun forwarding (`fwd1/fwd2.porkbun.com`), which is unaffected by SPF.
- DMARC `p=reject` with strict alignment — nothing legitimate sends as this
  domain, so reject outright. Reports go to the Gmail address. No DKIM record is
  needed because Porkbun forwarding rewrites the envelope and does not sign as
  this domain.
- CAA — pins certificate issuance to Let's Encrypt (what Vercel uses) and Google
  Trust Services (fallback), and blocks every other CA from mis-issuing.
- **DNSSEC** — enable the toggle in Porkbun → **Details** (domain settings).
  Porkbun publishes the DS record automatically for `.com`. This protects
  against DNS spoofing/cache poisoning; wait for it to show `active` before
  relying on it.

Also, while in the Porkbun dashboard: enable **registrar lock** and **2FA** on
the account. Domain takeover is a far cheaper attack than anything at the edge.

## Supabase

`sqyypzixzprkiwapzidc.supabase.co` is **paused** and does not resolve, which
takes the anonymous-write surface (photobook + visitor log) offline. The client
code degrades gracefully. If the project is ever restored, apply
`supabase/secure_public_submissions.sql` first — it adds row-level security and
per-IP write budgets so the anon key cannot be used to fill the tables.

## Verification checklist

After Attack Mode is off and this branch is deployed:

```bash
# should be 200
curl -sS -o /dev/null -w '%{http_code}\n' https://ajaiupadhyaya.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://ajaiupadhyaya.com/robots.txt
curl -sS -o /dev/null -w '%{http_code}\n' https://ajaiupadhyaya.com/.well-known/security.txt
curl -sS -o /dev/null -w '%{http_code}\n' -L https://ajaiupadhyaya.com/security.txt

# should be 403 (WAF)
curl -sS -o /dev/null -w '%{http_code}\n' -A 'GPTBot' https://ajaiupadhyaya.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://ajaiupadhyaya.com/.env
curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://ajaiupadhyaya.com/

# headers
curl -sSI https://ajaiupadhyaya.com/ | grep -Ei 'x-robots-tag|content-security-policy|strict-transport'
dig +short TXT ajaiupadhyaya.com
dig +short TXT _dmarc.ajaiupadhyaya.com
dig +short CAA ajaiupadhyaya.com
```

`GET /robots.txt` and `/.well-known/security.txt` deliberately stay reachable
even though AI agents are denied: they are the machine-readable "no", and a
blocked crawler cannot read them.

## Known gaps

- `npm audit --omit=dev` reports 3 advisories (`postcss-selector-parser`,
  `source-map-js`, `zod`). They look build-time/transitive; no runtime exposure
  found yet, but they should be cleared before the next dependency bump.
- Hobby traffic logs only go back 24 hours, so incident forensics are
  time-boxed. Export anything worth keeping the same day.
