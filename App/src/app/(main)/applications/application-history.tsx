'use client';

import {
    Badge,
    Box,
    Button,
    Card,
    HStack,
    Heading,
    NativeSelect,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaArrowRight, FaCalendar, FaLocationDot } from 'react-icons/fa6';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { getUserApplications } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { applicationStatusColorPalette } from '@/utils/applications';
import { ApplicationStatusEnumType, ApplicationStatusEnumValues } from '@/utils/enums';
import { validRequestStatus } from '@/utils/function';

type Application = {
    id: string;
    job_id: string;
    status: ApplicationStatusEnumType;
    applied_at: string;
    jobs: {
        title: string;
        company: string;
        location: string;
        job_type: string;
    } | null;
};

function getLast30DaysData(applications: Application[]) {
    const result = [];

    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);

        date.setDate(today.getDate() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const dateKey = `${year}-${month}-${day}`;

        const count = applications.filter((application) => {
            const appliedDate = new Date(application.applied_at);

            return (
                appliedDate.getFullYear() === year &&
                appliedDate.getMonth() === date.getMonth() &&
                appliedDate.getDate() === date.getDate()
            );
        }).length;

        result.push({
            date: dateKey,
            count: count,
        });
    }
    return result;
}

export default function ApplicationHistory() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        let ignore = false;

        async function loadApplications() {
            try {
                const { data, error, status } = await getUserApplications(createClientSupabase());

                if (ignore) return;
                if (!validRequestStatus(status) || error) throw new Error();

                setApplications((data ?? []) as unknown as Application[]);
            } catch {
                if (ignore) return;
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

    const showApplications = statusFilter
        ? applications.filter((application) => application.status === statusFilter)
        : applications;

    const activityData = getLast30DaysData(applications);

    return (
        <main className='m-8 flex w-full max-w-4xl flex-col gap-6 self-center'>
            <Heading as='h1' textStyle='3xl'>
                My Applications
            </Heading>

            <Text color='fg.muted'>Track the status of your applications here</Text>

            <Card.Root>
                <Card.Header>
                    <Heading size='md'>Application Activity</Heading>

                    <Text color='fg.muted' textStyle='sm'>
                        Applications submitted over the last 30 days
                    </Text>
                </Card.Header>

                <Card.Body>
                    <Box width='100%' height='260px'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray='3 3' />

                                <XAxis dataKey='date' tick={{ fontSize: 12 }} interval={4} />

                                <YAxis allowDecimals={false} />

                                <Tooltip />

                                <Line
                                    type='monotone'
                                    dataKey='count'
                                    stroke='#3182CE'
                                    strokeWidth={2}
                                    dot={true}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Card.Body>
            </Card.Root>

            {loading ? (
                <Spinner size='xl' className='self-center' />
            ) : loadError ? (
                <Text color='red.500'>Sorry, cannot load your applications.</Text>
            ) : applications.length === 0 ? (
                <Card.Root>
                    <Card.Body>
                        <Heading as='h2' textStyle='lg'>
                            No applications yet.
                        </Heading>
                    </Card.Body>
                </Card.Root>
            ) : (
                <>
                    <HStack justify='space-between' wrap='wrap'>
                        <Text fontWeight='medium'>
                            Showing {showApplications.length} of {applications.length} applications
                        </Text>

                        <NativeSelect.Root width='3xs'>
                            <NativeSelect.Field
                                aria-label='Filter by status'
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value=''>All statuses</option>

                                {ApplicationStatusEnumValues.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </HStack>

                    {showApplications.length === 0 ? (
                        <Text color='fg.muted'>No applications with this status</Text>
                    ) : (
                        <VStack gap={4} align='stretch'>
                            {showApplications.map((application) => (
                                <ApplicationCard key={application.id} application={application} />
                            ))}
                        </VStack>
                    )}
                </>
            )}
        </main>
    );
}

function ApplicationCard({ application }: { application: Application }) {
    const job = application.jobs;

    return (
        <Card.Root size='sm'>
            <Card.Header>
                <HStack justify='space-between' align='start'>
                    <Card.Title>{job?.title ?? 'Job unavailable'}</Card.Title>
                    <Badge
                        colorPalette={applicationStatusColorPalette[application.status] ?? 'gray'}
                    >
                        {application.status}
                    </Badge>
                </HStack>
                <Text textStyle='sm' color='fg.muted'>
                    {job?.company ?? 'Unknown company'}
                </Text>
            </Card.Header>

            <Card.Body>
                <HStack gap={4} color='fg.muted' textStyle='sm' wrap='wrap'>
                    {job && (
                        <HStack gap={1}>
                            <FaLocationDot />
                            {job.location} · {job.job_type}
                        </HStack>
                    )}
                    <HStack gap={1}>
                        <FaCalendar />
                        Applied on {new Date(application.applied_at).toLocaleDateString()}
                    </HStack>
                </HStack>
            </Card.Body>

            <Card.Footer>
                <Link href={`/jobs/${application.job_id}`}>
                    <Button variant='outline' size='sm'>
                        View job
                        <FaArrowRight />
                    </Button>
                </Link>
            </Card.Footer>
        </Card.Root>
    );
}
