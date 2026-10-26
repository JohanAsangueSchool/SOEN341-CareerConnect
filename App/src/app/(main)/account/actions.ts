'use server';

import { createAdminSupabase } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import {
    accountFormSchema,
    accountFormSchemaType,
    passwordFormSchema,
    passwordFormSchemaType,
} from '@/utils/forms/auth';
import { validRequestStatus } from '@/utils/function';

export async function updateAccount(values: accountFormSchemaType) {
    const { email, ...others } = accountFormSchema.parse(values);
    const supabase = await createServerSupabase();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error('You must be logged in.');

    // The admin API changes the email right away, without sending a confirmation email.
    if (email !== userData.user.email) {
        const { error } = await createAdminSupabase().auth.admin.updateUserById(userData.user.id, {
            email,
            email_confirm: true,
        });
        if (error) throw new Error(error.message);
    }

    const { data, error, status } = await supabase
        .from('profiles')
        .update({ ...others, email, updated_at: new Date() })
        .eq('id', userData.user.id)
        .select(`first_name, last_name, email, phone, postal_code, account_type, avatar_url`)
        .single();

    if (!validRequestStatus(status) || error || !data) {
        throw new Error(error?.message ?? 'Failed to update the profile.');
    }

    return data;
}

export async function updatePassword(values: passwordFormSchemaType) {
    const { password } = passwordFormSchema.parse(values);
    const supabase = await createServerSupabase();

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
}
