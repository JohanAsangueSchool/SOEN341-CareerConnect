'use client';

import {
    Box,
    Button,
    CloseButton,
    Dialog,
    HStack,
    Portal,
    Spinner,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { FaComments, FaPaperPlane } from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getApplicationMessages, sendApplicationMessage } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';

export type ApplicationMessage = {
    id: string;
    application_id: string;
    sender_id: string;
    body: string;
    created_at: string;
};

const MAX_MESSAGE_LENGTH = 2000;

// Both the insert response and the realtime event deliver our own messages, so skip duplicates
function withMessage(current: ApplicationMessage[] | undefined, message: ApplicationMessage) {
    return current?.some((existing) => existing.id === message.id)
        ? current
        : [...(current ?? []), message];
}

export default function ApplicationChatDialog({
    applicationId,
    title,
    counterpartName,
}: {
    applicationId: string;
    title: string;
    // Shown above messages sent by the other participant
    counterpartName: string;
}) {
    return (
        // lazyMount/unmountOnExit so messages load and the realtime channel opens only while open
        <Dialog.Root size='md' scrollBehavior='inside' lazyMount unmountOnExit>
            <Dialog.Trigger asChild>
                <Button variant='outline' size='sm'>
                    <FaComments />
                    Messages
                </Button>
            </Dialog.Trigger>

            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header flexDirection='column' alignItems='start' gap={1}>
                            <Dialog.Title>{title}</Dialog.Title>
                            <Text textStyle='sm' color='fg.muted'>
                                Conversation with {counterpartName}
                            </Text>
                        </Dialog.Header>

                        <ApplicationChat
                            applicationId={applicationId}
                            counterpartName={counterpartName}
                        />

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size='sm' />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

function ApplicationChat({
    applicationId,
    counterpartName,
}: {
    applicationId: string;
    counterpartName: string;
}) {
    const [supabase] = useState(createClientSupabase);
    const [userId, setUserId] = useState<string>();
    const [messages, setMessages] = useState<ApplicationMessage[]>();
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                const claims = await supabase.auth.getClaims();
                const { data, error, status } = await getApplicationMessages(
                    supabase,
                    applicationId,
                );

                if (ignore) return;
                if (!validRequestStatus(status) || error || !data) throw new Error();

                setUserId(claims?.data?.claims.sub);
                setMessages(data);
            } catch {
                if (ignore) return;

                setMessages([]);
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load messages.',
                    type: 'error',
                    closable: true,
                });
            }
        }

        load();

        const channel = supabase
            .channel(`application-messages:${applicationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'application_messages',
                    filter: `application_id=eq.${applicationId}`,
                },
                (payload) =>
                    setMessages((current) =>
                        withMessage(current, payload.new as ApplicationMessage),
                    ),
            )
            .subscribe();

        return () => {
            ignore = true;
            supabase.removeChannel(channel);
        };
    }, [applicationId, supabase]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [messages]);

    async function handleSend() {
        const body = draft.trim();
        if (!body || sending) return;

        setSending(true);

        try {
            const { data, error, status } = await sendApplicationMessage(
                supabase,
                applicationId,
                body,
            );

            if (!validRequestStatus(status) || error || !data) throw new Error();

            setMessages((current) => withMessage(current, data));
            setDraft('');
        } catch {
            toaster.create({
                title: 'Error',
                description: 'Failed to send message.',
                type: 'error',
                closable: true,
            });
        } finally {
            setSending(false);
        }
    }

    return (
        <>
            <Dialog.Body minHeight='xs'>
                {!messages ? (
                    <Spinner size='lg' className='mx-auto block' />
                ) : messages.length === 0 ? (
                    <Text color='fg.muted' textAlign='center' textStyle='sm'>
                        No messages yet. Start the conversation below.
                    </Text>
                ) : (
                    <VStack gap={3} align='stretch'>
                        {messages.map((message) => {
                            const mine = message.sender_id === userId;

                            return (
                                <VStack
                                    key={message.id}
                                    gap={1}
                                    align={mine ? 'end' : 'start'}
                                    data-testid='chat-message'
                                >
                                    <Text textStyle='xs' color='fg.muted'>
                                        {mine ? 'You' : counterpartName} ·{' '}
                                        {new Date(message.created_at).toLocaleString(undefined, {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        })}
                                    </Text>
                                    <Box
                                        maxWidth='80%'
                                        px={3}
                                        py={2}
                                        rounded='lg'
                                        bg={mine ? 'colorPalette.solid' : 'bg.muted'}
                                        color={mine ? 'colorPalette.contrast' : 'fg'}
                                        colorPalette='blue'
                                        whiteSpace='pre-wrap'
                                        wordBreak='break-word'
                                    >
                                        {message.body}
                                    </Box>
                                </VStack>
                            );
                        })}
                        <div ref={bottomRef} />
                    </VStack>
                )}
            </Dialog.Body>

            <Dialog.Footer>
                <HStack width='full' align='end'>
                    <Textarea
                        aria-label='Message'
                        placeholder='Write a message…'
                        autoresize
                        maxHeight='40'
                        maxLength={MAX_MESSAGE_LENGTH}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            // Enter sends, Shift+Enter adds a new line
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={!messages}
                    />
                    <Button
                        onClick={handleSend}
                        loading={sending}
                        disabled={!messages || draft.trim() === ''}
                    >
                        <FaPaperPlane />
                        Send
                    </Button>
                </HStack>
            </Dialog.Footer>
        </>
    );
}
