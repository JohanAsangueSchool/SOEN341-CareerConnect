-- US-04 (AC-04.1, AC-04.2) saved jobs. Applied to the shared Supabase project
-- through the SQL Editor. Safe to re-run.

create table if not exists public.saved_jobs (
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    job_id uuid not null references public.jobs (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, job_id)
);

alter table public.saved_jobs enable row level security;

grant select, insert, delete on public.saved_jobs to authenticated;

drop policy if exists "Workers read their saved jobs" on public.saved_jobs;
create policy "Workers read their saved jobs" on public.saved_jobs
    for select to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists "Workers save jobs" on public.saved_jobs;
create policy "Workers save jobs" on public.saved_jobs
    for insert to authenticated
    with check (user_id = (select auth.uid()) and public.is_worker());

drop policy if exists "Workers unsave jobs" on public.saved_jobs;
create policy "Workers unsave jobs" on public.saved_jobs
    for delete to authenticated
    using (user_id = (select auth.uid()));
