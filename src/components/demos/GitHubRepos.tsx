import { DateTime } from "luxon";
import { useEffect, useState } from "react";

type Repo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  pushed_at: string | null;
};

const user = import.meta.env.VITE_GITHUB_USER ?? "octocat";

export function GitHubRepos() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=5`,
        );
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as Repo[];
        if (!cancelled) setRepos(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setErr("Could not load repos (rate limit or network).");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-muted-foreground">{err}</p>;
  }
  if (!repos) {
    return <p className="text-sm text-muted-foreground">Loading GitHub…</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {repos.map((r) => (
        <li key={r.id} className="border-b border-border/60 pb-2 last:border-0">
          <a
            href={r.html_url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {r.name}
          </a>
          {r.description ? (
            <p className="mt-0.5 text-muted-foreground">{r.description}</p>
          ) : null}
          {r.pushed_at ? (
            <p className="mt-1 text-xs text-muted-foreground">
              pushed{" "}
              {DateTime.fromISO(r.pushed_at).toRelative({
                base: DateTime.now(),
              })}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
