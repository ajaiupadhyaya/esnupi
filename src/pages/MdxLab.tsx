import Hello from "@/content/hello.mdx";
import { Link } from "react-router-dom";

export default function MdxLab() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-6">
      <article className="prose prose-invert prose-sm max-w-none prose-headings:tracking-tight prose-a:text-primary">
        <Hello />
        <p className="not-prose mt-10">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            ← Back home
          </Link>
        </p>
      </article>
    </div>
  );
}
