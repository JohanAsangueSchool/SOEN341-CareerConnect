import { type Browser, type Locator, type Page, expect, test } from '@playwright/test';

import { RECRUITER_STATE, WORKER_STATE, uniqueTitle, worker } from './helpers';

/**
 * US-17 — Recruiter Dashboard (AC-17.1 … AC-17.3)
 * US-18 — Posting Management (AC-18.1 … AC-18.4)
 * US-19 — Applications Filter and Candidates Review (AC-19.1, AC-19.2)
 * US-10 — Application Status Update (AC-10.1)
 *
 * The tests run in order against one posting created in beforeAll, which the
 * Worker applies to for real so the dashboard has an application to show.
 * afterAll archives the posting, which hides it from Workers and from the
 * Recruiter's active list. Each run therefore leaves one archived posting and
 * one application on it.
 * See Documentation/Acceptance_Tests_Sprint_3.md.
 */

test.use({ storageState: RECRUITER_STATE });
test.describe.configure({ mode: 'serial' });

const title = uniqueTitle('Dashboard posting');
let jobId = '';

const DAY_MS = 24 * 60 * 60 * 1000;

async function openPage(browser: Browser, storageState: string): Promise<Page> {
    const context = await browser.newContext({ storageState });
    return context.newPage();
}

async function openDashboard(page: Page) {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
}

/** A posting card on the dashboard or the Recruiter's listing, located by its title. */
function postingCard(page: Page, postingTitle = title): Locator {
    return page
        .getByRole('heading', { name: postingTitle, exact: true })
        .locator('xpath=ancestor::div[.//a[starts-with(@href, "/jobs/edit?id=")]][1]');
}

/** The test Worker's application inside an expanded posting card. */
function applicantCard(card: Locator): Locator {
    return card
        .getByText(worker.fullName, { exact: true })
        .locator('xpath=ancestor::div[.//select[@aria-label="Application status"]][1]');
}

async function expandApplications(card: Locator) {
    await card.getByRole('button', { name: 'Review applications' }).click();
    await expect(applicantCard(card)).toBeVisible();
}

/** Searches the Worker-facing listing for the title and returns how many cards match. */
async function workerListingCount(page: Page): Promise<number> {
    await page.goto(`/jobs?keyword=${encodeURIComponent(title)}`);
    // Wait for the search to finish: either results or the empty state.
    await expect(
        page
            .getByRole('link', { name: 'View' })
            .first()
            .or(page.getByText('No jobs match your filters')),
    ).toBeVisible();
    return page.getByRole('heading', { name: title, exact: true }).count();
}

test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000);

    // The Recruiter creates an Open posting, with a description so the
    // Worker-facing listing tests (AC-16.2) still find one while it is open.
    const page = await openPage(browser, RECRUITER_STATE);
    await page.goto('/jobs/edit');
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Company').fill('E2E Test Company');
    await page.getByLabel('Status').selectOption('Open');
    await page.getByLabel('Job Type').selectOption('Contract');
    await page.getByLabel('Location').fill('Remote');
    await page.getByLabel('Category').fill('Software Engineering');
    await page.getByLabel('Description').fill('Created by the dashboard acceptance tests.');
    await page.getByRole('button', { name: 'Create Job Posting' }).click();
    await expect(page).toHaveURL('/jobs');

    const editHref = await postingCard(page)
        .getByRole('link', { name: 'Edit' })
        .getAttribute('href');
    jobId = new URLSearchParams(editHref!.split('?')[1]).get('id')!;
    await page.context().close();

    // The Worker applies, so the posting has one application to review.
    const seeker = await openPage(browser, WORKER_STATE);
    await seeker.goto(`/jobs/${jobId}`);
    await seeker.getByRole('button', { name: 'Apply Now' }).click();
    await expect(seeker.getByText('Application submitted!')).toBeVisible();
    await seeker.context().close();
});

test.afterAll(async ({ browser }) => {
    if (!jobId) return;

    // Archive the posting whatever state the tests left it in.
    const page = await openPage(browser, RECRUITER_STATE);
    await openDashboard(page);
    await page.getByLabel('Show postings').selectOption('all');
    const archive = postingCard(page).getByRole('button', { name: 'Archive' });
    if (await archive.isVisible()) {
        await archive.click();
        await expect(page.getByText('Posting archived')).toBeVisible();
    }
    await page.context().close();
});

test('AC-17.1 the dashboard lists the Recruiter’s postings', async ({ page }) => {
    await openDashboard(page);

    await expect(page.locator('header').getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(postingCard(page)).toBeVisible();
    await expect(postingCard(page)).toContainText('Open');
});

test('AC-17.2 each posting shows how many applications it received', async ({ page }) => {
    await openDashboard(page);

    await expect(postingCard(page)).toContainText('1 application');
    await expect(postingCard(page)).toContainText('1 Applied');
});

test('AC-17.3 a Worker cannot open the dashboard', async ({ browser }) => {
    const page = await openPage(browser, WORKER_STATE);

    await page.goto('/dashboard');

    await expect(page).toHaveURL('/');
    await expect(page.locator('header').getByRole('link', { name: 'Jobs' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
    await page.context().close();
});

test('AC-18.1 a new posting can be started from the dashboard', async ({ page }) => {
    await openDashboard(page);

    await page.getByRole('link', { name: 'New Job Posting' }).click();

    await expect(page).toHaveURL('/jobs/edit');
    await expect(page.getByRole('button', { name: 'Create Job Posting' })).toBeVisible();
});

test('AC-10.1 a status changed on the dashboard shows for the Worker', async ({
    page,
    browser,
}) => {
    await openDashboard(page);
    const card = postingCard(page);
    await expandApplications(card);

    await applicantCard(card).getByLabel('Application status').selectOption('Interview');

    await expect(page.getByText('Application marked as Interview.')).toBeVisible();
    await expect(card).toContainText('1 Interview');

    const seeker = await openPage(browser, WORKER_STATE);
    await seeker.goto('/applications');
    const application = seeker
        .getByRole('heading', { name: title, exact: true })
        .locator('xpath=ancestor::div[.//*[text()="Application status"]][1]');
    await expect(application).toContainText('Interview');
    await seeker.context().close();
});

test('AC-19.1 applications can be filtered by status', async ({ page }) => {
    await openDashboard(page);
    const card = postingCard(page);
    await expandApplications(card);
    const statusFilter = card.getByLabel('Filter by status');

    await statusFilter.selectOption('Rejected');
    await expect(card.getByText('No applications match your filters.')).toBeVisible();
    await expect(card.getByText(worker.fullName, { exact: true })).toBeHidden();

    await statusFilter.selectOption('Interview');
    await expect(applicantCard(card)).toBeVisible();
});

test('AC-19.2 applications can be filtered by submission date', async ({ page }) => {
    // Report the application as submitted ten days ago. Only the browser's copy
    // of the response changes; nothing is written to Supabase.
    const tenDaysAgo = new Date(Date.now() - 10 * DAY_MS).toISOString();
    await page.route('**/rest/v1/applications**', async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();

        const response = await route.fetch();
        const applications: { job_id: string; applied_at: string }[] = await response.json();
        await route.fulfill({
            response,
            json: applications.map((application) =>
                application.job_id === jobId
                    ? { ...application, applied_at: tenDaysAgo }
                    : application,
            ),
        });
    });

    await openDashboard(page);
    const card = postingCard(page);
    await expandApplications(card);
    const dateFilter = card.getByLabel('Filter by date');

    await dateFilter.selectOption('7d');
    await expect(card.getByText('No applications match your filters.')).toBeVisible();

    await dateFilter.selectOption('30d');
    await expect(applicantCard(card)).toBeVisible();
});

test('AC-18.2 / AC-18.3 an archived posting moves to the archived list and is hidden from Workers', async ({
    page,
    browser,
}) => {
    const seeker = await openPage(browser, WORKER_STATE);
    expect(await workerListingCount(seeker)).toBe(1);

    await openDashboard(page);
    await postingCard(page).getByRole('button', { name: 'Archive' }).click();

    // AC-18.2 — it leaves the active list and shows under the archived postings.
    await expect(page.getByText('Posting archived')).toBeVisible();
    await expect(postingCard(page)).toBeHidden();
    await page.getByLabel('Show postings').selectOption('archived');
    await expect(postingCard(page)).toContainText('Archived');

    // AC-18.3 — Workers no longer find it.
    expect(await workerListingCount(seeker)).toBe(0);
    await seeker.context().close();
});

test('AC-18.4 a restored posting returns to the active list as Closed', async ({ page }) => {
    await openDashboard(page);
    await page.getByLabel('Show postings').selectOption('archived');

    await postingCard(page).getByRole('button', { name: 'Restore' }).click();

    await expect(page.getByText('Posting restored')).toBeVisible();
    await expect(postingCard(page)).toBeHidden();
    await page.getByLabel('Show postings').selectOption('active');
    await expect(postingCard(page)).toContainText('Closed');
});
