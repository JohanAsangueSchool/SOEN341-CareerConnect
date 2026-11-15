'use client';

import { Badge, Button, Card, EmptyState, HStack, Heading, Spinner, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaBookmark, FaLayerGroup, FaLocationDot } from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getSavedJobs, unsaveJob } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';
import { jobStatusColorPalette, jobTypeColorPalette } from '@/utils/jobs';

type SavedJobType = {
    job_id: string;
    created_at: string;
    job: {
        title: string;
        company: string;
        location: string;
        category: string;
        job_type: string;
        status: string;
    };
};

export default function SavedJobsPage() {
    const [savedJobs, setSavedJobs] = useState<SavedJobType[]>();

    useEffect(() => {
        let ignore = false;

        async function load() {
            const { data, error, status } = await getSavedJobs(createClientSupabase());
            if (ignore) return;

            if (!validRequestStatus(status) || error || !data) {
                setSavedJobs([]);
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load your saved jobs.',
                    type: 'error',
                    closable: true,
                });
                return;
            }

            // PostgREST returns the joined posting as an object; a posting that
            // can no longer be read comes back as null and is left out.
            setSavedJobs(
                data.flatMap((saved) => {
                    const job = saved.jobs as unknown as SavedJobType['job'] | null;
                    return job ? [{ job_id: saved.job_id, created_at: saved.created_at, job }] : [];
                }),
            );
        }

        load();
        return () => {
            ignore = true;
        };
    }, []);

    async function remove(jobId: string) {
        const { error } = await unsaveJob(createClientSupabase(), jobId);

        if (error) {
            toaster.create({
                title: 'Error',
                description: 'Could not remove the saved job.',
                type: 'error',
                closable: true,
            });
            return;
        }

        setSavedJobs((current) => current?.filter((saved) => saved.job_id !== jobId));
    }

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <Heading as='h1' textStyle='3xl'>
                Saved Jobs
            </Heading>

            {!savedJobs ? (
                <Spinner size='xl' className='self-center' />
            ) : savedJobs.length === 0 ? (
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <FaBookmark />
                        </EmptyState.Indicator>
                        <EmptyState.Title>No saved jobs yet</EmptyState.Title>
                        <EmptyState.Description>
                            Use “Save job” on a posting to keep it here for later.
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <div className='flex flex-col gap-4'>
                    {savedJobs.map(({ job_id, created_at, job }) => (
                        <Card.Root key={job_id} size='sm'>
                            <Card.Header>
                                <HStack justify='space-between' align='start'>
                                    <Heading as='h2' textStyle='lg' lineClamp={1}>
                                        {job.title}
                                    </Heading>
                                    <HStack gap={2} flexShrink={0}>
                                        {job.status !== 'Open' && (
                                            <Badge
                                                colorPalette={
                                                    jobStatusColorPalette[job.status] ?? 'gray'
                                                }
                                            >
                                                {job.status}
                                            </Badge>
                                        )}
                                        <Badge
                                            colorPalette={
                                                jobTypeColorPalette[job.job_type] ?? 'gray'
                                            }
                                        >
                                            {job.job_type}
                                        </Badge>
                                    </HStack>
                                </HStack>
                                <Text color='fg.muted'>{job.company}</Text>
                            </Card.Header>
                            <Card.Body>
                                <HStack gap={4} color='fg.muted' textStyle='sm' wrap='wrap'>
                                    <HStack gap={1}>
                                        <FaLocationDot />
                                        {job.location}
                                    </HStack>
                                    <HStack gap={1}>
                                        <FaLayerGroup />
                                        {job.category}
                                    </HStack>
                                    <Text>Saved {new Date(created_at).toLocaleDateString()}</Text>
                                </HStack>
                            </Card.Body>
                            <Card.Footer justifyContent='flex-end'>
                                <Button variant='ghost' size='sm' onClick={() => remove(job_id)}>
                                    Remove
                                </Button>
                                <Link href={`/jobs/${job_id}`}>
                                    <Button variant='outline' size='sm'>
                                        View
                                    </Button>
                                </Link>
                            </Card.Footer>
                        </Card.Root>
                    ))}
                </div>
            )}
        </main>
    );
}
