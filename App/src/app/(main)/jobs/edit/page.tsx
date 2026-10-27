'use client';

import {
    Button,
    Field,
    Fieldset,
    HStack,
    Input,
    NativeSelect,
    Spinner,
    Textarea,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { unstable_rethrow, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FaChevronLeft } from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getRecruiterJob } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { JobStatusEnumValues, JobTypeEnumValues } from '@/utils/enums';
import { jobSchema, jobSchemaInputType, jobSchemaType } from '@/utils/forms/jobs';
import { validRequestStatus } from '@/utils/function';

import { createJob, updateJob } from './actions';

const emptyJob: jobSchemaInputType = {
    title: '',
    company: '',
    location: '',
    category: '',
    job_type: 'Full-time',
    status: 'Draft',
    salary_min: null,
    salary_max: null,
    description: '',
};

const inputToSalary = (value: string) => (value === '' ? null : Number(value));

export default function JobsEditPage() {
    const router = useRouter();
    // Read from the URL on the client: this page is prerendered as static, so
    // the searchParams prop would hold the empty build-time value.
    const id = useSearchParams().get('id') ?? undefined;
    const isEditing = typeof id === 'string';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isLoading },
    } = useForm<jobSchemaInputType, unknown, jobSchemaType>({
        resolver: zodResolver(jobSchema),
        defaultValues: async () => {
            if (!isEditing) return emptyJob;

            try {
                const { data, error, status } = await getRecruiterJob(createClientSupabase(), id);
                if (!validRequestStatus(status) || error || !data) throw new Error();

                return {
                    title: data.title,
                    company: data.company,
                    location: data.location,
                    category: data.category,
                    job_type: data.job_type,
                    status: data.status,
                    salary_min: data.salary_min,
                    salary_max: data.salary_max,
                    description: data.description ?? '',
                };
            } catch {
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load job posting.',
                    type: 'error',
                    closable: true,
                });
                router.push('/jobs');
                return emptyJob;
            }
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            if (isEditing) await updateJob(id, data);
            else await createJob(data);
        } catch (error) {
            unstable_rethrow(error);

            toaster.create({
                title: 'Error',
                description: isEditing
                    ? 'Failed to save job posting.'
                    : 'Failed to create job posting.',
                type: 'error',
                closable: true,
            });
        }
    });

    return (
        <main className='m-12 flex w-full max-w-3xl flex-col gap-6 self-center'>
            <Button variant='outline' onClick={() => router.back()} className='self-start'>
                <FaChevronLeft />
                Back
            </Button>

            {isLoading ? (
                <Spinner size='xl' className='self-center' />
            ) : (
                <form onSubmit={onSubmit} className='flex flex-col gap-8'>
                    <Fieldset.Root size='lg'>
                        <Fieldset.Legend textStyle='3xl'>
                            {isEditing ? 'Edit Job Posting' : 'New Job Posting'}
                        </Fieldset.Legend>
                        <Fieldset.Content>
                            <Field.Root invalid={!!errors.title}>
                                <Field.Label>Title</Field.Label>
                                <Input type='text' {...register('title')} />
                                <Field.ErrorText>{errors.title?.message}</Field.ErrorText>
                            </Field.Root>

                            <Field.Root invalid={!!errors.company}>
                                <Field.Label>Company</Field.Label>
                                <Input type='text' {...register('company')} />
                                <Field.ErrorText>{errors.company?.message}</Field.ErrorText>
                            </Field.Root>

                            <HStack align='start'>
                                <Field.Root invalid={!!errors.status}>
                                    <Field.Label>Status</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field {...register('status')}>
                                            {JobStatusEnumValues.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                    <Field.HelperText>
                                        Only Open postings are visible to job seekers
                                    </Field.HelperText>
                                    <Field.ErrorText>{errors.status?.message}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.job_type}>
                                    <Field.Label>Job Type</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field {...register('job_type')}>
                                            {JobTypeEnumValues.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                    <Field.ErrorText>{errors.job_type?.message}</Field.ErrorText>
                                </Field.Root>
                            </HStack>

                            <HStack align='start'>
                                <Field.Root invalid={!!errors.location}>
                                    <Field.Label>Location</Field.Label>
                                    <Input type='text' {...register('location')} />
                                    <Field.ErrorText>{errors.location?.message}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.category}>
                                    <Field.Label>Category</Field.Label>
                                    <Input type='text' {...register('category')} />
                                    <Field.ErrorText>{errors.category?.message}</Field.ErrorText>
                                </Field.Root>
                            </HStack>

                            <HStack align='start'>
                                <Field.Root invalid={!!errors.salary_min}>
                                    <Field.Label>Minimum Salary</Field.Label>
                                    <Input
                                        type='number'
                                        min={0}
                                        {...register('salary_min', { setValueAs: inputToSalary })}
                                    />
                                    <Field.HelperText>
                                        Leave empty if not specified
                                    </Field.HelperText>
                                    <Field.ErrorText>{errors.salary_min?.message}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.salary_max}>
                                    <Field.Label>Maximum Salary</Field.Label>
                                    <Input
                                        type='number'
                                        min={0}
                                        {...register('salary_max', { setValueAs: inputToSalary })}
                                    />
                                    <Field.HelperText>
                                        Under 1000 is shown per hour, otherwise per year
                                    </Field.HelperText>
                                    <Field.ErrorText>{errors.salary_max?.message}</Field.ErrorText>
                                </Field.Root>
                            </HStack>

                            <Field.Root invalid={!!errors.description}>
                                <Field.Label>Description</Field.Label>
                                <Textarea autoresize minHeight='40' {...register('description')} />
                                <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
                            </Field.Root>
                        </Fieldset.Content>
                    </Fieldset.Root>

                    <Button type='submit' width='full' loading={isSubmitting}>
                        {isEditing ? 'Save Changes' : 'Create Job Posting'}
                    </Button>
                </form>
            )}
        </main>
    );
}
