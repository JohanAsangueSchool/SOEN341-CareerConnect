# Acceptance Tests — Sprint 2

**Project:** CareerConnect
**Sprint:** 2
**Date:** 2026-10-22

---

## 1. Purpose

This document defines the acceptance tests for the seven user stories the team
committed to in Sprint 2.

Per the course material, an acceptance test is a *functional test that verifies
the system implements the story as intended*. Every user story has one or more
acceptance tests, and **a story is not complete until it has passed them**. The
acceptance test is the *Confirmation* element of a user story — the third of the
three C's (Card, Conversation, Confirmation).

Following the INVEST checklist, every criterion below is written to be
**testable**: it states an observable outcome rather than an intention. Where a
criterion could not be made testable it was reworded until it could.

Acceptance tests are **automated wherever possible**. The criteria marked
`Implemented` are automated in Playwright under `App/tests/` and run in GitHub
Actions on every push and pull request. See section 6 for the traceability
matrix linking each criterion to its code artifact and its automated test.

## 2. Conventions

| Convention | Meaning |
|---|---|
| `AC-<story>.<n>` | Acceptance criterion identifier, e.g. `AC-02.3` |
| `Implemented` | The feature exists; the criterion is verifiable today |
| `Partial` | The story is partly built; see the story's notes |
| `Not built` | No implementation yet; the criterion is a specification |
| Automated | Covered by a Playwright test in `App/tests/` |
| Manual | Verified by hand against the running application |

**Priority** and **Story Points** below are proposed values for the team to
confirm at sprint planning; they are not yet agreed estimates.

## 3. Test environment

| Item | Value |
|---|---|
| Application URL | `http://localhost:3000` |
| Start command | `cd App && npm run dev` |
| Automated suite | `cd App && npm test` |
| Required env file | `App/.env` |

`App/.env` must contain:

```
NEXT_PUBLIC_SUPABASE_URL=<project url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

### Test accounts

Route access is gated on `profiles.account_type`, so two seeded accounts are
required:

| Account | `account_type` | Used for |
|---|---|---|
| Worker test account | `Worker` | US-01, US-02, US-03, US-16, US-05, US-06 |
| Recruiter test account | `Recruiter` | US-08, access-control criteria |

For the automated suite these are supplied as environment variables and are
never committed:

```
E2E_WORKER_EMAIL=
E2E_WORKER_PASSWORD=
E2E_WORKER_FIRST_NAME=
E2E_WORKER_LAST_NAME=
E2E_RECRUITER_EMAIL=
E2E_RECRUITER_PASSWORD=
```

The Worker's first and last name are needed because AC-01.1, AC-01.3 and
AC-01.4 assert on the displayed name and initials.

The team's shared Worker and Recruiter logins (posted in the #testing channel)
can be used for these. The automated suite also loads `App/.env`, so the
`E2E_*` values can sit in that file alongside the Supabase keys.

---

## 4. Foundation — Authentication & Access Control

Not a Sprint 2 story in its own right, but a precondition for every story
below, so its criteria are stated and automated first.

|  | **Authenticate and authorise users** |
|---|---|
| **Priority** | High |
| **Story Points** | 5 |
| **Status** | Implemented |

**Description (scenario):** As a user, I want to register and sign in with an
account of the correct type so that I can access the features intended for my
role.

### Acceptance criteria — registration and sign-in

- **AC-A.1** A visitor can register as a `Worker` with valid details and is
  signed in and taken to the home page.
- **AC-A.2** A visitor can register as a `Recruiter` with valid details and is
  signed in and taken to the home page.
- **AC-A.3** A first name shorter than two characters is rejected with
  *"First name must be minimum 2 characters."*
- **AC-A.4** A malformed email address is rejected with
  *"Invalid email address."*
- **AC-A.5** A phone number not matching `XXX-XXX-XXXX` is rejected with
  *"Phone number is invalid."*
- **AC-A.6** A postal code not matching `A1A 1A1` is rejected with
  *"Postal code is invalid."*
- **AC-A.7** A password shorter than six characters is rejected with
  *"Password must be minimum 6 characters."*
- **AC-A.8** A confirm-password value that differs from the password is rejected
  with *"Both password must be identicals."*
- **AC-A.9** A registered user signing in with correct credentials is taken to
  the home page.
- **AC-A.10** A sign-in attempt with an incorrect password does not sign the
  user in and shows an error notification.
- **AC-A.11** A signed-in user can sign out from the avatar menu and is returned
  to the sign-in page.

### Acceptance criteria — access control

- **AC-G.1** A signed-out visitor requesting the home page is redirected to
  `/signin`.
- **AC-G.2** A signed-out visitor requesting `/resumes` is redirected to
  `/signin`.
- **AC-G.3** A signed-in `Recruiter` requesting `/resumes` is redirected to the
  home page.
- **AC-G.4** A signed-in `Worker` requesting `/resumes` is shown the resumes
  page.
- **AC-G.5** A signed-in `Recruiter` is not shown a "Resumes" tab in the header
  navigation.

> **Note on AC-A.1 / AC-A.2** — these two criteria create real user records.
> If the Supabase project has email confirmation enabled, registration will not
> sign the user in immediately and both criteria must be reworded to expect a
> confirmation-email prompt instead. Confirm the project setting before
> accepting these as written.

---

## 5. Sprint 2 user stories

### US-01 — User Profile Management

|  | **Manage my profile** |
|---|---|
| **Priority** | High |
| **Story Points** | 5 |
| **Status** | **Partial** — profile is displayed but cannot be edited |

**Description (scenario):** As a job seeker, I want to create and update my
profile so that recruiters can learn about my education, occupation, and city of
residence.

**Scope (from the Sprint 2 plan):** Verify profile creating, editing, and
display.

#### Acceptance criteria

| ID | Criterion | Status |
|---|---|---|
| AC-01.1 | The account page displays the signed-in user's First Name, Last Name, Email, Phone and Postal Code, each under its own label. | Implemented |
| AC-01.2 | The account page displays the user's account type (`Worker` or `Recruiter`). | Implemented |
| AC-01.3 | When the user has no avatar image, the avatar shows their initials derived from first and last name. | Implemented |
| AC-01.4 | The header avatar menu displays the user's full name. | Implemented |
| AC-01.5 | The user can edit their profile fields and save, and the new values persist after reloading the page. | **Not built** |
| AC-01.6 | The user can upload or change their avatar image, and it replaces the initials. | **Not built** |

> **Gap against the story.** The story says "create and update my profile", but
> the account page is currently **read-only**. It renders a pencil icon over the
> avatar on hover, which has no handler attached and does nothing. AC-01.5 and
> AC-01.6 are therefore specifications for work still outstanding, and US-01
> cannot be marked complete until they pass.

---

### US-02 — Resume Management

|  | **Manage my resumes** |
|---|---|
| **Priority** | High |
| **Story Points** | 8 |
| **Status** | **Partial** — structured editor built; no file upload |

**Description (scenario):** As a job seeker, I want to upload and manage my
resume so that when applying for jobs, I can use the resume in my account
directly.

**Scope (from the Sprint 2 plan):** Verify resume uploading, replacing, and
display.

#### Acceptance criteria

| ID | Criterion | Status |
|---|---|---|
| AC-02.1 | A Worker can create a resume with a title; on saving they are returned to the resumes list and the new resume appears there. | Implemented |
| AC-02.2 | A newly created resume shows a `Draft` status badge. | Implemented |
| AC-02.3 | A Worker with no resumes sees an empty state reading "No resumes yet". | Implemented — **manual only** |
| AC-02.4 | Submitting the resume form with an empty title is rejected with *"Title is required."* | Implemented |
| AC-02.5 | A Worker can add an education entry with establishment, program and start month, and it persists after saving. | Implemented |
| AC-02.6 | An education entry with an empty establishment is rejected with *"Education establishment is required"*. | Implemented |
| AC-02.7 | A Worker can add a work experience entry with establishment, position and start month, and it persists after saving. | Implemented |
| AC-02.8 | A work experience entry with an empty position is rejected with *"Work position is required"*. | Implemented |
| AC-02.9 | A Worker can add a skill with a name, and a skill with an empty name is rejected with *"Skill name is required"*. | Implemented |
| AC-02.10 | A project entry whose link is not a valid URL is rejected with a validation message on the link field. | Implemented |
| AC-02.11 | A Worker can remove any education, experience, skill or project entry, and it no longer appears after saving. | Implemented |
| AC-02.12 | Opening an existing resume for editing pre-fills every field with its stored values. | Implemented |
| AC-02.13 | Changing a resume's status to `Active` or `Archived` is reflected in the badge on the resumes list. | Implemented |
| AC-02.14 | An education or experience entry saved with an empty end month is treated as ongoing and saves successfully. | Implemented |
| AC-02.15 | Each resume card shows the number of education, experience, skill and project entries it contains. | Implemented |
| AC-02.16 | A Worker can upload a resume file (PDF or DOCX) and it is stored against their account. | **Not built** |
| AC-02.17 | A Worker can replace a previously uploaded resume file, and the new file supersedes the old one. | **Not built** |
| AC-02.18 | A Worker can delete a resume, and it no longer appears in their list. | **Not built** |

> **AC-02.3 cannot be automated yet.** The empty state only appears when the
> account has no resumes, and because deletion is not implemented (AC-02.18)
> there is no way to return an account to that state once a resume exists. It is
> therefore verified by hand on a freshly created account. Automating it becomes
> possible as soon as AC-02.18 passes.

> **Gap against the story.** The story and the Sprint 2 scope both say
> "uploading" and "replacing", but the application contains **no file upload of
> any kind** — there is no use of Supabase Storage anywhere in the codebase.
> What exists is a *structured editor* that captures education, experience,
> skills and projects as form data. AC-02.16 and AC-02.17 cover the missing
> upload capability. AC-02.18 covers deletion, which also has no UI.
>
> The team should decide whether US-02 means file upload, structured entry, or
> both, and reword the story accordingly — at present the story and the
> implementation describe different features.

---

### US-03 — Job Search and Job Listing Interface

|  | **Search and filter job postings** |
|---|---|
| **Priority** | High |
| **Story Points** | 8 |
| **Status** | **Not built** |

**Description (scenario):** As a job seeker, I want to search and filter job
postings by keywords, location, and job type so that I can find relevant job
opportunities efficiently.

**Scope (from the Sprint 2 plan):** Display available job opportunities, and
provide search and filtering capabilities.

#### Acceptance criteria

| ID | Criterion | Status |
|---|---|---|
| AC-03.1 | A signed-in Worker sees a list of all available job postings, each showing at minimum its title, company and location. | Not built |
| AC-03.2 | Entering a keyword returns only postings whose title or description contains that keyword. | Not built |
| AC-03.3 | Selecting a location returns only postings in that location. | Not built |
| AC-03.4 | Selecting a job type returns only postings of that type. | Not built |
| AC-03.5 | A search or filter combination matching no postings shows an explicit "no results" message rather than an empty page. | Not built |

---

### US-16 — View Job Details

|  | **View job details** |
|---|---|
| **Priority** | Medium |
| **Story Points** | 3 |
| **Status** | **Not built** |

**Description (scenario):** As a job seeker, I want to view detailed job
descriptions so that I can better understand each position and decide whether to
apply.

**Scope (from the Sprint 2 plan):** Display detailed job descriptions.

#### Acceptance criteria

| ID | Criterion | Status |
|---|---|---|
| AC-16.1 | Selecting a posting from the listings opens a detail view for that posting. | Not built |
| AC-16.2 | The detail view shows the full job description together with the company, location, job type and posting date. | Not built |
| AC-16.3 | The user can return from the detail view to the listings with their previous search and filters still applied. | Not built |

---

### US-05 — Job Application Submission

|  | **Submit a job application** |
|---|---|
| **Priority** | High |
| **Story Points** | 5 |
| **Status** | **Not built** |

**Description (scenario):** As a job seeker, I want to submit a job application
through the platform so that I can apply for positions without managing
applications across multiple systems.

**Scope (from the Sprint 2 plan):** Enable job application and provide
confirmation of successful application submission.

#### Acceptance criteria

| ID | Criterion | Status |
|---|---|---|
| AC-05.1 | A Worker can apply to a posting by selecting one of their own resumes. | Not built |
| AC-05.2 | On successful submission the Worker is shown an explicit confirmation. | Not built |
| AC-05.3 | A Worker who has already applied to a posting cannot submit a second application to it. | Not built |
| AC-05.4 | A Worker with no resumes is prevented from applying and is told a resume is required. | Not built |

---

### US-06 — Job Application Tracking

|  | **Track my applications** |
|---|---|
| **Priority** | High |
| **Story Points** | 5 |
| **Status** | **Not built** |

**Description (scenario):** As a job seeker, I want to track the status of my
applications so that I know whether the status is applied, under review,
interview, offered, or rejected.

**Scope (from the Sprint 2 plan):** Display application status.

#### Acceptance criteria

| ID | Criterion | Status |
|---|---|---|
| AC-06.1 | A Worker sees a list of every application they have submitted, each identifying the posting applied to. | Not built |
| AC-06.2 | Each application displays its current status as one of: applied, under review, interview, offered, rejected. | Not built |
| AC-06.3 | When a recruiter changes an application's status, the Worker sees the updated status on their next visit to the tracking page. | Not built |

> **Note.** The Sprint 1 user story listed the statuses as "submitted, under
> review, rejected, or accepted". Sprint 2 revised them to "applied, under
> review, interview, offered, rejected". These criteria use the **Sprint 2**
> wording. The database enum must match whichever wording the team settles on.

---

### US-08 — Recruiter Posting Management

|  | **Create and manage job postings** |
|---|---|
| **Priority** | High |
| **Story Points** | 8 |
| **Status** | **Not built** |

**Description (scenario):** As a recruiter, I want to create and manage job
postings so that I can advertise available positions to job seekers.

**Scope (from the Sprint 2 plan):** Start implementing job postings creation and
management, and display applications received for a posting.

#### Acceptance criteria

| ID | Criterion | Status |
|---|---|---|
| AC-08.1 | A Recruiter can create a job posting, and it then appears in the Worker-facing job listings. | Not built |
| AC-08.2 | Creating a posting with any required field empty is rejected with a message identifying the missing field. | Not built |
| AC-08.3 | A Recruiter can edit one of their own postings, and the changes are reflected in the listings. | Not built |
| AC-08.4 | A Recruiter can view the applications received for one of their postings, including each applicant's selected resume. | Not built |
| AC-08.5 | A signed-in Worker cannot reach the recruiter posting-management pages and is redirected away. | Not built |

---

## 6. Requirement Traceability Matrix

| Criterion | Status | Code artifact | Automated test |
|---|---|---|---|
| AC-A.1 – AC-A.8 | Implemented | `App/src/app/(auth)/signup/page.tsx`, `App/src/utils/forms/auth.ts` | `App/tests/auth.spec.ts` |
| AC-A.9 – AC-A.10 | Implemented | `App/src/app/(auth)/signin/page.tsx`, `App/src/app/(auth)/signin/actions.ts` | `App/tests/auth.spec.ts` |
| AC-A.11 | Implemented | `App/src/app/(main)/layout.tsx` | `App/tests/signout.spec.ts` |
| AC-G.1 – AC-G.4 | Implemented | `App/src/lib/supabase/proxy.ts`, `App/src/proxy.ts` | `App/tests/guards.spec.ts` |
| AC-G.5 | Implemented | `App/src/app/(main)/layout.tsx` | `App/tests/guards.spec.ts` |
| AC-01.1 – AC-01.3 | Implemented | `App/src/app/(main)/account/page.tsx` | `App/tests/account.spec.ts` |
| AC-01.4 | Implemented | `App/src/app/(main)/layout.tsx` | `App/tests/account.spec.ts` |
| AC-01.5 – AC-01.6 | Not built | — | — |
| AC-02.1 – AC-02.2 | Implemented | `App/src/app/(main)/resumes/page.tsx`, `resumes/edit/page.tsx` | `App/tests/resumes.spec.ts` |
| AC-02.3 | Implemented | `App/src/app/(main)/resumes/page.tsx` | Manual — see note in § 5 |
| AC-02.4 – AC-02.10 | Implemented | `App/src/app/(main)/resumes/edit/page.tsx`, `App/src/utils/forms/resumes.ts` | `App/tests/resumes.spec.ts` |
| AC-02.11 – AC-02.14 | Implemented | `App/src/app/(main)/resumes/edit/page.tsx`, `resumes/edit/actions.ts` | `App/tests/resumes.spec.ts` |
| AC-02.15 | Implemented | `App/src/app/(main)/resumes/page.tsx` | `App/tests/resumes.spec.ts` |
| AC-02.16 – AC-02.18 | Not built | — | — |
| AC-03.1 – AC-03.5 | Not built | — | — |
| AC-16.1 – AC-16.3 | Not built | — | — |
| AC-05.1 – AC-05.4 | Not built | — | — |
| AC-06.1 – AC-06.3 | Not built | — | — |
| AC-08.1 – AC-08.5 | Not built | — | — |

## 7. Coverage summary

| Story | Criteria | Implemented | Not built |
|---|---|---|---|
| Foundation — auth & access control | 16 | 16 | 0 |
| US-01 — Profile management | 6 | 4 | 2 |
| US-02 — Resume management | 18 | 15 | 3 |
| US-03 — Job search | 5 | 0 | 5 |
| US-16 — Job details | 3 | 0 | 3 |
| US-05 — Application submission | 4 | 0 | 4 |
| US-06 — Application tracking | 3 | 0 | 3 |
| US-08 — Recruiter postings | 5 | 0 | 5 |
| **Total** | **60** | **35** | **25** |

**Sprint 2 completion status.** Because a story is not complete until its
acceptance tests pass, on these criteria **no Sprint 2 story is yet complete**.
US-01 and US-02 are closest, each blocked on a capability named in its own story
text — profile editing for US-01, file upload for US-02.

## 8. Running the automated tests

```bash
cd App
npm install
npx playwright install chromium   # one-time
npm test                          # runs the suite
npm run test:ui                   # interactive runner
```

The suite requires `App/.env` and the six `E2E_*` account variables described in
section 3. Criteria marked `Not built` have no automated test and are excluded
from the suite.

**34 of the 35 implemented criteria are automated.** AC-02.3 is manual, for the
reason given in section 5.

AC-A.1 and AC-A.2 register new users, so they are tagged `@writes`. To run
everything except those:

```bash
npm test -- --grep-invert @writes
```

Resumes created by the suite are prefixed `[E2E]` so they can be identified.
Because deletion is not implemented, they accumulate and need clearing from
Supabase by hand from time to time.

In continuous integration, `.github/workflows/test.yml` has two jobs:

| Job | Runs | Needs secrets |
|---|---|---|
| `build` | Lint and production build | No |
| `acceptance-tests` | This suite, excluding `@writes` | Yes |

The `acceptance-tests` job needs these repository secrets, added under
**Settings → Secrets and variables → Actions**:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`E2E_WORKER_EMAIL`, `E2E_WORKER_PASSWORD`, `E2E_WORKER_FIRST_NAME`,
`E2E_WORKER_LAST_NAME`, `E2E_RECRUITER_EMAIL`, `E2E_RECRUITER_PASSWORD`.
Until they are configured that job fails while `build` still passes.

## 9. Known issues found by the suite

Last run (production build, excluding `@writes`): **34 of 34 pass** with the
fix in #35. Without it, AC-02.5, AC-02.7, AC-02.12 and AC-02.13 fail on the
first defect below. The tests assert the intended behaviour, so they were left
unchanged while the application was fixed.

| Criteria | Defect | Where | Status |
|---|---|---|---|
| AC-02.5, AC-02.7, AC-02.12, AC-02.13 | Opening an existing resume showed an empty *Create Resume* form instead of the stored resume. `/resumes/edit` is prerendered as a static page, so `use(searchParams)` never received `id`. | `App/src/app/(main)/resumes/edit/page.tsx` | Fixed in #35 |
| AC-A.1, AC-A.2 | Registration fails with a server error. The `handle_new_user` trigger does not copy `phone` or `postal_code` from the sign-up data, and the default for `profiles.phone` violates the `phone_format_dash` check. | Supabase: `public.handle_new_user`, `public.profiles` | Open |
| — | The last-name validation message read "Last name must be minimum 2 requicharactersred." | `App/src/utils/forms/auth.ts` | Fixed in #35 |

Supabase's `signOut()` ends every session of the account, so AC-A.11 signs the
Worker back in afterwards to keep the shared session usable by the other specs.

