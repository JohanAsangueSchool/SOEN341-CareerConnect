'use client';

import { Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { isJobSaved, saveJob, unsaveJob } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';

/** Saves a job to the Worker's Saved Jobs, or removes it again. */
export function SaveJobButton({ jobId }: { jobId: string }) {
    const [saved, setSaved] = useState<boolean>();
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let ignore = false;

        isJobSaved(createClientSupabase(), jobId).then(({ data, error }) => {
            if (!ignore) setSaved(!error && data);
        });

        return () => {
            ignore = true;
        };
    }, [jobId]);

    async function toggle() {
        setBusy(true);
        const client = createClientSupabase();
        const { error } = saved ? await unsaveJob(client, jobId) : await saveJob(client, jobId);
        setBusy(false);

        // 23505: already saved, e.g. in another tab.
        if (error && !('code' in error && error.code === '23505')) {
            toaster.create({
                title: 'Error',
                description: saved ? 'Could not remove the saved job.' : 'Could not save the job.',
                type: 'error',
                closable: true,
            });
            return;
        }

        setSaved(!saved);
        toaster.create({
            title: saved ? 'Removed from Saved Jobs' : 'Saved',
            description: saved ? undefined : 'You can find it on the Saved Jobs page.',
            type: 'success',
            closable: true,
        });
    }

    return (
        <Button
            variant='outline'
            onClick={toggle}
            loading={busy || saved === undefined}
            aria-pressed={!!saved}
        >
            {saved ? <FaBookmark /> : <FaRegBookmark />}
            {saved ? 'Saved' : 'Save job'}
        </Button>
    );
}
