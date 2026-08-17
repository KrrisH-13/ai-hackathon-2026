-- v001_initial_schema.sql
-- Initial schema: profiles, submissions, RLS policies, and the trigger
-- that auto-creates a profile row when a new auth user signs up.

-- ============================================================
-- Tables
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'citizen' check (role in ('citizen', 'staff', 'admin')),
  district_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null,
  latitude numeric not null,
  longitude numeric not null,
  district_id text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index submissions_user_id_idx on submissions (user_id);
create index submissions_district_id_idx on submissions (district_id);

-- ============================================================
-- updated_at maintenance
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

create trigger submissions_set_updated_at
  before update on submissions
  for each row execute function public.set_updated_at();

-- ============================================================
-- Auto-create a profile row on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'citizen');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Role helper (SECURITY DEFINER avoids recursive RLS on `profiles`)
-- ============================================================

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table profiles enable row level security;
alter table submissions enable row level security;

-- profiles: a user can read/update their own row; admins can read all.
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on profiles
  for select using (public.current_user_role() = 'admin');

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- submissions: citizens see/manage their own; staff see their district;
-- admins see everything.
create policy "submissions_select_own" on submissions
  for select using (auth.uid() = user_id);

create policy "submissions_select_staff_district" on submissions
  for select using (
    public.current_user_role() = 'staff'
    and district_id is not distinct from (
      select district_id from public.profiles where id = auth.uid()
    )
  );

create policy "submissions_select_admin" on submissions
  for select using (public.current_user_role() = 'admin');

create policy "submissions_insert_own" on submissions
  for insert with check (auth.uid() = user_id);

create policy "submissions_update_own" on submissions
  for update using (auth.uid() = user_id);

create policy "submissions_update_staff_admin" on submissions
  for update using (public.current_user_role() in ('staff', 'admin'));

create policy "submissions_delete_own" on submissions
  for delete using (auth.uid() = user_id);
