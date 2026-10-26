
'use client';

import { Badge, Card, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { getUserApplications } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { validRequestStatus } from '@/utils/function';

type Application = {
    id: string;
    job_id: string;
    status: 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';
    applied_at: string;
    jobs: {
        title: string;
        company: string;
        location: string;
        job_type: string;
    } | null;
};

const statusColors: Record<Application['status'], string> = {
    Pending: 'yellow',
    Reviewed: 'blue',
    Accepted: 'green',
    Rejected: 'red',
};

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let ignore = false;

        async function loadApplications() {
            try {
                const { data, error, status } =
                    await getUserApplications(createClientSupabase());

                if (ignore) return;

                if (!validRequestStatus(status) || error) {
                    throw new Error('Failed to load applications.');
                }

                setApplications((data ?? []) as unknown as Application[]);
            } catch (error) {
                if (ignore) return;
                console.error('Failed to load applications:', error);
                setLoadError(true);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        loadApplications();

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <main className="m-8 flex w-full max-w-4xl flex-col gap-6 self-center">
            <Heading as="h1" textStyle="3xl">
                My Applications
            </Heading>

            <Text color="fg.muted">
                Track the status of jobs you have applied to.
            </Text>

            {loading ? (
                <Spinner size="xl" className="self-center" />
            ) : loadError ? (
                <Text color="red.500">
                    Could not load your applications. Please refresh and try again.
                </Text>
            ) : applications.length === 0 ? (
                <Card.Root>
                    <Card.Body>
                        <VStack gap={3} align="start">
                            <Heading as="h2" textStyle="lg">
                                No applications yet
                            </Heading>
                            <Text color="fg.muted">
                                Browse the Jobs page and apply to a position to see it here.
                            </Text>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            ) : (
                <VStack gap={4} align="stretch">
                    {applications.map((application) => (
                        <Card.Root key={application.id}>
                            <Card.Body gap={3}>
                                <Heading as="h2" textStyle="xl">
                                    {application.jobs?.title ?? 'Job posting unavailable'}
                                </Heading>

                                <Text fontWeight="medium">
                                    {application.jobs?.company ?? 'Unknown company'}
                                </Text>

                                <Text color="fg.muted" fontSize="sm">
                                    {application.jobs
                                        ? `${application.jobs.location} · ${application.jobs.job_type}`
                                        : 'Job details unavailable'}
                                </Text>

                                <Text fontSize="sm">
                                    Applied on{' '}
                                    {new Date(application.applied_at).toLocaleDateString()}
                                </Text>

                                <div>
                                    <Text fontSize="sm" mb={1} color="fg.muted">
                                        Application status
                                    </Text>
                                    <Badge colorPalette={statusColors[application.status] ?? 'gray'}>
                                        {application.status}
                                    </Badge>
                                </div>
                            </Card.Body>
                        </Card.Root>
                    ))}
                </VStack>
            )}
        </main>
    );
}
