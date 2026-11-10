// Writes the latest acceptance test results into each user story issue.
//
// Usage: node update-acceptance-issues.mjs <playwright-results.json>
// Needs GITHUB_TOKEN and GITHUB_REPOSITORY; RUN_URL and GITHUB_SHA are linked
// in the table when set. Runs in CI after the acceptance tests on `main`.
//
// Each test title starts with the IDs it covers (e.g. "AC-03.2 …" or
// "AC-08.1 / AC-08.3 …"). AC-NN.x belongs to US-NN, and STORY_ISSUES gives the
// issue for each story. Tests for sign-in and access control (AC-A, AC-G) are
// not part of a user story and are left out.

import { readFileSync } from 'node:fs';

const STORY_ISSUES = {
    '01': 13,
    '02': 14,
    '03': 15,
    '04': 16,
    '05': 17,
    '06': 18,
    '07': 19,
    '08': 20,
    '09': 21,
    '10': 22,
    '11': 23,
    '12': 24,
    '13': 25,
    '14': 26,
    '15': 27,
    '16': 36,
    '17': 46,
    '18': 47,
    '19': 48,
    '20': 49,
    '21': 50,
    '22': 51,
    '23': 52,
    '24': 53,
    '25': 54,
    '26': 55,
};

const START = '<!-- acceptance-tests:start -->';
const END = '<!-- acceptance-tests:end -->';

const { GITHUB_TOKEN, GITHUB_REPOSITORY, RUN_URL, GITHUB_SHA } = process.env;
const resultsPath = process.argv[2];

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !resultsPath) {
    console.error('Needs GITHUB_TOKEN, GITHUB_REPOSITORY and a results file argument.');
    process.exit(1);
}

let report;
try {
    report = JSON.parse(readFileSync(resultsPath, 'utf8'));
} catch {
    // The tests did not get far enough to write results; keep the last status.
    console.log(`No results at ${resultsPath}; issues left unchanged.`);
    process.exit(0);
}

/** Every test in the report, with its title and outcome. */
function collectTests(suite, found = []) {
    for (const spec of suite.specs ?? []) {
        for (const test of spec.tests) {
            found.push({ title: spec.title, file: spec.file, test });
        }
    }
    for (const child of suite.suites ?? []) collectTests(child, found);
    return found;
}

/**
 * Turns Playwright's outcome into a status. An expected failure (test.fail())
 * that failed is a feature that is not built or not met yet; one that passed
 * means the feature now works and the marker should be removed.
 */
function statusOf(test) {
    const expectsFailure = test.expectedStatus === 'failed';

    switch (test.status) {
        case 'expected':
            return expectsFailure ? '❌ Not met' : '✅ Pass';
        case 'flaky':
            return '⚠️ Flaky (passed on retry)';
        case 'unexpected':
            return expectsFailure ? '⚠️ Passes, remove `test.fail()`' : '❌ Fail';
        default:
            return '⏭️ Skipped';
    }
}

const ID_PATTERN = /^((?:AC-\d+\.\d+)(?:\s*\/\s*AC-\d+\.\d+)*)\s+(.*)$/;

const rowsByStory = {};
for (const { title, file, test } of collectTests({ suites: report.suites })) {
    const match = title.match(ID_PATTERN);
    if (!match) continue;

    const ids = match[1].split('/').map((id) => id.trim());
    const description = match[2].charAt(0).toUpperCase() + match[2].slice(1);

    for (const id of ids) {
        const story = id.match(/^AC-(\d+)\./)[1];
        if (!STORY_ISSUES[story]) continue;
        (rowsByStory[story] ??= []).push({ id, description, status: statusOf(test), file });
    }
}

/** Sorts AC-02.2 before AC-02.10. */
function byId(a, b) {
    return Number(a.id.split('.')[1]) - Number(b.id.split('.')[1]);
}

const date = new Date().toISOString().slice(0, 10);
const commit = GITHUB_SHA ? ` on commit ${GITHUB_SHA.slice(0, 7)}` : '';
const run = RUN_URL ? ` ([run](${RUN_URL}))` : '';

function section(rows) {
    const table = rows
        .sort(byId)
        .map((row) => `| ${row.id} | ${row.description} | ${row.status} | \`${row.file}\` |`)
        .join('\n');

    return [
        START,
        '## Acceptance tests',
        '',
        '| ID | Test | Status | Test file |',
        '|---|---|---|---|',
        table,
        '',
        `_Updated automatically after every push to \`main\`. Last run: ${date}${commit}${run}._`,
        END,
    ].join('\n');
}

/**
 * Replaces the generated section, or a hand-written "## Acceptance tests"
 * section from before this script existed, and keeps everything else.
 */
function withSection(body, newSection) {
    body = body ?? '';
    const start = body.indexOf(START);
    const end = body.indexOf(END);

    if (start !== -1 && end !== -1) {
        return body.slice(0, start) + newSection + body.slice(end + END.length);
    }

    const manual = body.indexOf('## Acceptance tests');
    const kept = (manual === -1 ? body : body.slice(0, manual)).trim();
    return kept ? `${kept}\n\n${newSection}` : newSection;
}

async function github(path, options = {}) {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}${path}`, {
        ...options,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...options.headers,
        },
    });
    if (!response.ok) {
        throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status}`);
    }
    return response.json();
}

let failed = false;
for (const [story, issue] of Object.entries(STORY_ISSUES)) {
    const rows = rowsByStory[story] ?? [];
    if (rows.length < 2) {
        console.warn(`US-${story} (#${issue}) has ${rows.length} acceptance test(s); at least 2 are expected.`);
    }
    if (rows.length === 0) continue;

    try {
        const { body } = await github(`/issues/${issue}`);
        const updated = withSection(body, section(rows));
        if (updated === body) continue;

        await github(`/issues/${issue}`, {
            method: 'PATCH',
            body: JSON.stringify({ body: updated }),
        });
        console.log(`US-${story} (#${issue}): ${rows.length} tests updated.`);
    } catch (error) {
        console.error(`US-${story} (#${issue}): ${error.message}`);
        failed = true;
    }
}

process.exit(failed ? 1 : 0);
