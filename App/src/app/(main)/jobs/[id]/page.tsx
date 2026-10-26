'use client';

import { Badge, Button, Card, HStack, Heading, Spinner, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import {
    FaCalendar,
    FaChevronLeft,
    FaDollarSign,
    FaLayerGroup,
    FaLocationDot,
} from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getJob } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';
import { formatSalary, jobTypeColorPalette } from '@/utils/jobs';

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
    created_at: string;
};

export default function JobDetailPage({ params, searchParams }: PageProps<'/jobs/[id]'>) {
    const router = useRouter();
    const { id } = use(params);
    const [job, setJob] = useState<JobDetailType>();

    // The listing passes its filters in the query string so Back restores the same results
    const query = new URLSearchParams(
        Object.entries(use(searchParams)).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
    ).toString();
    const backHref = query ? `/jobs?${query}` : '/jobs';

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                const { data, error, status } = await getJob(createClientSupabase(), id);

                if (ignore) return;
                if (!validRequestStatus(status) || error || !data) throw new Error();

                setJob(data);
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
    }, [id, router, backHref]);

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
                                    <Badge size='lg' colorPalette='red'>
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
                </Card.Root>
            )}
        </main>
    );
}
