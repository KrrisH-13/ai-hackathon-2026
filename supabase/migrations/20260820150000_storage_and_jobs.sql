-- v002_storage_and_jobs.sql
-- Adds a private "attachments" storage bucket (for the upload helper in
-- lib/supabase/storage.ts) and a Postgres-backed background job queue (for
-- the worker in app/api/jobs/process/route.ts). Both are intentionally
-- generic/topic-agnostic — wire up real job `type`s in lib/jobs/handlers.ts
-- once the hackathon domain is picked.

-- ============================================================
-- Storage: attachments bucket
-- ============================================================
-- MIME type / size limits are enforced in the app layer (lib/constants.ts)
-- rather than here, so they can change without a migration.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Object paths are always `${user_id}/...` (see lib/supabase/storage.ts),
-- so ownership is just "first path segment matches auth.uid()".
create policy "attachments_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_select_staff_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.current_user_role() in ('staff', 'admin')
  );

create policy "attachments_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Jobs: Postgres-backed background queue
-- ============================================================
-- Deliberately not exposed to `anon`/`authenticated` at all (no GRANTs
-- below) — only server-side code using the service-role client
-- (lib/supabase/admin.ts) can enqueue or claim jobs. This keeps it simple:
-- no RLS policy logic to get wrong, since regular users never touch this
-- table directly.

create table jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_pending_run_after_idx on jobs (run_after) where status = 'pending';

create trigger jobs_set_updated_at
  before update on jobs
  for each row execute function public.set_updated_at();

alter table jobs enable row level security;

grant all on jobs to service_role;

-- Atomically claims up to `job_limit` pending jobs using SKIP LOCKED, so
-- concurrent worker invocations never process the same job twice.
create or replace function public.claim_jobs(job_limit int default 5)
returns setof jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update jobs
    set status = 'processing', attempts = attempts + 1, updated_at = now()
    where id in (
      select id from jobs
      where status = 'pending' and run_after <= now()
      order by created_at
      limit job_limit
      for update skip locked
    )
    returning *;
end;
$$;

revoke all on function public.claim_jobs(int) from public;
grant execute on function public.claim_jobs(int) to service_role;
