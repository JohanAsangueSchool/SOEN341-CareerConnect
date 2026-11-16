'use client';

import {
    Button,
    EmptyState,
    Field,
    HStack,
    Heading,
    Input,
    InputGroup,
    Spinner,
    Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaHeart, FaMagnifyingGlass, FaUsers } from 'react-icons/fa6';

import { CandidateCard } from '@/components/candidate_card';
import { toaster } from '@/components/ui/toaster';
import { CandidateType, searchCandidates } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';

/** How long typing has to pause before the search runs. */
const SEARCH_DELAY_MS = 300;

export default function CandidatesPage() {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<{ search: string; candidates: CandidateType[] }>();

    useEffect(() => {
        let ignore = false;

        const timer = setTimeout(async () => {
            const { data, error } = await searchCandidates(createClientSupabase(), search);
            if (ignore) return;

            if (error || !data) {
                toaster.create({
                    title: 'Error',
                    description: 'Failed to search candidates.',
                    type: 'error',
                    closable: true,
                });
                setResults({ search, candidates: [] });
                return;
            }

            setResults({ search, candidates: data });
        }, SEARCH_DELAY_MS);

        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [search]);

    // Results for an older search stay on screen, faded, until the new ones arrive.
    const stale = results?.search !== search;

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <HStack justify='space-between' wrap='wrap' gap={4}>
                <Heading as='h1' textStyle='3xl'>
                    Candidates
                </Heading>
                <Link href='/candidates/favorites'>
                    <Button variant='outline'>
                        <FaHeart />
                        Favorites
                    </Button>
                </Link>
            </HStack>

            <Field.Root>
                <Field.Label>Search candidates</Field.Label>
                <InputGroup startElement={<FaMagnifyingGlass />}>
                    <Input
                        type='search'
                        placeholder='Name, email or skill'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </InputGroup>
                <Field.HelperText>
                    Matches a Worker’s name, email or the skills on their resumes.
                </Field.HelperText>
            </Field.Root>

            {!results ? (
                <Spinner size='xl' className='self-center' />
            ) : results.candidates.length === 0 ? (
                <EmptyState.Root opacity={stale ? 0.5 : 1}>
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <FaUsers />
                        </EmptyState.Indicator>
                        <EmptyState.Title>No candidates found</EmptyState.Title>
                        <EmptyState.Description>
                            Try a different name or skill.
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <div
                    className='flex flex-col gap-4 transition-opacity'
                    style={{ opacity: stale ? 0.5 : 1 }}
                    aria-busy={stale}
                >
                    <Text textStyle='sm' color='fg.muted'>
                        {results.candidates.length === 50
                            ? 'Showing the first 50 candidates.'
                            : `${results.candidates.length} candidate${results.candidates.length === 1 ? '' : 's'}`}
                    </Text>
                    {results.candidates.map((candidate) => (
                        <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                </div>
            )}
        </main>
    );
}
