-- v003_ecopilot_profiles_and_co2_logs.sql
-- Adds the per-user ecopilot climate profile (heating, house type, waste
-- management, transport/car, other energy-saving measures) and a per-day
-- CO2 activity ledger, both scoped to the logged-in account via RLS.

-- ============================================================
-- Tables
-- ============================================================

create table ecopilot_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  district text not null default 'Vanha-Espoo (Espoon keskus, Tuomarila, Kauklahti)',
  housing_type text not null default 'kerrostalo'
    check (housing_type in ('kerrostalo', 'rivitalo', 'omakotitalo', 'paritalo')),
  living_area_sq_m numeric not null default 60,
  household_size int not null default 1,
  heating_system text not null default 'Kaukolämpö (District Heating / Fortum Clean Heat)',
  electricity_contract text not null default 'Kiinteähintainen (Fixed-Price Contract)',
  sauna_type text not null default 'none' check (sauna_type in ('electric', 'wood', 'none')),
  sauna_times_per_week int not null default 0,
  -- Preferred transport mode.
  commute_habit text not null default 'Pääosin HSL (Metro, Pikaratikka 15, Juna, Bussi)',
  -- Only meaningful when commute_habit involves driving; nullable otherwise.
  car_type text check (car_type in ('petrol', 'diesel', 'hybrid', 'phev', 'ev', 'none')),
  car_co2_grams_per_km numeric,
  waste_management_system text not null default 'Osittainen lajittelu (Some categories sorted)'
    check (waste_management_system in (
      'Täyslajittelu (Sorts everything per HSY guide)',
      'Osittainen lajittelu (Some categories sorted)',
      'Ei lajittelua / Sekajäte (No sorting / mixed waste only)'
    )),
  diet_preference text not null default 'omnivore'
    check (diet_preference in ('omnivore', 'flexitarian', 'vegetarian', 'vegan')),
  -- Other energy-saving measures already in place (solar panels, smart thermostat, etc).
  energy_saving_measures text[] not null default '{}',
  estimated_footprint_tonnes numeric not null default 5.0,
  target_footprint_tonnes numeric not null default 2.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ecopilot_profiles_set_updated_at
  before update on ecopilot_profiles
  for each row execute function public.set_updated_at();

-- Append-only ledger: one row per logged activity (not one row per day), so a
-- day's net footprint is the sum of that day's rows. co2_kg is signed —
-- positive = emitted, negative = saved/avoided.
create table ecopilot_co2_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_on date not null default current_date,
  category text not null check (category in ('heating', 'transport', 'waste', 'energy', 'food', 'other')),
  description text not null,
  co2_kg numeric not null,
  source text not null default 'manual'
    check (source in ('manual', 'energy-optimizer', 'commute-comparator', 'waste-classifier', 'roadmap-sprint')),
  created_at timestamptz not null default now()
);

create index ecopilot_co2_logs_user_date_idx on ecopilot_co2_logs (user_id, occurred_on desc);

-- ============================================================
-- Row-Level Security — every row is scoped to its own account only.
-- ============================================================

alter table ecopilot_profiles enable row level security;
alter table ecopilot_co2_logs enable row level security;

create policy "ecopilot_profiles_select_own" on ecopilot_profiles
  for select using (auth.uid() = user_id);

create policy "ecopilot_profiles_insert_own" on ecopilot_profiles
  for insert with check (auth.uid() = user_id);

create policy "ecopilot_profiles_update_own" on ecopilot_profiles
  for update using (auth.uid() = user_id);

create policy "ecopilot_co2_logs_select_own" on ecopilot_co2_logs
  for select using (auth.uid() = user_id);

create policy "ecopilot_co2_logs_insert_own" on ecopilot_co2_logs
  for insert with check (auth.uid() = user_id);

create policy "ecopilot_co2_logs_delete_own" on ecopilot_co2_logs
  for delete using (auth.uid() = user_id);

grant select, insert, update on ecopilot_profiles to authenticated;
grant select, insert, delete on ecopilot_co2_logs to authenticated;

grant all on ecopilot_profiles to service_role;
grant all on ecopilot_co2_logs to service_role;

-- ============================================================
-- Auto-create a default ecopilot profile alongside the existing `profiles`
-- row on signup (extends the v001 handle_new_user() trigger function).
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

  insert into public.ecopilot_profiles (user_id)
  values (new.id);

  return new;
end;
$$;

-- Backfill: give every existing account a default ecopilot profile too.
insert into public.ecopilot_profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
