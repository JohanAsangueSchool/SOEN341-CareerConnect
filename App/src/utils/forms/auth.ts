import * as z from 'zod';
import { AccountTypeEnum } from '../enums';

export const loginFormSchema = z.object({
    email: z.email('Invalid email address.').trim().min(1, 'Email is required.'),
    password: z.string().trim().min(1, 'Password is required.'),
});

export type loginFormSchemaType = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z.object({
    first_name: z.string().trim().min(2, 'First name must be minimum 2 characters.'),
    last_name: z.string().trim().min(2, 'Last name must be minimum 2 requicharactersred.'),
    account_type: AccountTypeEnum,
    email: z.email('Invalid email address.').trim().min(1, 'Email is required.'),
    phone: z
        .string()
        .trim()
        .regex(/^([0-9]{3})\-([0-9]{3})\-([0-9]{4})$/, 'Phone number is invalid.'),
    postal_code: z
        .string()
        .trim()
        .regex(/^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/, 'Postal code is invalid.'),
    password: z.string().trim().min(6, 'Password must be minimum 6 characters.'),
});

export type signupFormSchemaType = z.infer<typeof signupFormSchema>;
