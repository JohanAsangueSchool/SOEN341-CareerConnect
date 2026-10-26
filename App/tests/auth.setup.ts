import { test as setup } from '@playwright/test';

import { RECRUITER_STATE, WORKER_STATE, recruiter, signIn, worker } from './helpers';

// Signing in once per role and reusing the stored session keeps the rest of the
// suite from repeating the login flow for every test.

setup('authenticate as a Worker', async ({ page }) => {
    await signIn(page, worker.email, worker.password);
    await page.context().storageState({ path: WORKER_STATE });
});

setup('authenticate as a Recruiter', async ({ page }) => {
    await signIn(page, recruiter.email, recruiter.password);
    await page.context().storageState({ path: RECRUITER_STATE });
});
