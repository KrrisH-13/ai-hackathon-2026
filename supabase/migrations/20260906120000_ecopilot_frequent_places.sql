-- v013_ecopilot_frequent_places.sql
-- Adds the user's list of frequently-visited places to the climate profile
-- (work, grocery store, a child's day care, a hobby class, ...). Stored as a
-- small jsonb array on ecopilot_profiles rather than its own table — it's an
-- embedded, app-owned list. Each element is:
--   { "id": string, "label": string, "icon": string, "transportMode": string|null }
-- where `icon` is one of the FREQUENT_PLACE_ICON_KEYS and `transportMode` is a
-- FREQUENT_PLACE_TRANSPORT_MODES value or null (see lib/ecopilot/types.ts).
-- A later feature will let users log a trip to one of these places by id.

alter table ecopilot_profiles
  add column frequent_places jsonb not null default '[]'::jsonb;
