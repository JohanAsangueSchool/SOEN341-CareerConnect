'use client';

import {
    Badge,
    Button,
    ButtonProps,
    Card,
    Link as ChakraLink,
    CloseButton,
    Dialog,
    EmptyState,
    HStack,
    Portal,
    Spinner,
    Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
    FaBriefcase,
    FaCode,
    FaFile,
    FaGraduationCap,
    FaPaperclip,
    FaPen,
    FaPlus,
    FaStar,
    FaTrash,
    FaUpload,
} from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getUserResumes } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import {
    RESUME_FILE_TYPES,
    deleteResume,
    replaceResumeFile,
    resumeFileLinks,
    uploadResumeFile,
} from '@/lib/supabase/storage';
import { ResumeStatusEnumType } from '@/utils/enums';
import { validRequestStatus } from '@/utils/function';

type ResumeCardType = {
    id: string;
    title: string;
    summary: string;
    status: ResumeStatusEnumType;
    education: unknown[];
    experience: unknown[];
    skills: unknown[];
    projects: unknown[];
    file_path: string | null;
    file_name: string | null;
    updated_at: string;
};

// The extensions help the file picker on systems that ignore MIME types.
const RESUME_FILE_ACCEPT = [...RESUME_FILE_TYPES, '.pdf', '.doc', '.docx'].join(',');

const statusColorPalette: Record<string, string> = {
    Draft: 'gray',
    Active: 'green',
    Archived: 'orange',
};

function showError(error: unknown, fallback: string) {
    toaster.create({
        title: 'Error',
        description: error instanceof Error ? error.message : fallback,
        type: 'error',
        closable: true,
    });
}

/** A button that opens the file picker and passes the chosen file on. */
function FileButton({
    label,
    onFile,
    ...buttonProps
}: { label: React.ReactNode; onFile: (file: File) => Promise<void> } & ButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setBusy(true);
        try {
            await onFile(file);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <Button {...buttonProps} loading={busy} onClick={() => inputRef.current?.click()}>
                {label}
            </Button>
            <input
                ref={inputRef}
                type='file'
                hidden
                accept={RESUME_FILE_ACCEPT}
                onChange={onChange}
            />
        </>
    );
}

export default function ResumesPage() {
    const [resumes, setResumes] = useState<ResumeCardType[]>();
    const [fileLinks, setFileLinks] = useState<Record<string, string>>({});
    const [version, setVersion] = useState(0);
    const reload = () => setVersion((v) => v + 1);

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                const client = createClientSupabase();
                const { data, error, status } = await getUserResumes(client);

                if (ignore) return;
                if (!validRequestStatus(status) || error || !data) throw new Error();

                setResumes(data);

                const paths = data.flatMap((resume) =>
                    resume.file_path ? [resume.file_path] : [],
                );
                const links = await resumeFileLinks(client, paths);
                if (!ignore) setFileLinks(links);
            } catch {
                if (ignore) return;

                setResumes([]);
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load your resumes.',
                    type: 'error',
                    closable: true,
                });
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, [version]);

    async function upload(file: File) {
        try {
            await uploadResumeFile(createClientSupabase(), file);
            toaster.create({
                title: 'Success',
                description: 'Resume uploaded.',
                type: 'success',
                closable: true,
            });
            reload();
        } catch (error) {
            showError(error, 'Failed to upload the resume.');
        }
    }

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <HStack className='self-end'>
                <FileButton
                    variant='outline'
                    label={
                        <>
                            <FaUpload />
                            Upload resume
                        </>
                    }
                    onFile={upload}
                />
                <Link href='/resumes/edit'>
                    <Button>
                        <FaPlus />
                        New Resume
                    </Button>
                </Link>
            </HStack>
            <Text textStyle='xs' color='fg.muted' className='self-end'>
                PDF or Word, up to 5 MB.
            </Text>

            {!resumes ? (
                <Spinner size='xl' className='self-center' />
            ) : resumes.length === 0 ? (
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <FaFile />
                        </EmptyState.Indicator>
                        <EmptyState.Title>No resumes yet</EmptyState.Title>
                        <EmptyState.Description>
                            Create your first resume to start applying to jobs.
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {resumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            fileLink={resume.file_path ? fileLinks[resume.file_path] : undefined}
                            onChange={reload}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}

function ResumeCard({
    resume,
    fileLink,
    onChange,
}: {
    resume: ResumeCardType;
    fileLink?: string;
    onChange: () => void;
}) {
    async function replace(file: File) {
        try {
            await replaceResumeFile(createClientSupabase(), resume.id, file, resume.file_path);
            toaster.create({
                title: 'Success',
                description: 'Resume file replaced.',
                type: 'success',
                closable: true,
            });
            onChange();
        } catch (error) {
            showError(error, 'Failed to replace the file.');
        }
    }

    return (
        <Card.Root size='sm'>
            <Card.Header>
                <HStack justify='space-between' align='start'>
                    <Card.Title lineClamp={1}>{resume.title}</Card.Title>
                    <Badge colorPalette={statusColorPalette[resume.status] ?? 'gray'}>
                        {resume.status}
                    </Badge>
                </HStack>
                <Text textStyle='xs' color='fg.muted'>
                    Updated {new Date(resume.updated_at).toLocaleDateString()}
                </Text>
            </Card.Header>
            <Card.Body gap={3}>
                <Card.Description lineClamp={3}>{resume.summary || 'No summary.'}</Card.Description>
                <HStack
                    role='group'
                    aria-label='Section counts'
                    gap={4}
                    color='fg.muted'
                    textStyle='sm'
                    wrap='wrap'
                >
                    <HStack gap={1}>
                        <FaGraduationCap />
                        {resume.education?.length ?? 0}
                    </HStack>
                    <HStack gap={1}>
                        <FaBriefcase />
                        {resume.experience?.length ?? 0}
                    </HStack>
                    <HStack gap={1}>
                        <FaStar />
                        {resume.skills?.length ?? 0}
                    </HStack>
                    <HStack gap={1}>
                        <FaCode />
                        {resume.projects?.length ?? 0}
                    </HStack>
                </HStack>
                {resume.file_name && (
                    <HStack gap={2} textStyle='sm' minW={0}>
                        <FaPaperclip className='shrink-0' />
                        <Text truncate title={resume.file_name}>
                            {resume.file_name}
                        </Text>
                        {fileLink && (
                            <ChakraLink
                                href={fileLink}
                                target='_blank'
                                rel='noopener noreferrer'
                                colorPalette='blue'
                                className='shrink-0'
                            >
                                View file
                            </ChakraLink>
                        )}
                    </HStack>
                )}
            </Card.Body>
            <Card.Footer justifyContent='flex-end' flexWrap='wrap'>
                <DeleteResumeButton resume={resume} onDeleted={onChange} />
                <FileButton
                    variant='outline'
                    size='sm'
                    label={
                        <>
                            <FaUpload />
                            {resume.file_path ? 'Replace file' : 'Attach file'}
                        </>
                    }
                    onFile={replace}
                />
                <Link href={`/resumes/edit?id=${resume.id}`}>
                    <Button variant='outline' size='sm'>
                        <FaPen />
                        Edit
                    </Button>
                </Link>
            </Card.Footer>
        </Card.Root>
    );
}

/** Deletes a resume after asking for confirmation in a dialog. */
function DeleteResumeButton({
    resume,
    onDeleted,
}: {
    resume: ResumeCardType;
    onDeleted: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function confirmDelete() {
        setDeleting(true);
        try {
            await deleteResume(createClientSupabase(), resume.id, resume.file_path);
            setOpen(false);
            toaster.create({
                title: 'Success',
                description: 'Resume deleted.',
                type: 'success',
                closable: true,
            });
            onDeleted();
        } catch (error) {
            showError(error, 'Failed to delete the resume.');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <Dialog.Root role='alertdialog' open={open} onOpenChange={(e) => setOpen(e.open)}>
            <Dialog.Trigger asChild>
                <Button variant='ghost' size='sm' colorPalette='red' marginEnd='auto'>
                    <FaTrash />
                    Delete
                </Button>
            </Dialog.Trigger>

            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Delete resume?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Text>
                                “{resume.title}” and its file will be deleted. This cannot be
                                undone.
                            </Text>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant='outline' disabled={deleting}>
                                    Cancel
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button colorPalette='red' loading={deleting} onClick={confirmDelete}>
                                Delete resume
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
