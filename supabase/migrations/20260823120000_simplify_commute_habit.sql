-- v005_simplify_commute_habit.sql
-- Preferred transport is now a plain 3-way choice (Car / Public Transport /
-- Bike / Walk) — car type/CO2 details live in the separate car_type +
-- car_co2_grams_per_km columns, asked only when commute_habit = 'Car'.

update ecopilot_profiles set commute_habit = case commute_habit
  when 'Electric Vehicle (EV)' then 'Car'
  when 'Plug-in Hybrid (PHEV)' then 'Car'
  when 'Petrol / Diesel Car' then 'Car'
  when 'Public Transit (Metro, Light Rail, Train, Bus)' then 'Public Transport'
  when 'Cycling & Walking' then 'Bike / Walk'
  when 'Remote / Hybrid Work' then 'Public Transport'
  else commute_habit
end;

alter table ecopilot_profiles alter column commute_habit set default 'Public Transport';
