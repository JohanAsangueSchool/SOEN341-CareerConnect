import { expect, test } from '@playwright/test';

import { NOT_BUILT_TIMEOUT, WORKER_STATE, openFirstJob } from './helpers';

/**
 * US-13 — AI Cover Letter Generator (AC-13.1, AC-13.2)
 *
 * Not built yet: both tests are expected failures. Remove test.fail() once the
 * feature exists, adjusting the selectors to the real page if needed.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

test('AC-13.1 a job detail page offers to generate a cover letter', async ({ page }) => {
    test.fail();

    await openFirstJob(page);

    await expect(page.getByRole('button', { name: 'Generate cover letter' })).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});

test('AC-13.2 the generated cover letter mentions the job title', async ({ page }) => {
    test.fail();

    await openFirstJob(page);
    const jobTitle = await page.getByRole('heading').first().innerText();
    await page
        .getByRole('button', { name: 'Generate cover letter' })
        .click({ timeout: NOT_BUILT_TIMEOUT });

    await expect(page.getByLabel('Cover letter')).toContainText(jobTitle, { timeout: 30_000 });
});
