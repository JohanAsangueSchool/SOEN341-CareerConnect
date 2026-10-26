'use client';

import {
    Badge,
    Button,
    Card,
    EmptyState,
    HStack,
    Input,
    InputGroup,
    NativeSelect,
    Spinner,
    Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
    FaArrowRight,
    FaBriefcase,
    FaDollarSign,
    FaLayerGroup,
    FaLocationDot,
    FaMagnifyingGlass,
    FaXmark,
} from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getJobFilterOptions, getJobs } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { JobTypeEnumValues } from '@/utils/enums';
import { validRequestStatus } from '@/utils/function';
import { formatSalary, jobTypeColorPalette } from '@/utils/jobs';

type JobCardType = {
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    category: string;
    job_type: string;
    salary_min: number | null;
    salary_max: number | null;
    created_at: string;
};

function uniqueSorted(values: string[]) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export default function JobsPage() {
    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            {/* useSearchParams requires a Suspense boundary so the page can still be prerendered */}
            <Suspense fallback={<Spinner size='xl' className='self-center' />}>
                <JobsListing />
            </Suspense>
        </main>
    );
}

function JobsListing() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Filters live in the URL so they survive navigating to a job and back
    const keywordParam = searchParams.get('keyword') ?? '';
    const location = searchParams.get('location') ?? '';
    const category = searchParams.get('category') ?? '';
    const jobType = searchParams.get('type') ?? '';

    const [jobs, setJobs] = useState<JobCardType[]>();
    const [keyword, setKeyword] = useState(keywordParam);
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

    const hasFilters = keyword !== '' || location !== '' || category !== '' || jobType !== '';

    function updateParams(updates: Record<string, string>) {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) =>
            value ? params.set(key, value) : params.delete(key),
        );

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }

    function clearFilters() {
        setKeyword('');
        router.replace(pathname, { scroll: false });
    }

    // Wait until the user stops typing before updating the URL
    useEffect(() => {
        if (keyword === keywordParam) return;

        const timeout = setTimeout(() => updateParams({ keyword }), 300);
        return () => clearTimeout(timeout);
    });

    useEffect(() => {
        let ignore = false;

        async function loadOptions() {
            const { data, error, status } = await getJobFilterOptions(createClientSupabase());

            if (ignore || !validRequestStatus(status) || error || !data) return;

            setLocationOptions(uniqueSorted(data.map((job) => job.location)));
            setCategoryOptions(uniqueSorted(data.map((job) => job.category)));
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
                const { data, error, status } = await getJobs(createClientSupabase(), {
                    keyword: keywordParam,
                    location,
                    category,
                    jobType,
                });

                if (ignore) return;
                if (!validRequestStatus(status) || error || !data) throw new Error();

                setJobs(data);
            } catch {
                if (ignore) return;

                setJobs([]);
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load job listings.',
                    type: 'error',
                    closable: true,
                });
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, [keywordParam, location, category, jobType]);

    return (
        <>
            <div className='flex flex-col gap-3'>
                <InputGroup startElement={<FaMagnifyingGlass />}>
                    <Input
                        type='search'
                        placeholder='Search by title, company or keyword'
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </InputGroup>
                <div className='flex flex-wrap items-center gap-3'>
                    <FilterSelect
                        label='Location'
                        allLabel='All locations'
                        value={location}
                        options={locationOptions}
                        onChange={(value) => updateParams({ location: value })}
                    />
                    <FilterSelect
                        label='Category'
                        allLabel='All categories'
                        value={category}
                        options={categoryOptions}
                        onChange={(value) => updateParams({ category: value })}
                    />
                    <FilterSelect
                        label='Job type'
                        allLabel='All job types'
                        value={jobType}
                        options={JobTypeEnumValues}
                        onChange={(value) => updateParams({ type: value })}
                    />
                    {hasFilters && (
                        <Button variant='ghost' onClick={clearFilters}>
                            <FaXmark />
                            Clear filters
                        </Button>
                    )}
                </div>
            </div>

            {!jobs ? (
                <Spinner size='xl' className='self-center' />
            ) : jobs.length === 0 ? (
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <FaBriefcase />
                        </EmptyState.Indicator>
                        <EmptyState.Title>
                            {hasFilters ? 'No jobs match your filters' : 'No jobs found'}
                        </EmptyState.Title>
                        <EmptyState.Description>
                            {hasFilters
                                ? 'Try a different keyword, location, category or job type.'
                                : 'There are no open positions at the moment.'}
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} query={searchParams.toString()} />
                    ))}
                </div>
            )}
        </>
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
    options: string[];
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
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
        </NativeSelect.Root>
    );
}

function JobCard({ job, query }: { job: JobCardType; query: string }) {
    return (
        <Card.Root size='sm'>
            <Card.Header>
                <HStack justify='space-between' align='start'>
                    <Card.Title lineClamp={1}>{job.title}</Card.Title>
                    <Badge colorPalette={jobTypeColorPalette[job.job_type] ?? 'gray'}>
                        {job.job_type}
                    </Badge>
                </HStack>
                <Text textStyle='xs' color='fg.muted'>
                    {job.company} · Posted {new Date(job.created_at).toLocaleDateString()}
                </Text>
            </Card.Header>
            <Card.Body gap={3}>
                <Card.Description lineClamp={3}>{job.description}</Card.Description>
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
                </HStack>
            </Card.Body>
            <Card.Footer justifyContent='flex-end'>
                {/* Pass the filters along so the detail page can link back to the same results */}
                <Link href={`/jobs/${job.id}${query ? `?${query}` : ''}`}>
                    <Button variant='outline' size='sm'>
                        View
                        <FaArrowRight />
                    </Button>
                </Link>
            </Card.Footer>
        </Card.Root>
    );
}
