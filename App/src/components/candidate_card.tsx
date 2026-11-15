'use client';

import { Avatar, Badge, Button, Card, HStack, Heading, Link, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { FaEnvelope, FaHeart, FaLocationDot, FaPhone, FaRegHeart } from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { CandidateType, addFavoriteCandidate, removeFavoriteCandidate } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';

/** A Worker shown to a Recruiter, with their contact details and a favorite toggle. */
export function CandidateCard({
    candidate,
    onFavoriteChange,
}: {
    candidate: CandidateType;
    onFavoriteChange?: (candidateId: string, isFavorite: boolean) => void;
}) {
    const [isFavorite, setIsFavorite] = useState(candidate.is_favorite);
    const [busy, setBusy] = useState(false);
    const fullName = `${candidate.first_name} ${candidate.last_name}`;

    async function toggleFavorite() {
        setBusy(true);
        const client = createClientSupabase();
        const { error } = isFavorite
            ? await removeFavoriteCandidate(client, candidate.id)
            : await addFavoriteCandidate(client, candidate.id);
        setBusy(false);

        // 23505: already a favorite, e.g. from another tab.
        if (error && !('code' in error && error.code === '23505')) {
            toaster.create({
                title: 'Error',
                description: 'Could not update your favorites.',
                type: 'error',
                closable: true,
            });
            return;
        }

        setIsFavorite(!isFavorite);
        onFavoriteChange?.(candidate.id, !isFavorite);
    }

    return (
        <Card.Root size='sm'>
            <Card.Header>
                <HStack justify='space-between' align='start' gap={4}>
                    <HStack gap={3} minW={0}>
                        <Avatar.Root size='md'>
                            <Avatar.Fallback name={fullName} />
                            {candidate.avatar_url && <Avatar.Image src={candidate.avatar_url} />}
                        </Avatar.Root>
                        <Heading as='h2' textStyle='lg' truncate>
                            {fullName}
                        </Heading>
                    </HStack>
                    <Button
                        size='sm'
                        variant={isFavorite ? 'subtle' : 'outline'}
                        colorPalette='pink'
                        loading={busy}
                        aria-pressed={isFavorite}
                        onClick={toggleFavorite}
                        flexShrink={0}
                    >
                        {isFavorite ? <FaHeart /> : <FaRegHeart />}
                        {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    </Button>
                </HStack>
            </Card.Header>
            <Card.Body gap={3}>
                <HStack gap={4} color='fg.muted' textStyle='sm' wrap='wrap'>
                    <HStack gap={1}>
                        <FaEnvelope />
                        <Link href={`mailto:${candidate.email}`} colorPalette='blue'>
                            {candidate.email}
                        </Link>
                    </HStack>
                    <HStack gap={1}>
                        <FaPhone />
                        {candidate.phone}
                    </HStack>
                    <HStack gap={1}>
                        <FaLocationDot />
                        {candidate.postal_code}
                    </HStack>
                </HStack>
                {candidate.skills.length > 0 ? (
                    <HStack gap={2} wrap='wrap' aria-label='Skills' role='list'>
                        {candidate.skills.map((skill) => (
                            <Badge key={skill} role='listitem' variant='subtle'>
                                {skill}
                            </Badge>
                        ))}
                    </HStack>
                ) : (
                    <Text textStyle='sm' color='fg.muted'>
                        No skills listed yet.
                    </Text>
                )}
            </Card.Body>
        </Card.Root>
    );
}
