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
