import { createClient } from '@supabase/supabase-js';

// Server-only client. Never import this from browser bundles.
export function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server env is not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
