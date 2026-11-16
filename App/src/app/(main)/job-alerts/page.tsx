
'use client';

import { useEffect, useState } from 'react';
import { Heading, Spinner, Text, VStack } from '@chakra-ui/react';

import { useUserProfile } from '@/contexts/user_profile';
import { createClientSupabase } from '@/lib/supabase/client';
import { toaster } from '@/components/ui/toaster';

export default function JobAlertsPage() {
    const userProfile = useUserProfile();

    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function loadPreferences() {
            const supabase = createClientSupabase();

            try {
                const { data: claimsData, error: claimsError } =
                    await supabase.auth.getClaims();

                if (claimsError || !claimsData || !claimsData.claims.sub) {
                    throw new Error('Could not identify your account.');
                }

                const id = claimsData.claims.sub;
                setUserId(id);

                const [jobsResult, preferencesResult] = await Promise.all([
                    supabase
                        .from('jobs')
                        .select('category')
                        .eq('status', 'Open')
                        .not('category', 'is', null),

                    supabase
                        .from('job_alert_preferences')
                        .select('category'),
                ]);

                if (jobsResult.error) throw jobsResult.error;
                if (preferencesResult.error) throw preferencesResult.error;

                const availableCategories = [
                    ...new Set(
                        (jobsResult.data ?? [])
                            .map((job) => job.category)
                            .filter((category): category is string => !!category),
                    ),
                ].sort();

                setCategories(availableCategories);
                setSelectedCategories(
                    (preferencesResult.data ?? []).map((item) => item.category),
                );
            } catch (error) {
                console.error('Failed to load job alert preferences:', error);

                toaster.create({
                    title: 'Error',
                    description: 'Could not load job alert preferences.',
                    type: 'error',
                    closable: true,
                });
            } finally {
                setLoading(false);
            }
        }

        if (userProfile?.account_type === 'Worker') {
            loadPreferences();
        } else {
            setLoading(false);
        }
    }, [userProfile]);

    async function toggleCategory(category: string) {
        if (!userId || saving) return;

        const supabase = createClientSupabase();
        const isSelected = selectedCategories.includes(category);

        setSaving(true);

        try {
            if (isSelected) {
                const { error } = await supabase
                    .from('job_alert_preferences')
                    .delete()
                    .eq('user_id', userId)
                    .eq('category', category);

                if (error) throw error;

                setSelectedCategories((current) =>
                    current.filter((item) => item !== category),
                );
            } else {
                const { error } = await supabase
                    .from('job_alert_preferences')
                    .insert({ user_id: userId, category });

                if (error) throw error;

                setSelectedCategories((current) => [...current, category]);
            }
        } catch (error) {
            console.error('Failed to update job alert preference:', error);

            toaster.create({
                title: 'Error',
                description: 'Could not update your preferences.',
                type: 'error',
                closable: true,
            });
        } finally {
            setSaving(false);
        }
    }

    if (userProfile?.account_type !== 'Worker') {
        return (
            <main className='m-8'>
                <Text>Job alerts are only available to workers.</Text>
            </main>
        );
    }

    return (
        <main className='m-8 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <VStack align='start' gap={1}>
                <Heading textStyle='3xl'>Job Alert Preferences</Heading>
                <Text color='fg.muted'>
                    Choose the job categories you're interested in.
                    We'll notify you when a new job is posted in those categories.
                </Text>
            </VStack>

            {loading ? (
                <Spinner size='xl' />
            ) : categories.length === 0 ? (
                <Text color='fg.muted'>
                    No job categories are currently available.
                </Text>
            ) : (
                <VStack align='stretch' gap={3}>
                    {categories.map((category) => (
                        <label
                            key={category}
                            className='flex cursor-pointer items-center gap-3 rounded-lg border p-4'
                        >
                            <input
                                type='checkbox'
                                checked={selectedCategories.includes(category)}
                                onChange={() => toggleCategory(category)}
                                disabled={saving}
                                className='h-4 w-4'
                            />
                            <Text>{category}</Text>
                        </label>
                    ))}
                </VStack>
            )}

            {saving && (
                <Text color='fg.muted' textStyle='sm'>
                    Saving preferences...
                </Text>
            )}
        </main>
    );
}
