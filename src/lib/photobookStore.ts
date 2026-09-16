import type { RealtimeChannel } from "@supabase/supabase-js";

import { hasSupabaseConfig, supabase } from "./supabaseClient";
import { getVisitorDisplayName } from "./visitorIdentity";

export type SharedPhoto = {
  id: string;
  image_url: string;
  created_at: string;
  visitor_name?: string | null;
};

export type LoadSharedPhotosResult = {
  photos: SharedPhoto[];
  /** Both REST attempts failed (offline, DNS, RLS, etc.). */
  failed: boolean;
};

/**
 * Client-side mirror of the `museum_photos_image_url_shape` DB constraint in
 * `supabase/harden_public_write_tables.sql`. The database is the real gate (the
 * client can never be trusted), but validating here too gives fast feedback on
 * write and defends the render path against any legacy/pre-constraint row: only
 * https URLs or base64 raster-image data URLs, and nothing enormous. Notably
 * this excludes `data:image/svg+xml` — SVG can carry script.
 */
export const MAX_IMAGE_URL_LENGTH = 6_000_000;
const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/;

export function isSafeImageUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  if (url.length === 0 || url.length > MAX_IMAGE_URL_LENGTH) return false;
  return url.startsWith("https://") || DATA_IMAGE_RE.test(url);
}

function isLikelyNetworkFailure(err: { message?: string } | null): boolean {
  const m = (err?.message ?? "").toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("fetch") && m.includes("aborted")
  );
}

/** Drop any row whose image_url would not pass the DB constraint (legacy rows). */
function safePhotos(rows: unknown): SharedPhoto[] {
  if (!Array.isArray(rows)) return [];
  return (rows as SharedPhoto[]).filter((p) => isSafeImageUrl(p?.image_url));
}

export async function loadSharedPhotos(limit = 200): Promise<LoadSharedPhotosResult> {
  if (!supabase) return { photos: [], failed: false };
  const wide = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at,visitor_name")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!wide.error) return { photos: safePhotos(wide.data), failed: false };
  if (isLikelyNetworkFailure(wide.error)) {
    return { photos: [], failed: true };
  }
  const narrow = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!narrow.error) return { photos: safePhotos(narrow.data), failed: false };
  return { photos: [], failed: true };
}

export async function addSharedPhoto(imageUrl: string): Promise<SharedPhoto> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  if (!isSafeImageUrl(imageUrl)) {
    throw new Error("Unsupported image: only https URLs or base64 image data are allowed.");
  }
  const visitorName = getVisitorDisplayName();
  const payload: Record<string, string> = { image_url: imageUrl };
  if (visitorName) payload.visitor_name = visitorName;

  const attempt = await supabase
    .from("museum_photos")
    .insert(payload)
    .select("id,image_url,created_at,visitor_name")
    .single();
  if (!attempt.error) return attempt.data as SharedPhoto;

  const fallback = await supabase
    .from("museum_photos")
    .insert({ image_url: imageUrl })
    .select("id,image_url,created_at")
    .single();
  if (fallback.error) throw fallback.error;
  return { ...fallback.data, visitor_name: visitorName ?? null } as SharedPhoto;
}

export function subscribeToSharedPhotos(onChange: () => void): RealtimeChannel | null {
  if (!supabase || !hasSupabaseConfig) return null;
  const channel = supabase
    .channel("museum-photos-stream")
    .on("postgres_changes", { event: "*", schema: "public", table: "museum_photos" }, () => {
      onChange();
    })
    .subscribe();
  return channel;
}

export function unsubscribeSharedPhotos(channel: RealtimeChannel | null) {
  if (!supabase || !channel) return;
  void supabase.removeChannel(channel);
}
