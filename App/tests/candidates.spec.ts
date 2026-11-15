import { type Page, expect, test } from '@playwright/test';

import {
    NOT_BUILT_TIMEOUT,
    RECRUITER_STATE,
    WORKER_STATE,
    worker,
    workerApplicationCard,
} from './helpers';

/**
 * US-09 — Candidate Profile & Resume Viewer (AC-09.1, AC-09.2)
 * US-10 — Application Review & Feedback (AC-10.1, AC-10.2)
 * US-14 — Candidate Search (AC-14.1, AC-14.2)
 * US-15 — Favorite Candidates (AC-15.1, AC-15.2)
 *
 * AC-09.1 and AC-10.1 read the Recruiter's applications page and need the
 * Worker to have applied to one of the Recruiter's postings. AC-09.2 and
 * AC-10.2 cover features that are not built yet and are expected failures.
 * AC-14.x and AC-15.x search for the shared Worker and always leave them out
 * of the Recruiter's favorites.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: RECRUITER_STATE });

const APPLICATION_STATUSES = ['Applied', 'Under Review', 'Interview', 'Offered', 'Rejected'];

test('AC-09.1 a Recruiter sees the name and contact details of each applicant', async ({
    page,
}) => {
    await page.goto('/applications');

    const card = workerApplicationCard(page);
    await expect(card).toBeVisible();
    await expect(card).toContainText(worker.email);
    await expect(card).toContainText(/\d{3}-\d{3}-\d{4}/);
});

test('AC-09.2 a Recruiter can open the full profile of an applicant', async ({ page }) => {
    test.fail();

    await page.goto('/applications');
    await workerApplicationCard(page)
        .getByRole('link', { name: 'View profile' })
        .click({ timeout: NOT_BUILT_TIMEOUT });

    await expect(page.getByRole('heading', { name: worker.fullName })).toBeVisible();
});

test('AC-10.1 each application received can be set to any of the agreed statuses', async ({
    page,
}) => {
    await page.goto('/applications');

    const select = workerApplicationCard(page).getByLabel('Application status');
    await expect(select).toBeVisible();
    const options = await select.locator('option').allInnerTexts();
    expect(options.map((option) => option.trim())).toEqual(
        expect.arrayContaining(APPLICATION_STATUSES),
    );
});

test('AC-10.2 a Recruiter can leave feedback on an application', async ({ page }) => {
    test.fail();

    await page.goto('/applications');

    await expect(workerApplicationCard(page).getByLabel('Feedback')).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});

/** The candidate card for the shared Worker account. */
function workerCandidateCard(page: Page) {
    return page
        .getByRole('heading', { name: worker.fullName, exact: true })
        .locator('xpath=ancestor::div[.//a[starts-with(@href, "mailto:")]][1]');
}

/** Searches for the shared Worker on the candidate search page. */
async function searchForWorker(page: Page) {
    await page.goto('/candidates');
    await page.getByLabel('Search candidates').fill(worker.lastName);
    await expect(workerCandidateCard(page)).toBeVisible();
}

/** Makes sure the shared Worker is not one of the Recruiter's favorites. */
async function startNotFavorite(page: Page) {
    await searchForWorker(page);
    const remove = workerCandidateCard(page).getByRole('button', { name: 'Remove from favorites' });
    if (await remove.isVisible()) {
        await remove.click();
        await expect(
            workerCandidateCard(page).getByRole('button', { name: 'Add to favorites' }),
        ).toBeVisible();
    }
}

test('AC-14.1 a Recruiter can open the candidate search page', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('tab', { name: 'Candidates' }).click();

    await expect(page).toHaveURL('/candidates');
    await expect(page.getByLabel('Search candidates')).toBeVisible();
    // With no search, every Worker is listed, the shared one included.
    await expect(workerCandidateCard(page)).toBeVisible();
    await expect(workerCandidateCard(page)).toContainText(worker.email);
});

test('AC-14.2 searching by name returns the matching candidate', async ({ page }) => {
    await searchForWorker(page);

    // Every result matches the search.
    const names = page.getByRole('heading', { level: 2 });
    for (const name of await names.allTextContents()) {
        expect(name.toLowerCase()).toContain(worker.lastName.toLowerCase());
    }

    await page.getByLabel('Search candidates').fill('zzqx-no-such-candidate');
    await expect(page.getByText('No candidates found')).toBeVisible();
});

test('AC-15.1 a Recruiter can add a candidate to their favorites', async ({ page }) => {
    await startNotFavorite(page);

    try {
        await workerCandidateCard(page).getByRole('button', { name: 'Add to favorites' }).click();
        await expect(
            workerCandidateCard(page).getByRole('button', { name: 'Remove from favorites' }),
        ).toBeVisible();

        // Stored, not just shown.
        await searchForWorker(page);
        await expect(
            workerCandidateCard(page).getByRole('button', { name: 'Remove from favorites' }),
        ).toBeVisible();
    } finally {
        await startNotFavorite(page);
    }
});

test('AC-15.2 favorite candidates are listed on their own page', async ({ page }) => {
    await startNotFavorite(page);
    await workerCandidateCard(page).getByRole('button', { name: 'Add to favorites' }).click();
    await expect(
        workerCandidateCard(page).getByRole('button', { name: 'Remove from favorites' }),
    ).toBeVisible();

    try {
        await page.getByRole('link', { name: 'Favorites' }).click();
        await expect(page).toHaveURL('/candidates/favorites');
        await expect(page.getByRole('heading', { name: 'Favorite candidates' })).toBeVisible();
        await expect(workerCandidateCard(page)).toContainText(worker.email);

        // Removing them here takes them off the list.
        await workerCandidateCard(page)
            .getByRole('button', { name: 'Remove from favorites' })
            .click();
        await expect(workerCandidateCard(page)).toHaveCount(0);
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Favorite candidates' })).toBeVisible();
        await expect(workerCandidateCard(page)).toHaveCount(0);
    } finally {
        await startNotFavorite(page);
    }
});

test.describe('as a Worker', () => {
    test.use({ storageState: WORKER_STATE });

    test('AC-14.3 a Worker cannot open the candidate search page', async ({ page }) => {
        await page.goto('/candidates');

        await expect(page).toHaveURL('/');
        await expect(page.locator('header').getByRole('tab', { name: 'Candidates' })).toHaveCount(
            0,
        );
    });
});
