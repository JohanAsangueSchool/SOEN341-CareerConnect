-- US-01 (AC-01.6) avatar pictures and US-02 (AC-02.16 – AC-02.18) resume files.
-- Applied to the shared Supabase project through the SQL Editor. Safe to re-run.

-- Avatars ---------------------------------------------------------------------
-- The bucket already exists. Making it public lets profiles.avatar_url be a
-- plain URL that every page can show. Each user writes under a folder named
-- after their id: <user id>/<file>.
update storage.buckets
set public = true,
    file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
where id = 'avatars';

drop policy if exists "Users can update their own avatar files" on storage.objects;
create policy "Users can update their own avatar files" on storage.objects
    for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their own avatar files" on storage.objects;
create policy "Users can delete their own avatar files" on storage.objects
    for delete to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Resume files ----------------------------------------------------------------
-- A resume can carry an uploaded file (PDF or Word) next to its form fields.
-- file_path is the object's path in the resume-files bucket, file_name the
-- name it was uploaded with.
alter table public.resumes
    add column if not exists file_path text,
    add column if not exists file_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'resume-files',
    'resume-files',
    false,
    5242880, -- 5 MB
    array[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
on conflict (id) do nothing;

-- Workers manage the files in their own folder.
drop policy if exists "Workers manage their own resume files" on storage.objects;
create policy "Workers manage their own resume files" on storage.objects
    for all to authenticated
    using (bucket_id = 'resume-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
    with check (
        bucket_id = 'resume-files'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and public.is_worker()
    );

-- Recruiters can read the file of a resume submitted to one of their postings.
drop policy if exists "Recruiters read resume files submitted to them" on storage.objects;
create policy "Recruiters read resume files submitted to them" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'resume-files'
        and exists (
            select 1 from public.resumes r
            where r.file_path = storage.objects.name
              and public.resume_submitted_to_recruiter(r.id)
        )
    );

-- Deleting resumes ------------------------------------------------------------
-- The authenticated role had no DELETE grant on resumes, so the existing
-- "Users can delete their own resumes" policy never applied. A resume linked to
-- an application stays, so the recruiter can still read what was submitted
-- (keep_application_resume already stops that link from changing).
create or replace function public.resume_in_use(target_resume_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (select 1 from public.applications a where a.resume_id = target_resume_id);
$$;

grant delete on public.resumes to authenticated;

drop policy if exists "Resumes used in an application cannot be deleted" on public.resumes;
create policy "Resumes used in an application cannot be deleted" on public.resumes
    as restrictive
    for delete to authenticated
    using (not public.resume_in_use(id));
