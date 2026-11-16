import { type Page, expect, test } from '@playwright/test';

import { RECRUITER_STATE, WORKER_STATE, openFirstJob } from './helpers';

/**
 * US-04 — Saved Jobs (AC-04.1, AC-04.2)
 *
 * The shared Worker account saves the first posting on the listing and the
 * tests put it back the way they found it, so a run leaves nothing saved.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

/** Makes sure the open job page shows "Save job", unsaving it if needed. */
async function startUnsaved(page: Page) {
    const saved = page.getByRole('button', { name: 'Saved' });
    const save = page.getByRole('button', { name: 'Save job' });
    // The button reads "Save job" while it is still checking, so wait until it
    // can be clicked before trusting its label.
    await expect(saved.or(save)).toBeEnabled();
    if (await saved.isVisible()) {
        await saved.click();
        await expect(save).toBeVisible();
    }
}

test('AC-04.1 a Worker can save a job from its detail page', async ({ page }) => {
    await openFirstJob(page);
    await startUnsaved(page);

    try {
        await page.getByRole('button', { name: 'Save job' }).click();
        await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

        // Stored, not just shown.
        await page.reload();
        await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
    } finally {
        await startUnsaved(page);
    }
});

test('AC-04.2 saved jobs are listed on the Saved Jobs page', async ({ page }) => {
    await openFirstJob(page);
    const jobUrl = page.url();
    const title = (await page.getByRole('heading', { level: 1 }).textContent())!;
    await startUnsaved(page);
    await page.getByRole('button', { name: 'Save job' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

    try {
        await page.locator('header').getByRole('tab', { name: 'Saved Jobs' }).click();
        await expect(page).toHaveURL('/saved-jobs');
        await expect(page.getByRole('heading', { name: 'Saved Jobs', level: 1 })).toBeVisible();

        const card = page
            .getByRole('heading', { name: title, exact: true })
            .locator('xpath=ancestor::div[.//a[contains(@href, "/jobs/")]][1]');
        await expect(card).toBeVisible();

        // Removing it from the page unsaves it.
        await card.getByRole('button', { name: 'Remove' }).click();
        await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Saved Jobs', level: 1 })).toBeVisible();
        await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
    } finally {
        await page.goto(jobUrl);
        await startUnsaved(page);
    }
});

test.describe('as a Recruiter', () => {
    test.use({ storageState: RECRUITER_STATE });

    test('AC-04.3 a Recruiter has no Saved Jobs page', async ({ page }) => {
        await page.goto('/saved-jobs');

        await expect(page).toHaveURL('/');
        await expect(page.locator('header').getByRole('tab', { name: 'Saved Jobs' })).toHaveCount(
            0,
        );
    });
});
