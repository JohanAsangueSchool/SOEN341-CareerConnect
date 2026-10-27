'use server';

import { revalidatePath } from 'next/cache';

import { createServerSupabase } from '@/lib/supabase/server';
import { ApplicationStatusEnum, ApplicationStatusEnumType } from '@/utils/enums';
import { validRequestStatus } from '@/utils/function';

// RLS only lets recruiters update applications submitted to their own postings
export async function updateApplicationStatus(
    application_id: string,
    status: ApplicationStatusEnumType,
) {
    const supabase = await createServerSupabase();

    const {
        data,
        error,
        status: requestStatus,
    } = await supabase
        .from('applications')
        .update({ status: ApplicationStatusEnum.parse(status) })
        .eq('id', application_id)
        .select('id');

    if (!validRequestStatus(requestStatus) || error) {
        console.error('Failed to update application status:', requestStatus, error);
        throw error;
    }

    // RLS silently filters out rows the user may not update, so nothing comes back
    if (!data || data.length === 0) {
        console.error('Application status update matched no rows:', application_id);
        throw new Error('Application not found.');
    }

    revalidatePath('/applications');
}
