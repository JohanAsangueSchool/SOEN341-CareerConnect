// Writes the latest acceptance test results into each user story issue, and
// labels the issue with the overall status (LABELS) so it shows on the Issues
// list.
//
// Usage: node update-acceptance-issues.mjs [--check] <playwright-results.json>
// Needs GITHUB_TOKEN and GITHUB_REPOSITORY; RUN_URL and GITHUB_SHA are linked
// in the table when set. Runs in CI after the acceptance tests on `main`.
//
// Every story must have at least MIN_TESTS tests; the script fails if one has
// fewer. With --check it only does that check and touches no issues, so it
// needs no token (CI runs it on every push and pull request).
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

const MIN_TESTS = 2;

const { GITHUB_TOKEN, GITHUB_REPOSITORY, RUN_URL, GITHUB_SHA } = process.env;
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const resultsPath = args.find((arg) => arg !== '--check');

if (!resultsPath || (!checkOnly && (!GITHUB_TOKEN || !GITHUB_REPOSITORY))) {
    console.error('Needs a results file argument, and GITHUB_TOKEN and GITHUB_REPOSITORY unless --check.');
    process.exit(1);
}

let report;
try {
    report = JSON.parse(readFileSync(resultsPath, 'utf8'));
} catch {
    // The tests did not get far enough to write results; keep the last status.
    // The test step has already failed, so there is nothing more to report.
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

/**
 * Stories with fewer than MIN_TESTS tests. One test covering two IDs
 * ("AC-18.2 / AC-18.3 …") adds two rows but counts once.
 */
function testCount(story) {
    const rows = rowsByStory[story] ?? [];
    return new Set(rows.map((row) => `${row.file}\n${row.description}`)).size;
}

const thinStories = Object.entries(STORY_ISSUES).filter(([story]) => testCount(story) < MIN_TESTS);
for (const [story, issue] of thinStories) {
    console.error(
        `US-${story} (#${issue}) has ${testCount(story)} acceptance test(s); at least ${MIN_TESTS} are required.`,
    );
}

if (checkOnly) {
    if (thinStories.length === 0) {
        console.log(`Every user story has at least ${MIN_TESTS} acceptance tests.`);
    }
    process.exit(thinStories.length > 0 ? 1 : 0);
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
        const error = new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

const LABELS = {
    passing: { name: 'tests: passing', color: '2da44e' },
    partial: { name: 'tests: partial', color: 'd4a72c' },
    notBuilt: { name: 'tests: not built', color: '8c959f' },
    failing: { name: 'tests: failing', color: 'cf222e' },
};
const LABEL_PREFIX = 'tests: ';

/**
 * The overall status of a story: failing if any test fails or needs attention,
 * passing if all pass, not built if none does, and partial in between.
 */
function labelFor(rows) {
    const statuses = rows.map((row) => row.status);
    if (statuses.some((status) => status.startsWith('❌ Fail') || status.startsWith('⚠️'))) {
        return LABELS.failing;
    }
    if (statuses.every((status) => status === '✅ Pass')) return LABELS.passing;
    if (statuses.every((status) => status === '❌ Not met')) return LABELS.notBuilt;
    return LABELS.partial;
}

/** Creates any status label the repository does not have yet. */
async function ensureLabels() {
    for (const { name, color } of Object.values(LABELS)) {
        try {
            await github(`/labels/${encodeURIComponent(name)}`);
        } catch (error) {
            if (error.status !== 404) throw error;
            await github('/labels', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    color,
                    description: 'Acceptance tests, updated by CI',
                }),
            });
        }
    }
}

let failed = thinStories.length > 0;
try {
    await ensureLabels();
} catch (error) {
    console.error(`Status labels: ${error.message}`);
    failed = true;
}
for (const [story, issue] of Object.entries(STORY_ISSUES)) {
    const rows = rowsByStory[story] ?? [];
    if (rows.length === 0) continue;

    try {
        const { body, labels } = await github(`/issues/${issue}`);
        const updated = withSection(body, section(rows));

        // Keep the issue's other labels and replace its status label.
        const label = labelFor(rows);
        const current = labels.map((existing) => existing.name);
        const kept = current.filter((name) => !name.startsWith(LABEL_PREFIX));
        const newLabels = [...kept, label.name];
        const labelsChanged =
            newLabels.length !== current.length ||
            newLabels.some((name) => !current.includes(name));
        if (updated === body && !labelsChanged) continue;

        await github(`/issues/${issue}`, {
            method: 'PATCH',
            body: JSON.stringify({ body: updated, labels: newLabels }),
        });
        console.log(`US-${story} (#${issue}): ${rows.length} tests updated, ${label.name}.`);
    } catch (error) {
        console.error(`US-${story} (#${issue}): ${error.message}`);
        failed = true;
    }
}

process.exit(failed ? 1 : 0);
