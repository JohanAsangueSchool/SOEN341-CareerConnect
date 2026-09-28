'use client';

import { PasswordInput } from '@/components/ui/password-input';
import { toaster } from '@/components/ui/toaster';
import { loginFormSchema } from '@/utils/forms/auth';
import { Button, Field, Fieldset, Input } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { login } from './actions';
import { unstable_rethrow } from 'next/navigation';

export default function SignInPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginFormSchema),
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            await login(data);
        } catch (error) {
            unstable_rethrow(error);

            toaster.create({
                title: 'Error',
                description: 'Failed to login.',
                type: 'error',
                closable: true,
            });
        }
    });

    return (
        <form onSubmit={onSubmit} className='flex flex-col items-center px-8 py-16'>
            <Fieldset.Root size='lg' alignItems='center' width={320}>
                <Fieldset.Legend textAlign='center' textStyle='3xl'>
                    Welcome Back to CareerConnect
                </Fieldset.Legend>
                <Fieldset.Content>
                    <Field.Root invalid={!!errors.email}>
                        <Field.Label>Email</Field.Label>
                        <Input type='email' {...register('email')} />
                        <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.password}>
                        <Field.Label>Password</Field.Label>
                        <PasswordInput {...register('password')} />
                        <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                    </Field.Root>

                    <Button type='submit' width='full' loading={isSubmitting}>
                        Login
                    </Button>

                    <Link href='/signup'>
                        <Button variant='outline' width='full'>
                            Create an account
                        </Button>
                    </Link>
                </Fieldset.Content>
            </Fieldset.Root>
        </form>
    );
}
