import { expect, test } from '@playwright/test';

import { NOT_BUILT_TIMEOUT, WORKER_STATE } from './helpers';

/**
 * US-25 — AI-Powered Resume Feedback (AC-25.1, AC-25.2)
 * US-26 — AI Job Matching Suggestions (AC-26.1, AC-26.2)
 *
 * Not built yet: every test is an expected failure. Remove test.fail() once a
 * feature exists, adjusting the selectors to the real page if needed.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

test('AC-25.1 a Worker can ask for AI feedback on a resume', async ({ page }) => {
    test.fail();

    await page.goto('/resumes');

    await expect(page.getByRole('button', { name: 'Get AI feedback' }).first()).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});

test('AC-25.2 the AI feedback lists suggestions for improvement', async ({ page }) => {
    test.fail();

    await page.goto('/resumes');
    await page
        .getByRole('button', { name: 'Get AI feedback' })
        .first()
        .click({ timeout: NOT_BUILT_TIMEOUT });

    await expect(page.getByRole('heading', { name: /suggestions/i })).toBeVisible({
        timeout: 30_000,
    });
});

test('AC-26.1 the jobs page recommends postings for the Worker', async ({ page }) => {
    test.fail();

    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});

test('AC-26.2 each recommendation says why it matches the Worker', async ({ page }) => {
    test.fail();

    await page.goto('/jobs');

    await expect(page.getByText(/matches your (profile|resume|skills)/i).first()).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});
