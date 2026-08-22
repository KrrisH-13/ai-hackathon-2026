-- v006_ecopilot_co2_logs_activity_logger_source.sql
-- Natural-language activity logger (Gemini function calling) tags its ledger
-- entries with source = 'activity-logger' so a future reward system can
-- filter on it — widen the check constraint to allow that value.

alter table ecopilot_co2_logs drop constraint ecopilot_co2_logs_source_check;

alter table ecopilot_co2_logs add constraint ecopilot_co2_logs_source_check
  check (source in ('manual', 'energy-optimizer', 'commute-comparator', 'waste-classifier', 'roadmap-sprint', 'activity-logger'));
