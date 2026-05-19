import Spline from "@splinetool/react-spline";

/** Set `VITE_SPLINE_URL` to your published Spline scene URL (dashboard → Export → Public URL). */
export function SplineEmbed() {
  const url = import.meta.env.VITE_SPLINE_URL;
  if (!url) return null;
  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
      <Spline scene={url} className="h-full w-full" />
    </div>
  );
}
