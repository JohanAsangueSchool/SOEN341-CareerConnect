'use client';

import {
    Alert,
    Badge,
    Button,
    Card,
    HStack,
    Heading,
    Spinner,
    Stack,
    Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    FaArrowRight,
    FaCalendarXmark,
    FaFile,
    FaLocationDot,
    FaRotateRight,
    FaWandMagicSparkles,
} from 'react-icons/fa6';

import { type JobRecommendationsResult, getJobRecommendations } from '@/app/(main)/jobs/actions';
import { useUserProfile } from '@/contexts/user_profile';
import { formatDeadline, jobTypeColorPalette } from '@/utils/jobs';

/** Results are kept for the browser session, so revisiting the page does not ask Gemini again. */
const CACHE_MS = 30 * 60_000;

type Cached = { at: number; result: JobRecommendationsResult };

function readCache(key: string): JobRecommendationsResult | null {
    try {
        const cached = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Cached | null;
        if (cached && Date.now() - cached.at < CACHE_MS) return cached.result;
    } catch {}
    return null;
}

function writeCache(key: string, result: JobRecommendationsResult) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), result } satisfies Cached));
    } catch {}
}

/** US-26: postings Google Gemini recommends to the Worker from their resumes. */
export function JobRecommendations() {
    const email = useUserProfile()?.email ?? '';
    const cacheKey = `job-recommendations:${email}`;
    const [result, setResult] = useState<JobRecommendationsResult>();
    const [loading, setLoading] = useState(true);

    async function refresh() {
        setLoading(true);
        const fresh = await getJobRecommendations();
        // Errors are not cached, so the next visit tries again.
        if (!('error' in fresh)) writeCache(cacheKey, fresh);
        setResult(fresh);
        setLoading(false);
    }

    useEffect(() => {
        let ignore = false;

        async function load() {
            const fresh = readCache(cacheKey) ?? (await getJobRecommendations());
            if (ignore) return;
            if (!('error' in fresh)) writeCache(cacheKey, fresh);
            setResult(fresh);
            setLoading(false);
        }

        load();
        return () => {
            ignore = true;
        };
    }, [cacheKey]);

    return (
        <Card.Root size='sm' variant='subtle' as='section' aria-labelledby='recommended-heading'>
            <Card.Header>
                <HStack justify='space-between'>
                    <HStack gap={2}>
                        <FaWandMagicSparkles />
                        <Heading id='recommended-heading' as='h2' textStyle='lg'>
                            Recommended for you
                        </Heading>
                    </HStack>
                    <Button
                        size='xs'
                        variant='ghost'
                        onClick={refresh}
                        loading={loading}
                        disabled={!result}
                        aria-label='Refresh recommendations'
                    >
                        <FaRotateRight />
                    </Button>
                </HStack>
            </Card.Header>

            <Card.Body gap={3}>
                {loading ? (
                    <HStack gap={3} color='fg.muted'>
                        <Spinner size='sm' />
                        <Text>Finding postings that match your resume…</Text>
                    </HStack>
                ) : !result ? null : 'error' in result ? (
                    <Alert.Root status='warning'>
                        <Alert.Indicator />
                        <Alert.Title>{result.error}</Alert.Title>
                    </Alert.Root>
                ) : 'needsResume' in result ? (
                    <HStack justify='space-between' wrap='wrap' gap={2}>
                        <Text color='fg.muted'>
                            Add a resume to get job recommendations that match your skills.
                        </Text>
                        <Link href='/resumes/edit'>
                            <Button size='sm' variant='outline'>
                                <FaFile />
                                Create a resume
                            </Button>
                        </Link>
                    </HStack>
                ) : result.recommendations.length === 0 ? (
                    <Text color='fg.muted'>
                        No open postings match your resume right now. Adding skills and experience
                        to your resume helps find matches.
                    </Text>
                ) : (
                    <Stack gap={3} as='ul' aria-label='Recommended jobs'>
                        {result.recommendations.map((job) => (
                            <Card.Root key={job.id} size='sm' as='li'>
                                <Card.Body gap={2}>
                                    <HStack justify='space-between' align='start' gap={2}>
                                        <Stack gap={0}>
                                            {/* Not a heading: the listing below finds
                                                postings by their title headings. */}
                                            <Text fontWeight='semibold'>{job.title}</Text>
                                            <Text textStyle='xs' color='fg.muted'>
                                                {job.company}
                                            </Text>
                                        </Stack>
                                        <HStack gap={1} flexShrink={0}>
                                            <Badge
                                                colorPalette={
                                                    job.match === 'Strong' ? 'green' : 'blue'
                                                }
                                            >
                                                {job.match} match
                                            </Badge>
                                            <Badge
                                                colorPalette={
                                                    jobTypeColorPalette[job.job_type] ?? 'gray'
                                                }
                                            >
                                                {job.job_type}
                                            </Badge>
                                        </HStack>
                                    </HStack>
                                    <Text textStyle='sm'>
                                        <Text as='span' fontWeight='medium'>
                                            Why it matches your profile:{' '}
                                        </Text>
                                        {job.reason}
                                    </Text>
                                    <HStack justify='space-between' wrap='wrap' gap={2}>
                                        <HStack gap={4} color='fg.muted' textStyle='sm'>
                                            <HStack gap={1}>
                                                <FaLocationDot />
                                                {job.location}
                                            </HStack>
                                            {job.deadline && (
                                                <HStack gap={1}>
                                                    <FaCalendarXmark />
                                                    Apply by {formatDeadline(job.deadline)}
                                                </HStack>
                                            )}
                                        </HStack>
                                        <Link href={`/jobs/${job.id}`}>
                                            <Button variant='outline' size='xs'>
                                                See posting
                                                <FaArrowRight />
                                            </Button>
                                        </Link>
                                    </HStack>
                                </Card.Body>
                            </Card.Root>
                        ))}
                    </Stack>
                )}
                {result && 'recommendations' in result && result.recommendations.length > 0 && (
                    <Text textStyle='xs' color='fg.muted'>
                        Suggested by Google Gemini from your resumes. Use your own judgement.
                    </Text>
                )}
            </Card.Body>
        </Card.Root>
    );
}
