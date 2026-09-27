import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserProfile(client: SupabaseClient) {
    const claims = await client.auth.getClaims();
    console.log(claims?.data?.claims.sub);
    const { data, error, status } = await client
        .from('profiles')
        .select(`first_name, last_name, email, avatar_url`)
        .eq('id', claims?.data?.claims.sub)
        .single();

    return { data, error, status };
}
