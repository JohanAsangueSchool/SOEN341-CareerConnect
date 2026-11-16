import { type Page, expect, test } from '@playwright/test';

import { NOT_BUILT_TIMEOUT, WORKER_STATE, createResume, resumeCard, uniqueTitle } from './helpers';

/**
 * US-25 — AI-Powered Resume Feedback (AC-25.1 … AC-25.3)
 * US-26 — AI Job Matching Suggestions (AC-26.1, AC-26.2)
 *
 * AC-25.2 and AC-25.3 ask Google Gemini for real feedback, so they need
 * GEMINI_API_KEY (in App/.env locally, a repository secret in CI) and are
 * skipped without it. They create their own resume and delete it afterwards.
 * US-26 is not built yet: its tests are expected failures.
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
    test.fail();

    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});

test('AC-26.2 each recommendation says why it matches the Worker', async ({ page }) => {
    test.fail();

    await page.goto('/jobs');

    await expect(page.getByText(/matches your (profile|resume|skills)/i).first()).toBeVisible({
        timeout: NOT_BUILT_TIMEOUT,
    });
});
