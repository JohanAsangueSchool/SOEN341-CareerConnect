### Task: Acceptance Tests and Debugging

**Tool**

Claude Code

**Purpose of AI Use**

To create the acceptance tests for Sprint 2 and to debug the project.

**Prompt**

"Write automated acceptance tests for our Sprint 2 user stories, run them, and help me debug any failures."

**AI-Suggested Content**

- Playwright acceptance tests for sign-in, sign-up, access control, the account page and resumes.
- A GitHub Actions workflow that runs the tests on every push and pull request.
- Debugging of failing tests, which found bugs in the project (editing a resume opened an empty form, sign-up failing in Supabase, a typo in a validation message).

**Validation**

Ran the tests locally and on GitHub and checked the results against the acceptance criteria. All 34 tests pass.

**Decision**

Kept the tests, opened pull requests for the tests and the bug fix, and reported the sign-up bug to the team.

**Reflection**

AI made it faster to write the tests and find bugs. I reviewed the results and decided what to merge.

**Responsible Person:** David Peter
