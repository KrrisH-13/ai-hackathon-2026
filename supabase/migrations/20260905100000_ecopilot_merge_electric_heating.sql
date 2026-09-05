-- v009_ecopilot_merge_electric_heating.sql
-- "Electric" (split from the old "Air Heat Pump + Electric" combo in
-- v008) and "Direct Electric Heating" represent the same thing under
-- multi-select heating systems — merge them into a single "Electric
-- Heating" option (see lib/ecopilot/types.ts) and dedupe any row that
-- ended up with both.

update ecopilot_profiles
set heating_systems = (
  select array_agg(x)
  from (
    select distinct case when s in ('Electric', 'Direct Electric Heating') then 'Electric Heating' else s end as x
    from unnest(heating_systems) as s
  ) t
)
where heating_systems && array['Electric', 'Direct Electric Heating'];
