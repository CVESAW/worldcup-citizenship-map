import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env vars are present; otherwise the app uses seed data. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Server-side Supabase client for read queries (uses the anon key; RLS allows
 * public SELECT on the data tables). Returns null when not configured so
 * callers can fall back to the bundled seed dataset.
 */
export function getServerSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
