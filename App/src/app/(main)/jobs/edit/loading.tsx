import { Spinner } from '@chakra-ui/react';

// Gives the page the Suspense boundary that useSearchParams() needs in a
// static route.
export default function Loading() {
    return <Spinner size='xl' className='m-12 self-center' />;
}
