# Acceptance Tests — Sprint 2

Each user story has acceptance criteria. A story is complete when its criteria pass.
Every criterion has an automated test in `App/tests/` (Playwright), which runs on GitHub on every push and pull request.

**Live status:** after every push to `main`, CI writes each test's result into its user story issue (#13 – #27, #36, #46 – #55), so the issues always show the latest Pass / Fail. The statuses below are a snapshot.

**Status:** **Pass** = test passes · **Not met** = built but behaves differently · **Not built** = feature does not exist yet. Not met and Not built tests are expected failures (`test.fail()`).

**Summary (101 criteria):** 68 Pass · 3 Not met · 30 Not built. Not met: AC-05.1, AC-05.4 (no resume when applying), AC-08.4 (no applicant resume). Not built: AC-01.6, AC-02.16 – AC-02.18 (file upload and resume delete), US-04, US-07, US-09 – US-15 apart from AC-09.1 and AC-10.1, and US-22 – US-26.

## Running the tests

```bash
cd App
npm install
npx playwright install chromium
npm test
npx playwright show-report
```

`App/.env` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the test accounts
`E2E_WORKER_EMAIL`, `E2E_WORKER_PASSWORD`, `E2E_WORKER_FIRST_NAME`, `E2E_WORKER_LAST_NAME`,
`E2E_RECRUITER_EMAIL`, `E2E_RECRUITER_PASSWORD` (logins in #testing). On GitHub the same names are repository secrets.

## Sign-in and access control

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-A.1 | A visitor can register as a Worker | Pass | `auth.spec.ts` |
| AC-A.2 | A visitor can register as a Recruiter | Pass | `auth.spec.ts` |
| AC-A.3 | First name under 2 characters is rejected | Pass | `auth.spec.ts` |
| AC-A.4 | Malformed email is rejected | Pass | `auth.spec.ts` |
| AC-A.5 | Phone not in `XXX-XXX-XXXX` format is rejected | Pass | `auth.spec.ts` |
| AC-A.6 | Postal code not in `A1A 1A1` format is rejected | Pass | `auth.spec.ts` |
| AC-A.7 | Password under 6 characters is rejected | Pass | `auth.spec.ts` |
| AC-A.8 | Mismatched confirm password is rejected | Pass | `auth.spec.ts` |
| AC-A.9 | Correct login goes to the home page | Pass | `auth.spec.ts` |
| AC-A.10 | Wrong password does not sign in | Pass | `auth.spec.ts` |
| AC-A.11 | User can sign out from the avatar menu | Pass | `signout.spec.ts` |
| AC-G.1 | Signed-out visitor is sent to sign-in from home | Pass | `guards.spec.ts` |
| AC-G.2 | Signed-out visitor is sent to sign-in from resumes | Pass | `guards.spec.ts` |
| AC-G.3 | Recruiter is sent away from resumes | Pass | `guards.spec.ts` |
| AC-G.4 | Worker can open resumes | Pass | `guards.spec.ts` |
| AC-G.5 | Recruiter has no Resumes tab | Pass | `guards.spec.ts` |

## US-01 — Profile management

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-01.1 | Account page shows name, email, phone and postal code | Pass | `account.spec.ts` |
| AC-01.2 | Account page shows the account type | Pass | `account.spec.ts` |
| AC-01.3 | Avatar shows initials when there is no picture | Pass | `account.spec.ts` |
| AC-01.4 | Avatar menu shows the full name | Pass | `account.spec.ts` |
| AC-01.5 | User can edit the profile and changes are saved | Pass | `account.spec.ts` |
| AC-01.6 | User can upload or change the avatar picture | Not built | `account.spec.ts` |

## US-02 — Resume management

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-02.1 | Worker can create a resume and it appears in the list | Pass | `resumes.spec.ts` |
| AC-02.2 | New resume shows a Draft badge | Pass | `resumes.spec.ts` |
| AC-02.3 | Worker with no resumes sees "No resumes yet" | Pass | `resumes.spec.ts` |
| AC-02.4 | Empty title is rejected | Pass | `resumes.spec.ts` |
| AC-02.5 | Education entry is saved | Pass | `resumes.spec.ts` |
| AC-02.6 | Education without establishment is rejected | Pass | `resumes.spec.ts` |
| AC-02.7 | Work experience entry is saved | Pass | `resumes.spec.ts` |
| AC-02.8 | Experience without position is rejected | Pass | `resumes.spec.ts` |
| AC-02.9 | Skill without a name is rejected | Pass | `resumes.spec.ts` |
| AC-02.10 | Project with an invalid link is rejected | Pass | `resumes.spec.ts` |
| AC-02.11 | Removed entry is gone after saving | Pass | `resumes.spec.ts` |
| AC-02.12 | Editing a resume shows its saved values | Pass | `resumes.spec.ts` |
| AC-02.13 | Status change shows on the resume list | Pass | `resumes.spec.ts` |
| AC-02.14 | Entry with no end month saves as ongoing | Pass | `resumes.spec.ts` |
| AC-02.15 | Resume card shows its section counts | Pass | `resumes.spec.ts` |
| AC-02.16 | Worker can upload a resume file (PDF/DOCX) | Not built | `resumes.spec.ts` |
| AC-02.17 | Worker can replace an uploaded resume file | Not built | `resumes.spec.ts` |
| AC-02.18 | Worker can delete a resume | Not built | `resumes.spec.ts` |

## US-03 — Job search

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-03.1 | Listing shows each job's title, company and location | Pass | `jobs.spec.ts` |
| AC-03.2 | Keyword search returns only matching jobs | Pass | `jobs.spec.ts` |
| AC-03.3 | Location filter returns only jobs in that location | Pass | `jobs.spec.ts` |
| AC-03.4 | Job type filter returns only jobs of that type | Pass | `jobs.spec.ts` |
| AC-03.5 | No matches shows a "no results" message | Pass | `jobs.spec.ts` |

## US-16 — Job details

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-16.1 | Clicking a job opens its detail page | Pass | `jobs.spec.ts` |
| AC-16.2 | Detail page shows description, company, location, type and date | Pass | `jobs.spec.ts` |
| AC-16.3 | Going back keeps the search and filters | Pass | `jobs.spec.ts` |

## US-05 — Apply to a job

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-05.1 | Worker chooses one of their resumes when applying | Not met | `applications.spec.ts` |
| AC-05.2 | Worker sees a confirmation after applying | Pass | `applications.spec.ts` |
| AC-05.3 | Worker cannot apply twice to the same job | Pass | `applications.spec.ts` |
| AC-05.4 | Worker with no resumes cannot apply | Not met | `applications.spec.ts` |

## US-06 — Application tracking

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-06.1 | Worker sees every application and the job it was for | Pass | `applications.spec.ts` |
| AC-06.2 | Status is Applied, Under Review, Interview, Offered or Rejected | Pass | `applications.spec.ts` |
| AC-06.3 | Status changed by a recruiter shows for the Worker | Pass | `recruiter.spec.ts` |

## US-08 — Recruiter postings

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-08.1 | Recruiter can create and post a job, and it appears in the listing | Pass | `recruiter.spec.ts` |
| AC-08.2 | Posting with a required field empty is rejected | Pass | `recruiter.spec.ts` |
| AC-08.3 | Recruiter can edit their own posting | Pass | `recruiter.spec.ts` |
| AC-08.4 | Recruiter sees applications received, with each applicant's resume | Not met (no resume attached) | `recruiter.spec.ts` |
| AC-08.5 | Worker cannot open the posting editor | Pass | `recruiter.spec.ts` |

## US-04 — Saved jobs

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-04.1 | Worker can save a job from its detail page | Not built | `saved-jobs.spec.ts` |
| AC-04.2 | Saved jobs are listed on the Saved Jobs page | Not built | `saved-jobs.spec.ts` |

## US-07 — Application status notifications

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-07.1 | Header has a notifications button | Not built | `notifications.spec.ts` |
| AC-07.2 | Status change notification names the new status | Not built | `notifications.spec.ts` |

## US-09 — Candidate profile and resume viewer

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-09.1 | Recruiter sees each applicant's name and contact details | Pass | `candidates.spec.ts` |
| AC-09.2 | Recruiter can open an applicant's full profile | Not built | `candidates.spec.ts` |

## US-10 — Application review and feedback

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-10.1 | Each application received can be set to any of the agreed statuses | Pass | `candidates.spec.ts` |
| AC-10.2 | Recruiter can leave feedback on an application | Not built | `candidates.spec.ts` |

## US-11 — New job alerts

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-11.1 | Worker can choose fields of interest for job alerts | Not built | `notifications.spec.ts` |
| AC-11.2 | New posting in a chosen field shows as a notification | Not built | `notifications.spec.ts` |

## US-12 — Job expiry reminders

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-12.1 | Job posting shows its application deadline | Not built | `notifications.spec.ts` |
| AC-12.2 | Saved job about to expire shows as a notification | Not built | `notifications.spec.ts` |

## US-13 — AI cover letter generator

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-13.1 | Job detail page offers to generate a cover letter | Not built | `cover-letter.spec.ts` |
| AC-13.2 | Generated cover letter mentions the job title | Not built | `cover-letter.spec.ts` |

## US-14 — Candidate search

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-14.1 | Recruiter can open the candidate search page | Not built | `candidates.spec.ts` |
| AC-14.2 | Searching by name returns the matching candidate | Not built | `candidates.spec.ts` |

## US-15 — Favorite candidates

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-15.1 | Recruiter can add a candidate to their favorites | Not built | `candidates.spec.ts` |
| AC-15.2 | Favorite candidates are listed on their own page | Not built | `candidates.spec.ts` |

## US-17 — Recruiter dashboard

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-17.1 | Dashboard lists the Recruiter's postings | Pass | `dashboard.spec.ts` |
| AC-17.2 | Each posting shows how many applications it received | Pass | `dashboard.spec.ts` |
| AC-17.3 | Worker cannot open the dashboard | Pass | `dashboard.spec.ts` |

## US-18 — Posting management

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-18.1 | New posting can be started from the dashboard | Pass | `dashboard.spec.ts` |
| AC-18.2 | Archived posting moves to the archived list | Pass | `dashboard.spec.ts` |
| AC-18.3 | Archived posting is hidden from Workers | Pass | `dashboard.spec.ts` |
| AC-18.4 | Restored posting returns to the active list as Closed | Pass | `dashboard.spec.ts` |

## US-19 — Applications filter

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-19.1 | Applications can be filtered by status | Pass | `dashboard.spec.ts` |
| AC-19.2 | Applications can be filtered by submission date | Pass | `dashboard.spec.ts` |

## US-20 — Application history dashboard

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-20.1 | History lists every submitted application with its status | Pass | `history.spec.ts` |
| AC-20.2 | History can be narrowed to one status | Pass | `history.spec.ts` |

## US-21 — Application analytics

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-21.1 | History shows applications submitted over the last 30 days | Pass | `history.spec.ts` |
| AC-21.2 | Activity chart counts applications on the day they were submitted | Pass | `history.spec.ts` |

## US-22 — Application status update notifications

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-22.1 | Interview invitation shows as a notification | Not built | `notifications.spec.ts` |
| AC-22.2 | Opening a status notification shows the application | Not built | `notifications.spec.ts` |

## US-23 — Application deadline reminders

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-23.1 | Posting can be given an application deadline | Not built | `notifications.spec.ts` |
| AC-23.2 | Upcoming deadline shows as a reminder | Not built | `notifications.spec.ts` |

## US-24 — New application notifications

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-24.1 | Recruiter header has a notifications button | Not built | `notifications.spec.ts` |
| AC-24.2 | New application shows as a notification for the Recruiter | Not built | `notifications.spec.ts` |

## US-25 — AI resume feedback

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-25.1 | Worker can ask for AI feedback on a resume | Not built | `ai-suggestions.spec.ts` |
| AC-25.2 | AI feedback lists suggestions for improvement | Not built | `ai-suggestions.spec.ts` |

## US-26 — AI job matching

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-26.1 | Jobs page recommends postings for the Worker | Not built | `ai-suggestions.spec.ts` |
| AC-26.2 | Each recommendation says why it matches the Worker | Not built | `ai-suggestions.spec.ts` |

## Open issues

- **No resume when applying** (AC-05.1, AC-05.4, AC-08.4): *Apply Now* does not ask for a resume or check that the Worker has one.
- **Drafts cannot be saved**: the job form offers *Draft*, but the database only allows `Open` and `Closed` (`jobs_status_check`), so saving a draft fails with "Failed to create job posting."
- **No file upload** (AC-01.6, AC-02.16, AC-02.17) and **no resume delete** (AC-02.18).

## Notes

- The apply tests intercept the submit request, so they don't write to Supabase. The history tests (US-20, US-21) answer the applications request with a fixed history the same way.
- Not met and Not built tests are expected failures (`test.fail()`): each turns red once its feature works, as a reminder to remove the marker. Tests of features not built yet guess the button and page names, so adjust them to the real page when building the feature.
- The issue tables are written by `.github/scripts/update-acceptance-issues.mjs`. A test is listed under the story its ID belongs to (AC-04.x under US-04), so a new test only needs the ID at the start of its title.
- Each run of AC-A.1 and AC-A.2 creates a real user in Supabase; clear the `e2e+…@example.com` users from time to time.
- Resume tests create resumes titled `[E2E] …` on the shared Worker account; clear them in Supabase from time to time.
- The test accounts are shared. AC-A.11 signs out with the "local" scope so it ends only its own session; logging out of a test account manually in the app ends every session of that account and can fail a CI run in progress. CI runs the acceptance tests one at a time for the same reason.
- Recruiter tests create postings titled `[E2E] Posting …` and close them at the end, so Workers never see them. The profile and status tests put the original values back.
