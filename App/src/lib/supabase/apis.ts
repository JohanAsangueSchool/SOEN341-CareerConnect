import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserProfile(client: SupabaseClient) {
    const claims = await client.auth.getClaims();
    const { data, error, status } = await client
        .from('profiles')
        .select(`first_name, last_name, email, phone, postal_code, account_type, avatar_url`)
        .eq('id', claims?.data?.claims.sub)
        .single();

    return { data, error, status };
}

export async function getUserResumes(client: SupabaseClient) {
    const claims = await client.auth.getClaims();
    const { data, error, status } = await client
        .from('resumes')
        .select(`id, title, summary, status, education, experience, skills, projects, updated_at`)
        .eq('user_id', claims?.data?.claims.sub)
        .order('updated_at', { ascending: false });

    return { data, error, status };
}

export async function getUserResume(client: SupabaseClient, id: string) {
    const { data, error, status } = await client
        .from('resumes')
        .select(`title, summary, status, education, experience, skills, projects, updated_at`)
        .eq('id', id)
        .single();

    return { data, error, status };
}
