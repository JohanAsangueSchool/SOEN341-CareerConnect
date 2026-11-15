'use client';

import {
    Alert,
    Button,
    CloseButton,
    Dialog,
    Field,
    NativeSelect,
    Portal,
    Text,
    Textarea,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from 'react';
import { FaCopy, FaWandMagicSparkles } from 'react-icons/fa6';

import { generateCoverLetter } from '@/app/(main)/jobs/[id]/actions';
import { toaster } from '@/components/ui/toaster';
import { getUserResumes } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';

type ResumeOption = { id: string; title: string };

/** Writes a cover letter for a posting with Google Gemini, from one of the Worker's resumes. */
export function CoverLetterDialog({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
    const [open, setOpen] = useState(false);
    const [resumes, setResumes] = useState<ResumeOption[]>();
    const [resumeId, setResumeId] = useState('');
    const [generating, setGenerating] = useState(false);
    const [letter, setLetter] = useState('');
    const [error, setError] = useState('');

    async function onOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen || resumes) return;

        const { data } = await getUserResumes(createClientSupabase());
        const options = (data ?? []).filter((resume) => resume.status !== 'Archived');
        setResumes(options);
        setResumeId(options[0]?.id ?? '');
    }

    async function generate() {
        setGenerating(true);
        setError('');
        const result = await generateCoverLetter(jobId, resumeId);
        setGenerating(false);

        if ('error' in result) setError(result.error);
        else setLetter(result.letter);
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(letter);
            toaster.create({ title: 'Copied', type: 'success', closable: true });
        } catch {
            toaster.create({
                title: 'Error',
                description: 'Could not copy. Select the text and copy it instead.',
                type: 'error',
                closable: true,
            });
        }
    }

    return (
        <Dialog.Root size='lg' open={open} onOpenChange={(e) => onOpenChange(e.open)}>
            <Dialog.Trigger asChild>
                <Button variant='outline'>
                    <FaWandMagicSparkles />
                    Generate cover letter
                </Button>
            </Dialog.Trigger>

            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Cover letter for {jobTitle}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body className='flex flex-col gap-4'>
                            {resumes && resumes.length === 0 ? (
                                <Text>
                                    The letter is written from one of your resumes.{' '}
                                    <Link href='/resumes/edit' className='underline'>
                                        Create a resume
                                    </Link>{' '}
                                    first.
                                </Text>
                            ) : (
                                <Field.Root disabled={!resumes || generating}>
                                    <Field.Label>Resume</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={resumeId}
                                            onChange={(event) => setResumeId(event.target.value)}
                                        >
                                            {resumes?.map((resume) => (
                                                <option key={resume.id} value={resume.id}>
                                                    {resume.title}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                    <Field.HelperText>
                                        Google Gemini writes the letter from this resume and the
                                        posting. It only uses what your resume says, so check it
                                        before sending.
                                    </Field.HelperText>
                                </Field.Root>
                            )}

                            {error && (
                                <Alert.Root status='error'>
                                    <Alert.Indicator />
                                    <Alert.Title>{error}</Alert.Title>
                                </Alert.Root>
                            )}

                            {letter && (
                                <Field.Root>
                                    <Field.Label>Cover letter</Field.Label>
                                    <Textarea
                                        value={letter}
                                        onChange={(event) => setLetter(event.target.value)}
                                        autoresize
                                        minH='16rem'
                                        maxH='50vh'
                                    />
                                    <Field.HelperText>
                                        You can edit the letter here.
                                    </Field.HelperText>
                                </Field.Root>
                            )}
                        </Dialog.Body>

                        <Dialog.Footer>
                            {letter && (
                                <Button variant='outline' onClick={copy} disabled={generating}>
                                    <FaCopy />
                                    Copy
                                </Button>
                            )}
                            <Button
                                colorPalette='blue'
                                onClick={generate}
                                loading={generating}
                                loadingText='Writing…'
                                disabled={!resumeId}
                            >
                                <FaWandMagicSparkles />
                                {letter ? 'Write again' : 'Generate'}
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
