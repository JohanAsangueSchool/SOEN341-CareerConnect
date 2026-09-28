'use client';

import { useUserProfile } from '@/contexts/user_profile';
import { Avatar, Card, Text } from '@chakra-ui/react';
import { Concert_One } from 'next/font/google';
import { FaPencil } from 'react-icons/fa6';

const fieldLabels: { [k: string]: string } = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    postal_code: 'Postal Code',
};

const concertOneFont = Concert_One({ subsets: ['latin', 'latin-ext'], weight: ['400'] });

export default function AccountPage() {
    const userProfile = useUserProfile();
    const { avatar_url, account_type, ...otherFields } = userProfile!;

    return (
        <main className='m-12 flex w-full max-w-md flex-col gap-6 self-center'>
            <div className='mb-8 flex items-start justify-between gap-8'>
                <div className='group relative size-40 cursor-pointer'>
                    <Avatar.Root
                        size='full'
                        className='transition-all duration-300 group-hover:brightness-30'
                    >
                        <Avatar.Fallback
                            textStyle='5xl'
                            name={`${otherFields?.first_name} ${otherFields?.last_name}`}
                        />
                        {avatar_url && <Avatar.Image src={avatar_url} />}
                    </Avatar.Root>

                    <FaPencil className='absolute top-1/2 left-1/2 -translate-1/2 text-4xl text-white opacity-0 transition-all duration-300 group-hover:opacity-100' />
                </div>

                <Text textStyle='5xl' marginTop={8} style={concertOneFont.style}>
                    {account_type}
                </Text>
            </div>

            {Object.entries(otherFields).map(([key, value]) => (
                <Card.Root key={key} size='sm'>
                    <Card.Body>
                        <Card.Title>{fieldLabels[key]}</Card.Title>
                        <Card.Description textStyle='md'>{value}</Card.Description>
                    </Card.Body>
                </Card.Root>
            ))}
        </main>
    );
}
