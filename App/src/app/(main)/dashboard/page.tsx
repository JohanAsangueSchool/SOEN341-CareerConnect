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
    Stat,
    Text,
    VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    FaArrowRight,
    FaBoxArchive,
    FaBoxOpen,
    FaBriefcase,
    FaCalendar,
    FaChevronDown,
    FaChevronUp,
    FaEnvelope,
    FaLocationDot,
    FaPen,
    FaPhone,
    FaPlus,
    FaUpload,
    FaUsers,
} from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getRecruiterApplications, getRecruiterJobs } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { applicationStatusColorPalette } from '@/utils/applications';
import {
    DateRange,
    DateRangeValues,
    PostingView,
    PostingViewValues,
    countByStatus,
    dateRangeLabels,
    filterApplications,
    filterPostings,
    groupByJob,
    postingViewLabels,
} from '@/utils/dashboard';
import {
    ApplicationStatusEnumType,
    ApplicationStatusEnumValues,
    JobStatusEnumType,
} from '@/utils/enums';
import { validRequestStatus } from '@/utils/function';
import { jobStatusColorPalette, jobTypeColorPalette } from '@/utils/jobs';

import { updateApplicationStatus } from '../applications/actions';
import { archiveJob, postJob, restoreJob } from '../jobs/edit/actions';

type DashboardJob = {
    id: string;
    title: string;
    company: string;
    location: string;
    job_type: string;
    status: JobStatusEnumType;
    created_at: string;
};

type DashboardApplication = {
    id: string;
    job_id: string;
    user_id: string;
    status: ApplicationStatusEnumType;
    applied_at: string;
    applicant: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    } | null;
};

export default function DashboardPage() {
    const [jobs, setJobs] = useState<DashboardJob[]>();
    const [applications, setApplications] = useState<DashboardApplication[]>();
    const [view, setView] = useState<PostingView>('active');

    useEffect(() => {
        let ignore = false;

        async function load() {
            const client = createClientSupabase();

            try {
                const [jobsResult, applicationsResult] = await Promise.all([
                    getRecruiterJobs(client),
                    getRecruiterApplications(client),
                ]);

                if (ignore) return;
                if (
                    !validRequestStatus(jobsResult.status) ||
                    jobsResult.error ||
                    !jobsResult.data ||
                    !validRequestStatus(applicationsResult.status) ||
                    applicationsResult.error ||
                    !applicationsResult.data
                ) {
                    throw new Error();
                }

                setJobs(jobsResult.data);
                setApplications(applicationsResult.data as unknown as DashboardApplication[]);
            } catch {
                if (ignore) return;

                setJobs([]);
                setApplications([]);
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load your dashboard.',
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

    function markJobStatus(id: string, status: JobStatusEnumType) {
        setJobs((current) => current?.map((job) => (job.id === id ? { ...job, status } : job)));
    }

    function markApplicationStatus(id: string, status: ApplicationStatusEnumType) {
        setApplications((current) =>
            current?.map((application) =>
                application.id === id ? { ...application, status } : application,
            ),
        );
    }

    const applicationsByJob = groupByJob(applications ?? []);
    const shownJobs = filterPostings(jobs ?? [], view);

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <HStack justify='space-between' align='center' wrap='wrap' gap={3}>
                <div>
                    <Heading as='h1' textStyle='3xl'>
                        Dashboard
                    </Heading>
                    <Text color='fg.muted'>
                        Manage your job postings and the applications they receive.
                    </Text>
                </div>
                <Link href='/jobs/edit'>
                    <Button>
                        <FaPlus />
                        New Job Posting
                    </Button>
                </Link>
            </HStack>

            {!jobs || !applications ? (
                <Spinner size='xl' className='self-center' />
            ) : (
                <>
                    <DashboardStats jobs={jobs} applications={applications} />

                    <NativeSelect.Root width='3xs'>
                        <NativeSelect.Field
                            aria-label='Show postings'
                            value={view}
                            onChange={(e) => setView(e.target.value as PostingView)}
                        >
                            {PostingViewValues.map((value) => (
                                <option key={value} value={value}>
                                    {postingViewLabels[value]}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>

                    {shownJobs.length === 0 ? (
                        <EmptyState.Root>
                            <EmptyState.Content>
                                <EmptyState.Indicator>
                                    <FaBriefcase />
                                </EmptyState.Indicator>
                                <EmptyState.Title>
                                    {view === 'archived'
                                        ? 'No archived postings'
                                        : 'No job postings yet'}
                                </EmptyState.Title>
                                <EmptyState.Description>
                                    {view === 'archived'
                                        ? 'Postings you archive will appear here.'
                                        : 'Create your first job posting to start receiving applications.'}
                                </EmptyState.Description>
                            </EmptyState.Content>
                        </EmptyState.Root>
                    ) : (
                        <VStack gap={4} align='stretch'>
                            {shownJobs.map((job) => (
                                <PostingCard
                                    key={job.id}
                                    job={job}
                                    applications={applicationsByJob.get(job.id) ?? []}
                                    onJobStatusChange={markJobStatus}
                                    onApplicationStatusChange={markApplicationStatus}
                                />
                            ))}
                        </VStack>
                    )}
                </>
            )}
        </main>
    );
}

function DashboardStats({
    jobs,
    applications,
}: {
    jobs: DashboardJob[];
    applications: DashboardApplication[];
}) {
    const stats = [
        { label: 'Active postings', value: filterPostings(jobs, 'active').length },
        { label: 'Open postings', value: jobs.filter((job) => job.status === 'Open').length },
        { label: 'Applications', value: applications.length },
        { label: 'Awaiting review', value: countByStatus(applications)['Applied'] ?? 0 },
    ];

    return (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            {stats.map((stat) => (
                <Card.Root key={stat.label} size='sm'>
                    <Card.Body>
                        <Stat.Root>
                            <Stat.Label>{stat.label}</Stat.Label>
                            <Stat.ValueText>{stat.value}</Stat.ValueText>
                        </Stat.Root>
                    </Card.Body>
                </Card.Root>
            ))}
        </div>
    );
}

function PostingCard({
    job,
    applications,
    onJobStatusChange,
    onApplicationStatusChange,
}: {
    job: DashboardJob;
    applications: DashboardApplication[];
    onJobStatusChange: (id: string, status: JobStatusEnumType) => void;
    onApplicationStatusChange: (id: string, status: ApplicationStatusEnumType) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);
    const statusCounts = countByStatus(applications);
    const isArchived = job.status === 'Archived';

    async function changeStatus(
        action: (id: string) => Promise<void>,
        newStatus: JobStatusEnumType,
        message: string,
    ) {
        setUpdating(true);

        try {
            await action(job.id);
            onJobStatusChange(job.id, newStatus);
            toaster.create({
                title: message,
                type: 'success',
                closable: true,
            });
        } catch {
            toaster.create({
                title: 'Error',
                description: 'Failed to update the job posting.',
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
                    <Card.Title lineClamp={1}>{job.title}</Card.Title>
                    <HStack gap={1} flexShrink={0}>
                        <Badge colorPalette={jobStatusColorPalette[job.status] ?? 'gray'}>
                            {job.status}
                        </Badge>
                        <Badge colorPalette={jobTypeColorPalette[job.job_type] ?? 'gray'}>
                            {job.job_type}
                        </Badge>
                    </HStack>
                </HStack>
                <Text textStyle='xs' color='fg.muted'>
                    {job.company} · Created {new Date(job.created_at).toLocaleDateString()}
                </Text>
            </Card.Header>
            <Card.Body gap={3}>
                <HStack gap={4} color='fg.muted' textStyle='sm' wrap='wrap'>
                    <HStack gap={1}>
                        <FaLocationDot />
                        {job.location}
                    </HStack>
                    <HStack gap={1}>
                        <FaUsers />
                        {applications.length}{' '}
                        {applications.length === 1 ? 'application' : 'applications'}
                    </HStack>
                </HStack>
                {applications.length > 0 && (
                    <HStack gap={1} wrap='wrap'>
                        {ApplicationStatusEnumValues.filter((status) => statusCounts[status]).map(
                            (status) => (
                                <Badge
                                    key={status}
                                    variant='outline'
                                    colorPalette={applicationStatusColorPalette[status] ?? 'gray'}
                                >
                                    {statusCounts[status]} {status}
                                </Badge>
                            ),
                        )}
                    </HStack>
                )}
            </Card.Body>
            <Card.Footer justifyContent='space-between' gap={2} flexWrap='wrap'>
                <Button
                    variant='ghost'
                    size='sm'
                    aria-expanded={expanded}
                    disabled={applications.length === 0}
                    onClick={() => setExpanded((current) => !current)}
                >
                    {expanded ? <FaChevronUp /> : <FaChevronDown />}
                    {expanded ? 'Hide applications' : 'Review applications'}
                </Button>
                <HStack gap={2} wrap='wrap'>
                    {job.status === 'Draft' && (
                        <Button
                            size='sm'
                            colorPalette='blue'
                            loading={updating}
                            onClick={() => changeStatus(postJob, 'Open', 'Job posted!')}
                        >
                            <FaUpload />
                            Post
                        </Button>
                    )}
                    {isArchived ? (
                        <Button
                            variant='outline'
                            size='sm'
                            loading={updating}
                            onClick={() => changeStatus(restoreJob, 'Closed', 'Posting restored')}
                        >
                            <FaBoxOpen />
                            Restore
                        </Button>
                    ) : (
                        <Button
                            variant='outline'
                            size='sm'
                            loading={updating}
                            onClick={() => changeStatus(archiveJob, 'Archived', 'Posting archived')}
                        >
                            <FaBoxArchive />
                            Archive
                        </Button>
                    )}
                    <Link href={`/jobs/edit?id=${job.id}`}>
                        <Button variant='outline' size='sm'>
                            <FaPen />
                            Edit
                        </Button>
                    </Link>
                    <Link href={`/jobs/${job.id}`}>
                        <Button variant='outline' size='sm'>
                            View
                            <FaArrowRight />
                        </Button>
                    </Link>
                </HStack>
            </Card.Footer>
            {expanded && (
                <ApplicationsPanel
                    applications={applications}
                    onStatusChange={onApplicationStatusChange}
                />
            )}
        </Card.Root>
    );
}

function ApplicationsPanel({
    applications,
    onStatusChange,
}: {
    applications: DashboardApplication[];
    onStatusChange: (id: string, status: ApplicationStatusEnumType) => void;
}) {
    const [status, setStatus] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

    const shown = filterApplications(applications, { status, dateRange, sort });

    return (
        <Card.Body gap={3} borderTopWidth='1px'>
            <div className='flex flex-wrap items-center gap-3'>
                <NativeSelect.Root size='sm' flex='1' minWidth='3xs'>
                    <NativeSelect.Field
                        aria-label='Filter by status'
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
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
                <NativeSelect.Root size='sm' flex='1' minWidth='3xs'>
                    <NativeSelect.Field
                        aria-label='Filter by date'
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as DateRange)}
                    >
                        {DateRangeValues.map((value) => (
                            <option key={value} value={value}>
                                {dateRangeLabels[value]}
                            </option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                <NativeSelect.Root size='sm' flex='1' minWidth='3xs'>
                    <NativeSelect.Field
                        aria-label='Sort by date'
                        value={sort}
                        onChange={(e) => setSort(e.target.value === 'oldest' ? 'oldest' : 'newest')}
                    >
                        <option value='newest'>Newest first</option>
                        <option value='oldest'>Oldest first</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            </div>

            {shown.length === 0 ? (
                <Text color='fg.muted' textStyle='sm'>
                    No applications match your filters.
                </Text>
            ) : (
                <VStack gap={3} align='stretch'>
                    {shown.map((application) => (
                        <ApplicantCard
                            key={application.id}
                            application={application}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </VStack>
            )}
        </Card.Body>
    );
}

function ApplicantCard({
    application,
    onStatusChange,
}: {
    application: DashboardApplication;
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
        <Card.Root size='sm' variant='subtle'>
            <Card.Header>
                <HStack justify='space-between' align='start'>
                    <Card.Title textStyle='md' lineClamp={1}>
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
            <Card.Footer>
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
            </Card.Footer>
        </Card.Root>
    );
}
