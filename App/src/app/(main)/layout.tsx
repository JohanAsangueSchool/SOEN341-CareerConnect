'use client';

import { toaster } from '@/components/ui/toaster';
import { getUserProfile } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';
import { Avatar, Menu, Portal, Spinner } from '@chakra-ui/react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MainLayout({ children }: LayoutProps<'/'>) {
    const router = useRouter();
    const supabase = createClientSupabase();
    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                setIsLoading(true);

                const { data, error, status } = await getUserProfile(supabase);

                if (ignore) return;
                console.log(data, error, status);
                if (!validRequestStatus(status) || error || !data) throw new Error();

                setFullName(`${data.first_name} ${data.last_name}`);
                setAvatarUrl(data.avatar_url);
                setIsLoading(false);
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

        load();

        return () => {
            ignore = true;
        };
    }, [router, supabase]);

    return isLoading ? (
        <Spinner
            size='xl'
            position='fixed'
            top='50%'
            left='50%'
            transform='translate(-50%, -50%)'
        />
    ) : (
        <>
            <MainLayoutHeader supabase={supabase} fullName={fullName} avatarUrl={avatarUrl} />
            <main className='h-full flex-1 overflow-auto'>{children}</main>
        </>
    );
}

function MainLayoutHeader({
    supabase,
    fullName,
    avatarUrl,
}: {
    supabase: SupabaseClient;
    fullName: string;
    avatarUrl: string;
}) {
    const router = useRouter();

    return (
        <header className='flex w-full items-center gap-2 border-b p-2'>
            <div className='flex-1' />

            <Menu.Root positioning={{ placement: 'bottom-start' }}>
                <Menu.Trigger rounded='full' focusRing='outside'>
                    <Avatar.Root size='sm'>
                        <Avatar.Fallback name={fullName} />
                        <Avatar.Image src={avatarUrl} />
                    </Avatar.Root>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            <Menu.Item value='fullName' disabled>
                                {fullName}
                            </Menu.Item>
                            <Menu.Item value='account'>Account</Menu.Item>
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
