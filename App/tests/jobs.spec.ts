import { type Locator, type Page, expect, test } from '@playwright/test';

import { WORKER_STATE } from './helpers';

/**
 * US-03 — Job Search and Job Listing Interface (AC-03.1 … AC-03.5)
 * US-16 — View Job Details (AC-16.1 … AC-16.3)
 *
 * These read the job postings already in Supabase and assert on whatever the
 * listing returns, so they do not depend on particular postings existing.
 * See Documentation/Acceptance_Tests_Sprint_2.md § 5.
 */

test.use({ storageState: WORKER_STATE });

/** Every job card on the listing: the closest element around each View link that holds a title. */
function jobCards(page: Page): Locator {
    return page.getByRole('link', { name: 'View' }).locator('xpath=ancestor::div[.//h3][1]');
}

/**
 * Waits until the listing is non-empty and every card satisfies `matches`. The
 * old results stay on screen until the filtered ones arrive, so a single
 * check right after changing a filter can see the previous list.
 */
async function expectEveryCard(page: Page, matches: (text: string) => boolean) {
    await expect
        .poll(async () => {
            const texts = await jobCards(page).allInnerTexts();
            return texts.length > 0 && texts.every(matches);
        })
        .toBe(true);
}

/** Opens the listing and waits for the first card, so later counts are not taken mid-load. */
async function openListing(page: Page, query = '') {
    await page.goto(`/jobs${query}`);
    await expect(jobCards(page).first()).toBeVisible();
}

test('AC-03.1 the listing shows each posting with its title, company and location', async ({
    page,
}) => {
    await openListing(page);

    // Every location a posting can have, from the Location filter.
    const locationOptions = page.getByRole('combobox', { name: 'Location' }).locator('option');
    await expect(locationOptions.nth(1)).toBeAttached();
    const locations = (await locationOptions.allInnerTexts()).slice(1);

    const cards = jobCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        await expect(card.getByRole('heading')).not.toBeEmpty();
        // The company sits in the "<company> · Posted <date>" line under the title.
        const companyLine = await card.getByText('· Posted').innerText();
        expect(companyLine.split(' · ')[0].trim()).not.toBe('');
        const text = await card.innerText();
        expect(locations.some((location) => text.includes(location))).toBe(true);
    }
});

test('AC-03.2 a keyword returns only postings that contain it', async ({ page }) => {
    await openListing(page);

    // Take a word from the first posting's title so the search is known to match something.
    const firstTitle = await jobCards(page).first().getByRole('heading').innerText();
    const keyword = firstTitle.split(/\s+/).find((word) => word.length >= 4) ?? firstTitle;

    await page.getByPlaceholder('Search by title, company or keyword').fill(keyword);
    await expect(page).toHaveURL(new RegExp(`keyword=${encodeURIComponent(keyword)}`));

    await expectEveryCard(page, (text) => text.toLowerCase().includes(keyword.toLowerCase()));
});

test('AC-03.3 selecting a location returns only postings in that location', async ({ page }) => {
    await openListing(page);

    const select = page.getByRole('combobox', { name: 'Location' });
    // Option 0 is "All locations"; wait for the real options to load.
    await expect(select.locator('option').nth(1)).toBeAttached();
    const location = await select.locator('option').nth(1).innerText();

    await select.selectOption(location);
    await expect(page).toHaveURL(/location=/);

    await expectEveryCard(page, (text) => text.includes(location));
});

test('AC-03.4 selecting a job type returns only postings of that type', async ({ page }) => {
    await openListing(page);

    // Use the first posting's type so the filter is known to match something.
    const jobType = await jobCards(page).first().locator('.chakra-badge').innerText();

    await page.getByRole('combobox', { name: 'Job type' }).selectOption(jobType);
    await expect(page).toHaveURL(/type=/);

    const badges = jobCards(page).locator('.chakra-badge');
    await expect
        .poll(async () => {
            const types = await badges.allInnerTexts();
            return types.length > 0 && types.every((type) => type === jobType);
        })
        .toBe(true);
});

test('AC-03.5 a search with no matches shows an explicit no-results message', async ({ page }) => {
    await openListing(page);

    await page.getByPlaceholder('Search by title, company or keyword').fill('zzqx-no-such-job');

    await expect(page.getByText('No jobs match your filters')).toBeVisible();
    await expect(jobCards(page)).toHaveCount(0);
});

test('AC-16.1 selecting a posting opens its detail view', async ({ page }) => {
    await openListing(page);

    const card = jobCards(page).first();
    const title = await card.getByRole('heading').innerText();
    await card.getByRole('link', { name: 'View' }).click();

    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
});

test('AC-16.2 the detail view shows the description, company, location, type and date', async ({
    page,
}) => {
    await openListing(page);

    // Read what the card shows so the detail view can be checked against it.
    const card = jobCards(page).first();
    const jobType = await card.locator('.chakra-badge').innerText();
    const company = (await card.getByText('· Posted').innerText()).split(' · ')[0];
    const locationOptions = page.getByRole('combobox', { name: 'Location' }).locator('option');
    await expect(locationOptions.nth(1)).toBeAttached();
    const locations = await locationOptions.allInnerTexts();
    const cardText = await card.innerText();
    const location = locations.find((option) => cardText.includes(option))!;
    const description = (await card.locator('.chakra-card__description').textContent())!.trim();
    expect(description).not.toBe('');

    await card.getByRole('link', { name: 'View' }).click();

    await expect(page.getByRole('heading', { name: 'Job Description' })).toBeVisible();
    // The card clamps the description to three lines; the detail view shows all of it.
    await expect(page.locator('main main')).toContainText(description);
    await expect(page.getByText(company, { exact: true })).toBeVisible();
    await expect(page.getByText(location, { exact: true })).toBeVisible();
    await expect(page.locator('.chakra-badge', { hasText: jobType })).toBeVisible();
    await expect(page.getByText(/^Posted /)).toBeVisible();
});

test('AC-16.3 returning from a detail view keeps the search and filters', async ({ page }) => {
    await openListing(page);

    const jobType = await jobCards(page).first().locator('.chakra-badge').innerText();
    await page.getByRole('combobox', { name: 'Job type' }).selectOption(jobType);
    await expect(page).toHaveURL(/type=/);
    const filteredUrl = page.url();

    await jobCards(page).first().getByRole('link', { name: 'View' }).click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+/);

    await page.getByRole('link', { name: 'Back' }).click();

    await expect(page).toHaveURL(filteredUrl);
    await expect(page.getByRole('combobox', { name: 'Job type' })).toHaveValue(jobType);
});
