import { type Page, type Route, expect, test } from '@playwright/test';

import { WORKER_STATE } from './helpers';

/**
 * US-05 — Job Application Submission (AC-05.1 … AC-05.3)
 * US-06 — Job Application Tracking (AC-06.1, AC-06.2)
 *
 * A Worker can apply to each posting only once, and the suite shares one
 * Worker account, so a real application would use up a posting on every run.
 * The apply tests therefore intercept the insert in the browser: the page runs
 * its real flow and the test checks the request it sends, but nothing is
 * written to Supabase. They also answer the resume list the apply dialog loads,
 * so they do not depend on which resumes the shared Worker account has.
 *
 * AC-06.3 (status changed by a recruiter) has no recruiter screen yet.
 * See Documentation/Acceptance_Tests_Sprint_2.md § 5.
 */

test.use({ storageState: WORKER_STATE });

const APPLY_REQUEST = '**/rest/v1/rpc/apply_to_job**';
const RESUMES_REQUEST = '**/rest/v1/resumes**';

const E2E_RESUMES = [
    { id: 'e2e-resume-1', title: '[E2E] Recent resume', status: 'Active' },
    { id: 'e2e-resume-2', title: '[E2E] Older resume', status: 'Draft' },
];

/** Answers the resume list the apply dialog loads with `resumes`. */
async function mockResumes(page: Page, resumes: object[]) {
    await page.route(RESUMES_REQUEST, (route) =>
        route.request().method() === 'GET'
            ? route.fulfill({
                  status: 200,
                  contentType: 'application/json',
                  body: JSON.stringify(resumes),
              })
            : route.fallback(),
    );
}

/**
 * Opens job postings from the listing until one shows `buttonName`, and returns
 * its id. Which postings the Worker has applied to depends on the shared data,
 * so the test looks for one in the state it needs.
 */
async function openJobWithButton(page: Page, buttonName: string): Promise<string> {
    await page.goto('/jobs');
    const links = page.getByRole('link', { name: 'View' });
    await expect(links.first()).toBeVisible();
    const hrefs = await links.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('href')!),
    );

    for (const href of hrefs) {
        // The button reads "Apply Now" until the page has checked whether the
        // Worker already applied, so wait for that check before reading it.
        const appliedCheck = page.waitForResponse(
            (response) =>
                response.url().includes('/rest/v1/applications') &&
                response.request().method() === 'GET',
        );
        await page.goto(href);
        await appliedCheck;

        const footerButton = page.getByRole('button', {
            name: /^(Apply Now|Applied|Applications closed)$/,
        });
        await expect(footerButton).toBeVisible();
        if ((await footerButton.innerText()) === buttonName) {
            return href.split('/').pop()!.split('?')[0];
        }
    }

    throw new Error(`No job posting shows a "${buttonName}" button for the Worker account.`);
}

/** Answers the apply insert the way Supabase would, without reaching the database. */
function fulfilApply(route: Route, status: number, body: object) {
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

test('AC-05.2 applying shows an explicit confirmation', async ({ page }) => {
    const jobId = await openJobWithButton(page, 'Apply Now');
    await mockResumes(page, E2E_RESUMES);

    let sentJobId: string | undefined;
    await page.route(APPLY_REQUEST, (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        sentJobId = route.request().postDataJSON().target_job_id;
        return fulfilApply(route, 201, {
            id: 'e2e-application',
            job_id: jobId,
            user_id: 'e2e-worker',
            resume_id: E2E_RESUMES[0].id,
            status: 'Applied',
            applied_at: new Date().toISOString(),
        });
    });

    await page.getByRole('button', { name: 'Apply Now' }).click();
    await page.getByRole('button', { name: 'Submit Application' }).click();

    await expect(page.getByText('Your application was submitted successfully.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Applied' })).toBeDisabled();
    expect(sentJobId).toBe(jobId);
});

test('AC-05.3 a second application to the same posting is refused', async ({ page }) => {
    await openJobWithButton(page, 'Apply Now');
    await mockResumes(page, E2E_RESUMES);

    // Supabase rejects a duplicate with a unique-violation error (23505).
    await page.route(APPLY_REQUEST, (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        return fulfilApply(route, 409, {
            code: '23505',
            message: 'duplicate key value violates unique constraint',
            details: null,
            hint: null,
        });
    });

    await page.getByRole('button', { name: 'Apply Now' }).click();
    await page.getByRole('button', { name: 'Submit Application' }).click();

    await expect(page.getByText('You have already applied to this job.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Applied' })).toBeDisabled();
});

test('AC-05.1 the Worker chooses one of their resumes when applying', async ({ page }) => {
    await openJobWithButton(page, 'Apply Now');
    await mockResumes(page, E2E_RESUMES);

    let sentResumeId: string | undefined;
    await page.route(APPLY_REQUEST, (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        sentResumeId = route.request().postDataJSON().target_resume_id;
        return fulfilApply(route, 201, {});
    });

    await page.getByRole('button', { name: 'Apply Now' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Nothing is sent until the Worker confirms a resume
    expect(sentResumeId).toBeUndefined();

    await dialog.getByLabel('Resume').selectOption(E2E_RESUMES[1].id);
    await dialog.getByRole('button', { name: 'Submit Application' }).click();

    await expect(page.getByText('Your application was submitted successfully.')).toBeVisible();
    expect(sentResumeId).toBe(E2E_RESUMES[1].id);
});

test('AC-05.4 a Worker with no resumes is told a resume is required', async ({ page }) => {
    await openJobWithButton(page, 'Apply Now');
    await mockResumes(page, []);

    let applied = false;
    await page.route(APPLY_REQUEST, (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        applied = true;
        return fulfilApply(route, 201, {});
    });

    await page.getByRole('button', { name: 'Apply Now' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('A resume is required to apply.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Submit Application' })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'Create Resume' })).toHaveAttribute(
        'href',
        '/resumes/edit',
    );
    expect(applied).toBe(false);
});

test('AC-06.1 the Worker sees each application with the posting it was for', async ({ page }) => {
    await page.goto('/applications');

    // Requires the Worker account to have applied to at least one posting.
    const cards = page.getByText('Application status').locator('xpath=ancestor::div[.//h2][1]');
    await expect(cards.first()).toBeVisible();

    for (let i = 0; i < (await cards.count()); i++) {
        const card = cards.nth(i);
        await expect(card.getByRole('heading', { level: 2 })).not.toHaveText(
            'Job posting unavailable',
        );
        await expect(card).toContainText('Applied on');
    }
});

test('AC-06.2 each application shows a status from the agreed list', async ({ page }) => {
    await page.goto('/applications');

    const badges = page.getByText('Application status').locator('xpath=following-sibling::*[1]');
    await expect(badges.first()).toBeVisible();

    const allowed = ['Applied', 'Under Review', 'Interview', 'Offered', 'Rejected'];
    for (const status of await badges.allInnerTexts()) {
        expect(allowed).toContain(status.trim());
    }
});
