import { type Locator, type Page, expect } from '@playwright/test';
import path from 'node:path';

/** Stored sessions produced by auth.setup.ts. */
export const WORKER_STATE = path.join(__dirname, '.auth', 'worker.json');
export const RECRUITER_STATE = path.join(__dirname, '.auth', 'recruiter.json');

/**
 * Reads a required environment variable, failing with an actionable message
 * rather than letting a test fail later on an empty credential.
 */
export function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Missing environment variable ${name}. The acceptance suite needs the ` +
                `Supabase keys and the two seeded test accounts — see "Running the tests" in ` +
                `Documentation/Acceptance_Tests_Sprint_2.md.`,
        );
    }

    return value;
}

export const worker = {
    get email() {
        return requireEnv('E2E_WORKER_EMAIL');
    },
    get password() {
        return requireEnv('E2E_WORKER_PASSWORD');
    },
    get firstName() {
        return requireEnv('E2E_WORKER_FIRST_NAME');
    },
    get lastName() {
        return requireEnv('E2E_WORKER_LAST_NAME');
    },
    get fullName() {
        return `${worker.firstName} ${worker.lastName}`;
    },
};

export const recruiter = {
    get email() {
        return requireEnv('E2E_RECRUITER_EMAIL');
    },
    get password() {
        return requireEnv('E2E_RECRUITER_PASSWORD');
    },
};

/** Signs in through the real form and waits for the redirect to the home page. */
export async function signIn(page: Page, email: string, password: string) {
    await page.goto('/signin');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    // The first sign-in of a run also waits for `next dev` to compile the home
    // page, which can take longer than the default five seconds.
    await expect(page).toHaveURL('/', { timeout: 20_000 });
}

/**
 * The header's avatar menu trigger. The navigation tabs render as links, so the
 * menu trigger is the only button in the header.
 */
export function avatarMenu(page: Page): Locator {
    return page.locator('header').getByRole('button');
}

/** Opens the avatar menu and signs out. */
export async function signOut(page: Page) {
    await avatarMenu(page).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/signin');
}

/**
 * A fieldset on the resume editor, located by its legend — used to scope
 * selectors because "Establishment", "Description" and "Add" each appear in
 * more than one section.
 */
export function resumeSection(page: Page, legend: string): Locator {
    return page.locator('fieldset').filter({ has: page.getByText(legend, { exact: true }) });
}

/**
 * A resume card on the list page, located by its title: the closest element
 * around the title heading that also holds that resume's Edit link.
 */
export function resumeCard(page: Page, title: string): Locator {
    return page
        .getByRole('heading', { name: title, exact: true })
        .locator('xpath=ancestor::div[.//a[contains(@href, "/resumes/edit?id=")]][1]');
}

/** A title that is unique per run and identifiable as test data. */
export function uniqueTitle(label: string): string {
    return `[E2E] ${label} ${Date.now()}`;
}

/** Creates a resume with just a title and returns to the list page. */
export async function createResume(page: Page, title: string) {
    await page.goto('/resumes/edit');
    await page.getByLabel('Title').fill(title);
    await page.getByRole('button', { name: 'Create Resume' }).click();
    await expect(page).toHaveURL('/resumes');
    await expect(resumeCard(page, title)).toBeVisible();
}
