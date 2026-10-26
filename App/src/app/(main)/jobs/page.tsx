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
import { useEffect, useState } from 'react';
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
    const [jobs, setJobs] = useState<JobCardType[]>();
    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('');
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

    const hasFilters = keyword !== '' || location !== '' || category !== '';

    // Wait until the user stops typing before querying
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedKeyword(keyword), 300);
        return () => clearTimeout(timeout);
    }, [keyword]);

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
                    keyword: debouncedKeyword,
                    location,
                    category,
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
    }, [debouncedKeyword, location, category]);

    function clearFilters() {
        setKeyword('');
        setDebouncedKeyword('');
        setLocation('');
        setCategory('');
    }

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <div className='flex flex-wrap items-center gap-3'>
                <InputGroup flex='1' minWidth='3xs' startElement={<FaMagnifyingGlass />}>
                    <Input
                        type='search'
                        placeholder='Search by title, company or keyword'
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </InputGroup>
                <NativeSelect.Root width='3xs'>
                    <NativeSelect.Field
                        aria-label='Location'
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    >
                        <option value=''>All locations</option>
                        {locationOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                <NativeSelect.Root width='3xs'>
                    <NativeSelect.Field
                        aria-label='Category'
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value=''>All categories</option>
                        {categoryOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
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
                                ? 'Try a different keyword, location or category.'
                                : 'There are no open positions at the moment.'}
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            )}
        </main>
    );
}

function JobCard({ job }: { job: JobCardType }) {
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
                <Link href={`/jobs/${job.id}`}>
                    <Button variant='outline' size='sm'>
                        View
                        <FaArrowRight />
                    </Button>
                </Link>
            </Card.Footer>
        </Card.Root>
    );
}
