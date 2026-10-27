import { type Page, expect, test } from '@playwright/test';

import { WORKER_STATE, createResume, resumeCard, resumeSection, uniqueTitle } from './helpers';

/**
 * US-02 — Resume Management (AC-02.1, AC-02.2, AC-02.4 … AC-02.15)
 *
 * AC-02.3 (the "No resumes yet" empty state) is verified manually: the account
 * must have zero resumes, and there is no delete function yet (AC-02.18), so it
 * cannot be restored once this suite has run.
 *
 * AC-02.16 … AC-02.18 cover file upload, replacement and deletion, none of
 * which are implemented. See Documentation/Acceptance_Tests_Sprint_2.md § 5.
 */

test.use({ storageState: WORKER_STATE });

/**
 * The resume's own Title field. Scoped to the first fieldset because the
 * Projects section also has a field labelled "Title".
 */
function titleField(page: Page) {
    return page.locator('fieldset').first().getByLabel('Title');
}

/** Random letters, so a title is unique without introducing digits. */
function letterSuffix(): string {
    return (
        Math.random()
            .toString(36)
            .replace(/[^a-z]/g, '')
            .slice(0, 6) || 'abcdef'
    );
}

async function addRow(page: Page, section: string) {
    await resumeSection(page, section).getByRole('button', { name: 'Add' }).click();
}

test('AC-02.1 a Worker can create a resume and it appears in the list', async ({ page }) => {
    const title = uniqueTitle('Create');

    await createResume(page, title);
});

test('AC-02.2 a newly created resume shows a Draft badge', async ({ page }) => {
    const title = uniqueTitle('Draft');

    await createResume(page, title);

    await expect(resumeCard(page, title)).toContainText('Draft');
});

test('AC-02.4 an empty title is rejected', async ({ page }) => {
    await page.goto('/resumes/edit');
    await page.getByRole('button', { name: 'Create Resume' }).click();

    await expect(page.getByText('Title is required.')).toBeVisible();
    await expect(page).toHaveURL('/resumes/edit');
});

test('AC-02.5 an education entry persists after saving', async ({ page }) => {
    const title = uniqueTitle('Education');

    await page.goto('/resumes/edit');
    await titleField(page).fill(title);
    await addRow(page, 'Education');

    const education = resumeSection(page, 'Education');
    await education.getByLabel('Establishment').fill('Concordia University');
    await education.getByLabel('Program').fill('Software Engineering');
    await education.getByLabel('Start Month').fill('2024-09');

    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');

    // Reopen it to confirm the entry was stored, not just accepted.
    await resumeCard(page, title).getByRole('link', { name: 'Edit' }).click();
    await expect(resumeSection(page, 'Education').getByLabel('Establishment')).toHaveValue(
        'Concordia University',
    );
});

test('AC-02.6 an education entry without an establishment is rejected', async ({ page }) => {
    await page.goto('/resumes/edit');
    await titleField(page).fill(uniqueTitle('EducationInvalid'));
    await addRow(page, 'Education');

    const education = resumeSection(page, 'Education');
    await education.getByLabel('Program').fill('Software Engineering');
    await education.getByLabel('Start Month').fill('2024-09');

    await page.getByRole('button', { name: 'Create Resume' }).click();

    await expect(page.getByText('Education establishment is required')).toBeVisible();
    await expect(page).toHaveURL('/resumes/edit');
});

test('AC-02.7 a work experience entry persists after saving', async ({ page }) => {
    const title = uniqueTitle('Experience');

    await page.goto('/resumes/edit');
    await titleField(page).fill(title);
    await addRow(page, 'Experience');

    const experience = resumeSection(page, 'Experience');
    await experience.getByLabel('Establishment').fill('Acme Corp');
    await experience.getByLabel('Position').fill('Backend Developer');
    await experience.getByLabel('Start Month').fill('2025-05');

    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');

    await resumeCard(page, title).getByRole('link', { name: 'Edit' }).click();
    await expect(resumeSection(page, 'Experience').getByLabel('Position')).toHaveValue(
        'Backend Developer',
    );
});

test('AC-02.8 a work experience entry without a position is rejected', async ({ page }) => {
    await page.goto('/resumes/edit');
    await titleField(page).fill(uniqueTitle('ExperienceInvalid'));
    await addRow(page, 'Experience');

    const experience = resumeSection(page, 'Experience');
    await experience.getByLabel('Establishment').fill('Acme Corp');
    await experience.getByLabel('Start Month').fill('2025-05');

    await page.getByRole('button', { name: 'Create Resume' }).click();

    await expect(page.getByText('Work position is required')).toBeVisible();
    await expect(page).toHaveURL('/resumes/edit');
});

test('AC-02.9 a skill without a name is rejected', async ({ page }) => {
    await page.goto('/resumes/edit');
    await titleField(page).fill(uniqueTitle('SkillInvalid'));
    await addRow(page, 'Skills');

    await page.getByRole('button', { name: 'Create Resume' }).click();

    await expect(page.getByText('Skill name is required')).toBeVisible();
    await expect(page).toHaveURL('/resumes/edit');
});

test('AC-02.10 a project with an invalid link is rejected', async ({ page }) => {
    await page.goto('/resumes/edit');
    await titleField(page).fill(uniqueTitle('ProjectInvalid'));
    await addRow(page, 'Projects');

    const projects = resumeSection(page, 'Projects');
    await projects.getByLabel('Title').fill('Portfolio');
    const link = projects.getByLabel('Link');
    await link.fill('notaurl');

    await page.getByRole('button', { name: 'Create Resume' }).click();

    // The field is type="url", so the browser rejects the value with its own
    // message before the form's schema runs (z.url() accepts anything the
    // browser does, so the schema's "Invalid URL" is never reached).
    expect(await link.evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
    expect(await link.evaluate((el: HTMLInputElement) => el.validationMessage)).not.toBe('');
    await expect(page).toHaveURL('/resumes/edit');
});

test('AC-02.11 an entry can be removed', async ({ page }) => {
    const title = uniqueTitle('Remove');

    await page.goto('/resumes/edit');
    await titleField(page).fill(title);
    await addRow(page, 'Skills');
    await addRow(page, 'Skills');
    await resumeSection(page, 'Skills').getByLabel('Name').nth(0).fill('Removed skill');
    await resumeSection(page, 'Skills').getByLabel('Name').nth(1).fill('Kept skill');
    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');

    // Remove the first skill from the saved resume and save again.
    await resumeCard(page, title).getByRole('link', { name: 'Edit' }).click();
    const skills = resumeSection(page, 'Skills');
    await expect(skills.getByLabel('Name')).toHaveCount(2);
    await skills.getByRole('button', { name: 'Remove' }).first().click();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page).toHaveURL('/resumes');

    // Reopen it: only the kept skill is stored.
    await resumeCard(page, title).getByRole('link', { name: 'Edit' }).click();
    await expect(resumeSection(page, 'Skills').getByLabel('Name')).toHaveCount(1);
    await expect(resumeSection(page, 'Skills').getByLabel('Name')).toHaveValue('Kept skill');
});

test('AC-02.12 opening an existing resume pre-fills its fields', async ({ page }) => {
    const title = uniqueTitle('Prefill');

    await page.goto('/resumes/edit');
    await titleField(page).fill(title);
    await page.getByLabel('Summary').fill('A short professional summary.');
    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');

    await resumeCard(page, title).getByRole('link', { name: 'Edit' }).click();

    await expect(titleField(page)).toHaveValue(title);
    await expect(page.getByLabel('Summary')).toHaveValue('A short professional summary.');
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
});

test('AC-02.13 a status change is reflected on the resumes list', async ({ page }) => {
    const title = uniqueTitle('Status');

    await createResume(page, title);
    await expect(resumeCard(page, title)).toContainText('Draft');

    await resumeCard(page, title).getByRole('link', { name: 'Edit' }).click();
    await page.getByLabel('Status').selectOption('Active');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page).toHaveURL('/resumes');

    await expect(resumeCard(page, title)).toContainText('Active');
});

test('AC-02.14 an entry with no end month saves as ongoing', async ({ page }) => {
    const title = uniqueTitle('Ongoing');

    await page.goto('/resumes/edit');
    await titleField(page).fill(title);
    await addRow(page, 'Education');

    const education = resumeSection(page, 'Education');
    await education.getByLabel('Establishment').fill('Concordia University');
    await education.getByLabel('Program').fill('Software Engineering');
    await education.getByLabel('Start Month').fill('2024-09');
    // End Month deliberately left empty.

    await page.getByRole('button', { name: 'Create Resume' }).click();

    await expect(page).toHaveURL('/resumes');
    await expect(resumeCard(page, title)).toBeVisible();
});

test('AC-02.15 a resume card shows its section counts', async ({ page }) => {
    // A digit-free title, so the counts are the only numbers in the card body.
    const title = `[E2E] Counts ${letterSuffix()}`;

    await page.goto('/resumes/edit');
    await titleField(page).fill(title);

    await addRow(page, 'Education');
    const education = resumeSection(page, 'Education');
    await education.getByLabel('Establishment').fill('Concordia University');
    await education.getByLabel('Program').fill('Software Engineering');
    await education.getByLabel('Start Month').fill('2024-09');

    await addRow(page, 'Experience');
    const experience = resumeSection(page, 'Experience');
    await experience.getByLabel('Establishment').fill('Acme Corp');
    await experience.getByLabel('Position').fill('Backend Developer');
    await experience.getByLabel('Start Month').fill('2025-05');

    await addRow(page, 'Skills');
    await resumeSection(page, 'Skills').getByLabel('Name').fill('TypeScript');

    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');

    // Each count sits next to its section icon: 1 education, 1 experience,
    // 1 skill, 0 projects — in that order. The Edit button also has an icon.
    const counts = resumeCard(page, title).locator('svg').locator('xpath=..').filter({ hasNotText: 'Edit' });
    await expect(counts).toHaveText(['1', '1', '1', '0']);
});
