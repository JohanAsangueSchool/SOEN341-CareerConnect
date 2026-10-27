import { type Page, expect, test } from '@playwright/test';

import { worker } from './helpers';

/**
 * Foundation — Authentication (AC-A.1 … AC-A.10)
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

type SignupFields = {
    firstName: string;
    lastName: string;
    accountType: 'Worker' | 'Recruiter';
    email: string;
    phone: string;
    postalCode: string;
    password: string;
    confirmPassword: string;
};

function validSignup(overrides: Partial<SignupFields> = {}): SignupFields {
    const password = 'passw0rd';

    return {
        firstName: 'Acceptance',
        lastName: 'Tester',
        accountType: 'Worker',
        email: `e2e+${Date.now()}@example.com`,
        phone: '514-555-0100',
        postalCode: 'H3G 1M8',
        password,
        confirmPassword: password,
        ...overrides,
    };
}

async function fillSignupForm(page: Page, fields: SignupFields) {
    await page.goto('/signup');
    await page.getByLabel('First Name').fill(fields.firstName);
    await page.getByLabel('Last Name').fill(fields.lastName);
    // The account-type control is a RadioCard whose input is visually hidden, so
    // click the card's text the way a user would rather than the input itself.
    await page.getByText(fields.accountType, { exact: true }).click();
    await expect(page.getByRole('radio', { name: fields.accountType })).toBeChecked();
    await page.getByLabel('Email').fill(fields.email);
    await page.getByLabel('Phone').fill(fields.phone);
    await page.getByLabel('Postal Code').fill(fields.postalCode);
    await page.getByLabel('Password', { exact: true }).fill(fields.password);
    await page.getByLabel('Confirm Password').fill(fields.confirmPassword);
}

async function submitSignup(page: Page) {
    await page.getByRole('button', { name: 'Sign Up' }).click();
}

test.describe('Registration', () => {
    // Not met: sign-up fails in Supabase (the handle_new_user trigger does not
    // copy phone and postal_code), so AC-A.1 and AC-A.2 are expected failures.
    // Once sign-up works they pass, the build turns red, and test.fail() should
    // be removed. Each passing run then creates a real user.
    test('AC-A.1 a visitor can register as a Worker', async ({ page }) => {
        test.fail();

        await fillSignupForm(page, validSignup({ accountType: 'Worker' }));
        await submitSignup(page);

        await expect(page).toHaveURL('/');
    });

    test('AC-A.2 a visitor can register as a Recruiter', async ({ page }) => {
        test.fail();

        await fillSignupForm(page, validSignup({ accountType: 'Recruiter' }));
        await submitSignup(page);

        await expect(page).toHaveURL('/');
    });

    test('AC-A.3 a first name shorter than two characters is rejected', async ({ page }) => {
        await fillSignupForm(page, validSignup({ firstName: 'A' }));
        await submitSignup(page);

        await expect(page.getByText('First name must be minimum 2 characters.')).toBeVisible();
        await expect(page).toHaveURL('/signup');
    });

    test('AC-A.4 a malformed email address is rejected', async ({ page }) => {
        // The input is type="email", so the browser blocks a value with no "@"
        // before the form's own validation runs. A missing top-level domain gets
        // past the browser but not the schema.
        await fillSignupForm(page, validSignup({ email: 'tester@example' }));
        await submitSignup(page);

        await expect(page.getByText('Invalid email address.')).toBeVisible();
        await expect(page).toHaveURL('/signup');
    });

    test('AC-A.5 a phone number not matching XXX-XXX-XXXX is rejected', async ({ page }) => {
        await fillSignupForm(page, validSignup({ phone: '5145550100' }));
        await submitSignup(page);

        await expect(page.getByText('Phone number is invalid.')).toBeVisible();
        await expect(page).toHaveURL('/signup');
    });

    test('AC-A.6 a postal code not matching A1A 1A1 is rejected', async ({ page }) => {
        await fillSignupForm(page, validSignup({ postalCode: 'H3G1M8' }));
        await submitSignup(page);

        await expect(page.getByText('Postal code is invalid.')).toBeVisible();
        await expect(page).toHaveURL('/signup');
    });

    test('AC-A.7 a password shorter than six characters is rejected', async ({ page }) => {
        await fillSignupForm(page, validSignup({ password: 'abc', confirmPassword: 'abc' }));
        await submitSignup(page);

        await expect(page.getByText('Password must be minimum 6 characters.')).toBeVisible();
        await expect(page).toHaveURL('/signup');
    });

    test('AC-A.8 a mismatched confirm password is rejected', async ({ page }) => {
        await fillSignupForm(page, validSignup({ confirmPassword: 'different' }));
        await submitSignup(page);

        await expect(page.getByText('Both password must be identicals.')).toBeVisible();
        await expect(page).toHaveURL('/signup');
    });
});

test.describe('Sign in', () => {
    test('AC-A.9 correct credentials take the user to the home page', async ({ page }) => {
        await page.goto('/signin');
        await page.getByLabel('Email').fill(worker.email);
        await page.getByLabel('Password', { exact: true }).fill(worker.password);
        await page.getByRole('button', { name: 'Login' }).click();

        await expect(page).toHaveURL('/');
    });

    test('AC-A.10 an incorrect password does not sign the user in', async ({ page }) => {
        await page.goto('/signin');
        await page.getByLabel('Email').fill(worker.email);
        await page.getByLabel('Password', { exact: true }).fill('definitely-not-the-password');
        await page.getByRole('button', { name: 'Login' }).click();

        await expect(page.getByText('Failed to login.')).toBeVisible();
        await expect(page).toHaveURL('/signin');
    });
});

// AC-A.11 (sign out) is in signout.spec.ts, which restores the shared session.
