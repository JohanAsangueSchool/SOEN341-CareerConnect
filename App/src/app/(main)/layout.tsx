'use client';

import { toaster } from '@/components/ui/toaster';
import { UserProfileProvider, UserProfileType } from '@/contexts/user_profile';
import { getUserProfile } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';
import { Avatar, Link, Menu, Portal, Spinner, Tabs } from '@chakra-ui/react';
import { SupabaseClient } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaFile, FaHouse } from 'react-icons/fa6';

export default function MainLayout({ children }: LayoutProps<'/'>) {
    const router = useRouter();
    const supabase = createClientSupabase();
    const [userProfile, setUserProfile] = useState<UserProfileType>();

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                const { data, error, status } = await getUserProfile(supabase);

                if (ignore) return;
                if (!validRequestStatus(status) || error || !data) throw new Error();

                setUserProfile(data);
            } catch {
                if (ignore) return;

                toaster.create({
                    title: 'Error',
                    description: 'Please log into your account',
                    type: 'error',
                    closable: true,
                });

                router.push('/signin');
            }
        }

        if (!userProfile) load();
        return () => {
            ignore = true;
        };
    }, [userProfile, router, supabase]);

    return !userProfile ? (
        <Spinner
            size='xl'
            position='fixed'
            top='50%'
            left='50%'
            transform='translate(-50%, -50%)'
        />
    ) : (
        <UserProfileProvider userProfile={userProfile}>
            <MainLayoutHeader supabase={supabase} userProfile={userProfile} />
            <main className='flex h-full max-h-full min-h-80 flex-1 flex-col overflow-auto'>
                {children}
            </main>
        </UserProfileProvider>
    );
}

function MainLayoutHeader({
    supabase,
    userProfile,
}: {
    supabase: SupabaseClient;
    userProfile: UserProfileType;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const fullName = `${userProfile.first_name} ${userProfile.last_name}`;

    return (
        <header className='flex w-full items-center gap-2 border-b p-2'>
            <Tabs.Root variant='subtle' value={pathname.split('/').slice(0, 2).join('/')}>
                <Tabs.List>
                    <Tabs.Trigger value='/' asChild>
                        <Link unstyled href='/'>
                            <FaHouse />
                            Home
                        </Link>
                    </Tabs.Trigger>
                    {userProfile.account_type === 'Worker' && (
                        <Tabs.Trigger value='/resumes' asChild>
                            <Link unstyled href='/resumes'>
                                <FaFile />
                                Resumes
                            </Link>
                        </Tabs.Trigger>
                    )}
                </Tabs.List>
            </Tabs.Root>

            <div className='flex-1' />

            <Menu.Root positioning={{ placement: 'bottom-start' }}>
                <Menu.Trigger rounded='full' focusRing='outside'>
                    <Avatar.Root size='sm'>
                        <Avatar.Fallback name={fullName} />
                        {userProfile.avatar_url && <Avatar.Image src={userProfile.avatar_url} />}
                    </Avatar.Root>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            <Menu.Item value='fullName' disabled>
                                {fullName}
                            </Menu.Item>
                            <Menu.Item value='account' asChild>
                                <Link href='/account' className='hover:no-underline'>
                                    Account
                                </Link>
                            </Menu.Item>
                            <Menu.Separator />
                            <Menu.Item
                                value='logout'
                                color='fg.error'
                                _hover={{ bg: 'bg.error', color: 'fg.error' }}
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    router.push('/signin');
                                }}
                            >
                                Logout
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>
        </header>
    );
}
