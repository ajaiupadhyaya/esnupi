import { PHOTO_MANIFEST } from "./manifest";

const photoModules = import.meta.glob(
  "/src/photography/images/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP}",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

function prettyName(file: string): string {
  const base = file.replace(/\.[^.]+$/, "");
  const t = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return t.length ? t : "Untitled";
}

/** Empty or whitespace-only strings in the manifest → use fallback / empty UI. */
function trimmedOrUndefined(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t?.length ? t : undefined;
}

export type FilmPhoto = {
  id: string;
  src: string;
  file: string;
  title: string;
  location: string;
  blurb: string;
};

export function buildFilmPhotoLibrary(): FilmPhoto[] {
  const byFile = new Map<string, { id: string; src: string; file: string }>();
  for (const [path, src] of Object.entries(photoModules)) {
    const file = path.split("/").pop() ?? path;
    byFile.set(file, { id: path, src, file });
  }

  const used = new Set<string>();
  const ordered: FilmPhoto[] = [];

  for (const entry of PHOTO_MANIFEST) {
    const mod = byFile.get(entry.file);
    if (!mod) continue;
    used.add(entry.file);
    const titleFromManifest = trimmedOrUndefined(entry.title);
    ordered.push({
      ...mod,
      title: titleFromManifest ?? prettyName(entry.file),
      location: trimmedOrUndefined(entry.location) ?? "",
      blurb: trimmedOrUndefined(entry.blurb) ?? "",
    });
  }

  const rest = [...byFile.entries()]
    .filter(([f]) => !used.has(f))
    .sort((a, b) => a[0].localeCompare(b[0]));

  for (const [, mod] of rest) {
    ordered.push({
      ...mod,
      title: prettyName(mod.file),
      location: "",
      blurb: "",
    });
  }

  return ordered;
}
