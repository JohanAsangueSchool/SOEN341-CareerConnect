import { createClient } from '@supabase/supabase-js';

// Bypasses RLS, only use it in server code.
export function createAdminSupabase() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
