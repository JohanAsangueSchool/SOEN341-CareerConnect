import * as z from 'zod';

import { JobStatusEnum, JobTypeEnum } from '../enums';

const salarySchema = z
    .number({ error: 'Salary must be a number.' })
    .nonnegative('Salary cannot be negative.')
    .nullable();

export const jobSchema = z
    .object({
        title: z.string().trim().min(1, 'Title is required.'),
        company: z.string().trim().min(1, 'Company is required.'),
        location: z.string().trim().min(1, 'Location is required.'),
        category: z.string().trim().min(1, 'Category is required.'),
        job_type: JobTypeEnum,
        status: JobStatusEnum,
        salary_min: salarySchema,
        salary_max: salarySchema,
        description: z.string().trim(),
    })
    .refine(
        (job) =>
            job.salary_min === null || job.salary_max === null || job.salary_min <= job.salary_max,
        { message: 'Maximum salary must be at least the minimum.', path: ['salary_max'] },
    );

export type jobSchemaType = z.infer<typeof jobSchema>;

export type jobSchemaInputType = z.input<typeof jobSchema>;
