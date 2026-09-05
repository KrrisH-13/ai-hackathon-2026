-- v011_ecopilot_drop_energy_saving_measures.sql
-- Drops energy_saving_measures — confirmed unused outside the profile form
-- (no AI prompts, footprint calculations, or other views ever read it), and
-- the "Other Energy-Saving Measures" checkbox section is being removed from
-- ProfileCustomizerModal.tsx along with it.

alter table ecopilot_profiles drop column if exists energy_saving_measures;
