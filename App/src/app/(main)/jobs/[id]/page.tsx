'use client';

import { Badge, Button, Card, HStack, Heading, Spinner, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import {
    FaCalendar,
    FaCalendarXmark,
    FaChevronLeft,
    FaDollarSign,
    FaLayerGroup,
    FaLocationDot,
    FaPen,
} from 'react-icons/fa6';

import { CoverLetterDialog } from '@/components/cover_letter_dialog';
import { SaveJobButton } from '@/components/save_job_button';
import { toaster } from '@/components/ui/toaster';
import { useUserProfile } from '@/contexts/user_profile';
import { applyToJob, getJob, hasUserApplied } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';
import {
    formatDeadline,
    formatSalary,
    isPastDeadline,
    jobStatusColorPalette,
    jobTypeColorPalette,
} from '@/utils/jobs';

type JobDetailType = {
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    category: string;
    job_type: string;
    salary_min: number | null;
    salary_max: number | null;
    status: string;
    application_deadline: string | null;
    recruiter_id: string | null;
    created_at: string;
};

export default function JobDetailPage({ params, searchParams }: PageProps<'/jobs/[id]'>) {
    const router = useRouter();
    const { id } = use(params);
    const isRecruiter = useUserProfile()?.account_type === 'Recruiter';
    const [job, setJob] = useState<JobDetailType>();
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    // Apply stays disabled until the page knows whether the Worker already
    // applied, so a late answer to that check can't undo a new application.
    const [appliedChecked, setAppliedChecked] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    // The listing passes its filters in the query string so Back restores the same results
    const query = new URLSearchParams(
        Object.entries(use(searchParams)).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
    ).toString();
    const backHref = query ? `/jobs?${query}` : '/jobs';
    async function handleApply() {
        setApplying(true);

        try {
            const { error } = await applyToJob(createClientSupabase(), id);

            if (error) {
                if ('code' in error && error.code === '23505') {
                    toaster.create({
                        title: 'Already applied',
                        description: 'You have already applied to this job.',
                        type: 'info',
                        closable: true,
                    });
                    setHasApplied(true);
                    return;
                }

                throw error;
            }

            setHasApplied(true);
            toaster.create({
                title: 'Application submitted!',
                description: 'Your application was submitted successfully.',
                type: 'success',
                closable: true,
            });
        } catch (error) {
            console.error(
                'Application error details:',
                JSON.stringify(error, Object.getOwnPropertyNames(error as object)),
            );
            toaster.create({
                title: 'Application failed',
                description: 'Could not submit your application. Please try again.',
                type: 'error',
                closable: true,
            });
        } finally {
            setApplying(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        async function load() {
            const client = createClientSupabase();

            try {
                const { data, error, status } = await getJob(client, id);

                if (ignore) return;
                if (!validRequestStatus(status) || error || !data) {
                    throw new Error('Failed to load job posting.');
                }

                setJob(data);

                // Recruiters can't apply, they can only edit the postings they own
                if (isRecruiter) {
                    const claims = await client.auth.getClaims();

                    if (ignore) return;

                    setIsOwner(data.recruiter_id === claims.data?.claims.sub);
                    return;
                }

                const appliedResult = await hasUserApplied(client, id);

                if (ignore) return;

                if (!appliedResult.error && validRequestStatus(appliedResult.status)) {
                    setHasApplied(appliedResult.data);
                }
                setAppliedChecked(true);
            } catch {
                if (ignore) return;

                toaster.create({
                    title: 'Error',
                    description: 'Failed to load job posting.',
                    type: 'error',
                    closable: true,
                });

                router.push(backHref);
            }
        }

        load();

        return () => {
            ignore = true;
        };
    }, [id, router, backHref, isRecruiter]);

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <Link href={backHref} className='self-start'>
                <Button variant='outline'>
                    <FaChevronLeft />
                    Back
                </Button>
            </Link>

            {!job ? (
                <Spinner size='xl' className='self-center' />
            ) : (
                <Card.Root>
                    <Card.Header gap={2}>
                        <HStack justify='space-between' align='start' gap={4}>
                            <Heading as='h1' textStyle='3xl'>
                                {job.title}
                            </Heading>
                            <HStack gap={2} flexShrink={0}>
                                {job.status !== 'Open' && (
                                    <Badge
                                        size='lg'
                                        colorPalette={jobStatusColorPalette[job.status] ?? 'gray'}
                                    >
                                        {job.status}
                                    </Badge>
                                )}
                                <Badge
                                    size='lg'
                                    colorPalette={jobTypeColorPalette[job.job_type] ?? 'gray'}
                                >
                                    {job.job_type}
                                </Badge>
                            </HStack>
                        </HStack>
                        <Text textStyle='lg' fontWeight='medium' color='fg.muted'>
                            {job.company}
                        </Text>
                        <HStack gap={4} color='fg.muted' textStyle='sm' wrap='wrap'>
                            <HStack gap={1}>
                                <FaLocationDot />
                                {job.location}
                            </HStack>
                            <HStack gap={1}>
                                <FaLayerGroup />
                                {job.category}
                            </HStack>
                            <HStack gap={1}>
                                <FaDollarSign />
                                {formatSalary(job.salary_min, job.salary_max)}
                            </HStack>
                            <HStack gap={1}>
                                <FaCalendar />
                                Posted {new Date(job.created_at).toLocaleDateString()}
                            </HStack>
                            {job.application_deadline && (
                                <HStack
                                    gap={1}
                                    color={
                                        isPastDeadline(job.application_deadline)
                                            ? 'fg.error'
                                            : undefined
                                    }
                                >
                                    <FaCalendarXmark />
                                    Application deadline {formatDeadline(job.application_deadline)}
                                </HStack>
                            )}
                        </HStack>
                    </Card.Header>
                    <Card.Body gap={3} borderTopWidth='1px' marginTop={4} paddingTop={6}>
                        <Heading as='h2' textStyle='xl'>
                            Job Description
                        </Heading>
                        <Text whiteSpace='pre-line'>
                            {job.description || 'No description provided.'}
                        </Text>
                    </Card.Body>
                    <Card.Footer borderTopWidth='1px' paddingTop={4} gap={2}>
                        {isRecruiter ? (
                            isOwner && (
                                <Link href={`/jobs/edit?id=${job.id}`}>
                                    <Button colorPalette='blue'>
                                        <FaPen />
                                        Edit Posting
                                    </Button>
                                </Link>
                            )
                        ) : (
                            <Button
                                colorPalette='blue'
                                onClick={handleApply}
                                loading={applying}
                                disabled={
                                    !appliedChecked ||
                                    applying ||
                                    hasApplied ||
                                    job.status !== 'Open' ||
                                    isPastDeadline(job.application_deadline)
                                }
                            >
                                {hasApplied
                                    ? 'Applied'
                                    : job.status !== 'Open' ||
                                        isPastDeadline(job.application_deadline)
                                      ? 'Applications closed'
                                      : 'Apply Now'}
                            </Button>
                        )}
                        {!isRecruiter && <SaveJobButton jobId={job.id} />}
                        {!isRecruiter && <CoverLetterDialog jobId={job.id} jobTitle={job.title} />}
                    </Card.Footer>
                </Card.Root>
            )}
        </main>
    );
}
