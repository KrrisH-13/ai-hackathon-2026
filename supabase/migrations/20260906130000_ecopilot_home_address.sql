-- v014_ecopilot_home_address.sql
-- Adds the user's home address to the climate profile. Stored as a free-text
-- address plus optional coordinates (captured when the address is picked from
-- the Finland autocomplete, see components/ecopilot/AddressAutocomplete.tsx).
-- The coordinates give a later quick trip-logging feature a fixed origin
-- without a second lookup. All nullable — a profile may have no address set.

alter table ecopilot_profiles
  add column home_address text,
  add column home_lat numeric,
  add column home_lon numeric;
