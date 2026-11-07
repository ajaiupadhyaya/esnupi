# BASIS Lab

An AI-assisted research pipeline that drafts BASIS issues and opens them as **draft pull
requests**. Nothing reaches ajaiupadhyaya.com until you merge.

```
 feeds (free)  ─┐
 web search    ─┴─▶ 1. SCOUT (Sonnet)     5 testable topics, picks one
                    2. RESEARCH (Sonnet)  writes + runs Python on free data in the runner
                         └─ analysis.py re-run from scratch to prove it reproduces
                    3. WRITE (Opus)       MDX in the house style (lab/style/STYLE.md)
                    4. REFEREE (Sonnet)   number audit + independent review → 1 revision
                    5. PACKAGE            src/content/basis/NNN-slug.mdx, public/basis/slug/*.svg
                         └─ MDX compiled exactly as the site does
                    ▶ draft PR with a review brief + Vercel preview
```

## One-time setup

1. **API key.** In the Claude Console create a key named `basis-lab`. Optional but
   recommended: put it in its own workspace with a spend limit, as a second cap.
2. **Secret.** GitHub → esnupi → Settings → Secrets and variables → Actions → New
   repository secret: `ANTHROPIC_API_KEY`.
3. **PR permission.** Settings → Actions → General → Workflow permissions: choose
   *Read and write permissions* and tick *Allow GitHub Actions to create and approve pull
   requests*.
4. **Run it.** Actions → BASIS Lab → Run workflow. Leave `topic` blank to let the scout
   choose, or give it a question. It also runs every Monday at 14:17 UTC.

## Reviewing a draft

The PR body has the referee's verdict, run cost, a checklist, numbers the audit could not
trace, likely interview questions, and the other topics the scout proposed. Open the
Vercel preview, read the page, edit the MDX on the branch if needed, then mark the PR ready
and merge. Close it to discard.

All the evidence lives in `lab/runs/<date>-<slug>/`: `analysis.py`, `results.json`,
`notes.md`, figures, both drafts, referee reports, `logs/costs.json`. Failed runs don't
open a PR; download the `basis-lab-run` artifact from the workflow run to see why.

## Budget

`lab/config.toml → [budget]`. Currently a **$10 lifetime trial cap**, at most $3.50 per run,
with per-stage caps. Spend is priced from every API response's usage block and saved after
every call to `ledger.json` on the `lab-state` branch. When less than $1.50 remains, runs
skip. To go monthly, raise `total_usd` (the ledger keeps counting; e.g. set it to
`ledger total + 90`).

Expected cost per issue: about $0.80–$2.50, mostly research and the Opus draft.

## Tuning

- Feeds, search targets and allowed free data: `[sources]` in `config.toml`.
- Models per stage: `[models]`. Swap the writer to Sonnet to roughly halve the cost.
- Voice and structure: `style/STYLE.md` and the `[style].exemplars` issues.
- Charts: `toolkit/basischart.py` (house-style SVG, no dependencies).

## Local runs

```bash
cd lab
pip install -r requirements.txt
python -m basis_lab.run --mock              # offline dry run, no API calls
ANTHROPIC_API_KEY=... python -m basis_lab.run --topic "..."   # real run, local ledger lab/state/
```

## Safety

Generated code runs in the GitHub runner with network access but **without** the API key
or GitHub token in its environment, and file tools can't leave the run directory. The
runner is thrown away after each job.
