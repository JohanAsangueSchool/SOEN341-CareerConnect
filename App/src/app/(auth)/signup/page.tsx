'use client';

import { PasswordInput } from '@/components/ui/password-input';
import { toaster } from '@/components/ui/toaster';
import { AccountTypeEnumValues } from '@/utils/enums';
import { signupFormSchema } from '@/utils/forms/auth';
import { Button, Field, Fieldset, HStack, Input, RadioCard } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { signup } from './actions';
import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';

export default function SignUpPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signupFormSchema),
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);

    const onSubmit = handleSubmit(async (data) => {
        try {
            if (confirmPassword !== data.password) {
                setConfirmPasswordError(true);
                return;
            } else {
                setConfirmPasswordError(false);
            }

            await signup(data);
        } catch (error) {
            unstable_rethrow(error);
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
                    <Field.Root invalid={!!errors.first_name}>
                        <Field.Label>First Name</Field.Label>
                        <Input type='text' {...register('first_name')} />
                        <Field.ErrorText>{errors.first_name?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.last_name}>
                        <Field.Label>Last Name</Field.Label>
                        <Input type='text' {...register('last_name')} />
                        <Field.ErrorText>{errors.last_name?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.account_type}>
                        <Field.Label>Account Type</Field.Label>
                        <RadioCard.Root size='sm' width='full'>
                            <HStack align='stretch'>
                                {AccountTypeEnumValues.map((item) => (
                                    <RadioCard.Item key={item} value={item}>
                                        <RadioCard.ItemHiddenInput {...register('account_type')} />
                                        <RadioCard.ItemControl>
                                            <RadioCard.ItemText>{item}</RadioCard.ItemText>
                                            <RadioCard.ItemIndicator />
                                        </RadioCard.ItemControl>
                                    </RadioCard.Item>
                                ))}
                            </HStack>
                        </RadioCard.Root>
                        <Field.ErrorText>{errors.account_type?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.email}>
                        <Field.Label>Email</Field.Label>
                        <Input type='email' {...register('email')} />
                        <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.phone}>
                        <Field.Label>Phone</Field.Label>
                        <Input {...register('phone')} />
                        <Field.HelperText>XXX-XXX-XXXX</Field.HelperText>
                        <Field.ErrorText>{errors.phone?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.postal_code}>
                        <Field.Label>Postal Code</Field.Label>
                        <Input {...register('postal_code')} />
                        <Field.HelperText>XXX XXX</Field.HelperText>
                        <Field.ErrorText>{errors.postal_code?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.password}>
                        <Field.Label>Password</Field.Label>
                        <PasswordInput {...register('password')} />
                        <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={confirmPasswordError}>
                        <Field.Label>Confirm Password</Field.Label>
                        <PasswordInput
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Field.ErrorText>Both password must be identicals.</Field.ErrorText>
                    </Field.Root>

                    <Button type='submit' width='full' loading={isSubmitting}>
                        Sign Up
                    </Button>
                </Fieldset.Content>
            </Fieldset.Root>
        </form>
    );
}
