'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { signupFormSchemaType } from '@/utils/forms';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signup(data: signupFormSchemaType) {
    const supabase = await createServerSupabase();

    const { email, password, ...others } = data;
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: others,
        },
    });

    if (error) throw error;

    revalidatePath('/', 'layout');
    redirect('/');
}
