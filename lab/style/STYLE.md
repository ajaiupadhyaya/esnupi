# BASIS house style

Distilled from issues 001–007 in `src/content/basis/`. The writer follows this
exactly; the referee checks against it. When this guide and an example issue
disagree, the example issue wins.

## What a BASIS issue is

A short, honest research note by AJ Upadhyaya. One question, real data, real
code, a clear answer, and an equally clear account of what the answer does
*not* show. The reader is a quant researcher or trader at a firm like Jane
Street, Citadel or D. E. Shaw, deciding in two minutes whether the author
thinks carefully. Length: 1,500–2,800 words.

The register is a careful working paper written in plain English. It is not a
blog post, not a newsletter, not marketing, and never breathless.

## File format

```mdx
export const meta = {
  number: 8,
  title: "Sentence-case question or claim, no trailing period",
  date: "YYYY-MM-DD",
  dek: "One or two sentences: the finding and its main limit.",
};

<Lead paragraph: 3–5 sentences. State the result with its key number, then
the biggest caveat, in the first paragraph. No throat-clearing.>

**[Read the code →](https://github.com/ajaiupadhyaya/esnupi/tree/main/lab/runs/<slug>)** One sentence on what is reproducible from it.

## Summary

- **What it is.** …
- **What happened.** / **What it found.** …
- **What it does not show.** …

## 1. <Section title in sentence case>
…
## N. Limits
## N+1. What I'd do next
## N+2. How this was made
## Sources
```

- Section headings are `## 1. Title`, numbered, sentence case, often a
  plain claim or question ("Where the near-perfect scores came from",
  "Why the pass is weak evidence"). `Summary` and `Sources` are unnumbered.
- The Summary is four bold-lead bullets. Bold leads are short and end in a
  period: **What it is.** **What happened.** **What it found.** **What it
  does not show.** (Small variations are fine, e.g. **What the test found.**)
- No heading levels besides `##`. No emoji, no HTML, no JSX components:
  plain Markdown only (GFM tables are fine). Avoid bare `{` `}` `<` `>` in
  prose — MDX treats them as code; write "less than" or use inline code.
- Figures: `![Alt text that states the finding, with numbers](/basis/<slug>/<file>.svg)`.
  The alt text is a full sentence that says what the chart shows, e.g.
  "Polymarket's slope gap to Betfair falls from −0.012 at kickoff to −0.001 an hour earlier".
  Every figure is referenced by the prose around it. 2–4 figures per issue.
- Tables: GFM, a header row, numbers right where the reader needs them.
  Use tables for results, sample construction, limits ("Limit | What it means").
- Use the real minus sign (−) for negative numbers in prose and tables.
  Thousands separators: 6,555. Percent: 7.73%. Units after numbers.
  Dates in prose: 25 October 2026 or 2025-26 for seasons; ISO in meta.
- Inline code for identifiers, files, tickers in code context: `survival_months`.

## Voice

- First person singular, sparingly: "I set the margin after seeing these numbers."
- Short declarative sentences. One idea per sentence. Concrete subjects.
- Lead with the finding, then qualify it. Never bury a caveat.
- Distinguish confirmatory from exploratory explicitly. If something was
  chosen after seeing data, say so in the same breath as the number.
- Say what a number means in plain terms right after giving it
  ("A mean gap of 0.002 nats means one side gave what happened about 0.2% more
  probability…").
- Prefer "does not show", "cannot tell", "is not evidence for" over hedging
  adverbs. No "arguably", "interestingly", "it is worth noting", "delve",
  "landscape", "robust" (unless a robustness test), "game-changer", "unlock",
  "in today's fast-paced", "crucial", "leverage" (verb).
- No rhetorical questions in the body. No exclamation marks.
- Numbers carry the argument. Every claim that can have a number has one,
  with its sample size and, where relevant, a standard error or interval.
- Name the method precisely (Newey-West s.e., 200 bootstrap resamples, TOST at
  5% each side) and cite the methods literature in Sources.

## Required honesty sections

- **Limits.** A table: `| Limit | What it means |`, 4–8 rows. Include data
  limits, method limits, look-ahead or selection risk, and scope.
- **What I'd do next.** A numbered list of 2–4 concrete next steps, each
  starting with a bold imperative ("**Run it once.**").
- **How this was made.** One paragraph. Exact template, adjusted to fit:
  "The code, analysis and drafts were produced with Claude, Anthropic's
  language model, through an automated research pipeline under my direction.
  I chose to pursue the question, reviewed the code and results, edited the
  draft and take responsibility for the content." Add any conflicts or
  positions ("I hold no position in …").
- **Sources.** One paragraph, not a bulleted list. Group as: Project (code
  link), Data (each source with link and what was used), Methods (author,
  year, what for). Then a final plain paragraph: what the page is *not*
  ("This is a description of one sample, not a trading signal…") and that the
  key choices "are mine to argue with".

## What never goes in

- Any number not produced by the analysis code or quoted from a cited source.
- Claims about what a firm "thinks" or "does internally".
- Investment advice, price targets, "buy"/"sell".
- Copied passages from source blogs or papers. Paraphrase and cite.
- Fake precision: report to the precision the standard error supports.
