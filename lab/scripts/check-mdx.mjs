// Compile one MDX file exactly the way the site does (@mdx-js + remark-gfm).
// Usage: node lab/scripts/check-mdx.mjs path/to/issue.mdx
// Exits non-zero with the compiler's message if the file would break the build.
import { readFile } from "node:fs/promises";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const file = process.argv[2];
const src = await readFile(file, "utf8");
try {
  await compile(src, { remarkPlugins: [remarkGfm] });
  if (!/export const meta = \{[\s\S]*?number:\s*\d+[\s\S]*?title:[\s\S]*?date:/.test(src)) {
    throw new Error("missing or incomplete `export const meta` (number, title, date)");
  }
  console.log(`ok ${file}`);
} catch (e) {
  console.error(`MDX error in ${file}: ${e.message}`);
  process.exit(1);
}
