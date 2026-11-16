import { type Browser, type Page, expect, test } from '@playwright/test';

import {
    NOT_BUILT_TIMEOUT,
    RECRUITER_STATE,
    WORKER_STATE,
    openFirstJob,
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
 * The US-07 and US-22 – US-24 tests run as one flow on a posting they create:
 * the Recruiter posts it with a deadline two days away, the Worker saves it
 * (deadline reminder) and applies (new application notification), and the
 * Recruiter moves the application to Interview (status notification). The
 * notifications are written by the database (see feature/notification-reminder
 * and App/supabase/migrations/20261116000001_notifications_and_deadlines.sql). At the
 * end the Worker unsaves it and the Recruiter closes it, so Workers no longer
 * see it. The application and the notifications stay, as there is no way to
 * delete an application.
 *
 * US-11 and US-12 are not built yet: their tests are expected failures.
 * Remove test.fail() once a feature exists, adjusting the selectors if needed.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
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

            // Close it, so Workers no longer see it.
            await recruiter.goto(`/jobs/edit?id=${jobId}`);
            await expect(recruiter.getByLabel('Title')).toHaveValue(title);
            await recruiter.getByLabel('Status').selectOption('Closed');
            await recruiter.getByRole('button', { name: 'Save Changes' }).click();
            await expect(recruiter).toHaveURL('/jobs');
        }
        await recruiter.context().close();
        await seeker.context().close();
    });

    test('AC-23.1 a posting can be given an application deadline', async () => {
        await recruiter.goto('/jobs/edit');
        await recruiter.getByLabel('Title').fill(title);
        await recruiter.getByLabel('Company').fill('E2E Test Company');
        await recruiter.getByLabel('Status').selectOption('Open');
        await recruiter.getByLabel('Job Type').selectOption('Contract');
        await recruiter.getByLabel('Location').fill('Remote');
        await recruiter.getByLabel('Category').fill('Software Engineering');
        await recruiter.getByLabel('Application Deadline').fill(deadline);
        await recruiter.getByLabel('Description').fill('Created by the acceptance test suite.');
        await recruiter.getByRole('button', { name: 'Create Job Posting' }).click();
        await expect(recruiter).toHaveURL('/jobs');

        // The Worker sees the deadline on the posting.
        await seeker.goto(`/jobs?keyword=${encodeURIComponent(title)}`);
        await seeker
            .getByRole('heading', { name: title, exact: true })
            .locator('xpath=ancestor::div[.//a[starts-with(@href, "/jobs/")]][1]')
            .getByRole('link', { name: 'View' })
            .click();
        await expect(seeker).toHaveURL(/\/jobs\/[^/?]+/);
        jobId = new URL(seeker.url()).pathname.split('/')[2];
        await expect(seeker.getByText(/^Application deadline /)).toBeVisible();
    });

    test('AC-23.2 an upcoming application deadline shows as a reminder', async () => {
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

test('AC-11.1 a Worker can choose fields of interest for job alerts', async ({ page }) => {
    test.fail();

    await page.goto('/account');

    await expect(page.getByLabel('Fields of interest')).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-11.2 a new posting in a chosen field shows as a notification', async ({ page }) => {
    test.fail();

    const list = await openNotifications(page);

    await expect(list.getByText(/new job/i).first()).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-12.1 a job posting shows its application deadline', async ({ page }) => {
    test.fail();

    await openFirstJob(page);

    await expect(page.getByText(/deadline/i).first()).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-12.2 a saved job about to expire shows as a notification', async ({ page }) => {
    test.fail();

    const list = await openNotifications(page);

    await expect(list.getByText(/expires/i).first()).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});
