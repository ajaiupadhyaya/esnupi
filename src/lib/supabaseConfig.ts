/**
 * Supabase *configuration* only — deliberately imports nothing from
 * `@supabase/supabase-js`.
 *
 * `hasSupabaseConfig` is read on the desktop's first render to decide whether
 * the shared photobook and visitor log are available at all. When that lived in
 * the same module as `createClient`, a single boolean dragged the whole ~200 KB
 * Supabase SDK into the entry bundle. Keeping the env read separate lets the
 * SDK stay behind the dynamic import in `supabaseClient.ts`.
 */
const url = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseUrl = url;
export const supabaseAnonKey = anonKey;
export const hasSupabaseConfig = Boolean(url && anonKey);
