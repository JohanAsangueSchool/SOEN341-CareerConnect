'use client';

import {
    Button,
    Card,
    Field,
    Fieldset,
    HStack,
    IconButton,
    Input,
    NativeSelect,
    Spinner,
    Text,
    Textarea,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { unstable_rethrow, useRouter } from 'next/navigation';
import { use } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { FaChevronLeft, FaPlus, FaTrash } from 'react-icons/fa6';

import { toaster } from '@/components/ui/toaster';
import { getUserResume } from '@/lib/supabase/apis';
import { createClientSupabase } from '@/lib/supabase/client';
import { ResumeStatusEnumValues } from '@/utils/enums';
import {
    resumeEducationSchemaType,
    resumeExperienceSchemaType,
    resumeProjectSchemaType,
    resumeSchema,
    resumeSchemaInputType,
    resumeSchemaType,
    resumeSkillSchemaType,
} from '@/utils/forms/resumes';
import { validRequestStatus } from '@/utils/function';

import { createResume, updateResume } from './actions';

const emptyResume: resumeSchemaInputType = {
    title: '',
    summary: '',
    status: 'Draft',
    education: [],
    experience: [],
    skills: [],
    projects: [],
};

const monthToDate = (value: string) => (value ? new Date(value) : undefined);

const dateToMonth = (value?: string | Date) =>
    value ? new Date(value).toISOString().slice(0, 7) : undefined;

const withMonthInputs = <T extends { startMonth?: string | Date; endMonth?: string | Date }>(
    item: T,
) => ({ ...item, startMonth: dateToMonth(item.startMonth), endMonth: dateToMonth(item.endMonth) });

export default function ResumesEditPage({ searchParams }: PageProps<'/resumes/edit'>) {
    const router = useRouter();
    const { id } = use(searchParams);
    const isEditing = typeof id === 'string';

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isLoading },
    } = useForm<resumeSchemaInputType, unknown, resumeSchemaType>({
        resolver: zodResolver(resumeSchema),
        defaultValues: async () => {
            if (!isEditing) return emptyResume;

            try {
                const { data, error, status } = await getUserResume(createClientSupabase(), id);
                if (!validRequestStatus(status) || error || !data) throw new Error();

                return {
                    title: data.title,
                    summary: data.summary ?? '',
                    status: data.status,
                    education: (data.education ?? []).map(withMonthInputs),
                    experience: (data.experience ?? []).map(withMonthInputs),
                    skills: data.skills ?? [],
                    projects: data.projects ?? [],
                };
            } catch {
                toaster.create({
                    title: 'Error',
                    description: 'Failed to load resume.',
                    type: 'error',
                    closable: true,
                });
                router.push('/resumes');
                return emptyResume;
            }
        },
    });

    const education = useFieldArray({ control, name: 'education' });
    const experience = useFieldArray({ control, name: 'experience' });
    const skills = useFieldArray({ control, name: 'skills' });
    const projects = useFieldArray({ control, name: 'projects' });

    const onSubmit = handleSubmit(async (data) => {
        try {
            if (isEditing) await updateResume(id, data);
            else await createResume(data);
        } catch (error) {
            unstable_rethrow(error);

            toaster.create({
                title: 'Error',
                description: isEditing ? 'Failed to save resume.' : 'Failed to create resume.',
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
                            {isEditing ? 'Edit Resume' : 'New Resume'}
                        </Fieldset.Legend>
                        <Fieldset.Content>
                            <Field.Root invalid={!!errors.title}>
                                <Field.Label>Title</Field.Label>
                                <Input type='text' {...register('title')} />
                                <Field.ErrorText>{errors.title?.message}</Field.ErrorText>
                            </Field.Root>

                            <Field.Root invalid={!!errors.status}>
                                <Field.Label>Status</Field.Label>
                                <NativeSelect.Root>
                                    <NativeSelect.Field {...register('status')}>
                                        {ResumeStatusEnumValues.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                                <Field.ErrorText>{errors.status?.message}</Field.ErrorText>
                            </Field.Root>

                            <Field.Root invalid={!!errors.summary}>
                                <Field.Label>Summary</Field.Label>
                                <Textarea autoresize {...register('summary')} />
                                <Field.ErrorText>{errors.summary?.message}</Field.ErrorText>
                            </Field.Root>
                        </Fieldset.Content>
                    </Fieldset.Root>

                    <Fieldset.Root size='lg'>
                        <SectionLegend
                            title='Education'
                            onAdd={() =>
                                education.append({
                                    establishment: '',
                                    program: '',
                                    description: '',
                                } as resumeEducationSchemaType)
                            }
                        />
                        <Fieldset.Content>
                            {education.fields.length === 0 && <EmptySection />}
                            {education.fields.map((field, index) => {
                                const fieldErrors = errors.education?.[index];

                                return (
                                    <SectionCard
                                        key={field.id}
                                        onRemove={() => education.remove(index)}
                                    >
                                        <Field.Root invalid={!!fieldErrors?.establishment}>
                                            <Field.Label>Establishment</Field.Label>
                                            <Input
                                                type='text'
                                                {...register(`education.${index}.establishment`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.establishment?.message}
                                            </Field.ErrorText>
                                        </Field.Root>

                                        <Field.Root invalid={!!fieldErrors?.program}>
                                            <Field.Label>Program</Field.Label>
                                            <Input
                                                type='text'
                                                {...register(`education.${index}.program`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.program?.message}
                                            </Field.ErrorText>
                                        </Field.Root>

                                        <HStack align='start'>
                                            <Field.Root invalid={!!fieldErrors?.startMonth}>
                                                <Field.Label>Start Month</Field.Label>
                                                <Input
                                                    type='month'
                                                    {...register(`education.${index}.startMonth`, {
                                                        setValueAs: monthToDate,
                                                    })}
                                                />
                                                <Field.ErrorText>
                                                    {fieldErrors?.startMonth?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root invalid={!!fieldErrors?.endMonth}>
                                                <Field.Label>End Month</Field.Label>
                                                <Input
                                                    type='month'
                                                    {...register(`education.${index}.endMonth`, {
                                                        setValueAs: monthToDate,
                                                    })}
                                                />
                                                <Field.HelperText>
                                                    Leave empty if ongoing
                                                </Field.HelperText>
                                                <Field.ErrorText>
                                                    {fieldErrors?.endMonth?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                        </HStack>

                                        <Field.Root invalid={!!fieldErrors?.description}>
                                            <Field.Label>Description</Field.Label>
                                            <Textarea
                                                autoresize
                                                {...register(`education.${index}.description`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.description?.message}
                                            </Field.ErrorText>
                                        </Field.Root>
                                    </SectionCard>
                                );
                            })}
                        </Fieldset.Content>
                    </Fieldset.Root>

                    <Fieldset.Root size='lg'>
                        <SectionLegend
                            title='Experience'
                            onAdd={() =>
                                experience.append({
                                    establishment: '',
                                    position: '',
                                    description: '',
                                } as resumeExperienceSchemaType)
                            }
                        />
                        <Fieldset.Content>
                            {experience.fields.length === 0 && <EmptySection />}
                            {experience.fields.map((field, index) => {
                                const fieldErrors = errors.experience?.[index];

                                return (
                                    <SectionCard
                                        key={field.id}
                                        onRemove={() => experience.remove(index)}
                                    >
                                        <Field.Root invalid={!!fieldErrors?.establishment}>
                                            <Field.Label>Establishment</Field.Label>
                                            <Input
                                                type='text'
                                                {...register(`experience.${index}.establishment`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.establishment?.message}
                                            </Field.ErrorText>
                                        </Field.Root>

                                        <Field.Root invalid={!!fieldErrors?.position}>
                                            <Field.Label>Position</Field.Label>
                                            <Input
                                                type='text'
                                                {...register(`experience.${index}.position`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.position?.message}
                                            </Field.ErrorText>
                                        </Field.Root>

                                        <HStack align='start'>
                                            <Field.Root invalid={!!fieldErrors?.startMonth}>
                                                <Field.Label>Start Month</Field.Label>
                                                <Input
                                                    type='month'
                                                    {...register(`experience.${index}.startMonth`, {
                                                        setValueAs: monthToDate,
                                                    })}
                                                />
                                                <Field.ErrorText>
                                                    {fieldErrors?.startMonth?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root invalid={!!fieldErrors?.endMonth}>
                                                <Field.Label>End Month</Field.Label>
                                                <Input
                                                    type='month'
                                                    {...register(`experience.${index}.endMonth`, {
                                                        setValueAs: monthToDate,
                                                    })}
                                                />
                                                <Field.HelperText>
                                                    Leave empty if ongoing
                                                </Field.HelperText>
                                                <Field.ErrorText>
                                                    {fieldErrors?.endMonth?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                        </HStack>

                                        <Field.Root invalid={!!fieldErrors?.description}>
                                            <Field.Label>Description</Field.Label>
                                            <Textarea
                                                autoresize
                                                {...register(`experience.${index}.description`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.description?.message}
                                            </Field.ErrorText>
                                        </Field.Root>
                                    </SectionCard>
                                );
                            })}
                        </Fieldset.Content>
                    </Fieldset.Root>

                    <Fieldset.Root size='lg'>
                        <SectionLegend
                            title='Skills'
                            onAdd={() =>
                                skills.append({
                                    name: '',
                                    description: '',
                                } as resumeSkillSchemaType)
                            }
                        />
                        <Fieldset.Content>
                            {skills.fields.length === 0 && <EmptySection />}
                            {skills.fields.map((field, index) => {
                                const fieldErrors = errors.skills?.[index];

                                return (
                                    <SectionCard
                                        key={field.id}
                                        onRemove={() => skills.remove(index)}
                                    >
                                        <Field.Root invalid={!!fieldErrors?.name}>
                                            <Field.Label>Name</Field.Label>
                                            <Input
                                                type='text'
                                                {...register(`skills.${index}.name`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.name?.message}
                                            </Field.ErrorText>
                                        </Field.Root>

                                        <Field.Root invalid={!!fieldErrors?.description}>
                                            <Field.Label>Description</Field.Label>
                                            <Textarea
                                                autoresize
                                                {...register(`skills.${index}.description`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.description?.message}
                                            </Field.ErrorText>
                                        </Field.Root>
                                    </SectionCard>
                                );
                            })}
                        </Fieldset.Content>
                    </Fieldset.Root>

                    <Fieldset.Root size='lg'>
                        <SectionLegend
                            title='Projects'
                            onAdd={() =>
                                projects.append({
                                    title: '',
                                    link: '',
                                    description: '',
                                } as resumeProjectSchemaType)
                            }
                        />
                        <Fieldset.Content>
                            {projects.fields.length === 0 && <EmptySection />}
                            {projects.fields.map((field, index) => {
                                const fieldErrors = errors.projects?.[index];

                                return (
                                    <SectionCard
                                        key={field.id}
                                        onRemove={() => projects.remove(index)}
                                    >
                                        <Field.Root invalid={!!fieldErrors?.title}>
                                            <Field.Label>Title</Field.Label>
                                            <Input
                                                type='text'
                                                {...register(`projects.${index}.title`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.title?.message}
                                            </Field.ErrorText>
                                        </Field.Root>

                                        <Field.Root invalid={!!fieldErrors?.link}>
                                            <Field.Label>Link</Field.Label>
                                            <Input
                                                type='url'
                                                {...register(`projects.${index}.link`)}
                                            />
                                            <Field.HelperText>https://...</Field.HelperText>
                                            <Field.ErrorText>
                                                {fieldErrors?.link?.message}
                                            </Field.ErrorText>
                                        </Field.Root>

                                        <Field.Root invalid={!!fieldErrors?.description}>
                                            <Field.Label>Description</Field.Label>
                                            <Textarea
                                                autoresize
                                                {...register(`projects.${index}.description`)}
                                            />
                                            <Field.ErrorText>
                                                {fieldErrors?.description?.message}
                                            </Field.ErrorText>
                                        </Field.Root>
                                    </SectionCard>
                                );
                            })}
                        </Fieldset.Content>
                    </Fieldset.Root>

                    <Button type='submit' width='full' loading={isSubmitting}>
                        {isEditing ? 'Save Changes' : 'Create Resume'}
                    </Button>
                </form>
            )}
        </main>
    );
}

function SectionLegend({ title, onAdd }: { title: string; onAdd: () => void }) {
    return (
        <HStack justify='space-between'>
            <Fieldset.Legend textStyle='xl'>{title}</Fieldset.Legend>
            <Button size='sm' variant='outline' onClick={onAdd}>
                <FaPlus />
                Add
            </Button>
        </HStack>
    );
}

function SectionCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
    return (
        <Card.Root size='sm'>
            <Card.Body gap={4}>
                <IconButton
                    aria-label='Remove'
                    size='xs'
                    variant='ghost'
                    colorPalette='red'
                    alignSelf='end'
                    onClick={onRemove}
                >
                    <FaTrash />
                </IconButton>
                {children}
            </Card.Body>
        </Card.Root>
    );
}

function EmptySection() {
    return (
        <Text color='fg.muted' textStyle='sm'>
            Nothing added yet.
        </Text>
    );
}
