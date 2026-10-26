import { expect, test } from '@playwright/test';

import { RECRUITER_STATE, WORKER_STATE } from './helpers';

/**
 * Foundation — Access control (AC-G.1 … AC-G.5)
 * Enforced by App/src/lib/supabase/proxy.ts, which gates routes on
 * profiles.account_type. See Documentation/Acceptance_Tests_Sprint_2.md § 4.
 */

test.describe('Signed-out visitors', () => {
    test('AC-G.1 the home page redirects to sign-in', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveURL('/signin');
    });

    test('AC-G.2 the resumes page redirects to sign-in', async ({ page }) => {
        await page.goto('/resumes');

        await expect(page).toHaveURL('/signin');
    });
});

test.describe('Recruiter accounts', () => {
    test.use({ storageState: RECRUITER_STATE });

    test('AC-G.3 the resumes page redirects to the home page', async ({ page }) => {
        await page.goto('/resumes');

        await expect(page).toHaveURL('/');
    });

    test('AC-G.5 no Resumes tab is shown in the header', async ({ page }) => {
        await page.goto('/');

        const header = page.locator('header');
        // The header navigation renders as tabs.
        await expect(header.getByRole('tab', { name: 'Home' })).toBeVisible();
        await expect(header.getByRole('tab', { name: 'Resumes' })).toHaveCount(0);
    });
});

test.describe('Worker accounts', () => {
    test.use({ storageState: WORKER_STATE });

    test('AC-G.4 the resumes page is shown', async ({ page }) => {
        await page.goto('/resumes');

        await expect(page).toHaveURL('/resumes');
        await expect(page.getByRole('button', { name: 'New Resume' })).toBeVisible();
    });
});
