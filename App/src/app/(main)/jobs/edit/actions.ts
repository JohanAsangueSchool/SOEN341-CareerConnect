'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createServerSupabase } from '@/lib/supabase/server';
import { JobStatusEnum, JobStatusEnumType } from '@/utils/enums';
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

// RLS only lets recruiters update their own postings and silently skips the rest
async function setJobStatus(job_id: string, status: JobStatusEnumType) {
    const supabase = await createServerSupabase();

    const {
        data,
        error,
        status: requestStatus,
    } = await supabase
        .from('jobs')
        .update({ status: JobStatusEnum.parse(status) })
        .eq('id', job_id)
        .select('id');

    if (!validRequestStatus(requestStatus) || error) throw error;
    if (!data || data.length === 0) throw new Error('Job posting not found.');

    revalidatePath('/jobs', 'layout');
    revalidatePath('/dashboard');
}

// Hides a posting from Workers and moves it out of the recruiter's active list
export async function archiveJob(job_id: string) {
    await setJobStatus(job_id, 'Archived');
}

// Brings an archived posting back as Closed, so it stays hidden until it is reopened
export async function restoreJob(job_id: string) {
    await setJobStatus(job_id, 'Closed');
}
