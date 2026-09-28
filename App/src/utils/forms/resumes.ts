import * as z from 'zod';
import { ResumeStatusEnum } from '../enums';

export const resumeSkillSchema = z.object({
    name: z.string().trim().min(1, 'Skill name is required'),
    description: z.string().trim(),
});

export type resumeSkillSchemaType = z.infer<typeof resumeSkillSchema>;

export const resumeEducationSchema = z.object({
    establishment: z.string().trim().min(1, 'Education establishment is required'),
    program: z.string().trim().min(1, 'Education program is required'),
    startMonth: z.coerce.date({ error: 'Start month is required.' }),
    endMonth: z.coerce.date().optional(),
    description: z.string().trim(),
});

export type resumeEducationSchemaType = z.infer<typeof resumeEducationSchema>;

export const resumeExperienceSchema = z.object({
    establishment: z.string().trim().min(1, 'Work establishment is required'),
    position: z.string().trim().min(1, 'Work position is required'),
    startMonth: z.coerce.date({ error: 'Start month is required.' }),
    endMonth: z.coerce.date().optional(),
    description: z.string().trim(),
});

export type resumeExperienceSchemaType = z.infer<typeof resumeExperienceSchema>;

export const resumeProjectSchema = z.object({
    title: z.string().trim().min(1, 'Project title is required'),
    link: z.url(),
    description: z.string().trim(),
});

export type resumeProjectSchemaType = z.infer<typeof resumeProjectSchema>;

export const resumeSchema = z.object({
    title: z.string().trim().min(1, 'Title is required.'),
    summary: z.string().trim(),
    status: ResumeStatusEnum,
    education: resumeEducationSchema.array(),
    experience: resumeExperienceSchema.array(),
    skills: resumeSkillSchema.array(),
    projects: resumeProjectSchema.array(),
});

export type resumeSchemaType = z.infer<typeof resumeSchema>;

export type resumeSchemaInputType = z.input<typeof resumeSchema>;
