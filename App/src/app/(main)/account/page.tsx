'use client';

import {
    Avatar,
    Button,
    Card,
    CloseButton,
    Dialog,
    Field,
    HStack,
    Input,
    Link,
    Portal,
    Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Concert_One } from 'next/font/google';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaPencil } from 'react-icons/fa6';

import { PasswordInput } from '@/components/ui/password-input';
import { toaster } from '@/components/ui/toaster';
import { useSetUserProfile, useUserProfile } from '@/contexts/user_profile';
import {
    accountFormSchema,
    accountFormSchemaType,
    passwordFormSchema,
    passwordFormSchemaType,
} from '@/utils/forms/auth';

import { updateAccount, updatePassword } from './actions';

const fieldLabels: { [k in keyof accountFormSchemaType]: string } = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    postal_code: 'Postal Code',
};

const fieldHelpers: { [k in keyof accountFormSchemaType]?: string } = {
    phone: 'XXX-XXX-XXXX',
    postal_code: 'XXX XXX',
};

const fieldTypes: { [k in keyof accountFormSchemaType]?: string } = {
    email: 'email',
};

const concertOneFont = Concert_One({ subsets: ['latin', 'latin-ext'], weight: ['400'] });

export default function AccountPage() {
    const userProfile = useUserProfile()!;
    const { avatar_url, account_type, first_name, last_name } = userProfile;

    return (
        <main className='m-12 flex w-full max-w-md flex-col gap-6 self-center'>
            <div className='mb-8 flex items-start justify-between gap-8'>
                <div className='group relative size-40 cursor-pointer'>
                    <Avatar.Root
                        size='full'
                        className='transition-all duration-300 group-hover:brightness-30'
                    >
                        <Avatar.Fallback textStyle='5xl' name={`${first_name} ${last_name}`} />
                        {avatar_url && <Avatar.Image src={avatar_url} />}
                    </Avatar.Root>

                    <FaPencil className='absolute top-1/2 left-1/2 -translate-1/2 text-4xl text-white opacity-0 transition-all duration-300 group-hover:opacity-100' />
                </div>

                <div className='mt-8 flex flex-col items-end gap-2'>
                    <Text textStyle='5xl' style={concertOneFont.style}>
                        {account_type}
                    </Text>
                    <AccountPasswordDialog />
                </div>
            </div>

            <AccountInformation />
        </main>
    );
}

function AccountInformation() {
    const userProfile = useUserProfile()!;
    const setUserProfile = useSetUserProfile();
    const [editing, setEditing] = useState(false);

    const defaultValues = Object.fromEntries(
        Object.keys(fieldLabels).map((key) => [
            key,
            userProfile[key as keyof accountFormSchemaType],
        ]),
    ) as accountFormSchemaType;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(accountFormSchema),
        defaultValues,
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            setUserProfile(await updateAccount(data));
            reset(data);
            setEditing(false);

            toaster.create({
                title: 'Success',
                description: 'Account updated.',
                type: 'success',
                closable: true,
            });
        } catch (error) {
            toaster.create({
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Failed to update the account.',
                type: 'error',
                closable: true,
            });
        }
    });

    if (!editing) {
        return (
            <>
                {(Object.keys(fieldLabels) as (keyof accountFormSchemaType)[]).map((key) => (
                    <Card.Root key={key} size='sm'>
                        <Card.Body>
                            <Card.Title>{fieldLabels[key]}</Card.Title>
                            <Card.Description textStyle='md'>{userProfile[key]}</Card.Description>
                        </Card.Body>
                    </Card.Root>
                ))}

                <Button onClick={() => setEditing(true)}>
                    <FaPencil /> Edit Account
                </Button>
            </>
        );
    }

    return (
        <form onSubmit={onSubmit} className='flex flex-col gap-6'>
            {(Object.keys(fieldLabels) as (keyof accountFormSchemaType)[]).map((key) => (
                <Card.Root key={key} size='sm'>
                    <Card.Body>
                        <Field.Root invalid={!!errors[key]}>
                            <Field.Label>{fieldLabels[key]}</Field.Label>
                            <Input type={fieldTypes[key] ?? 'text'} {...register(key)} />
                            {fieldHelpers[key] && (
                                <Field.HelperText>{fieldHelpers[key]}</Field.HelperText>
                            )}
                            <Field.ErrorText>{errors[key]?.message}</Field.ErrorText>
                        </Field.Root>
                    </Card.Body>
                </Card.Root>
            ))}

            <HStack>
                <Button
                    variant='outline'
                    flex={1}
                    disabled={isSubmitting}
                    onClick={() => {
                        reset(defaultValues);
                        setEditing(false);
                    }}
                >
                    Cancel
                </Button>
                <Button type='submit' flex={1} loading={isSubmitting}>
                    Save
                </Button>
            </HStack>
        </form>
    );
}

function AccountPasswordDialog() {
    const [open, setOpen] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<passwordFormSchemaType>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: { password: '', confirm_password: '' },
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            await updatePassword(data);
            reset();
            setOpen(false);

            toaster.create({
                title: 'Success',
                description: 'Password updated.',
                type: 'success',
                closable: true,
            });
        } catch (error) {
            toaster.create({
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Failed to update the password.',
                type: 'error',
                closable: true,
            });
        }
    });

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(e) => {
                setOpen(e.open);
                if (!e.open) reset();
            }}
        >
            <Dialog.Trigger asChild>
                <Link asChild textStyle='sm' color='fg.muted'>
                    <button type='button'>Update Password</button>
                </Link>
            </Dialog.Trigger>

            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content asChild>
                        <form onSubmit={onSubmit}>
                            <Dialog.Header>
                                <Dialog.Title>Update Password</Dialog.Title>
                            </Dialog.Header>

                            <Dialog.Body className='flex flex-col gap-4'>
                                <Field.Root invalid={!!errors.password}>
                                    <Field.Label>New Password</Field.Label>
                                    <PasswordInput {...register('password')} />
                                    <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.confirm_password}>
                                    <Field.Label>Confirm Password</Field.Label>
                                    <PasswordInput {...register('confirm_password')} />
                                    <Field.ErrorText>
                                        {errors.confirm_password?.message}
                                    </Field.ErrorText>
                                </Field.Root>
                            </Dialog.Body>

                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant='outline' disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                </Dialog.ActionTrigger>
                                <Button type='submit' loading={isSubmitting}>
                                    Update Password
                                </Button>
                            </Dialog.Footer>

                            <Dialog.CloseTrigger asChild>
                                <CloseButton size='sm' />
                            </Dialog.CloseTrigger>
                        </form>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
