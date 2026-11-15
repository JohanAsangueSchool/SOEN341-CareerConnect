import { expect, test } from '@playwright/test';

import { WORKER_STATE, openFirstJob } from './helpers';

/**
 * US-13 — AI Cover Letter Generator (AC-13.1, AC-13.2)
 *
 * AC-13.2 asks Google Gemini for a real letter, so it needs GEMINI_API_KEY (in
 * App/.env locally, as a repository secret in CI) and is skipped without it.
 * It uses one of the shared Worker account's resumes.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

test('AC-13.1 a job detail page offers to generate a cover letter', async ({ page }) => {
    await openFirstJob(page);

    await page.getByRole('button', { name: 'Generate cover letter' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /^Cover letter for / })).toBeVisible();
    await expect(dialog.getByLabel('Resume')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Generate' })).toBeEnabled();
});

test('AC-13.2 the generated cover letter mentions the job title', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, 'Needs GEMINI_API_KEY to call Gemini.');
    test.setTimeout(90_000);

    await openFirstJob(page);
    const jobTitle = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();

    await page.getByRole('button', { name: 'Generate cover letter' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Generate' }).click();

    const letter = dialog.getByLabel('Cover letter');
    await expect(letter).toBeVisible({ timeout: 60_000 });
    const text = await letter.inputValue();
    expect(text.toLowerCase()).toContain(jobTitle.toLowerCase());
    // A letter, not a one-line answer.
    expect(text.split(/\s+/).length).toBeGreaterThan(80);
});
