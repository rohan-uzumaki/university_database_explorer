import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaces a clear error in the browser console/build log instead of a
  // confusing downstream failure if .env.local wasn't set up.
  console.warn(
    'Supabase env vars are missing. Copy .env.local.example to .env.local and fill them in.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
