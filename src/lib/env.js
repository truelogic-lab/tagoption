/**
 * Environment access — reads from Vite's import.meta.env.
 * Real secrets (DB URL, API keys) go in .env, never in code.
 * The app runs fine without them — they're only needed once a backend exists.
 */
export const env = {
  apiBase:      import.meta.env.VITE_API_BASE      || null,
  databaseUrl:  import.meta.env.VITE_DATABASE_URL  || null,
  supabaseUrl:  import.meta.env.VITE_SUPABASE_URL  || null,
  supabaseKey:  import.meta.env.VITE_SUPABASE_ANON_KEY || null,
  isConfigured: Boolean(import.meta.env.VITE_API_BASE),
};
