-- US-24 (AC-24.x) new application notifications. Apply to the shared Supabase
-- project through the SQL Editor. Safe to re-run.
--
-- The shared project already had this trigger, written outside the repo for
-- feature/notification-reminder. This keeps it in the repo, with the same
-- wording, so a fresh project gets it and the acceptance tests can rely on it.

-- Tells the Recruiter who owns the posting that someone applied to it.
create or replace function public.notify_recruiter_of_new_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    job_recruiter_id uuid;
    job_title text;
    applicant_name text;
begin
    select jobs.recruiter_id, jobs.title
    into job_recruiter_id, job_title
    from public.jobs
    where jobs.id = new.job_id;

    if job_recruiter_id is null then
        return new;
    end if;

    select nullif(trim(concat_ws(' ', profiles.first_name, profiles.last_name)), '')
    into applicant_name
    from public.profiles
    where profiles.id = new.user_id;

    insert into public.notifications (user_id, type, title, message, link)
    values (
        job_recruiter_id,
        'new_application',
        'New application',
        format('%s applied to %s.', coalesce(applicant_name, 'A candidate'), job_title),
        '/applications?job=' || new.job_id::text
    );

    return new;
end;
$$;

drop trigger if exists on_application_created on public.applications;
create trigger on_application_created
    after insert on public.applications
    for each row execute function public.notify_recruiter_of_new_application();

-- To check it is in place:
--   select tgname, tgenabled from pg_trigger
--   where tgrelid = 'public.applications'::regclass and not tgisinternal;
