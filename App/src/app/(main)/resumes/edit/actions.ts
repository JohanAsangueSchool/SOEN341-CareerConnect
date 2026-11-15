'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { resumeSchemaType } from '@/utils/forms/resumes';
import { validRequestStatus } from '@/utils/function';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createResume(values: resumeSchemaType) {
    const supabase = await createServerSupabase();
    const claims = await supabase.auth.getClaims();
    const user_id = claims.data?.claims.sub;

    const { error, status } = await supabase
        .from('resumes')
        .insert({
            ...values,
            user_id: user_id,
        })
        .select();

    if (!validRequestStatus(status) || error) throw error;

    revalidatePath('/resumes', 'layout');
    redirect('/resumes');
}

export async function updateResume(resume_id: string, values: resumeSchemaType) {
    const supabase = await createServerSupabase();

    const { error, status } = await supabase
        .from('resumes')
        .update({
            ...values,
            updated_at: new Date(),
        })
        .eq('id', resume_id)
        .select();

    if (!validRequestStatus(status) || error) throw error;

    revalidatePath('/resumes', 'layout');
    redirect('/resumes');
}
