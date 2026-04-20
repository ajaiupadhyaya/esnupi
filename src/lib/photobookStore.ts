import type { RealtimeChannel } from "@supabase/supabase-js";

import { hasSupabaseConfig, supabase } from "./supabaseClient";

export type SharedPhoto = {
  id: string;
  image_url: string;
  created_at: string;
};

export async function loadSharedPhotos(limit = 200): Promise<SharedPhoto[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function addSharedPhoto(imageUrl: string): Promise<SharedPhoto> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const { data, error } = await supabase
    .from("museum_photos")
    .insert({ image_url: imageUrl })
    .select("id,image_url,created_at")
    .single();
  if (error) throw error;
  return data;
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
