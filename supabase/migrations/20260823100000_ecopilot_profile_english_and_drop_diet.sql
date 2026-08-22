-- v004_ecopilot_profile_english_and_drop_diet.sql
-- Two changes to ecopilot_profiles, in support of dropping the diet
-- preference field and standardizing on English-only option text:
--   1. Drop diet_preference entirely (unused by the UI going forward).
--   2. Rewrite heating_system / electricity_contract / commute_habit /
--      waste_management_system values from the old Finnish-led wording to
--      the new English-only wording (see lib/ecopilot/types.ts), migrating
--      any existing rows and updating column defaults for new signups.

alter table ecopilot_profiles drop column if exists diet_preference;

-- waste_management_system has a check constraint — drop/recreate around the rename.
alter table ecopilot_profiles drop constraint if exists ecopilot_profiles_waste_management_system_check;

update ecopilot_profiles set waste_management_system = case waste_management_system
  when 'Täyslajittelu (Sorts everything per HSY guide)' then 'Full Sorting (Sorts everything per HSY guide)'
  when 'Osittainen lajittelu (Some categories sorted)' then 'Partial Sorting (Some categories sorted)'
  when 'Ei lajittelua / Sekajäte (No sorting / mixed waste only)' then 'No Sorting (Mixed waste only)'
  else waste_management_system
end;

alter table ecopilot_profiles
  alter column waste_management_system set default 'Partial Sorting (Some categories sorted)',
  add constraint ecopilot_profiles_waste_management_system_check
    check (waste_management_system in (
      'Full Sorting (Sorts everything per HSY guide)',
      'Partial Sorting (Some categories sorted)',
      'No Sorting (Mixed waste only)'
    ));

-- heating_system / electricity_contract / commute_habit are freeform text
-- (no check constraint) — just migrate existing rows and refresh defaults.
update ecopilot_profiles set heating_system = case heating_system
  when 'Kaukolämpö (District Heating / Fortum Clean Heat)' then 'District Heating (Fortum Clean Heat)'
  when 'Maalämpö (Geothermal Heat Pump)' then 'Geothermal Heat Pump'
  when 'Ilmalämpöpumppu + Suora sähkö (Air Heat Pump + Electric)' then 'Air Heat Pump + Electric'
  when 'Suora sähkölämmitys (Direct Electric)' then 'Direct Electric Heating'
  when 'Puulämmitys / Varaava takka (Wood / Masonry Heater)' then 'Wood / Masonry Heater'
  when 'Öljylämmitys / Poistuva (Oil / Transitioning)' then 'Oil Heating (Transitioning Away)'
  else heating_system
end;

update ecopilot_profiles set electricity_contract = case electricity_contract
  when 'Pörssisähkö (Nord Pool Hourly Spot)' then 'Nord Pool Hourly Spot Price'
  when 'Kiinteähintainen (Fixed-Price Contract)' then 'Fixed-Price Contract'
  when 'Uusiutuva / EKOenergia (100% Certified Green)' then 'Renewable / Certified Green (100%)'
  else electricity_contract
end;

update ecopilot_profiles set commute_habit = case commute_habit
  when 'Pääosin HSL (Metro, Pikaratikka 15, Juna, Bussi)' then 'Public Transit (Metro, Light Rail, Train, Bus)'
  when 'Kävellen ja Pyörällä (Cycling & Walking / Baana)' then 'Cycling & Walking'
  when 'Sähköauto (Electric Vehicle)' then 'Electric Vehicle (EV)'
  when 'Ladattava hybridi (PHEV)' then 'Plug-in Hybrid (PHEV)'
  when 'Polttomoottoriauto (Bensiini / Diesel)' then 'Petrol / Diesel Car'
  when 'Etätyö / Hybridityö (Remote First)' then 'Remote / Hybrid Work'
  else commute_habit
end;

alter table ecopilot_profiles
  alter column heating_system set default 'District Heating (Fortum Clean Heat)',
  alter column electricity_contract set default 'Fixed-Price Contract',
  alter column commute_habit set default 'Public Transit (Metro, Light Rail, Train, Bus)';
