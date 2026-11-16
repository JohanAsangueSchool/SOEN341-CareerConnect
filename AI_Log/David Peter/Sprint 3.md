### Task: Features from Earlier Sprints and Acceptance Tests

**Tool**

Claude Code

**Purpose of AI Use**

To get help adding acceptance tests for every user story, debugging failing tests, and implementing the user stories left over from earlier sprints.

**Prompt**

"Make sure there are at least 2 acceptance tests per user story, then finish the work from earlier sprints."

**AI-Suggested Content**

- Acceptance tests so every user story has at least two, and CI that shows each story's test status on its issue.
- Debugging that found the AC-18.1 bug (the header tabs followed their old link) and a database permission error when deleting a resume.
- Code for the leftover features I picked (profile pictures, resume files, saved jobs, candidate search) and their database changes.

**Validation**

Reviewed the changes, tried each feature in the app, and ran the tests locally and on GitHub. All checks on the pull requests pass.

**Decision**

I chose which stories to finish and which to leave out (notifications, and Johan's applications branch), and merged the work through pull requests after review.

**Reflection**

AI was most useful for writing tests and tracking down bugs. I decided the scope, checked the results in the app, and decided what to merge.

**Responsible Person:** David Peter

---

### Task: AI Resume Feedback and AI Cover Letter

**Tool**

Claude Code

**Purpose of AI Use**

To get help choosing a free AI service and connecting it to the app for the Sprint 3 AI feature (AI-powered resume feedback) and the cover letter generator.

**Prompt**

"What can I do for feature 4? I start now and finish in a later sprint." and "I need a free way to implement this AI feature, I will not pay for an API."

**AI-Suggested Content**

- Using Google Gemini's free tier instead of a paid API, with a fallback to another free model when one is overloaded.
- Code for the resume feedback (overall comment, strengths and ranked suggestions) and the cover letter generator.
- A plan for Sprint 4: feedback history, feedback for a specific job, Word files and a daily limit per user.

**Validation**

Tested both features in the app with a real resume, checked that the feedback matched what was actually in the resume, and ran the AI acceptance tests with a Gemini key. All 6 AI tests pass.

**Decision**

I picked Gemini because it is free, kept the API key out of the code (stored in `.env` and as a GitHub secret), and merged the features in #64.

**Reflection**

AI helped me find a free option and figure out why answers were slow (the free models were overloaded). I reviewed the feedback quality myself and planned what to finish in Sprint 4.

**Responsible Person:** David Peter
