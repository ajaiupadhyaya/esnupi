import { getSupabase, hasSupabaseConfig } from "./supabaseClient";
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

/** Longest data: URL we will accept — a photobooth frame is well under this. */
const MAX_IMAGE_URL_LENGTH = 6_000_000;

/**
 * `museum_photos` is anonymously insertable by design (that is the whole point
 * of a shared photobook), so anything that comes back out of it is untrusted
 * input that we are about to hand to `<img src>`. Only same-origin-safe image
 * sources get through: an https URL, or a base64 image data URL. That closes
 * off `javascript:`, `data:text/html`, and friends regardless of what the
 * database happens to contain.
 */
export function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url || url.length > MAX_IMAGE_URL_LENGTH) return false;
  if (/^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(url)) return true;
  try {
    return new URL(url, window.location.origin).protocol === "https:";
  } catch {
    return false;
  }
}

function toSharedPhotos(rows: unknown): SharedPhoto[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row): row is SharedPhoto => {
    const r = row as Partial<SharedPhoto> | null;
    return Boolean(r && typeof r.id === "string" && isSafeImageUrl(r.image_url));
  });
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

export async function loadSharedPhotos(limit = 200): Promise<LoadSharedPhotosResult> {
  const supabase = await getSupabase();
  if (!supabase) return { photos: [], failed: false };
  const wide = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at,visitor_name")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!wide.error) return { photos: toSharedPhotos(wide.data), failed: false };
  if (isLikelyNetworkFailure(wide.error)) {
    return { photos: [], failed: true };
  }
  const narrow = await supabase
    .from("museum_photos")
    .select("id,image_url,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!narrow.error) return { photos: toSharedPhotos(narrow.data), failed: false };
  return { photos: [], failed: true };
}

export async function addSharedPhoto(imageUrl: string): Promise<SharedPhoto> {
  const supabase = await getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  if (!isSafeImageUrl(imageUrl)) {
    throw new Error("Unsupported image source.");
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

  const fallback = await supabase
    .from("museum_photos")
    .insert({ image_url: imageUrl })
    .select("id,image_url,created_at")
    .single();
  if (fallback.error) throw fallback.error;
  return { ...fallback.data, visitor_name: visitorName ?? null } as SharedPhoto;
}

/**
 * Subscribes to realtime photobook changes. Resolves to a disposer — call it
 * on unmount. (Previously this returned the channel plus a separate
 * `unsubscribeSharedPhotos`; the client is now loaded lazily, so the disposer
 * closes over it instead.)
 */
export async function subscribeToSharedPhotos(onChange: () => void): Promise<() => void> {
  const supabase = await getSupabase();
  if (!supabase || !hasSupabaseConfig) return () => {};
  const channel = supabase
    .channel("museum-photos-stream")
    .on("postgres_changes", { event: "*", schema: "public", table: "museum_photos" }, () => {
      onChange();
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
