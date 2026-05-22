import { createClient } from '@supabase/supabase-js';
// SERVICE ROLE bypasses RLS. Use ONLY in server-side admin paths
// (e.g. tenant onboarding, storage upload via service worker, audit writes).
// Never expose to the client.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
