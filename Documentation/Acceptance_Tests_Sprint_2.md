# Acceptance Tests — Sprint 2

Each user story has acceptance criteria. A story is complete when its criteria pass.
Automated tests live in `App/tests/` (Playwright) and run on GitHub on every push and pull request.

**Status:** **Pass** = automated and passing · **Manual** = checked by hand · **Untested** = built, no test yet · **Not met** = built but behaves differently · **Not built**

## Running the tests

```bash
cd App
npm install
npx playwright install chromium
npm test -- --grep-invert @writes
npx playwright show-report
```

`App/.env` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the test accounts
`E2E_WORKER_EMAIL`, `E2E_WORKER_PASSWORD`, `E2E_WORKER_FIRST_NAME`, `E2E_WORKER_LAST_NAME`,
`E2E_RECRUITER_EMAIL`, `E2E_RECRUITER_PASSWORD` (logins in #testing). On GitHub the same names are repository secrets.

## Sign-in and access control

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-A.1 | A visitor can register as a Worker | Fails (sign-up bug) | `auth.spec.ts` |
| AC-A.2 | A visitor can register as a Recruiter | Fails (sign-up bug) | `auth.spec.ts` |
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
| AC-01.5 | User can edit the profile and changes are saved | Untested | — |
| AC-01.6 | User can upload or change the avatar picture | Not built | — |

## US-02 — Resume management

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-02.1 | Worker can create a resume and it appears in the list | Pass | `resumes.spec.ts` |
| AC-02.2 | New resume shows a Draft badge | Pass | `resumes.spec.ts` |
| AC-02.3 | Worker with no resumes sees "No resumes yet" | Manual | — |
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
| AC-02.16 | Worker can upload a resume file (PDF/DOCX) | Not built | — |
| AC-02.17 | Worker can replace an uploaded resume file | Not built | — |
| AC-02.18 | Worker can delete a resume | Not built | — |

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
| AC-05.1 | Worker chooses one of their resumes when applying | Not met | `applications.spec.ts` (expected failure) |
| AC-05.2 | Worker sees a confirmation after applying | Pass | `applications.spec.ts` |
| AC-05.3 | Worker cannot apply twice to the same job | Pass | `applications.spec.ts` |
| AC-05.4 | Worker with no resumes cannot apply | Not met | — |

## US-06 — Application tracking

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-06.1 | Worker sees every application and the job it was for | Pass | `applications.spec.ts` |
| AC-06.2 | Status is Applied, Under Review, Interview, Offered or Rejected | Pass | `applications.spec.ts` |
| AC-06.3 | Status changed by a recruiter shows for the Worker | Untested | — |

## US-08 — Recruiter postings

| ID | Criterion | Status | Test |
|---|---|---|---|
| AC-08.1 | Recruiter can create and post a job, and it appears in the listing | Untested | — |
| AC-08.2 | Posting with a required field empty is rejected | Untested | — |
| AC-08.3 | Recruiter can edit their own posting | Untested | — |
| AC-08.4 | Recruiter sees applications received, with each applicant's resume | Not met (no resume attached) | — |
| AC-08.5 | Worker cannot open the posting editor | Untested | — |

## Open issues

- **Sign-up fails** (AC-A.1, AC-A.2): the Supabase `handle_new_user` trigger does not copy `phone` and `postal_code`, and the `profiles.phone` default fails its format check. The two tests are tagged `@writes` and skipped in CI.
- **No resume when applying** (AC-05.1, AC-05.4, AC-08.4): *Apply Now* does not ask for a resume or check that the Worker has one.
- **No file upload** (AC-01.6, AC-02.16, AC-02.17) and **no resume delete** (AC-02.18).

## Notes

- The apply tests intercept the submit request, so they don't write to Supabase.
- AC-05.1 is an expected failure (`test.fail()`): it turns red once the gap is fixed, as a reminder to remove the marker.
- Resume tests create resumes titled `[E2E] …` on the shared Worker account; clear them in Supabase from time to time.
