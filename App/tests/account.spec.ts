import { expect, test } from '@playwright/test';

import { WORKER_STATE, avatarMenu, worker } from './helpers';

/**
 * US-01 — User Profile Management (AC-01.1 … AC-01.4)
 * AC-01.5 (edit and save a profile) and AC-01.6 (change the avatar) are not
 * implemented and so have no test here.
 * See Documentation/Acceptance_Tests_Sprint_2.md § 5.
 */

test.use({ storageState: WORKER_STATE });

test('AC-01.1 the account page shows each profile field under its own label', async ({ page }) => {
    await page.goto('/account');

    for (const label of ['First Name', 'Last Name', 'Email', 'Phone', 'Postal Code']) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    await expect(page.getByText(worker.firstName, { exact: true })).toBeVisible();
    await expect(page.getByText(worker.lastName, { exact: true })).toBeVisible();
    await expect(page.getByText(worker.email, { exact: true })).toBeVisible();
});

test('AC-01.2 the account page shows the account type', async ({ page }) => {
    await page.goto('/account');

    await expect(page.getByText('Worker', { exact: true })).toBeVisible();
});

test('AC-01.3 the avatar falls back to the user initials', async ({ page }) => {
    await page.goto('/account');

    // Scoped to the page's own <main>: the header avatar shows the same
    // initials on every page and would otherwise satisfy the check.
    const initials = `${worker.firstName[0]}${worker.lastName[0]}`;
    await expect(page.locator('main main').getByText(initials, { exact: true })).toBeVisible();
});

test('AC-01.4 the avatar menu shows the full name', async ({ page }) => {
    await page.goto('/');
    await avatarMenu(page).click();

    await expect(page.getByRole('menuitem', { name: worker.fullName })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Account' })).toBeVisible();
});
