# Contribution Log — Sprint 3

**Team Member:** Johan Asangue Tchoupa (40308923), [@JohanAsangueSchool](https://github.com/JohanAsangueSchool)

## Task 3.1: Application Status and New Application Notifications (US-22, US-24)

**Purpose**

Feature development. Notify job seekers when the status of one of their applications changes, and notify recruiters when a candidate applies to one of their postings.

**Contributions**

- Built a notifications bell in the header for both job seekers and recruiters, with an unread count, a dropdown list and a link to the related page (My Applications for a status change, the posting's applications for a new application).
- Opening the list marks the notifications as read. The list refreshes every minute and when the tab gets focus again.
- Connected the bell to the `notifications` table and the database triggers set up in `feature/notification-reminder`, which already create a notification on a new application and on a status change, instead of adding a second set of triggers.
- Replaced the expected-failure tests with real ones that run the whole flow: the recruiter creates a posting, the job seeker applies, the recruiter moves the application to Interview, and each side sees its notification.
- Updated the `avatarMenu` test helper, which assumed the avatar was the only button in the header.

**Links**

- Branch: _to add_
- Commit: _to add_
- Issues: [#51 US-22: Application Status Update Notifications](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/issues/51), [#53 US-24: New Application Notifications](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/issues/53)

**Time Spent**

_to fill in_

**Responsible Person:** Johan Asangue Tchoupa

## Task 3.2: Application Deadline Reminders (US-23)

**Purpose**

Feature development. Let recruiters set an application deadline on a posting, and remind job seekers about saved jobs whose deadline is close.

**Contributions**

- Added an optional Application Deadline field to the posting form, saved in `jobs.application_deadline`.
- Showed the deadline on the job cards and the job details page. The Apply button is disabled once the deadline has passed.
- Added the Supabase function `create_deadline_reminders`. It creates a "Saved job expiring soon" notification for each open posting the job seeker saved but has not applied to, when the deadline is today or in the next 3 days. The app calls it before loading notifications, so no scheduled job is needed, and each posting is only reminded once.
- Added tests for setting a deadline and for the reminder on a saved job.

**Links**

- Commit: _to add_
- Migration: `App/supabase/migrations/20261116000001_notifications_and_deadlines.sql`
- Issue: [#52 US-23: Application Deadline Reminders](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/issues/52)

**Time Spent**

_to fill in_

**Responsible Person:** Johan Asangue Tchoupa

## Task 3.3: AI Job Matching Suggestions (US-26)

**Purpose**

Feature development. Recommend open job postings to job seekers based on their resumes, and explain why each one fits.

**Contributions**

- Added a "Recommended for you" section at the top of the job seeker's Jobs page.
- Added the server action `getJobRecommendations`. It sends up to 3 of the job seeker's resumes and up to 40 open postings they have not applied to (and whose deadline has not passed) to Google Gemini, using the Gemini client already shared by the other AI features.
- Gemini answers in a fixed JSON format: up to 5 postings, each with a Strong or Good match and a reason. Postings are given short references in the prompt, and any reference not in the list is dropped, so the AI cannot recommend a posting that does not exist.
- Results are kept for 30 minutes in the browser session, with a refresh button. Job seekers without a resume are asked to create one first.
- Replaced the expected-failure tests with real ones. The test that calls Gemini creates a matching posting and resume, then cleans both up.

**Links**

- Branch: _to add_
- Commit: _to add_
- Issue: [#55 US-26: AI Job Matching Suggestions](https://github.com/JohanAsangueSchool/SOEN341-CareerConnect/issues/55)

**Time Spent**

_to fill in_

**Responsible Person:** Johan Asangue Tchoupa
