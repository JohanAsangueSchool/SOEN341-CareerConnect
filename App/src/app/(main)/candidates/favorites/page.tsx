'use client';

import { Button, EmptyState, HStack, Heading, Spinner } from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaChevronLeft, FaHeart } from 'react-icons/fa6';

import { CandidateCard } from '@/components/candidate_card';
import { toaster } from '@/components/ui/toaster';
import { CandidateType, searchCandidates } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';

export default function FavoriteCandidatesPage() {
    const [favorites, setFavorites] = useState<CandidateType[]>();

    useEffect(() => {
        let ignore = false;

        searchCandidates(createClientSupabase(), '', true).then(({ data, error }) => {
            if (ignore) return;

            if (error || !data) {
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load your favorite candidates.',
                    type: 'error',
                    closable: true,
                });
            }
            setFavorites(data ?? []);
        });

        return () => {
            ignore = true;
        };
    }, []);

    // Removing a favorite here takes the candidate off the list.
    function onFavoriteChange(candidateId: string, isFavorite: boolean) {
        if (!isFavorite) {
            setFavorites((current) => current?.filter((candidate) => candidate.id !== candidateId));
        }
    }

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <HStack justify='space-between' wrap='wrap' gap={4}>
                <Heading as='h1' textStyle='3xl'>
                    Favorite candidates
                </Heading>
                <Link href='/candidates'>
                    <Button variant='outline'>
                        <FaChevronLeft />
                        Search candidates
                    </Button>
                </Link>
            </HStack>

            {!favorites ? (
                <Spinner size='xl' className='self-center' />
            ) : favorites.length === 0 ? (
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <FaHeart />
                        </EmptyState.Indicator>
                        <EmptyState.Title>No favorite candidates yet</EmptyState.Title>
                        <EmptyState.Description>
                            Use “Add to favorites” on the candidate search page to keep people you
                            want to contact later.
                        </EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            ) : (
                <div className='flex flex-col gap-4'>
                    {favorites.map((candidate) => (
                        <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            onFavoriteChange={onFavoriteChange}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
