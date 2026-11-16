import { type Page, expect, test } from '@playwright/test';

import {
    RECRUITER_STATE,
    WORKER_STATE,
    createResume,
    resumeCard,
    resumeSection,
    uniqueTitle,
} from './helpers';

/**
 * US-25 — AI-Powered Resume Feedback (AC-25.1 … AC-25.3)
 * US-26 — AI Job Matching Suggestions (AC-26.1, AC-26.2)
 *
 * AC-25.2 and AC-25.3 ask Google Gemini for real feedback, so they need
 * GEMINI_API_KEY (in App/.env locally, a repository secret in CI) and are
 * skipped without it. They create their own resume and delete it afterwards.
 * AC-26.2 also needs the key; it creates a matching posting and resume, then
 * closes the posting and deletes the resume.
 * See Documentation/Acceptance_Tests_Sprint_2.md.
 */

test.use({ storageState: WORKER_STATE });

const NEEDS_KEY = 'Needs GEMINI_API_KEY to call Gemini.';

/**
 * A small, valid one-page PDF with the given lines of text. The AI rejects
 * malformed PDFs, so the byte offsets in the cross-reference table are real.
 */
function resumePdf(lines: string[]) {
    const escape = (text: string) => text.replace(/[\\()]/g, (c) => `\\${c}`);
    const stream = [
        'BT /F1 12 Tf 72 720 Td 16 TL',
        ...lines.map((line) => `(${escape(line)}) '`),
        'ET',
    ].join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = objects.map((body, index) => {
        const offset = Buffer.byteLength(pdf);
        pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
        return offset;
    });
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

    return Buffer.from(pdf);
}

/** Deletes a resume through its card, confirming in the dialog. */
async function deleteResume(page: Page, title: string) {
    await page.goto('/resumes');
    await resumeCard(page, title).getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete resume' }).click();
    await expect(page.getByText('Resume deleted.')).toBeVisible();
}

/** Opens the feedback dialog for a resume and waits for the AI's answer. */
async function getFeedback(page: Page, title: string) {
    await resumeCard(page, title).getByRole('button', { name: 'Get AI feedback' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: `AI feedback for ${title}` })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Suggestions for improvement' })).toBeVisible({
        timeout: 90_000,
    });
    return dialog;
}

test('AC-25.1 a Worker can ask for AI feedback on a resume', async ({ page }) => {
    const title = uniqueTitle('Feedback button');
    await createResume(page, title);

    try {
        await resumeCard(page, title).getByRole('button', { name: 'Get AI feedback' }).click();

        const dialog = page.getByRole('dialog');
        await expect(
            dialog.getByRole('heading', { name: `AI feedback for ${title}` }),
        ).toBeVisible();
        // Either the review starts, or the page says AI is not set up.
        await expect(
            dialog.getByText('Reviewing your resume…').or(dialog.getByRole('alert')),
        ).toBeVisible();
    } finally {
        await deleteResume(page, title);
    }
});

test('AC-25.2 the AI feedback lists suggestions for improvement', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, NEEDS_KEY);
    test.setTimeout(150_000);
    const title = uniqueTitle('Feedback');

    // A deliberately thin resume, so there is clearly something to improve.
    await page.goto('/resumes/edit');
    await page.locator('fieldset').first().getByLabel('Title').fill(title);
    await page.getByLabel('Summary').fill('Student looking for a job.');
    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');

    try {
        const dialog = await getFeedback(page, title);

        await expect(dialog.getByRole('heading', { name: 'Overall' })).toBeVisible();
        const suggestions = dialog.getByRole('list', { name: 'Suggestions' }).getByRole('listitem');
        expect(await suggestions.count()).toBeGreaterThanOrEqual(1);
        // Each suggestion carries a priority.
        await expect(suggestions.first()).toContainText(/High|Medium|Low/);
    } finally {
        await page.keyboard.press('Escape');
        await deleteResume(page, title);
    }
});

test('AC-25.3 an uploaded PDF resume is reviewed from the file', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, NEEDS_KEY);
    test.setTimeout(150_000);
    const title = uniqueTitle('PDF feedback');

    await page.goto('/resumes');
    await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles({
            name: `${title}.pdf`,
            mimeType: 'application/pdf',
            buffer: resumePdf([
                'Alex Martin - alex.martin@example.com',
                'Education: BEng Software Engineering, Concordia University, 2023 - present',
                'Experience: Cashier, Corner Market, 2022 - 2023. Handled the till.',
                'Skills: Java, Git',
            ]),
        });
    await expect(page.getByText('Resume uploaded.')).toBeVisible();

    try {
        const dialog = await getFeedback(page, title);

        // The note under the feedback says the file itself was read.
        await expect(dialog.getByText(/from your resume file and fields/)).toBeVisible();
        expect(
            await dialog.getByRole('list', { name: 'Suggestions' }).getByRole('listitem').count(),
        ).toBeGreaterThanOrEqual(1);
    } finally {
        await page.keyboard.press('Escape');
        await deleteResume(page, title);
    }
});

test('AC-26.1 the jobs page recommends postings for the Worker', async ({ page }) => {
    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible();
});

test('AC-26.2 each recommendation says why it matches the Worker', async ({ page, browser }) => {
    test.skip(!process.env.GEMINI_API_KEY, NEEDS_KEY);
    // Up to three Gemini answers, plus creating and cleaning up the test data.
    test.setTimeout(240_000);
    const resumeTitle = uniqueTitle('Matching');
    const postingTitle = uniqueTitle('Posting React Native developer');
    const recruiter = await (await browser.newContext({ storageState: RECRUITER_STATE })).newPage();

    // A posting and a resume that clearly fit each other.
    await recruiter.goto('/jobs/edit');
    await recruiter.getByLabel('Title').fill(postingTitle);
    await recruiter.getByLabel('Company').fill('E2E Test Company');
    await recruiter.getByLabel('Status').selectOption('Open');
    await recruiter.getByLabel('Job Type').selectOption('Internship');
    await recruiter.getByLabel('Location').fill('Montreal');
    await recruiter.getByLabel('Category').fill('Software Engineering');
    await recruiter
        .getByLabel('Description')
        .fill('Build our mobile app with React Native and TypeScript. Created by the test suite.');
    await recruiter.getByRole('button', { name: 'Create Job Posting' }).click();
    await expect(recruiter).toHaveURL('/jobs');

    await page.goto('/resumes/edit');
    await page.locator('fieldset').first().getByLabel('Title').fill(resumeTitle);
    await page
        .getByLabel('Summary')
        .fill(
            'Software engineering student who builds mobile apps with React Native and TypeScript.',
        );
    const skills = resumeSection(page, 'Skills');
    await skills.getByRole('button', { name: 'Add' }).click();
    await skills.getByLabel('Name').fill('React Native');
    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');

    try {
        // A fresh browser context, so no recommendations are cached yet.
        await page.goto('/jobs');
        const card = page.getByRole('region', { name: 'Recommended for you' });
        const finding = card.getByText('Finding postings that match your resume…');
        const recommendations = card.getByRole('list', { name: 'Recommended jobs' });
        await expect(card).toBeVisible();

        // Gemini (free tier) is sometimes busy or answers with no match, which
        // shows a warning or an empty state instead of the list: ask again, up
        // to twice, with the card's refresh button.
        for (let attempt = 1; attempt <= 3; attempt++) {
            await expect(finding).toBeHidden({ timeout: 60_000 });
            if (attempt === 3 || (await recommendations.isVisible())) break;
            await card.getByRole('button', { name: 'Refresh recommendations' }).click();
            await expect(finding)
                .toBeVisible({ timeout: 2_000 })
                .catch(() => {});
        }
        await expect(recommendations).toBeVisible();

        const items = recommendations.getByRole('listitem');
        expect(await items.count()).toBeGreaterThanOrEqual(1);
        for (const item of await items.all()) {
            await expect(item).toContainText(/Why it matches your profile: \S+/);
            await expect(item).toContainText(/(Strong|Good) match/);
        }
    } finally {
        await deleteResume(page, resumeTitle);

        // Close the posting, so Workers no longer see it.
        await recruiter.goto('/jobs');
        const card = recruiter
            .getByRole('heading', { name: postingTitle, exact: true })
            .locator('xpath=ancestor::div[.//a[starts-with(@href, "/jobs/edit?id=")]][1]');
        await card.getByRole('link', { name: 'Edit' }).click();
        await expect(recruiter.getByLabel('Title')).toHaveValue(postingTitle);
        await recruiter.getByLabel('Status').selectOption('Closed');
        await recruiter.getByRole('button', { name: 'Save Changes' }).click();
        await expect(recruiter).toHaveURL('/jobs');
        await recruiter.context().close();
    }
});
