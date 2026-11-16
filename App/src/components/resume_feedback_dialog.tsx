'use client';

import {
    Alert,
    Badge,
    Button,
    CloseButton,
    Dialog,
    HStack,
    Heading,
    List,
    Portal,
    Spinner,
    Stack,
    Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from 'react';
import { FaPen, FaRotateRight, FaWandMagicSparkles } from 'react-icons/fa6';

import { type ResumeFeedbackResult, getResumeFeedback } from '@/app/(main)/resumes/actions';
import { FEEDBACK_PRIORITIES } from '@/lib/ai/resume_feedback';

const priorityColor: Record<string, string> = { High: 'red', Medium: 'orange', Low: 'gray' };

/** Asks Google Gemini to review a resume and shows the feedback. */
export function ResumeFeedbackDialog({ resumeId, title }: { resumeId: string; title: string }) {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<ResumeFeedbackResult>();
    const [loading, setLoading] = useState(false);

    async function analyze() {
        setLoading(true);
        setResult(undefined);
        setResult(await getResumeFeedback(resumeId));
        setLoading(false);
    }

    function onOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        // The first opening starts the review; later ones show the last result.
        if (isOpen && !result && !loading) analyze();
    }

    const suggestions =
        result && 'feedback' in result
            ? [...result.feedback.suggestions].sort(
                  (a, b) =>
                      FEEDBACK_PRIORITIES.indexOf(a.priority) -
                      FEEDBACK_PRIORITIES.indexOf(b.priority),
              )
            : [];

    return (
        <Dialog.Root
            size='lg'
            scrollBehavior='inside'
            open={open}
            onOpenChange={(e) => onOpenChange(e.open)}
        >
            <Dialog.Trigger asChild>
                <Button variant='outline' size='sm'>
                    <FaWandMagicSparkles />
                    Get AI feedback
                </Button>
            </Dialog.Trigger>

            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>AI feedback for {title}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            {loading && (
                                <Stack align='center' gap={3} paddingY={10}>
                                    <Spinner size='xl' />
                                    <Text color='fg.muted'>Reviewing your resume…</Text>
                                </Stack>
                            )}

                            {result && 'error' in result && (
                                <Alert.Root status='error'>
                                    <Alert.Indicator />
                                    <Alert.Title>{result.error}</Alert.Title>
                                </Alert.Root>
                            )}

                            {result && 'feedback' in result && (
                                <Stack gap={6}>
                                    {result.skippedFile && (
                                        <Alert.Root status='info'>
                                            <Alert.Indicator />
                                            <Alert.Title>
                                                {result.skippedFile} is a Word file, which can’t be
                                                read yet, so this feedback is based on the fields
                                                you filled in. Upload a PDF to have the file
                                                reviewed.
                                            </Alert.Title>
                                        </Alert.Root>
                                    )}

                                    <Stack gap={2}>
                                        <Heading as='h3' textStyle='md'>
                                            Overall
                                        </Heading>
                                        <Text>{result.feedback.overall}</Text>
                                    </Stack>

                                    {result.feedback.strengths.length > 0 && (
                                        <Stack gap={2}>
                                            <Heading as='h3' textStyle='md'>
                                                Strengths
                                            </Heading>
                                            <List.Root paddingStart={5}>
                                                {result.feedback.strengths.map((strength) => (
                                                    <List.Item key={strength}>{strength}</List.Item>
                                                ))}
                                            </List.Root>
                                        </Stack>
                                    )}

                                    <Stack gap={3}>
                                        <Heading as='h3' textStyle='md'>
                                            Suggestions for improvement
                                        </Heading>
                                        {suggestions.length === 0 ? (
                                            <Text color='fg.muted'>No changes suggested.</Text>
                                        ) : (
                                            <List.Root
                                                variant='plain'
                                                gap={4}
                                                aria-label='Suggestions'
                                            >
                                                {suggestions.map((item, index) => (
                                                    <List.Item key={index} display='block'>
                                                        <HStack gap={2} marginBottom={1}>
                                                            <Badge
                                                                colorPalette={
                                                                    priorityColor[item.priority]
                                                                }
                                                            >
                                                                {item.priority}
                                                            </Badge>
                                                            <Badge variant='outline'>
                                                                {item.section}
                                                            </Badge>
                                                        </HStack>
                                                        <Text fontWeight='medium'>
                                                            {item.issue}
                                                        </Text>
                                                        <Text color='fg.muted'>
                                                            {item.suggestion}
                                                        </Text>
                                                    </List.Item>
                                                ))}
                                            </List.Root>
                                        )}
                                    </Stack>

                                    <Text textStyle='xs' color='fg.muted'>
                                        Written by Google Gemini from your resume
                                        {result.readFile ? ' file and fields' : ''}. Use your own
                                        judgement.
                                    </Text>
                                </Stack>
                            )}
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Link href={`/resumes/edit?id=${resumeId}`}>
                                <Button variant='outline'>
                                    <FaPen />
                                    Edit resume
                                </Button>
                            </Link>
                            <Button onClick={analyze} loading={loading} disabled={!result}>
                                <FaRotateRight />
                                Analyze again
                            </Button>
                        </Dialog.Footer>

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size='sm' />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
