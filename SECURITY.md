# Security controls and deployment

This is a public portfolio. The shared photobook and guestbook intentionally accept
anonymous submissions. Visitor names are display labels, not authenticated identity.
The secret desktop panel and all bundled media are public content, even if hidden
behind UI interactions.

## Deploy the October 4, 2026 fixes

1. Use Node 22 or newer. Run `npm ci`, `npm run test:security`,
   `npm run headers:check`, and `npm run build`.
2. Restore the inactive Supabase project through its dashboard. Review its actual
   schema, policies, grants, triggers, and existing data before applying SQL.
3. Apply `supabase/secure_public_submissions.sql` after the existing schema and
   `harden_public_write_tables.sql`. The new migration preserves existing rows,
   replaces the image/name constraints, and applies checks to future writes.
   Do not run the older hardening SQL after the new migration.
4. Deploy the rebuilt app through the existing Vercel deployment flow.
5. Verify real production responses, a normal photobooth submission, and database
   policies/grants. Production verification was blocked during the local audit.

The migration gives each table a private counter protected by a row lock, so
concurrent inserts cannot bypass a budget. Every insert receives a fresh UUID and
server timestamp. All public/authenticated table privileges are revoked and only
SELECT/INSERT are restored; RLS is enabled. Counters are inaccessible to these roles.

| Table | Per minute | Per UTC day | Maximum stored rows |
| --- | ---: | ---: | ---: |
| museum_photos | 10 | 100 | 500 |
| site_visitor_log | 30 | 1000 | 5000 |

Photos must be raster base64 data URLs no larger than 1,000,000 bytes. Arbitrary
remote image URLs are rejected on write and hidden on read, including legacy rows.
Existing photos larger than the new limit are also hidden. No existing rows are
deleted. Normal 480x360 photobooth captures and the four-shot strip remain supported.
Names are limited to 60 characters. The client loads 50 photos by default, at most 100.

When a total-row limit is reached, submissions stop until an administrator reviews
and removes records or deliberately adjusts the limit. The migration does not delete
visitor content automatically. Global budgets can still be exhausted by one attacker:
add a server-side submission gateway with server-verified CAPTCHA, durable per-client
rate limits, image decoding/re-encoding, and moderation before treating anonymous
writes as abuse-resistant. A public API key is not a secret or a bot defense.
Direct reads and realtime can still consume bandwidth; review platform quotas and
consider smaller thumbnails and disabling realtime on large collections.

## Verification

`npm run test:security` checks actual image validation, shader input normalization,
no retry after a rejected photo write, and the preview server's malformed-path,
symlink-escape, missing-asset, and SPA behavior using disposable fixtures.

`tests/public-submissions.sql` runs inside a rolled-back transaction. Use it only
in a disposable PostgreSQL database with roles `anon`, `authenticated`, public
schema usage, publication `supabase_realtime`, the original schema, hardening SQL,
and the new migration. It verifies server identity/timestamps, rejected URLs and
names, table/counter privileges, minute/day caps, and the total-photo ceiling.
Do not run these administrative fixture tests against production.

## Remaining dependency advisory

Sharp is updated to ^0.35.5 and overridden across the dependency tree. The existing
Vite/imagetools APIs are retained and the full image build passes. The npm audit
still reports seven high-severity entries from the same unpatched braces advisory:
https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

This dependency processes build-time glob patterns through Tailwind/chokidar,
not visitor input in this static deployment. Keep patterns and build inputs trusted.
Do not run the Vite development server publicly. Recheck the registry for a fix;
`npm audit fix --force` proposes disruptive downgrades and is not appropriate here.

Hydra still requires CSP `unsafe-eval` for authored sketches. Numeric shader inputs
are normalized before generating source; no remote user-authored code execution
feature was found. Replacing or isolating Hydra would allow a stricter script policy.
The toy browser iframe now uses an opaque origin and cannot open popups or request
extra sandbox permissions; some embedded sites may need to be opened in a full tab.

No audit guarantees complete security. Repeat review when integrations or write
paths change, and monitor hosting/database account access and quotas.
