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

export async function loadSharedPhotos(limit = 200): Promise<LoadSharedPhotosResult> {
  if (!supabase) return { photos: [], failed: false };
  const wide = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at,visitor_name")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!wide.error) return { photos: (wide.data ?? []) as SharedPhoto[], failed: false };
  if (isLikelyNetworkFailure(wide.error)) {
    return { photos: [], failed: true };
  }
  const narrow = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!narrow.error) return { photos: (narrow.data ?? []) as SharedPhoto[], failed: false };
  return { photos: [], failed: true };
}

export async function addSharedPhoto(imageUrl: string): Promise<SharedPhoto> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
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
