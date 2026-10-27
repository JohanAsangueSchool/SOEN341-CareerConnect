'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createServerSupabase } from '@/lib/supabase/server';
import { jobSchema, jobSchemaType } from '@/utils/forms/jobs';
import { validRequestStatus } from '@/utils/function';

export async function createJob(values: jobSchemaType) {
    const supabase = await createServerSupabase();
    const claims = await supabase.auth.getClaims();
    const recruiter_id = claims.data?.claims.sub;

    const { error, status } = await supabase
        .from('jobs')
        .insert({
            ...jobSchema.parse(values),
            recruiter_id: recruiter_id,
        })
        .select();

    if (!validRequestStatus(status) || error) throw error;

    revalidatePath('/jobs', 'layout');
    redirect('/jobs');
}

export async function updateJob(job_id: string, values: jobSchemaType) {
    const supabase = await createServerSupabase();

    const { error, status } = await supabase
        .from('jobs')
        .update(jobSchema.parse(values))
        .eq('id', job_id)
        .select();

    if (!validRequestStatus(status) || error) throw error;

    revalidatePath('/jobs', 'layout');
    redirect('/jobs');
}

// Publishes a draft so Workers can see and apply to it
export async function postJob(job_id: string) {
    const supabase = await createServerSupabase();

    const { error, status } = await supabase
        .from('jobs')
        .update({ status: 'Open' })
        .eq('id', job_id)
        .select();

    if (!validRequestStatus(status) || error) throw error;

    revalidatePath('/jobs', 'layout');
}
