import { type Browser, type Page, expect, test } from '@playwright/test';

import {
    RECRUITER_STATE,
    WORKER_STATE,
    openNotifications,
    uniqueTitle,
    worker,
    workerApplicationCard,
} from './helpers';

/**
 * US-07 — Application Status Notifications (AC-07.1, AC-07.2)
 * US-11 — New Job Alerts (AC-11.1, AC-11.2)
 * US-12 — Job Expiry Reminders (AC-12.1, AC-12.2)
 * US-22 — Application Status Update Notifications (AC-22.1, AC-22.2)
 * US-23 — Application Deadline Reminders (AC-23.1, AC-23.2)
 * US-24 — New Application Notifications (AC-24.1, AC-24.2)
 *
 * The US-07, US-12 and US-22 – US-24 tests run as one flow on a posting they create:
 * the Recruiter posts it with a deadline two days away, the Worker saves it
 * (deadline reminder) and applies (new application notification), and the
 * Recruiter moves the application to Interview (status notification). The
 * notifications are written by the database (see feature/notification-reminder
 * and App/supabase/migrations/20261116000001_notifications_and_deadlines.sql). At the
 * end the Worker unsaves it and the Recruiter closes it, so Workers no longer
 * see it. The application and the notifications stay, as there is no way to
 * delete an application.
 *
 * The US-11 tests run as a second flow, in a field of interest only this run
 * uses: the Recruiter posts a job in it, the Worker chooses it on Job Alerts,
 * and a second posting in it shows as a notification. At the end the Worker
 * clears the choice and the Recruiter closes both postings.
 *
 * US-12 (job expiry reminders) is the same feature as US-23, so its criteria
 * share the US-23 tests. See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

/** `YYYY-MM-DD`, `days` from today in the local time zone. */
function dateFromToday(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

async function openAs(browser: Browser, storageState: string): Promise<Page> {
    const context = await browser.newContext({ storageState });
    return context.newPage();
}

/** Creates an Open posting as the Recruiter, with a deadline when given. */
async function createPosting(
    recruiter: Page,
    { title, category, deadline }: { title: string; category: string; deadline?: string },
) {
    await recruiter.goto('/jobs/edit');
    await recruiter.getByLabel('Title').fill(title);
    await recruiter.getByLabel('Company').fill('E2E Test Company');
    await recruiter.getByLabel('Status').selectOption('Open');
    await recruiter.getByLabel('Job Type').selectOption('Contract');
    await recruiter.getByLabel('Location').fill('Remote');
    await recruiter.getByLabel('Category').fill(category);
    if (deadline) await recruiter.getByLabel('Application Deadline').fill(deadline);
    await recruiter.getByLabel('Description').fill('Created by the acceptance test suite.');
    await recruiter.getByRole('button', { name: 'Create Job Posting' }).click();
    await expect(recruiter).toHaveURL('/jobs');
}

/** Opens a posting from the Worker's job search and returns its id. */
async function openPostingAsWorker(seeker: Page, title: string): Promise<string> {
    await seeker.goto(`/jobs?keyword=${encodeURIComponent(title)}`);
    await seeker
        .getByRole('heading', { name: title, exact: true })
        .locator('xpath=ancestor::div[.//a[starts-with(@href, "/jobs/")]][1]')
        .getByRole('link', { name: 'View' })
        .click();
    await expect(seeker).toHaveURL(/\/jobs\/[^/?]+/);
    return new URL(seeker.url()).pathname.split('/')[2];
}

/** Closes a posting as the Recruiter, so Workers no longer see it. */
async function closePosting(recruiter: Page, jobId: string, title: string) {
    await recruiter.goto(`/jobs/edit?id=${jobId}`);
    await expect(recruiter.getByLabel('Title')).toHaveValue(title);
    await recruiter.getByLabel('Status').selectOption('Closed');
    await recruiter.getByRole('button', { name: 'Save Changes' }).click();
    await expect(recruiter).toHaveURL('/jobs');
}

test('AC-07.1 the header has a notifications button', async ({ page }) => {
    await page.goto('/');

    await expect(
        page.locator('header').getByRole('button', { name: 'Notifications' }),
    ).toBeVisible();
});

test.describe('Recruiter accounts', () => {
    test.use({ storageState: RECRUITER_STATE });

    test('AC-24.1 the Recruiter header has a notifications button', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.locator('header').getByRole('button', { name: 'Notifications' }),
        ).toBeVisible();
    });
});

test.describe.serial('Notifications for a posting', () => {
    const title = uniqueTitle('Posting notifications');
    const deadline = dateFromToday(2);
    let recruiter: Page;
    let seeker: Page;
    let jobId: string | undefined;

    test.beforeAll(async ({ browser }) => {
        recruiter = await openAs(browser, RECRUITER_STATE);
        seeker = await openAs(browser, WORKER_STATE);
    });

    test.afterAll(async () => {
        if (jobId) {
            // Unsave it, so the Worker's saved jobs are left as they were.
            await seeker.goto(`/jobs/${jobId}`);
            const saved = seeker.getByRole('button', { name: 'Saved', exact: true });
            if (await saved.isVisible({ timeout: 10_000 }).catch(() => false)) {
                await saved.click();
                await expect(seeker.getByRole('button', { name: 'Save job' })).toBeVisible();
            }

            await closePosting(recruiter, jobId, title);
        }
        await recruiter.context().close();
        await seeker.context().close();
    });

    test('AC-23.1 / AC-12.1 a posting can be given an application deadline', async () => {
        await createPosting(recruiter, { title, category: 'Software Engineering', deadline });

        // The Worker sees the deadline on the posting.
        jobId = await openPostingAsWorker(seeker, title);
        await expect(seeker.getByText(/^Application deadline /)).toBeVisible();
    });

    test('AC-23.2 / AC-12.2 an upcoming application deadline shows as a reminder', async () => {
        await seeker.goto(`/jobs/${jobId}`);
        await seeker.getByRole('button', { name: 'Save job' }).click();
        await expect(seeker.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();

        const list = await openNotifications(seeker);
        await expect(
            list
                .getByRole('listitem')
                .filter({ hasText: title })
                .filter({ hasText: 'Saved job expiring soon' }),
        ).toContainText(/is in 2 days|is tomorrow|is today/);
    });

    test('AC-24.2 a new application shows as a notification for the Recruiter', async () => {
        await seeker.goto(`/jobs/${jobId}`);
        await seeker.getByRole('button', { name: 'Apply Now' }).click();
        await expect(seeker.getByRole('button', { name: 'Applied' })).toBeVisible();

        const list = await openNotifications(recruiter);
        await list.getByText(`${worker.fullName} applied to ${title}.`).click();
        await expect(recruiter).toHaveURL(`/applications?job=${jobId}`);
    });

    test('AC-22.1 an interview invitation shows as a notification', async () => {
        await recruiter.goto(`/applications?job=${jobId}`);
        await workerApplicationCard(recruiter)
            .getByLabel('Application status')
            .selectOption('Interview');
        await expect(recruiter.getByText('Application marked as Interview.')).toBeVisible();

        const list = await openNotifications(seeker);
        await expect(
            list.getByText(`Your application for ${title} at E2E Test Company is now Interview.`),
        ).toBeVisible();
    });

    test('AC-07.2 a status change notification names the new status', async () => {
        const list = await openNotifications(seeker);
        const notification = list
            .getByRole('listitem')
            .filter({ hasText: title })
            .filter({ hasText: 'Application status updated' });

        await expect(notification).toContainText('is now Interview.');
    });

    test('AC-22.2 opening a status notification shows the application', async () => {
        const list = await openNotifications(seeker);
        await list
            .getByRole('listitem')
            .filter({ hasText: title })
            .getByText('Application status updated')
            .click();

        await expect(seeker).toHaveURL('/applications');
        await expect(seeker.getByRole('heading', { name: title, exact: true })).toBeVisible();
    });
});

test.describe.serial('Job alerts for a field of interest', () => {
    // A field only this run uses, so the alert can only come from this flow.
    const category = uniqueTitle('Alert field');
    const firstTitle = uniqueTitle('Alert posting');
    const alertTitle = `${firstTitle} matching`;
    const postings: { id: string; title: string }[] = [];
    let recruiter: Page;
    let seeker: Page;

    test.beforeAll(async ({ browser }) => {
        recruiter = await openAs(browser, RECRUITER_STATE);
        seeker = await openAs(browser, WORKER_STATE);
    });

    test.afterAll(async () => {
        // Clear the choice while the field is still listed (only fields of
        // Open postings are), then close the postings.
        if (postings.length > 0) {
            await seeker.goto('/job-alerts');
            const field = seeker.getByRole('checkbox', { name: category });
            if (await field.isChecked({ timeout: 10_000 }).catch(() => false)) {
                // Controlled checkbox: it changes once the choice is saved.
                await field.click();
                await expect(field).not.toBeChecked();
                await expect(field).toBeEnabled();
            }
        }
        for (const posting of postings) await closePosting(recruiter, posting.id, posting.title);
        await recruiter.context().close();
        await seeker.context().close();
    });

    test('AC-11.1 a Worker can choose fields of interest for job alerts', async () => {
        await createPosting(recruiter, { title: firstTitle, category });
        postings.push({ id: await openPostingAsWorker(seeker, firstTitle), title: firstTitle });

        await seeker.goto('/job-alerts');
        const field = seeker.getByRole('checkbox', { name: category });
        // Controlled checkbox: it changes once the choice is saved.
        await field.click();
        await expect(field).toBeChecked();
        // Saving disables the choices until it is done.
        await expect(field).toBeEnabled();

        // The choice is saved.
        await seeker.reload();
        await expect(seeker.getByRole('checkbox', { name: category })).toBeChecked();
    });

    test('AC-11.2 a new posting in a chosen field shows as a notification', async () => {
        await createPosting(recruiter, { title: alertTitle, category });
        postings.push({ id: await openPostingAsWorker(seeker, alertTitle), title: alertTitle });

        const list = await openNotifications(seeker);
        await expect(
            list
                .getByRole('listitem')
                .filter({ hasText: alertTitle })
                .filter({ hasText: 'New job matching your interests' }),
        ).toContainText(`has been posted in ${category}.`);
    });
});
