import { type Page, expect, test } from '@playwright/test';

import { NOT_BUILT_TIMEOUT, WORKER_STATE, openFirstJob } from './helpers';

/**
 * US-07 — Application Status Notifications (AC-07.1, AC-07.2)
 * US-11 — New Job Alerts (AC-11.1, AC-11.2)
 * US-12 — Job Expiry Reminders (AC-12.1, AC-12.2)
 *
 * Not built yet: every test is an expected failure. Remove test.fail() once a
 * feature exists, adjusting the selectors to the real page if needed.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

/** Opens the notifications list from the header. */
async function openNotifications(page: Page) {
    await page.goto('/');
    await page
        .locator('header')
        .getByRole('button', { name: 'Notifications' })
        .click({ timeout: NOT_BUILT_TIMEOUT });
}

test('AC-07.1 the header has a notifications button', async ({ page }) => {
    test.fail();

    await page.goto('/');

    await expect(page.locator('header').getByRole('button', { name: 'Notifications' })).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});

test('AC-07.2 a status change notification names the new status', async ({ page }) => {
    test.fail();

    await openNotifications(page);

    await expect(
        page.getByText(/status changed to (Applied|Under Review|Interview|Offered|Rejected)/i).first(),
    ).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-11.1 a Worker can choose fields of interest for job alerts', async ({ page }) => {
    test.fail();

    await page.goto('/account');

    await expect(page.getByLabel('Fields of interest')).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-11.2 a new posting in a chosen field shows as a notification', async ({ page }) => {
    test.fail();

    await openNotifications(page);

    await expect(page.getByText(/new job/i).first()).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-12.1 a job posting shows its application deadline', async ({ page }) => {
    test.fail();

    await openFirstJob(page);

    await expect(page.getByText(/deadline/i).first()).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});

test('AC-12.2 a saved job about to expire shows as a notification', async ({ page }) => {
    test.fail();

    await openNotifications(page);

    await expect(page.getByText(/expires/i).first()).toBeVisible({ timeout: NOT_BUILT_TIMEOUT });
});
