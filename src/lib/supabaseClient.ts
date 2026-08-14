import type { SupabaseClient } from "@supabase/supabase-js";

import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "./supabaseConfig";

export { hasSupabaseConfig } from "./supabaseConfig";

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Lazily constructs (and then memoises) the Supabase client.
 *
 * The import is dynamic on purpose: the SDK is ~200 KB and is only needed once
 * a visitor actually touches the shared photobook or the visitor log, which is
 * long after first paint. Callers must handle `null` — that is the
 * "no keys configured" case, and every integration degrades to local-only.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!hasSupabaseConfig) return Promise.resolve(null);
  clientPromise ??= import("@supabase/supabase-js")
    .then(({ createClient }) =>
      createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: { persistSession: false },
      }),
    )
    .catch((err) => {
      console.warn("[supabase] client failed to load", err);
      clientPromise = null; // let a later caller retry
      return null;
    });
  return clientPromise;
}
