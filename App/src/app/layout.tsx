import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Provider } from '@/components/ui/provider';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

const interFont = Inter({
    subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
    title: 'CarreerConnect',
    description: 'Manage your career on one platform',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html
            suppressHydrationWarning
            lang='en'
            style={interFont.style}
            className='h-screen antialiased'
        >
            <body className='flex h-full flex-col'>
                <Provider>
                    {children}
                    <Toaster />
                </Provider>
            </body>
        </html>
    );
}
