# Contribution Log — David Peter (Sprint 2)

**GitHub:** [davidpeter1123](https://github.com/davidpeter1123)

## Summary

| Activity                  | Time spent |
| ------------------------- | ---------- |
| Acceptance tests          | 3.5 h      |
| CI pipeline               | 1.5 h      |
| Debugging and bug fixes   | 2 h        |
| Backlog and documentation | 1 h        |
| **Total**                 | **8 h**    |

## Acceptance tests

Wrote the Sprint 2 acceptance criteria and automated them with Playwright.

| Date | Contribution | Link |
|---|---|---|
| 2026-10-22 | Wrote the Sprint 2 acceptance criteria (60 criteria across the stories) | [Acceptance_Tests_Sprint_2.md](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/Documentation/Acceptance_Tests_Sprint_2.md) |
| 2026-10-22 | Wrote the first Playwright suite: auth, access control, account and resume tests | [App/tests](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/tree/main/App/tests) |
| 2026-10-26 | Finished the acceptance test document (traceability matrix, coverage, known issues) | [Acceptance_Tests_Sprint_2.md](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/Documentation/Acceptance_Tests_Sprint_2.md) |
| 2026-10-26 | Pull request: acceptance tests and CI | [#29](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/29) |
| 2026-10-26 | Add Playwright acceptance tests | [1484d1f](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/1484d1f) |
| 2026-10-26 | Fix test selectors and shared session handling | [4c74578](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/4c74578) |
| 2026-10-26 | Mark the edit-resume defects as fixed | [aa9762d](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/aa9762d) |
| 2026-10-26 | Merge `main` into the test branch and resolve the lockfile conflict | [c9c5223](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/c9c5223) |
| 2026-10-26 | Pull request: tests for job search, job details and applications | [#37](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/37) |
| 2026-10-26 | Add tests for US-03, US-16, US-05 and US-06 | [155412e](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/155412e) |
| 2026-10-26 | Strengthen weak tests (AC-01.3, AC-02.11, AC-03.1, AC-16.2) | [cf22313](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/cf22313) |
| 2026-10-26 | Pull request: simplified the acceptance test document (one table per user story) | [#39](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/39) |
| 2026-10-26 | Simplify the acceptance test document | [7bf83a5](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/7bf83a5) |
| 2026-10-26 | Pull request: tests for recruiter postings, status updates and profile editing | [#40](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/40) |
| 2026-10-26 | Add tests for AC-08.1, AC-08.2, AC-08.3, AC-08.5, AC-06.3 and AC-01.5 | [c421eb0](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/c421eb0) |
| 2026-10-26 | Run the sign-up tests as expected failures | [7892799](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/7892799) |
| 2026-10-26 | Add a status summary to the acceptance test document | [e466974](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/e466974) |
| 2026-10-26 | Record the latest full test run (54 passed) | [92521e7](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/92521e7) |
| 2026-10-26 | Link the latest green CI run in the acceptance test document | [24f947d](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/24f947d) |

## CI pipeline

GitHub Actions workflow that runs lint, build and the acceptance tests on every push and pull request.

| Date | Contribution | Link |
|---|---|---|
| 2026-10-22 | Set up Playwright (config, test scripts) and wrote the GitHub Actions workflow | [test.yml](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/.github/workflows/test.yml) |
| 2026-10-26 | Workflow added with the tests | [#29](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/29) |
| 2026-10-26 | Cache Playwright browsers in CI | [8ca40e8](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/8ca40e8) |
| 2026-10-26 | First green run (34/34 tests) | [Run #2](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/actions/runs/40414730088) |
| 2026-10-26 | Full suite now runs every test on GitHub: 54 passed, including 3 expected failures | [#40](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/40) |
| 2026-10-26 | Fixed overlapping CI runs logging each other out (acceptance tests now run one at a time) | [11985a8](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/11985a8) |
| 2026-10-26 | Stopped the sign-out test from logging out other test runs (local sign-out scope) | [37793e5](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/37793e5) |
| 2026-10-26 | Green CI run with every test (54 passed, including 3 expected failures) | [Run](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/actions/runs/40441811736) |

## Debugging and bug fixes

| Date | Contribution | Link |
|---|---|---|
| 2026-10-26 | Pull request: fix editing an existing resume | [#35](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/35) |
| 2026-10-26 | Editing a resume opened an empty form (production build) | [daa78b2](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/daa78b2) |
| 2026-10-26 | Garbled last-name validation message | [f12e7d8](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/f12e7d8) |
| 2026-10-26 | Found and documented the Supabase sign-up bug | [Known issues](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/Documentation/Acceptance_Tests_Sprint_2.md#open-issues) |
| 2026-10-26 | Found that saving a job posting as a Draft fails (database only allows Open and Closed) | [#40](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/40) |

## Backlog and documentation

| Date | Contribution | Link |
|---|---|---|
| 2026-10-26 | Updated the project board to match what is built (US-01, US-02, US-05, US-06) | [Project board](https://github.com/users/JohanAsangueSchool/projects/1) |
| 2026-10-26 | Added the missing US-16 backlog item | [#36](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/issues/36) |
| 2026-10-26 | AI usage log for Sprint 2 | [d7bcf1e](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/d7bcf1e) |
| 2026-10-26 | Merged pull requests | [#29](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/29), [#35](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/35), [#39](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/39), [#40](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/40) |
