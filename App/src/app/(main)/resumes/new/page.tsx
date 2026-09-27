'use client';

import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FaChevronLeft } from 'react-icons/fa6';

export default function ResumesNewPage() {
    const router = useRouter();

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <Button variant='outline' onClick={() => router.back()} className='self-start'>
                <FaChevronLeft />
                Back
            </Button>
        </main>
    );
}
