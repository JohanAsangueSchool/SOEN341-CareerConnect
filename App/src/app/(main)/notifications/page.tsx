'use client';

import { Badge, Button, Card, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { toaster } from '@/components/ui/toaster';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';

type NotificationType = {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read_at: string | null;
    created_at: string;
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    async function loadNotifications() {
        const supabase = createClientSupabase();

        try {
            const { data, error, status } = await supabase
                .from('notifications')
                .select('id, type, title, message, link, read_at, created_at')
                .order('created_at', { ascending: false });

            if (!validRequestStatus(status) || error) throw error;

            setNotifications(data ?? []);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            toaster.create({
                title: 'Error',
                description: 'Failed to load notifications.',
                type: 'error',
                closable: true,
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadNotifications();
    }, []);

    async function toggleReadStatus(notification: NotificationType) {
        const supabase = createClientSupabase();
        const newReadAt = notification.read_at ? null : new Date().toISOString();

        const { error } = await supabase
            .from('notifications')
            .update({ read_at: newReadAt })
            .eq('id', notification.id);

        if (error) {
            toaster.create({
                title: 'Error',
                description: 'Could not update notification status.',
                type: 'error',
                closable: true,
            });
            return;
        }

        setNotifications((current) =>
            current.map((item) =>
                item.id === notification.id ? { ...item, read_at: newReadAt } : item,
            ),
        );
    }

    async function markAllAsRead() {
        setUpdating(true);

        const supabase = createClientSupabase();
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('notifications')
            .update({ read_at: now })
            .is('read_at', null);

        if (error) {
            toaster.create({
                title: 'Error',
                description: 'Could not mark notifications as read.',
                type: 'error',
                closable: true,
            });
        } else {
            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    read_at: notification.read_at ?? now,
                })),
            );
        }

        setUpdating(false);
    }

    const unreadCount = notifications.filter((item) => !item.read_at).length;

    return (
        <main className='m-8 flex w-full max-w-4xl flex-col gap-6 self-center'>
            <HStack justify='space-between' align='center' wrap='wrap'>
                <VStack align='start' gap={1}>
                    <Heading textStyle='3xl'>Notifications</Heading>
                    <Text color='fg.muted'>
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </Text>
                </VStack>

                <Button
                    variant='outline'
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0 || updating}
                    loading={updating}
                >
                    Mark all as read
                </Button>
            </HStack>

            {loading ? (
                <Spinner size='xl' className='self-center' />
            ) : notifications.length === 0 ? (
                <Card.Root>
                    <Card.Body padding={8}>
                        <VStack align='center' gap={2}>
                            <Heading textStyle='lg'>You're all caught up!</Heading>
                            <Text color='fg.muted'>You don't have any notifications yet.</Text>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            ) : (
                <VStack align='stretch' gap={3}>
                    {notifications.map((notification) => (
                        <Card.Root
                            key={notification.id}
                            variant='outline'
                            background={notification.read_at ? 'bg' : 'bg.subtle'}
                        >
                            <Card.Body gap={3}>
                                <HStack justify='space-between' align='start'>
                                    <Heading textStyle='md'>{notification.title}</Heading>

                                    {!notification.read_at && (
                                        <Badge colorPalette='blue'>Unread</Badge>
                                    )}
                                </HStack>

                                <Text>{notification.message}</Text>

                                <Text color='fg.muted' textStyle='xs'>
                                    {new Date(notification.created_at).toLocaleString()}
                                </Text>

                                <HStack justify='space-between' wrap='wrap'>
                                    {notification.link && (
                                        <Link
                                            href={notification.link}
                                            onClick={() => {
                                                if (!notification.read_at) {
                                                    void toggleReadStatus(notification);
                                                }
                                            }}
                                        >
                                            <Button size='sm' variant='outline'>
                                                View
                                            </Button>
                                        </Link>
                                    )}

                                    <Button
                                        size='sm'
                                        variant='ghost'
                                        onClick={() => toggleReadStatus(notification)}
                                    >
                                        {notification.read_at ? 'Mark as unread' : 'Mark as read'}
                                    </Button>
                                </HStack>
                            </Card.Body>
                        </Card.Root>
                    ))}
                </VStack>
            )}
        </main>
    );
}