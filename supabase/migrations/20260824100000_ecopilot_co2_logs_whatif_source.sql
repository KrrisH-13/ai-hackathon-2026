-- v007_ecopilot_co2_logs_whatif_source.sql
-- The What-If projection tool ("Add to plan & log it") tags entries with
-- source = 'what-if' so the Tracker & Rewards history can distinguish a
-- committed what-if projection from a manually logged or auto-detected
-- activity — widen the check constraint to allow that value.

alter table ecopilot_co2_logs drop constraint ecopilot_co2_logs_source_check;

alter table ecopilot_co2_logs add constraint ecopilot_co2_logs_source_check
  check (source in ('manual', 'energy-optimizer', 'commute-comparator', 'waste-classifier', 'roadmap-sprint', 'activity-logger', 'what-if'));
