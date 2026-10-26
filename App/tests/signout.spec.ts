import { expect, test } from '@playwright/test';

import { WORKER_STATE, signIn, signOut, worker } from './helpers';

/**
 * Foundation — Sign out (AC-A.11)
 * See Documentation/Acceptance_Tests_Sprint_2.md section 4.
 *
 * Supabase's signOut() ends every session of the account, including the one
 * stored by auth.setup.ts that the other specs reuse, so the Worker is signed
 * back in and the stored session replaced once the criterion is checked.
 */

test.use({ storageState: WORKER_STATE });

test('AC-A.11 a signed-in user can sign out from the avatar menu', async ({ page }) => {
    await page.goto('/');
    await signOut(page);

    // The session is gone, so a protected route bounces back to sign-in.
    await page.goto('/');
    await expect(page).toHaveURL('/signin');

    await signIn(page, worker.email, worker.password);
    await page.context().storageState({ path: WORKER_STATE });
});
