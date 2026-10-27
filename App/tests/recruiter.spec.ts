import { type Browser, type Locator, type Page, expect, test } from '@playwright/test';

import { RECRUITER_STATE, WORKER_STATE, uniqueTitle, worker } from './helpers';

/**
 * US-08 — Recruiter Posting Management (AC-08.1 … AC-08.3, AC-08.5)
 * US-06 — Job Application Tracking (AC-06.3)
 *
 * These change shared data, so each test puts it back when it finishes: the
 * posting test closes the posting it created (closed postings are hidden from
 * Workers), and the status test restores the application's original status.
 * AC-08.4 (applicant's resume) is not met: applications carry no resume.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: RECRUITER_STATE });

/** Opens a page signed in as the Worker, alongside the Recruiter's page. */
async function workerPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext({ storageState: WORKER_STATE });
    return context.newPage();
}

/** A posting card on the Recruiter's own listing, located by its title. */
function postingCard(page: Page, title: string): Locator {
    return page
        .getByRole('heading', { name: title, exact: true })
        .locator('xpath=ancestor::div[.//a[starts-with(@href, "/jobs/edit?id=")]][1]');
}

/** Searches the Worker-facing listing for a title and returns how many cards match. */
async function workerListingCount(page: Page, title: string): Promise<number> {
    await page.goto(`/jobs?keyword=${encodeURIComponent(title)}`);
    // Wait for the search to finish: either results or the empty state.
    await expect(
        page.getByRole('link', { name: 'View' }).first().or(page.getByText('No jobs match your filters')),
    ).toBeVisible();
    return page.getByRole('heading', { name: title, exact: true }).count();
}

async function fillPosting(page: Page, title: string, status: 'Open' | 'Closed') {
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Company').fill('E2E Test Company');
    await page.getByLabel('Status').selectOption(status);
    await page.getByLabel('Job Type').selectOption('Contract');
    await page.getByLabel('Location').fill('Remote');
    await page.getByLabel('Category').fill('Software Engineering');
    await page.getByLabel('Description').fill('Created by the acceptance test suite.');
}

test('AC-08.5 a Worker cannot open the posting editor', async ({ browser }) => {
    const page = await workerPage(browser);

    await page.goto('/jobs/edit');

    await expect(page).toHaveURL('/jobs');
    await page.context().close();
});

test('AC-08.2 a posting with a required field empty is rejected', async ({ page }) => {
    await page.goto('/jobs/edit');
    await fillPosting(page, uniqueTitle('Invalid posting'), 'Open');
    await page.getByLabel('Company').fill('');

    await page.getByRole('button', { name: 'Create Job Posting' }).click();

    await expect(page.getByText('Company is required.')).toBeVisible();
    await expect(page).toHaveURL('/jobs/edit');
});

test('AC-08.1 / AC-08.3 a Recruiter can create and edit a posting', async ({
    page,
    browser,
}) => {
    const title = uniqueTitle('Posting');
    const editedTitle = `${title} edited`;
    const seeker = await workerPage(browser);

    try {
        // AC-08.1 — an Open posting appears in the Worker-facing listing.
        // (Saving as a Draft is not tested: the database rejects that status.)
        await page.goto('/jobs/edit');
        await fillPosting(page, title, 'Open');
        await page.getByRole('button', { name: 'Create Job Posting' }).click();
        await expect(page).toHaveURL('/jobs');
        await expect(postingCard(page, title)).toContainText('Open');
        expect(await workerListingCount(seeker, title)).toBe(1);

        // AC-08.3 — an edit is reflected in the listing.
        await postingCard(page, title).getByRole('link', { name: 'Edit' }).click();
        await expect(page.getByLabel('Title')).toHaveValue(title);
        await page.getByLabel('Title').fill(editedTitle);
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page).toHaveURL('/jobs');
        expect(await workerListingCount(seeker, editedTitle)).toBe(1);
    } finally {
        // Close whichever version exists so it no longer shows to Workers.
        await page.goto('/jobs');
        const card = postingCard(page, editedTitle).or(postingCard(page, title)).first();
        // The list loads after the page opens; give the posting time to appear.
        const created = await card
            .waitFor({ timeout: 10_000 })
            .then(() => true)
            .catch(() => false);
        if (created) {
            const shownTitle = await card.getByRole('heading').innerText();
            await card.getByRole('link', { name: 'Edit' }).click();
            // The form loads the saved values after it opens; wait for them, or
            // they would overwrite the status chosen here.
            await expect(page.getByLabel('Title')).toHaveValue(shownTitle);
            await page.getByLabel('Status').selectOption('Closed');
            await page.getByRole('button', { name: 'Save Changes' }).click();
            await expect(page).toHaveURL('/jobs');
            await expect(postingCard(page, shownTitle)).toContainText('Closed');
        }
        await seeker.context().close();
    }

    // Once closed, it is gone from the Worker-facing listing.
    const after = await workerPage(browser);
    expect(await workerListingCount(after, editedTitle)).toBe(0);
    await after.context().close();
});

test('AC-06.3 a status changed by the Recruiter shows for the Worker', async ({
    page,
    browser,
}) => {
    await page.goto('/applications');

    // Requires the Worker to have applied to one of this Recruiter's postings.
    const card = page
        .getByText(worker.fullName, { exact: true })
        .locator('xpath=ancestor::div[.//select[@aria-label="Application status"]][1]')
        .first();
    await expect(card).toBeVisible();

    const jobTitle = (await card.getByText(' · ').innerText()).split(' · ')[0];
    const select = card.getByLabel('Application status');
    const original = await select.inputValue();
    const changed = original === 'Interview' ? 'Under Review' : 'Interview';

    const seeker = await workerPage(browser);
    try {
        await select.selectOption(changed);
        await expect(page.getByText(`Application marked as ${changed}.`)).toBeVisible();

        await seeker.goto('/applications');
        const application = seeker
            .getByRole('heading', { name: jobTitle, exact: true })
            .locator('xpath=ancestor::div[.//*[text()="Application status"]][1]');
        await expect(application).toContainText(changed);
    } finally {
        await select.selectOption(original);
        await expect(page.getByText(`Application marked as ${original}.`)).toBeVisible();
        await seeker.context().close();
    }
});
