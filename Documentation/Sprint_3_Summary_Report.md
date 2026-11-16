# CareerConnect: Sprint 3 Summary Report

**Group B:** Johan Asangue Tchoupa · David Peter · Jiaxin Li · Sara Loudagh · Xinlei Tian

## Sprint Objectives

- Finish three features: **Recruiter Dashboard and Posting Management**, **Application Analytics and History Dashboard**, and **Notifications and Reminders** (US-17 to US-24, plus US-09 and US-10 carried over from Sprint 1).
- Start the AI features: **AI Resume Feedback** (US-25) and **AI Job Matching** (US-26).
- Finish the stories left over from Sprints 1 and 2, and write at least two automated acceptance tests for every user story.

## Features and Functionality Implemented

- **Recruiter dashboard:** recruiters see all their postings with application counts. They can create, edit, archive and restore postings, filter applications by status and submission date, and update an application's status.
- **Application history and analytics:** job seekers see their applications as cards, a breakdown by status, and a line chart of their applications over the last 30 days.
- **Notifications and reminders:** a header bell and a Notifications page with an unread badge. Notifications can be marked read or unread. Job seekers are told when an application's status changes, and recruiters when someone applies to one of their postings. Postings can now have an application deadline, which sends reminders for saved jobs that are about to close and disables Apply once it passes. Job seekers can also set job alerts by category.
- **AI features:** job matching ("Recommended for you", with a Strong or Good match and a reason for each posting), resume feedback (overall comment, strengths and ranked suggestions, and it reads uploaded PDFs), and a cover letter generator.
- **Stories left over from earlier sprints:** profile pictures, uploading and replacing resume files, saved jobs, and candidate search and favourite candidates for recruiters.

## Team Innovation and Original Features

- **Explained, verifiable AI recommendations:** each AI job match comes with a reason. Every suggestion is checked against the real list of open postings, so the AI cannot recommend a posting that does not exist.
- **Notifications created by the database:** Supabase triggers create the notifications themselves, so they work the same no matter which page or client causes the change.
- **Live test status on GitHub issues:** CI writes each user story's acceptance test results on its issue and labels the issue with its status, so the backlog always shows what passes.

## Challenges and Resolutions

| Challenge                                                                                         | Resolution                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two members built notifications on separate branches, so the work overlapped.                     | We kept one set of database triggers and connected the header bell to them. We also added the trigger that existed only in the shared database to the repo as a migration. |
| Pull requests #61 to #63 were merged into each other's branches instead of `main`.                | We found the problem and brought all three into `main` through PR #64.                                                                                                     |
| Free Gemini models were often busy, and a paid API was not an option.                             | We switched to the free Gemini API and fall back to the next model when one is busy. CI skips the AI tests when no API key is set.                                         |
| Some acceptance tests assumed the old UI, such as the avatar being the only button in the header. | We updated the test helpers and replaced the tests marked as expected failures with real end-to-end tests.                                                                 |

## Team Contributions

| Member                    | Main contributions                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Johan Asangue Tchoupa** | Header notifications bell (US-22, US-24), application deadline reminders (US-23), AI job matching (US-26), and PR reviews and merges                                            |
| **David Peter**           | Profile pictures and resume files, saved jobs, candidate search and favourites, AI cover letter, AI resume feedback (US-25), and acceptance tests and CI with live issue status |
| **Jiaxin Li**             | Sprint 3 user stories and scope, application history page (US-20), and 30-day activity chart (US-21)                                                                            |
| **Sara Loudagh**          | Notifications page and badge, status-change triggers, job alerts by category, and deadline reminders using a daily scheduled job (pg_cron)                                      |
| **Xinlei Tian**           | Recruiter dashboard and posting management (US-17 to US-19, US-10), its Playwright acceptance tests, and meeting minutes                                                        |

Each member's detailed log is in `Contributions_Log/` and their AI usage log is in `AI_Log/`.

## Repository Reference

https://github.com/JohanAsangueSchool/SOEN341-CareerConnect
