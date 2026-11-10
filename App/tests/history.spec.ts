import { type Page, type Route, expect, test } from '@playwright/test';

import { WORKER_STATE } from './helpers';

/**
 * US-20 — Application History Dashboard (AC-20.1, AC-20.2)
 * US-21 — Application Analytics (AC-21.1, AC-21.2)
 *
 * The Worker's real applications change from run to run, so these answer the
 * applications request in the browser with a fixed history: two applications
 * submitted today, one Applied and one Interview. Nothing is read from or
 * written to Supabase for them.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

const HISTORY = [
    {
        id: 'e2e-application-1',
        job_id: 'e2e-job-1',
        status: 'Applied',
        applied_at: new Date().toISOString(),
        jobs: {
            title: '[E2E] History posting A',
            company: 'E2E Corp',
            location: 'Montreal',
            job_type: 'Full-time',
        },
    },
    {
        id: 'e2e-application-2',
        job_id: 'e2e-job-2',
        status: 'Interview',
        applied_at: new Date().toISOString(),
        jobs: {
            title: '[E2E] History posting B',
            company: 'E2E Corp',
            location: 'Montreal',
            job_type: 'Internship',
        },
    },
];

/** Opens the Worker's applications page with HISTORY as their applications. */
async function openHistory(page: Page) {
    await page.route('**/rest/v1/applications**', (route: Route) =>
        route.request().method() === 'GET' ? route.fulfill({ json: HISTORY }) : route.fallback(),
    );
    await page.goto('/applications');
    // The chart is drawn empty first, so wait until the history has loaded.
    await expect(page.getByText(`of ${HISTORY.length} applications`)).toBeVisible();
}

test('AC-20.1 the history lists every submitted application with its status', async ({ page }) => {
    await openHistory(page);

    await expect(page.getByText('Showing 2 of 2 applications')).toBeVisible();
    for (const application of HISTORY) {
        const card = page
            .getByRole('heading', { name: application.jobs.title, level: 2 })
            .locator('xpath=ancestor::div[.//a][1]');
        await expect(card).toContainText(application.status);
    }
});

test('AC-20.2 the history can be narrowed to one status', async ({ page }) => {
    await openHistory(page);

    await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('Interview');

    await expect(page.getByText('Showing 1 of 2 applications')).toBeVisible();
    await expect(page.getByRole('heading', { name: HISTORY[1].jobs.title })).toBeVisible();
    await expect(page.getByRole('heading', { name: HISTORY[0].jobs.title })).toHaveCount(0);
});

test('AC-21.1 the history shows applications submitted over the last 30 days', async ({ page }) => {
    await openHistory(page);

    await expect(page.getByRole('heading', { name: 'Application Activity' })).toBeVisible();
    await expect(page.getByText('Applications submitted over the last 30 days')).toBeVisible();
    // One point per day.
    await expect(page.locator('.recharts-line-dot')).toHaveCount(30);
});

test('AC-21.2 the activity chart counts applications on the day they were submitted', async ({
    page,
}) => {
    await openHistory(page);

    const dots = page.locator('.recharts-line-dot');
    await expect(dots).toHaveCount(30);

    // Both applications were submitted today (the last point), none 29 days
    // ago (the first), so today's point sits higher on the chart.
    // The chart animates when the data arrives, so poll until it settles.
    await expect
        .poll(async () => {
            const firstY = Number(await dots.first().getAttribute('cy'));
            const todayY = Number(await dots.last().getAttribute('cy'));
            return todayY < firstY;
        })
        .toBe(true);
});
