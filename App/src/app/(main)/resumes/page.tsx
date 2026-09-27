'use client';

import { Button } from '@chakra-ui/react';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa6';

export default function ResumesPage() {
    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <Link className='self-end' href='/resumes/new'>
                <Button>
                    <FaPlus />
                    New Resume
                </Button>
            </Link>
        </main>
    );
}
