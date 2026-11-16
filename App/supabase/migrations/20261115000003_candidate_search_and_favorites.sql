-- US-14 (AC-14.x) candidate search and US-15 (AC-15.x) favorite candidates.
-- Applied to the shared Supabase project through the SQL Editor. Safe to re-run.

-- Favorites -------------------------------------------------------------------
create table if not exists public.favorite_candidates (
    recruiter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    candidate_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (recruiter_id, candidate_id)
);

alter table public.favorite_candidates enable row level security;

grant select, insert, delete on public.favorite_candidates to authenticated;

drop policy if exists "Recruiters read their favorites" on public.favorite_candidates;
create policy "Recruiters read their favorites" on public.favorite_candidates
    for select to authenticated
    using (recruiter_id = (select auth.uid()));

drop policy if exists "Recruiters add Workers to their favorites" on public.favorite_candidates;
create policy "Recruiters add Workers to their favorites" on public.favorite_candidates
    for insert to authenticated
    with check (
        recruiter_id = (select auth.uid())
        and exists (
            select 1 from public.profiles me
            where me.id = (select auth.uid()) and me.account_type = 'Recruiter'
        )
        and exists (
            select 1 from public.profiles candidate
            where candidate.id = candidate_id and candidate.account_type = 'Worker'
        )
    );

drop policy if exists "Recruiters remove their favorites" on public.favorite_candidates;
create policy "Recruiters remove their favorites" on public.favorite_candidates
    for delete to authenticated
    using (recruiter_id = (select auth.uid()));

-- Search ----------------------------------------------------------------------
-- Workers whose name, email or a skill on one of their non-archived resumes
-- contains `search` (everyone when it is empty), with their skills and whether
-- the calling Recruiter has them as a favorite. Returns nothing to anyone who
-- is not a Recruiter.
create or replace function public.search_candidates(
    search text default '',
    only_favorites boolean default false
)
returns table (
    id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    postal_code text,
    avatar_url text,
    skills text[],
    is_favorite boolean
)
language sql
stable
security definer
set search_path = ''
as $$
    with caller as (
        select 1 from public.profiles me
        where me.id = auth.uid() and me.account_type = 'Recruiter'
    ),
    term as (
        select nullif(trim(coalesce(search, '')), '') as value
    ),
    skills as (
        select r.user_id, array_agg(distinct s ->> 'name' order by s ->> 'name') as names
        from public.resumes r
        cross join lateral jsonb_array_elements(r.skills) s
        where r.status <> 'Archived' and coalesce(s ->> 'name', '') <> ''
        group by r.user_id
    )
    select
        p.id, p.first_name, p.last_name, p.email, p.phone, p.postal_code, p.avatar_url,
        coalesce(sk.names, '{}'),
        f.candidate_id is not null
    from public.profiles p
    cross join term
    left join skills sk on sk.user_id = p.id
    left join public.favorite_candidates f
        on f.candidate_id = p.id and f.recruiter_id = auth.uid()
    where exists (select 1 from caller)
      and p.account_type = 'Worker'
      and (not only_favorites or f.candidate_id is not null)
      and (
          term.value is null
          or (p.first_name || ' ' || p.last_name) ilike '%' || term.value || '%'
          or p.email ilike '%' || term.value || '%'
          or exists (select 1 from unnest(sk.names) n where n ilike '%' || term.value || '%')
      )
    order by p.last_name, p.first_name
    limit 50;
$$;

revoke execute on function public.search_candidates(text, boolean) from public, anon;
grant execute on function public.search_candidates(text, boolean) to authenticated;
