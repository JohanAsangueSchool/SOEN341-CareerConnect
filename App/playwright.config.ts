import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Next.js reads App/.env for the app itself, but the test runner needs the
// E2E_* accounts too. In CI the values come from repository secrets instead.
if (existsSync('.env')) process.loadEnvFile('.env');

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './tests',

    // The suite shares two seeded Supabase accounts and writes resume rows, so
    // tests are run serially to keep them from interfering with each other.
    fullyParallel: false,
    workers: 1,

    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // `npx playwright show-report` opens the HTML report of the last run.
    reporter: [['list'], ['html', { open: 'never' }]],

    use: {
        baseURL,
        trace: 'on-first-retry',
    },

    projects: [
        // Signs in once per role and stores the sessions for the other specs.
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
            testIgnore: /auth\.setup\.ts/,
        },
    ],

    webServer: {
        // The Next.js docs recommend testing against a production build; dev is
        // used locally so a run picks up edits without a rebuild.
        command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
