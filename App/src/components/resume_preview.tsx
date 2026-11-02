'use client';

import { Heading, Link, Stack, Text, VStack } from '@chakra-ui/react';

import {
    resumeEducationSchemaType,
    resumeExperienceSchemaType,
    resumeProjectSchemaType,
    resumeSkillSchemaType,
} from '@/utils/forms/resumes';

// Dates come back from the database as ISO strings inside the JSON columns
type Stored<T> = Omit<T, 'startMonth' | 'endMonth'> & { startMonth?: string; endMonth?: string };

export type ResumePreviewType = {
    title: string;
    summary: string | null;
    education: Stored<resumeEducationSchemaType>[] | null;
    experience: Stored<resumeExperienceSchemaType>[] | null;
    skills: resumeSkillSchemaType[] | null;
    projects: resumeProjectSchemaType[] | null;
    updated_at: string;
};

// Links are written by applicants, so only http(s) ones are made clickable for recruiters
function isWebLink(value: string) {
    return /^https?:\/\//i.test(value);
}

function formatMonth(value?: string) {
    return value
        ? new Date(value).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC',
          })
        : 'Present';
}

function formatPeriod(startMonth?: string, endMonth?: string) {
    return `${formatMonth(startMonth)} – ${formatMonth(endMonth)}`;
}

export default function ResumePreview({ resume }: { resume: ResumePreviewType }) {
    const education = resume.education ?? [];
    const experience = resume.experience ?? [];
    const skills = resume.skills ?? [];
    const projects = resume.projects ?? [];

    return (
        <VStack gap={6} align='stretch'>
            <Text textStyle='xs' color='fg.muted'>
                Updated {new Date(resume.updated_at).toLocaleDateString()}
            </Text>

            {resume.summary && <Text whiteSpace='pre-line'>{resume.summary}</Text>}

            {experience.length > 0 && (
                <ResumeSection title='Experience'>
                    {experience.map((item, index) => (
                        <ResumeEntry
                            key={index}
                            title={item.position}
                            subtitle={item.establishment}
                            period={formatPeriod(item.startMonth, item.endMonth)}
                            description={item.description}
                        />
                    ))}
                </ResumeSection>
            )}

            {education.length > 0 && (
                <ResumeSection title='Education'>
                    {education.map((item, index) => (
                        <ResumeEntry
                            key={index}
                            title={item.program}
                            subtitle={item.establishment}
                            period={formatPeriod(item.startMonth, item.endMonth)}
                            description={item.description}
                        />
                    ))}
                </ResumeSection>
            )}

            {skills.length > 0 && (
                <ResumeSection title='Skills'>
                    {skills.map((item, index) => (
                        <ResumeEntry key={index} title={item.name} description={item.description} />
                    ))}
                </ResumeSection>
            )}

            {projects.length > 0 && (
                <ResumeSection title='Projects'>
                    {projects.map((item, index) => (
                        <Stack key={index} gap={1}>
                            {isWebLink(item.link) ? (
                                <Link
                                    href={item.link}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    fontWeight='medium'
                                    colorPalette='blue'
                                >
                                    {item.title}
                                </Link>
                            ) : (
                                <Text fontWeight='medium'>{item.title}</Text>
                            )}
                            {item.description && (
                                <Text textStyle='sm' whiteSpace='pre-line'>
                                    {item.description}
                                </Text>
                            )}
                        </Stack>
                    ))}
                </ResumeSection>
            )}

            {!resume.summary &&
                experience.length + education.length + skills.length + projects.length === 0 && (
                    <Text color='fg.muted'>This resume is empty.</Text>
                )}
        </VStack>
    );
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <VStack gap={3} align='stretch'>
            <Heading as='h3' textStyle='md' borderBottomWidth='1px' paddingBottom={1}>
                {title}
            </Heading>
            {children}
        </VStack>
    );
}

function ResumeEntry({
    title,
    subtitle,
    period,
    description,
}: {
    title: string;
    subtitle?: string;
    period?: string;
    description?: string;
}) {
    return (
        <Stack gap={1}>
            <Text fontWeight='medium'>{title}</Text>
            {(subtitle || period) && (
                <Text textStyle='sm' color='fg.muted'>
                    {[subtitle, period].filter(Boolean).join(' · ')}
                </Text>
            )}
            {description && (
                <Text textStyle='sm' whiteSpace='pre-line'>
                    {description}
                </Text>
            )}
        </Stack>
    );
}
