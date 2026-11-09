import { expect, test } from '@playwright/test';

import { NOT_BUILT_TIMEOUT, WORKER_STATE, openFirstJob } from './helpers';

/**
 * US-04 — Saved Jobs (AC-04.1, AC-04.2)
 *
 * Not built yet: both tests are expected failures. Remove test.fail() once the
 * feature exists, adjusting the selectors to the real page if needed.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

test('AC-04.1 a Worker can save a job from its detail page', async ({ page }) => {
    test.fail();

    await openFirstJob(page);
    await page.getByRole('button', { name: 'Save job' }).click({ timeout: NOT_BUILT_TIMEOUT });

    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
});

test('AC-04.2 saved jobs are listed on the Saved Jobs page', async ({ page }) => {
    test.fail();

    await page.goto('/saved-jobs');

    await expect(page.getByRole('heading', { name: 'Saved Jobs' })).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});
