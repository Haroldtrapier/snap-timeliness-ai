// Supabase is OPTIONAL. When these env vars are present the app uses real
// Supabase Auth + Postgres; when absent it falls back to the demo session.
// This lets production keep working until the keys are added in Vercel.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
