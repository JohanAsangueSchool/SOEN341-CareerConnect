# Contribution Log — David Peter (Sprint 3)

**GitHub:** [davidpeter1123](https://github.com/davidpeter1123)

## Summary

| Activity                         | Time spent |
| -------------------------------- | ---------- |
| Features from earlier sprints    | 5 h        |
| AI resume feedback (Feature 4)   | 2.5 h      |
| Acceptance tests and CI          | 3 h        |
| Debugging and bug fixes          | 1.5 h      |
| Backlog and documentation        | 1 h        |
| **Total**                        | **13 h**   |

## Features from earlier sprints

Finished the user stories left over from Sprints 1 and 2 (notifications were left for later).

| Date | Contribution | Link |
|---|---|---|
| 2026-11-15 | Pull request: profile pictures and resume file upload, replace and delete | [#60](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/60) |
| 2026-11-15 | Add avatar pictures and resume file upload, replace and delete | [0e0215e](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/0e0215e) |
| 2026-11-15 | Database changes in Supabase: storage buckets, access rules, and resumes used in applications can't be deleted | [Migration](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/App/supabase/migrations/20261115000001_avatar_and_resume_files.sql) |
| 2026-11-15 | Pull request: saved jobs (US-04) | [#61](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/61) |
| 2026-11-15 | Add saved jobs (Save job button and Saved Jobs tab) | [5836b24](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/5836b24) |
| 2026-11-15 | Pull request: candidate search and favorite candidates (US-14, US-15) | [#62](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/62) |
| 2026-11-15 | Add candidate search and favorite candidates for recruiters | [5f1217e](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/5f1217e) |
| 2026-11-15 | Pull request: AI cover letter generator (US-13) | [#63](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/63) |
| 2026-11-15 | Add the AI cover letter generator | [013fa12](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/013fa12) |
| 2026-11-15 | Use the free Gemini API for the cover letter instead of a paid API | [eed611b](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/eed611b) |

## AI resume feedback (Feature 4)

Started the Sprint 3 AI feature (US-25). It will be finished in Sprint 4 (feedback history, feedback for a specific job, Word files, daily limit).

| Date | Contribution | Link |
|---|---|---|
| 2026-11-15 | Add AI resume feedback: overall comment, strengths and ranked suggestions, reads uploaded PDFs | [75d79e0](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/75d79e0) |
| 2026-11-15 | Fall back to the next free Gemini model when one is busy | [5006427](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/5006427) |
| 2026-11-15 | Try the free Gemini models that answer reliably first (faster answers) | [81e1429](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/81e1429) |
| 2026-11-16 | Pull request: saved jobs, candidate search, AI cover letter and AI resume feedback (brings #61 to #63 to `main`) | [#64](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/64) |

## Acceptance tests and CI

| Date | Contribution | Link |
|---|---|---|
| 2026-11-01 | Pull request: mark the sign-up acceptance tests as passing | [#41](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/41) |
| 2026-11-09 | Pull request: show live acceptance test results on the user story issues | [#44](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/44) |
| 2026-11-09 | CI writes each user story's test results on its issue | [0c191d5](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/0c191d5) |
| 2026-11-09 | Use a posting with a description in the job details test | [62bb01c](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/62bb01c) |
| 2026-11-10 | Pull request: add Sprint 3 user stories to the live issue status | [#56](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/56) |
| 2026-11-14 | Pull request: label each user story issue with its test status | [#57](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/57) |
| 2026-11-15 | Pull request: at least two acceptance tests per user story | [#59](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/59) |
| 2026-11-15 | Require at least two acceptance tests per user story | [9fa4049](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/9fa4049) |
| 2026-11-15 | Tests for saved jobs, candidate search, cover letter and resume feedback | [#64](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/64) |
| 2026-11-15 | Run the AI tests in CI with the Gemini key (skipped without it) | [test.yml](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/.github/workflows/test.yml) |

## Debugging and bug fixes

| Date | Contribution | Link |
|---|---|---|
| 2026-11-15 | Pull request: fix AC-18.1 (New Job Posting on the dashboard landed on /jobs) | [#58](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/58) |
| 2026-11-15 | Stop the header tabs from following their link when the URL changes | [022b71a](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/022b71a) |
| 2026-11-15 | Match the Jobs tab exactly now that there is a Saved Jobs tab | [ae81ee2](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/commit/ae81ee2) |
| 2026-11-15 | Fixed deleting a resume (database permission error) | [#60](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/60) |
| 2026-11-15 | Found that #61 to #63 merged into each other's branches instead of `main`, and brought them to `main` in #64 | [#64](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/64) |

## Backlog and documentation

| Date | Contribution | Link |
|---|---|---|
| 2026-11-15 | Updated the acceptance test document (105 criteria: 86 pass, 3 not met, 16 not built) | [Acceptance_Tests_Sprint_2.md](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/Documentation/Acceptance_Tests_Sprint_2.md) |
| 2026-11-16 | AI usage log for Sprint 3 | [AI_Log/David Peter/Sprint 3.md](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/blob/main/AI_Log/David%20Peter/Sprint%203.md) |
| 2026-11-16 | Merged pull requests | [#41](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/41), [#44](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/44), [#56](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/56), [#57](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/57), [#58](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/58), [#59](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/59), [#60](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/60), [#64](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/pull/64) |
