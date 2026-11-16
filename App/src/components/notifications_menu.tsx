'use client';

import {
    Box,
    Float,
    HStack,
    IconButton,
    Popover,
    Portal,
    Spinner,
    Stack,
    Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
    FaBell,
    FaBriefcase,
    FaCalendarXmark,
    FaClipboardCheck,
    FaUserPlus,
} from 'react-icons/fa6';

import {
    type NotificationType,
    getNotifications,
    markNotificationsRead,
} from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';

/** How often the unread count is refreshed while the page is open. */
const POLL_MS = 60_000;

// Notification types written by the database triggers and functions.
const typeIcon: Record<string, React.ReactNode> = {
    application_status: <FaClipboardCheck />,
    new_application: <FaUserPlus />,
    new_job: <FaBriefcase />,
    job_expiring: <FaCalendarXmark />,
};

/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. */
function timeAgo(iso: string) {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} d ago`;
    return new Date(iso).toLocaleDateString();
}

/**
 * The header's bell: status changes, job alerts and deadline reminders for
 * Workers (US-07, US-11, US-22, US-23), new applications for Recruiters (US-24). Opening it marks everything
 * read; unread items stay highlighted until it closes.
 */
export function NotificationsMenu({ isWorker }: { isWorker: boolean }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationType[]>();
    // Unread when the list was opened, kept highlighted while it stays open.
    const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        const { data, error } = await getNotifications(createClientSupabase(), isWorker);
        if (!error && data) setNotifications(data);
        // A failed first load shows the empty list rather than a spinner forever.
        else setNotifications((current) => current ?? []);
        return data ?? [];
    }, [isWorker]);

    useEffect(() => {
        let ignore = false;

        async function poll() {
            if (!ignore && document.visibilityState === 'visible') await load();
        }

        poll();
        const interval = setInterval(poll, POLL_MS);
        window.addEventListener('focus', poll);
        return () => {
            ignore = true;
            clearInterval(interval);
            window.removeEventListener('focus', poll);
        };
    }, [load]);

    async function onOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) {
            setHighlighted(new Set());
            return;
        }

        const latest = await load();
        const unread = latest.filter((n) => !n.read_at).map((n) => n.id);
        setHighlighted(new Set(unread));
        if (unread.length === 0) return;

        const { error } = await markNotificationsRead(createClientSupabase(), unread);
        if (!error) {
            const now = new Date().toISOString();
            setNotifications((current) =>
                current?.map((n) => (unread.includes(n.id) ? { ...n, read_at: now } : n)),
            );
        }
    }

    const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

    return (
        <Popover.Root
            open={open}
            onOpenChange={(e) => onOpenChange(e.open)}
            positioning={{ placement: 'bottom-end' }}
        >
            <Popover.Trigger asChild>
                <IconButton
                    variant='ghost'
                    rounded='full'
                    aria-label='Notifications'
                    position='relative'
                >
                    <FaBell />
                    {unreadCount > 0 && (
                        <Float placement='top-end' offset={2}>
                            <Box
                                aria-hidden
                                minWidth={4}
                                height={4}
                                paddingX={1}
                                rounded='full'
                                bg='red.solid'
                                color='white'
                                fontSize='2xs'
                                lineHeight={4}
                                textAlign='center'
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Box>
                        </Float>
                    )}
                </IconButton>
            </Popover.Trigger>

            <Portal>
                <Popover.Positioner>
                    <Popover.Content width='sm' maxWidth='calc(100vw - 16px)'>
                        <Popover.Header>
                            <Popover.Title fontWeight='semibold'>Notifications</Popover.Title>
                        </Popover.Header>
                        <Popover.Body padding={0} maxHeight='md' overflowY='auto'>
                            {!notifications ? (
                                <Spinner margin={4} />
                            ) : notifications.length === 0 ? (
                                <Stack align='center' gap={2} padding={6} color='fg.muted'>
                                    <FaBriefcase />
                                    <Text textStyle='sm'>
                                        {isWorker
                                            ? 'Updates on your applications and reminders for saved jobs show here.'
                                            : 'New applications to your postings show here.'}
                                    </Text>
                                </Stack>
                            ) : (
                                <Stack as='ul' gap={0} aria-label='Notifications'>
                                    {notifications.map((n) => (
                                        <HStack
                                            as='li'
                                            key={n.id}
                                            align='start'
                                            gap={3}
                                            paddingX={4}
                                            paddingY={3}
                                            borderTopWidth='1px'
                                            bg={highlighted.has(n.id) ? 'bg.muted' : undefined}
                                            _hover={{ bg: 'bg.subtle' }}
                                        >
                                            <Box paddingTop={1} color='fg.muted'>
                                                {typeIcon[n.type] ?? <FaBell />}
                                            </Box>
                                            <Link
                                                href={n.link}
                                                className='flex-1'
                                                onClick={() => onOpenChange(false)}
                                            >
                                                <Text textStyle='sm' fontWeight='medium'>
                                                    {n.title}
                                                </Text>
                                                <Text textStyle='sm' color='fg.muted'>
                                                    {n.message}
                                                </Text>
                                                <Text textStyle='xs' color='fg.subtle'>
                                                    {timeAgo(n.created_at)}
                                                </Text>
                                            </Link>
                                        </HStack>
                                    ))}
                                </Stack>
                            )}
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
}
