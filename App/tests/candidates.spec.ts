import { expect, test } from '@playwright/test';

import { NOT_BUILT_TIMEOUT, RECRUITER_STATE, worker, workerApplicationCard } from './helpers';

/**
 * US-09 — Candidate Profile & Resume Viewer (AC-09.1, AC-09.2)
 * US-10 — Application Review & Feedback (AC-10.1, AC-10.2)
 * US-14 — Candidate Search (AC-14.1, AC-14.2)
 * US-15 — Favorite Candidates (AC-15.1, AC-15.2)
 *
 * AC-09.1 and AC-10.1 read the Recruiter's applications page and need the
 * Worker to have applied to one of the Recruiter's postings. The other tests
 * cover features that are not built yet and are expected failures: remove
 * test.fail() once a feature exists, adjusting the selectors if needed.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: RECRUITER_STATE });

const APPLICATION_STATUSES = ['Applied', 'Under Review', 'Interview', 'Offered', 'Rejected'];

test('AC-09.1 a Recruiter sees the name and contact details of each applicant', async ({ page }) => {
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

test('AC-14.1 a Recruiter can open the candidate search page', async ({ page }) => {
    test.fail();

    await page.goto('/candidates');

    await expect(page.getByLabel('Search candidates')).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-14.2 searching by name returns the matching candidate', async ({ page }) => {
    test.fail();

    await page.goto('/candidates');
    await page.getByLabel('Search candidates').fill(worker.lastName, { timeout: NOT_BUILT_TIMEOUT });

    await expect(page.getByText(worker.fullName, { exact: true })).toBeVisible();
});

test('AC-15.1 a Recruiter can add a candidate to their favorites', async ({ page }) => {
    test.fail();

    await page.goto('/candidates');

    await expect(page.getByRole('button', { name: 'Add to favorites' }).first()).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});

test('AC-15.2 favorite candidates are listed on their own page', async ({ page }) => {
    test.fail();

    await page.goto('/candidates/favorites');

    await expect(page.getByRole('heading', { name: 'Favorite candidates' })).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});
