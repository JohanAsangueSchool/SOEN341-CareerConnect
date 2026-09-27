'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { loginFormSchemaType } from '@/utils/forms/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(data: loginFormSchemaType) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) throw error;

    revalidatePath('/', 'layout');
    redirect('/');
}
