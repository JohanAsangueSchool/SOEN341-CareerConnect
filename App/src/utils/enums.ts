import * as z from 'zod';

export const AccountTypeEnumValues = ['Worker', 'Recruiter'];

export const AccountTypeEnum = z.enum(AccountTypeEnumValues, {
    error: () => 'Invalid account type.',
});

export type AccountTypeEnumType = z.infer<typeof AccountTypeEnum>;

export const ResumeStatusEnumValues = ['Draft', 'Active', 'Archived'];

export const ResumeStatusEnum = z.enum(ResumeStatusEnumValues, {
    error: () => 'Invalid resume status.',
});

export type ResumeStatusEnumType = z.infer<typeof ResumeStatusEnum>;

export const JobTypeEnumValues = ['Full-time', 'Part-time', 'Internship', 'Contract'];

export const JobTypeEnum = z.enum(JobTypeEnumValues, {
    error: () => 'Invalid job type.',
});

export type JobTypeEnumType = z.infer<typeof JobTypeEnum>;

export const JobStatusEnumValues = ['Draft', 'Open', 'Closed'];

export const JobStatusEnum = z.enum(JobStatusEnumValues, {
    error: () => 'Invalid job status.',
});

export type JobStatusEnumType = z.infer<typeof JobStatusEnum>;

export const ApplicationStatusEnumValues = [
    'Applied',
    'Under Review',
    'Interview',
    'Offered',
    'Rejected',
];

export const ApplicationStatusEnum = z.enum(ApplicationStatusEnumValues, {
    error: () => 'Invalid application status.',
});

export type ApplicationStatusEnumType = z.infer<typeof ApplicationStatusEnum>;
