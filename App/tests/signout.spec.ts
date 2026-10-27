import { expect, test } from '@playwright/test';

import { WORKER_STATE, signIn, signOut, worker } from './helpers';

/**
 * Foundation — Sign out (AC-A.11)
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 *
 * The app's Logout calls Supabase's signOut() with the default "global" scope,
 * which ends every session of the account. The Worker account is shared by
 * every test run (CI and local), so a global sign-out here would log out the
 * other runs mid-test. The test switches that one request to the "local" scope
 * so only this browser's session ends; the user-facing flow is unchanged.
 *
 * This run's other specs reuse the same stored session, so the Worker is signed
 * back in and the stored session replaced once the criterion is checked.
 */

test.use({ storageState: WORKER_STATE });

test('AC-A.11 a signed-in user can sign out from the avatar menu', async ({ page }) => {
    await page.route('**/auth/v1/logout**', (route) => {
        const url = new URL(route.request().url());
        url.searchParams.set('scope', 'local');
        return route.continue({ url: url.toString() });
    });

    await page.goto('/');
    await signOut(page);

    // The session is gone, so a protected route bounces back to sign-in.
    await page.goto('/');
    await expect(page).toHaveURL('/signin');

    await signIn(page, worker.email, worker.password);
    await page.context().storageState({ path: WORKER_STATE });
});
