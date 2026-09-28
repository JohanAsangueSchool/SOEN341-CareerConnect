'use client';

import { Badge, Button, Card, EmptyState, HStack, Spinner, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    FaBriefcase,
    FaCode,
    FaFile,
    FaGraduationCap,
    FaPen,
    FaPlus,
    FaStar,
} from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getUserResumes } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
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
    updated_at: string;
};

const statusColorPalette: Record<string, string> = {
    Draft: 'gray',
    Active: 'green',
    Archived: 'orange',
};

export default function ResumesPage() {
    const [resumes, setResumes] = useState<ResumeCardType[]>();

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                const { data, error, status } = await getUserResumes(createClientSupabase());

                if (ignore) return;
                if (!validRequestStatus(status) || error || !data) throw new Error();

                setResumes(data);
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
    }, []);

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <Link className='self-end' href='/resumes/edit'>
                <Button>
                    <FaPlus />
                    New Resume
                </Button>
            </Link>

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
                        <ResumeCard key={resume.id} resume={resume} />
                    ))}
                </div>
            )}
        </main>
    );
}

function ResumeCard({ resume }: { resume: ResumeCardType }) {
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
                <HStack gap={4} color='fg.muted' textStyle='sm' wrap='wrap'>
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
            </Card.Body>
            <Card.Footer justifyContent='flex-end'>
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
