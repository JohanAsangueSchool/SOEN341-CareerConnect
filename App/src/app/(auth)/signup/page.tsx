'use client';

import { PasswordInput } from '@/components/ui/password-input';
import { toaster } from '@/components/ui/toaster';
import { AccountTypeEnum, AccountTypeEnumValues } from '@/utils/enums';
import { Button, Field, Fieldset, HStack, Input, RadioCard } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const signupSchema = z.object({
    firstname: z.string().trim().min(1, 'First name is required.'),
    lastname: z.string().trim().min(1, 'Last name is required.'),
    email: z.email('Invalid email address.').trim().min(1, 'Email is required.'),
    password: z.string().trim().min(1, 'Password is required.'),
    accountType: AccountTypeEnum,
});

export default function SignUpPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error();
        } catch {
            toaster.create({
                title: 'Error',
                description: 'Failed to create an account.',
                type: 'error',
                closable: true,
            });
        }
    });

    return (
        <form onSubmit={onSubmit} className='flex flex-col items-center px-8 py-16'>
            <Fieldset.Root size='lg' alignItems='center' width={320}>
                <Fieldset.Legend textAlign='center' textStyle='3xl'>
                    Create an Account
                </Fieldset.Legend>
                <Fieldset.HelperText justifyItems='center'>
                    <Link href='/signin' className='hover:underline'>
                        Already have an account? Login now!
                    </Link>
                </Fieldset.HelperText>
                <Fieldset.Content>
                    <Field.Root invalid={!!errors.firstname}>
                        <Field.Label>First Name</Field.Label>
                        <Input type='text' {...register('firstname')} />
                        <Field.ErrorText>{errors.firstname?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.lastname}>
                        <Field.Label>Last Name</Field.Label>
                        <Input type='text' {...register('lastname')} />
                        <Field.ErrorText>{errors.lastname?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.accountType}>
                        <Field.Label>Account Type</Field.Label>
                        <RadioCard.Root size='sm' width='full'>
                            <HStack align='stretch'>
                                {AccountTypeEnumValues.map((item) => (
                                    <RadioCard.Item key={item} value={item}>
                                        <RadioCard.ItemHiddenInput {...register('accountType')} />
                                        <RadioCard.ItemControl>
                                            <RadioCard.ItemText>{item}</RadioCard.ItemText>
                                            <RadioCard.ItemIndicator />
                                        </RadioCard.ItemControl>
                                    </RadioCard.Item>
                                ))}
                            </HStack>
                        </RadioCard.Root>
                        <Field.ErrorText>{errors.accountType?.message}</Field.ErrorText>
                    </Field.Root>

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
                        Sign Up
                    </Button>
                </Fieldset.Content>
            </Fieldset.Root>
        </form>
    );
}
