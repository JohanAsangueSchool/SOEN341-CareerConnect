-- US-23 (AC-23.x) application deadline reminders. Apply to the shared Supabase
-- project through the SQL Editor. Safe to re-run.
--
-- Builds on the notifications set up for feature/notification-reminder, which
-- are already in the shared project: the public.notifications table
-- (user_id, type, title, message, link, read_at, created_at), the
-- jobs.application_deadline column, and the triggers that notify Recruiters of
-- new applications (US-24) and Workers of status changes (US-07, US-22).

-- Already in the shared project; only adds it to a fresh one.
alter table public.jobs add column if not exists application_deadline date;

-- Adds a 'job_expiring' notification for each Open posting the calling Worker
-- saved, has not applied to, and whose deadline is today or in the next 3
-- days. The app calls it before listing notifications, so no scheduled job is
-- needed. A posting that already has a reminder for this Worker is skipped.
create or replace function public.create_deadline_reminders()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
    insert into public.notifications (user_id, type, title, message, link)
    select
        auth.uid(),
        'job_expiring',
        'Saved job expiring soon',
        format(
            'The application deadline for %s at %s is %s (%s). You saved it but have not applied yet.',
            j.title,
            j.company,
            case j.application_deadline - current_date
                when 0 then 'today'
                when 1 then 'tomorrow'
                else 'in ' || (j.application_deadline - current_date) || ' days'
            end,
            to_char(j.application_deadline, 'FMMonth FMDD, YYYY')
        ),
        '/jobs/' || j.id::text
    from public.saved_jobs s
    join public.jobs j on j.id = s.job_id
    where s.user_id = auth.uid()
      and j.status = 'Open'
      and j.application_deadline between current_date and current_date + 3
      and not exists (
          select 1 from public.applications a
          where a.job_id = j.id and a.user_id = auth.uid()
      )
      and not exists (
          select 1 from public.notifications n
          where n.user_id = auth.uid()
            and n.type = 'job_expiring'
            and n.link = '/jobs/' || j.id::text
      );
$$;

revoke execute on function public.create_deadline_reminders() from public, anon;
grant execute on function public.create_deadline_reminders() to authenticated;
