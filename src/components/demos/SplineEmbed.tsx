import Spline from "@splinetool/react-spline";

/** Set `VITE_SPLINE_URL` to your published Spline scene URL (dashboard → Export → Public URL). */
export function SplineEmbed() {
  const url = import.meta.env.VITE_SPLINE_URL;
  if (!url) {
    return (
      <p className="text-sm text-muted-foreground">
        Add{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          VITE_SPLINE_URL
        </code>{" "}
        in <code className="font-mono text-xs">.env</code> to embed your Spline scene.
      </p>
    );
  }
  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
      <Spline scene={url} className="h-full w-full" />
    </div>
  );
}
