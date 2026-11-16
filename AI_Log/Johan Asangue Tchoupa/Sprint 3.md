# AI Log — Sprint 3

**Tool used:** Claude Code

## Task 3.2: Notifications Migration — Debugging a Supabase Error

**Purpose of AI Use**

Debugging. The migration for the notification features (US-22, US-23, US-24) failed when it was run in the Supabase SQL editor.

**Chat Link or Prompt/Response**

**Prompt:**

"Failed to run sql query: ERROR: 42703: column "kind" does not exist
LINE 33: where kind = 'deadline_reminder';"

**AI-Suggested Content**

AI explained that the column existed in the migration, so the error meant a `notifications` table was already in the shared database with different columns. Because the migration used `create table if not exists`, Postgres skipped the new table, and the next statement failed on the old one. AI first renamed the new table to avoid the conflict and gave SQL queries to inspect the old table. The queries showed 3 recent rows of types `application_status`, `new_job` and `job_expiring`. This meant a teammate was building notifications at the same time. AI then found the `feature/notification-reminder` branch and gave a `pg_trigger` query, which showed that the database already had triggers for new applications and status changes. AI suggested not running the migration and reworking it to use the existing `notifications` table and `jobs.application_deadline` column. The migration now only adds the missing deadline reminder function.

**Validation**

Ran the inspection queries (`information_schema.columns`, the table rows and `pg_trigger`) in the Supabase SQL editor, read the teammate's branch, and checked that the reworked code passed the type check, the lint and the production build.

**Decision**

Accepted. The first fix (renaming the table) was dropped: it would have created two notification tables, two deadline columns and duplicate notifications for every status change.

**Reflection**

Running the migration again or renaming the table would have hidden a bigger problem: two people were building the same feature on one shared database. Inspecting the database before changing it showed this. The database setup was only in Supabase and not in any migration file, so the team should commit database changes as migrations.

**Responsible Person:** Johan Asangue Tchoupa
