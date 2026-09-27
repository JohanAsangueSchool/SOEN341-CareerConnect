import * as z from 'zod';

export const AccountTypeEnumValues = ['Worker', 'Recruiter'];

export const AccountTypeEnum = z.enum(AccountTypeEnumValues, {
    error: () => 'Invalid account type.',
});

export type AccountTypeEnumType = z.infer<typeof AccountTypeEnum>;
