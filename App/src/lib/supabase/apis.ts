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

export type JobFilters = {
    keyword?: string;
    location?: string;
    category?: string;
    jobType?: string;
};

export async function getJobs(client: SupabaseClient, filters: JobFilters = {}) {
    let query = client
        .from('jobs')
        .select(
            `id, title, company, description, location, category, job_type, salary_min, salary_max, created_at`,
        )
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

    // Strip characters that would break the PostgREST `or` filter syntax
    const keyword = filters.keyword?.replace(/[,()%]/g, ' ').trim();
    if (keyword) {
        query = query.or(
            `title.ilike.%${keyword}%,company.ilike.%${keyword}%,description.ilike.%${keyword}%`,
        );
    }
    if (filters.location) query = query.eq('location', filters.location);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.jobType) query = query.eq('job_type', filters.jobType);

    const { data, error, status } = await query;

    return { data, error, status };
}

export async function getJobFilterOptions(client: SupabaseClient) {
    const { data, error, status } = await client
        .from('jobs')
        .select(`location, category`)
        .eq('status', 'Open');

    return { data, error, status };
}

export async function getJob(client: SupabaseClient, id: string) {
    const { data, error, status } = await client
        .from('jobs')
        .select(
            `id, title, company, description, location, category, job_type, salary_min, salary_max, status, created_at`,
        )
        .eq('id', id)
        .single();

    return { data, error, status };
}
