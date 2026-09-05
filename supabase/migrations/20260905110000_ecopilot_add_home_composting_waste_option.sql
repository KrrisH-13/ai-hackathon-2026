-- v010_ecopilot_add_home_composting_waste_option.sql
-- Adds a "Partial Sorting with Home Composting" option to
-- waste_management_system (see lib/ecopilot/types.ts) — recreate the check
-- constraint with the new value added; no existing rows need remapping.

alter table ecopilot_profiles drop constraint if exists ecopilot_profiles_waste_management_system_check;

alter table ecopilot_profiles
  add constraint ecopilot_profiles_waste_management_system_check
    check (waste_management_system in (
      'Full Sorting (Sorts everything per HSY guide)',
      'Partial Sorting (Some categories sorted)',
      'Partial Sorting with Home Composting (Some categories sorted, biowaste composted at home)',
      'No Sorting (Mixed waste only)'
    ));
