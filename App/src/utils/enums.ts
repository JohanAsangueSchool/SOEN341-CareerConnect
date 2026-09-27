import * as z from 'zod';

export const AccountTypeEnum = z.enum(['Worker', 'Recruiter'], {
    error: () => 'Invalid account type.',
});

export type AccountTypeEnumType = z.infer<typeof AccountTypeEnum>;
