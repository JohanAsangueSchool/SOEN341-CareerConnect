'use client';

import { FaBell } from 'react-icons/fa6';
import { Avatar, Link, Menu, Portal, Spinner, Tabs } from '@chakra-ui/react';
import { SupabaseClient } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    FaBookmark,
    FaBriefcase,
    FaClipboardCheck,
    FaFile,
    FaFilter,
    FaGaugeHigh,
    FaHouse,
    FaUsers,
} from 'react-icons/fa6';

import { NotificationsMenu } from '@/components/notifications_menu';
import { toaster } from '@/components/ui/toaster';
import { UserProfileProvider, UserProfileType } from '@/contexts/user_profile';
import { getUserProfile } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';

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
        <UserProfileProvider userProfile={userProfile} setUserProfile={setUserProfile}>
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
    const [unreadCount, setUnreadCount] = useState(0);
    const fullName = `${userProfile.first_name} ${userProfile.last_name}`;

    useEffect(() => {
        async function loadUnreadCount() {
            const { count, error } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .is('read_at', null);

            if (error) {
                console.error('Notification query failed');
                console.error('Message:', error.message);
                console.error('Code:', error.code);
                console.error('Details:', error.details);
                console.error('Hint:', error.hint);
                return;
            }

            setUnreadCount(count ?? 0);
        }

        loadUnreadCount();
    }, [supabase, pathname]);

    return (
        <header className='flex w-full items-center gap-2 border-b p-2'>
            {/* The selected tab follows the URL. navigate={null} stops Tabs from
                clicking the newly selected tab's link whenever that changes, which
                sent e.g. /dashboard -> /jobs/edit on to /jobs. The links navigate. */}
            <Tabs.Root
                variant='subtle'
                value={pathname.split('/').slice(0, 2).join('/')}
                navigate={null}
            >
                <Tabs.List>
                    <Tabs.Trigger value='/' asChild>
                        <Link unstyled href='/'>
                            <FaHouse />
                            Home
                        </Link>
                    </Tabs.Trigger>

                    {userProfile.account_type === 'Recruiter' && (
                        <Tabs.Trigger value='/dashboard' asChild>
                            <Link unstyled href='/dashboard'>
                                <FaGaugeHigh />
                                Dashboard
                            </Link>
                        </Tabs.Trigger>
                    )}

                    <Tabs.Trigger value='/jobs' asChild>
                        <Link unstyled href='/jobs'>
                            <FaBriefcase />
                            Jobs
                        </Link>
                    </Tabs.Trigger>

                    {userProfile.account_type === 'Worker' && (
                        <>
                            <Tabs.Trigger value='/resumes' asChild>
                                <Link unstyled href='/resumes'>
                                    <FaFile />
                                    Resumes
                                </Link>
                            </Tabs.Trigger>

                            <Tabs.Trigger value='/applications' asChild>
                                <Link unstyled href='/applications'>
                                    <FaClipboardCheck />
                                    My Applications
                                </Link>
                            </Tabs.Trigger>

                            <Tabs.Trigger value='/saved-jobs' asChild>
                                <Link unstyled href='/saved-jobs'>
                                    <FaBookmark />
                                    Saved Jobs
                                </Link>
                            </Tabs.Trigger>

                            <Tabs.Trigger value='/job-alerts' asChild>
                                <Link unstyled href='/job-alerts'>
                                    <FaFilter />
                                    Job Alerts
                                </Link>
                            </Tabs.Trigger>
                        </>
                    )}

                    {userProfile.account_type === 'Recruiter' && (
                        <>
                            <Tabs.Trigger value='/applications' asChild>
                                <Link unstyled href='/applications'>
                                    <FaClipboardCheck />
                                    Applications
                                </Link>
                            </Tabs.Trigger>

                            <Tabs.Trigger value='/candidates' asChild>
                                <Link unstyled href='/candidates'>
                                    <FaUsers />
                                    Candidates
                                </Link>
                            </Tabs.Trigger>
                        </>
                    )}

                    <Tabs.Trigger value='/notifications' asChild>
                        <Link unstyled href='/notifications' className='flex items-center gap-2'>
                            <FaBell />
                            Notifications
                            {unreadCount > 0 && (
                                <span className='rounded-full bg-red-500 px-2 py-0.5 text-xs text-white'>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    </Tabs.Trigger>
                </Tabs.List>
            </Tabs.Root>

            <div className='flex-1' />

            <NotificationsMenu isWorker={userProfile.account_type === 'Worker'} />

            <Menu.Root positioning={{ placement: 'bottom-start' }}>
                <Menu.Trigger rounded='full' focusRing='outside' aria-label='Account menu'>
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
