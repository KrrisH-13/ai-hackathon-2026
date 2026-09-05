-- v008_ecopilot_heating_systems_multi_select.sql
-- Heating system becomes a multi-select field (a home can combine e.g. an air
-- heat pump with electric backup), so heating_system (text) is replaced with
-- heating_systems (text[]) — same pattern as energy_saving_measures. Also
-- drops the "Fortum Clean Heat" branding from District Heating and splits
-- the old "Air Heat Pump + Electric" combo option into two independently
-- selectable options (see lib/ecopilot/types.ts).

alter table ecopilot_profiles add column heating_systems text[];

update ecopilot_profiles set heating_systems = case heating_system
  when 'District Heating (Fortum Clean Heat)' then array['District Heating']
  when 'Geothermal Heat Pump' then array['Geothermal Heat Pump']
  when 'Air Heat Pump + Electric' then array['Air Heat Pump', 'Electric']
  when 'Direct Electric Heating' then array['Direct Electric Heating']
  when 'Wood / Masonry Heater' then array['Wood / Masonry Heater']
  when 'Oil Heating (Transitioning Away)' then array['Oil Heating (Transitioning Away)']
  else array[heating_system]
end;

alter table ecopilot_profiles
  alter column heating_systems set not null,
  alter column heating_systems set default array['District Heating'];

alter table ecopilot_profiles drop column heating_system;
