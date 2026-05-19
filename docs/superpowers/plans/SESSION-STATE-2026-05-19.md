# Session state — 2026-05-19 (pause point)

## Live site
- Production URL still serves commit **`56c2797`** (pre-fix). Deployment id: `dpl_CwZhdn7qjAXeXYkZxVPDavrYJ7Pi`. Site is up.
- Rollback tag: `pre-production-fix-2026-05-19` → `56c2797` (pushed to origin).

## main branch (origin) — 26 commits ahead of pre-fix tag
HEAD is **`2629995`** (`perf(imagetools): drop AVIF + 480w`). Local build at this commit: **7 s**, dist 159 MB, entry chunk 364 KB.

## Vercel deployments
| State | Id | Commit | Notes |
|---|---|---|---|
| QUEUED | `dpl_BSV7jWTX49zeRQCiW7cjJgVHuVv1` | `2629995` | The fix. Waiting on slot. |
| BUILDING (stuck) | `dpl_7kpS1ihMgukfMn5p31Z3uJyeCbMB` | `1303f3e` | Hanging on AVIF transforms. Needs manual cancel. |
| ERROR | `dpl_FXDumvkfCEA2jwaJFU4S6F5Jdm84` | `874cc80` | Original failed deploy — peer-dep ERESOLVE. |

## Immediate next step on resume
1. **Cancel the stuck build** in Vercel dashboard:
   `https://vercel.com/ajaiupadhyayas-projects/esnupi/7kpS1ihMgukfMn5p31Z3uJyeCbMB` → ⋯ → Cancel.
   (Or: authorize me to run `npx vercel rm dpl_7kpS1ihMgukfMn5p31Z3uJyeCbMB --yes`.)
2. Once cancelled, `dpl_BSV7jWTX49zeRQCiW7cjJgVHuVv1` will start building automatically. Expected ~2–3 min total on Vercel.
3. Watch for state `READY` via `mcp__plugin_vercel_vercel__get_deployment` with `idOrUrl=dpl_BSV7jWTX49zeRQCiW7cjJgVHuVv1`.
4. If READY: the new build is live at `https://ajaiupadhyaya.com/`. Smoke-test in a browser.
5. If ERROR: pull `get_deployment_build_logs` and diagnose.

## Root-cause story (what went wrong post-merge)
- Subagent used `vite-imagetools@10` locally with `--legacy-peer-deps` since v10 requires vite ≥7 and we're on vite 6. **Local installs hid the peer conflict; Vercel's clean `npm install` did not.** → fixed in `1303f3e` by pinning `vite-imagetools@^9`.
- That fix triggered a second slow-build problem: sharp's AVIF encoder is ~10x slower than WebP. Vercel's 2-core builder pushed past 10 min on 75 photos × 9 variants. → fixed in `2629995` by reducing to `format=webp;jpg&w=1024;2048` (4 variants instead of 9).
- Vercel did not auto-cancel the in-progress slow build when the new commit landed (unusual — typically it does). That's why the queue is stuck.

## Pending user-blocked items (unchanged from pre-pause)
- Replace Unsplash placeholders + final copy in `src/lib/projectsData.ts`.
- Drop `public/og-cover.png` (1200×630) and `public/apple-touch-icon.png` (180×180).
- Run `supabase/site_visitor_log.sql` in your Supabase SQL editor to apply the RLS role tweak.
- Verify outbound hrefs in `projectsData.ts` and `ContentPanels.tsx`.

## Rollback recipe (if the new build ships and something's wrong)
- **Vercel:** in dashboard, find `dpl_CwZhdn7qjAXeXYkZxVPDavrYJ7Pi` → "Promote to Production".
- **Local source:** `git checkout pre-production-fix-2026-05-19` (read-only inspection) or
  `git reset --hard pre-production-fix-2026-05-19 && git push --force-with-lease origin main` (full revert; destructive — confirm before running).
