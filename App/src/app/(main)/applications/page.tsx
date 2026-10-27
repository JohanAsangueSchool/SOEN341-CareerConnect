'use client';

import {
    Badge,
    Button,
    Card,
    EmptyState,
    HStack,
    Heading,
    NativeSelect,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
    FaArrowRight,
    FaCalendar,
    FaClipboardCheck,
    FaEnvelope,
    FaPhone,
    FaXmark,
} from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { useUserProfile } from '@/contexts/user_profile';
import {
    getRecruiterApplications,
    getRecruiterJobs,
    getUserApplications,
} from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { applicationStatusColorPalette } from '@/utils/applications';
import { ApplicationStatusEnumType, ApplicationStatusEnumValues } from '@/utils/enums';
import { validRequestStatus } from '@/utils/function';

import { updateApplicationStatus } from './actions';

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

type RecruiterApplication = {
    id: string;
    job_id: string;
    user_id: string;
    status: ApplicationStatusEnumType;
    applied_at: string;
    jobs: {
        title: string;
        company: string;
    };
    applicant: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    } | null;
};

type JobOption = {
    id: string;
    title: string;
};

export default function ApplicationsPage() {
    const userProfile = useUserProfile();

    return userProfile?.account_type === 'Recruiter' ? (
        // useSearchParams requires a Suspense boundary so the page can still be prerendered
        <Suspense fallback={<Spinner size='xl' className='self-center' />}>
            <RecruiterApplications />
        </Suspense>
    ) : (
        <WorkerApplications />
    );
}

function WorkerApplications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let ignore = false;

        async function loadApplications() {
            try {
                const { data, error, status } = await getUserApplications(createClientSupabase());

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
        <main className='m-8 flex w-full max-w-4xl flex-col gap-6 self-center'>
            <Heading as='h1' textStyle='3xl'>
                My Applications
            </Heading>

            <Text color='fg.muted'>Track the status of jobs you have applied to.</Text>

            {loading ? (
                <Spinner size='xl' className='self-center' />
            ) : loadError ? (
                <Text color='red.500'>
                    Could not load your applications. Please refresh and try again.
                </Text>
            ) : applications.length === 0 ? (
                <Card.Root>
                    <Card.Body>
                        <VStack gap={3} align='start'>
                            <Heading as='h2' textStyle='lg'>
                                No applications yet
                            </Heading>
                            <Text color='fg.muted'>
                                Browse the Jobs page and apply to a position to see it here.
                            </Text>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            ) : (
                <VStack gap={4} align='stretch'>
                    {applications.map((application) => (
                        <Card.Root key={application.id}>
                            <Card.Body gap={3}>
                                <Heading as='h2' textStyle='xl'>
                                    {application.jobs?.title ?? 'Job posting unavailable'}
                                </Heading>

                                <Text fontWeight='medium'>
                                    {application.jobs?.company ?? 'Unknown company'}
                                </Text>

                                <Text color='fg.muted' fontSize='sm'>
                                    {application.jobs
                                        ? `${application.jobs.location} · ${application.jobs.job_type}`
                                        : 'Job details unavailable'}
                                </Text>

                                <Text fontSize='sm'>
                                    Applied on{' '}
                                    {new Date(application.applied_at).toLocaleDateString()}
                                </Text>

                                <div>
                                    <Text fontSize='sm' mb={1} color='fg.muted'>
                                        Application status
                                    </Text>
                                    <Badge
                                        colorPalette={
                                            applicationStatusColorPalette[application.status] ??
                                            'gray'
                                        }
                                    >
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

function RecruiterApplications() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Filters live in the URL so they survive navigating to a job and back
    const jobId = searchParams.get('job') ?? '';
    const status = searchParams.get('status') ?? '';
    const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';

    const [applications, setApplications] = useState<RecruiterApplication[]>();
    const [jobOptions, setJobOptions] = useState<JobOption[]>([]);

    const hasFilters = jobId !== '' || status !== '';

    function updateParams(updates: Record<string, string>) {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) =>
            value ? params.set(key, value) : params.delete(key),
        );

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }

    function clearFilters() {
        updateParams({ job: '', status: '' });
    }

    useEffect(() => {
        let ignore = false;

        async function loadOptions() {
            const { data, error, status } = await getRecruiterJobs(createClientSupabase());

            if (ignore || !validRequestStatus(status) || error || !data) return;

            setJobOptions(data.map((job) => ({ id: job.id, title: job.title })));
        }

        loadOptions();
        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                const {
                    data,
                    error,
                    status: requestStatus,
                } = await getRecruiterApplications(createClientSupabase(), {
                    jobId,
                    status,
                    sort,
                });

                if (ignore) return;
                if (!validRequestStatus(requestStatus) || error || !data) throw new Error();

                setApplications(data as unknown as RecruiterApplication[]);
            } catch {
                if (ignore) return;

                setApplications([]);
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load applications.',
                    type: 'error',
                    closable: true,
                });
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, [jobId, status, sort]);

    function markStatus(id: string, newStatus: ApplicationStatusEnumType) {
        setApplications((current) =>
            current?.map((application) =>
                application.id === id ? { ...application, status: newStatus } : application,
            ),
        );
    }

    return (
        <main className='m-8 flex w-full max-w-4xl flex-col gap-6 self-center'>
            <Heading as='h1' textStyle='3xl'>
                Applications
            </Heading>

            <Text color='fg.muted'>Review the applications submitted to your job postings.</Text>

            <div className='flex flex-wrap items-center gap-3'>
                <FilterSelect
                    label='Job posting'
                    allLabel='All job postings'
                    value={jobId}
                    options={jobOptions.map((job) => ({ value: job.id, label: job.title }))}
                    onChange={(value) => updateParams({ job: value })}
                />
                <FilterSelect
                    label='Status'
                    allLabel='All statuses'
                    value={status}
                    options={ApplicationStatusEnumValues.map((value) => ({
                        value,
                        label: value,
                    }))}
                    onChange={(value) => updateParams({ status: value })}
                />
                <NativeSelect.Root flex='1' minWidth='3xs'>
                    <NativeSelect.Field
                        aria-label='Sort by date'
                        value={sort}
                        onChange={(e) =>
                            // Newest is the default, so keep it out of the URL
                            updateParams({ sort: e.target.value === 'oldest' ? 'oldest' : '' })
                        }
                    >
                        <option value='newest'>Newest first</option>
                        <option value='oldest'>Oldest first</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                {hasFilters && (
                    <Button variant='ghost' onClick={clearFilters}>
                        <FaXmark />
                        Clear filters
                    </Button>
                )}
            </div>

            {!applications ? (
                <Spinner size='xl' className='self-center' />
            ) : applications.length === 0 ? (
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <FaClipboardCheck />
                        </EmptyState.Indicator>
                        <EmptyState.Title>
                            {hasFilters
                                ? 'No applications match your filters'
                                : 'No applications yet'}
                        </EmptyState.Title>
                        <EmptyState.Description>
                            {hasFilters
                                ? 'Try a different job posting or status.'
                                : 'Applications submitted to your job postings will appear here.'}
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <VStack gap={4} align='stretch'>
                    {applications.map((application) => (
                        <RecruiterApplicationCard
                            key={application.id}
                            application={application}
                            onStatusChange={markStatus}
                        />
                    ))}
                </VStack>
            )}
        </main>
    );
}

function FilterSelect({
    label,
    allLabel,
    value,
    options,
    onChange,
}: {
    label: string;
    allLabel: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    return (
        <NativeSelect.Root flex='1' minWidth='3xs'>
            <NativeSelect.Field
                aria-label={label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value=''>{allLabel}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
        </NativeSelect.Root>
    );
}

function RecruiterApplicationCard({
    application,
    onStatusChange,
}: {
    application: RecruiterApplication;
    onStatusChange: (id: string, status: ApplicationStatusEnumType) => void;
}) {
    const [updating, setUpdating] = useState(false);
    const applicant = application.applicant;

    async function handleStatusChange(newStatus: ApplicationStatusEnumType) {
        setUpdating(true);

        try {
            await updateApplicationStatus(application.id, newStatus);
            onStatusChange(application.id, newStatus);
            toaster.create({
                title: 'Status updated',
                description: `Application marked as ${newStatus}.`,
                type: 'success',
                closable: true,
            });
        } catch {
            toaster.create({
                title: 'Error',
                description: 'Failed to update application status.',
                type: 'error',
                closable: true,
            });
        } finally {
            setUpdating(false);
        }
    }

    return (
        <Card.Root size='sm'>
            <Card.Header>
                <HStack justify='space-between' align='start'>
                    <Card.Title lineClamp={1}>
                        {applicant
                            ? `${applicant.first_name} ${applicant.last_name}`
                            : 'Unknown applicant'}
                    </Card.Title>
                    <Badge
                        colorPalette={applicationStatusColorPalette[application.status] ?? 'gray'}
                    >
                        {application.status}
                    </Badge>
                </HStack>
                <Text textStyle='xs' color='fg.muted'>
                    {application.jobs.title} · {application.jobs.company}
                </Text>
            </Card.Header>
            <Card.Body>
                <HStack gap={4} color='fg.muted' textStyle='sm' wrap='wrap'>
                    <HStack gap={1}>
                        <FaCalendar />
                        Applied on {new Date(application.applied_at).toLocaleDateString()}
                    </HStack>
                    {applicant?.email && (
                        <HStack gap={1}>
                            <FaEnvelope />
                            {applicant.email}
                        </HStack>
                    )}
                    {applicant?.phone && (
                        <HStack gap={1}>
                            <FaPhone />
                            {applicant.phone}
                        </HStack>
                    )}
                </HStack>
            </Card.Body>
            <Card.Footer justifyContent='space-between' gap={2} flexWrap='wrap'>
                <NativeSelect.Root size='sm' width='3xs' disabled={updating}>
                    <NativeSelect.Field
                        aria-label='Application status'
                        value={application.status}
                        onChange={(e) =>
                            handleStatusChange(e.target.value as ApplicationStatusEnumType)
                        }
                    >
                        {ApplicationStatusEnumValues.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
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
