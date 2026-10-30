# BASIS issues

Each issue of BASIS is one `.mdx` file in this folder. It appears at
`/basis` (the issue list) and `/basis/<filename>` (the issue itself) as soon as
it is committed and deployed. Nothing else needs editing.

1. Copy `_template.mdx` to a new file named after the issue, e.g.
   `2026-10-12.mdx` or `001-rates-reprice.mdx`. The filename becomes the URL.
2. Fill in `export const meta` at the top: `number`, `title`, `date` (ISO,
   `YYYY-MM-DD`) and an optional one-line `dek`.
3. Write the issue below it in Markdown. Headings, lists, tables, links, bold and
   italics all work. Images go in `public/basis/` and are referenced as
   `/basis/<file>`.
4. Commit and push. Issues are sorted by `number`, newest first.

Files that start with `_` are ignored, so the template never ships.
