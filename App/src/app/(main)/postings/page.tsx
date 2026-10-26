'use client';

import { UserProfileType } from '@/contexts/user_profile';
import { Spinner } from '@chakra-ui/react';
import { useState } from 'react';

export default function PostingsPage() {
    const [user, setUser] = useState<UserProfileType | null>(null);

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            {!user ? (
                <Spinner size='xl' className='self-center' />
            ) : user.account_type === 'recruiter' ? (
                <PostingsPageRecruiter user={user} />
            ) : (
                <PostingsPageWorker user={user} />
            )}
        </main>
    );
}

function PostingsPageWorker(props: { user: UserProfileType }) {
    return <></>;
}

function PostingsPageRecruiter(props: { user: UserProfileType }) {
    return <></>;
}
