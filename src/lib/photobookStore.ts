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

/** Only bounded raster data URLs: shared rows must not beacon to third parties. */
export const MAX_IMAGE_URL_LENGTH = 1_000_000;
const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isSafeImageUrl(url: unknown): url is string {
  return typeof url === "string" && url.length <= MAX_IMAGE_URL_LENGTH && DATA_IMAGE_RE.test(url);
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

export async function loadSharedPhotos(limit = 50): Promise<LoadSharedPhotosResult> {
  if (!supabase) return { photos: [], failed: false };
  const wide = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at,visitor_name")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(100, Math.floor(limit) || 50)));
  if (!wide.error) return { photos: safePhotos(wide.data), failed: false };
  if (isLikelyNetworkFailure(wide.error)) {
    return { photos: [], failed: true };
  }
  const narrow = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(100, Math.floor(limit) || 50)));
  if (!narrow.error) return { photos: safePhotos(narrow.data), failed: false };
  return { photos: [], failed: true };
}

export async function addSharedPhoto(imageUrl: string): Promise<SharedPhoto> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  if (!isSafeImageUrl(imageUrl)) {
    throw new Error("Unsupported image: only base64 raster images up to 1 MB are allowed.");
  }
  const visitorName = getVisitorDisplayName();
  const payload: Record<string, string> = { image_url: imageUrl };
  if (visitorName) payload.visitor_name = visitorName.slice(0, 60);

  const attempt = await supabase
    .from("museum_photos")
    .insert(payload)
    .select("id,image_url,created_at,visitor_name")
    .single();
  if (!attempt.error) return attempt.data as SharedPhoto;

  // Never retry a denied write with a weaker payload.
  throw attempt.error;
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
