import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EcopilotProfile, EcopilotProfileUpdate, Co2Log, Co2LogInsert } from "@/lib/db/types";
import type { UserProfile, Co2LogEntry, Co2DailyTotal } from "./types";

type Client = SupabaseClient<Database>;

/** Best-effort display name from the Google OAuth profile Supabase Auth already captured. */
export function displayNameFromUser(user: { user_metadata?: Record<string, unknown>; email?: string | null }): string {
  const metadata = user.user_metadata ?? {};
  return (metadata.full_name as string) || (metadata.name as string) || user.email || "Espoo resident";
}

/** The ecopilot profile row, auto-created on signup — see the handle_new_user() trigger. */
export async function getEcopilotProfile(userId: string, client: Client): Promise<EcopilotProfile | null> {
  const { data, error } = await client.from("ecopilot_profiles").select("*").eq("user_id", userId).maybeSingle();

  if (error) throw new Error(`Failed to fetch ecopilot profile: ${error.message}`);
  return data;
}

export async function updateEcopilotProfile(
  userId: string,
  patch: EcopilotProfileUpdate,
  client: Client
): Promise<EcopilotProfile> {
  const { data, error } = await client
    .from("ecopilot_profiles")
    .update(patch)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update ecopilot profile: ${error.message}`);
  return data;
}

/** CO2 ledger rows from the last `days` days, newest first. */
export async function getRecentCo2Logs(userId: string, client: Client, days = 30): Promise<Co2Log[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await client
    .from("ecopilot_co2_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("occurred_on", sinceStr)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch CO2 logs: ${error.message}`);
  return data;
}

export async function insertCo2Log(userId: string, entry: Co2LogInsert, client: Client): Promise<Co2Log> {
  const { data, error } = await client
    .from("ecopilot_co2_logs")
    .insert([{ ...entry, user_id: userId }])
    .select()
    .single();

  if (error) throw new Error(`Failed to log CO2 activity: ${error.message}`);
  return data;
}

export async function deleteCo2Log(userId: string, id: string, client: Client): Promise<void> {
  const { error } = await client.from("ecopilot_co2_logs").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(`Failed to delete CO2 log: ${error.message}`);
}

/** Lifetime CO2 saved (sum of all negative/avoided entries), for the share-pledge badge. */
export async function getTotalCo2SavedKg(userId: string, client: Client): Promise<number> {
  const { data, error } = await client
    .from("ecopilot_co2_logs")
    .select("co2_kg")
    .eq("user_id", userId)
    .lt("co2_kg", 0);

  if (error) throw new Error(`Failed to compute total CO2 saved: ${error.message}`);
  return round2(data.reduce((sum, row) => sum + -row.co2_kg, 0));
}

export function aggregateDailyTotals(logs: Co2Log[]): Co2DailyTotal[] {
  const totals = new Map<string, number>();
  for (const log of logs) {
    totals.set(log.occurred_on, (totals.get(log.occurred_on) ?? 0) + log.co2_kg);
  }

  return Array.from(totals.entries())
    .map(([date, netCo2Kg]) => ({ date, netCo2Kg: round2(netCo2Kg) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toCo2LogEntries(logs: Co2Log[]): Co2LogEntry[] {
  return logs.map((log) => ({
    id: log.id,
    occurredOn: log.occurred_on,
    category: log.category,
    description: log.description,
    co2Kg: log.co2_kg,
    source: log.source,
  }));
}

/** Maps the DB row (+ display name and computed lifetime savings) to the UserProfile shape the ported UI expects. */
export function mapProfileRowToUserProfile(row: EcopilotProfile, displayName: string, savedCo2Kg: number): UserProfile {
  return {
    id: row.user_id,
    name: displayName,
    district: row.district,
    housingType: row.housing_type,
    householdSize: row.household_size,
    livingAreaSqM: row.living_area_sq_m,
    heatingSystem: row.heating_system,
    electricityContract: row.electricity_contract,
    saunaType: row.sauna_type,
    saunaTimesPerWeek: row.sauna_times_per_week,
    commuteHabit: row.commute_habit,
    carType: row.car_type,
    carCo2GramsPerKm: row.car_co2_grams_per_km,
    wasteManagementSystem: row.waste_management_system,
    energySavingMeasures: row.energy_saving_measures,
    estimatedFootprintTonnes: row.estimated_footprint_tonnes,
    targetFootprintTonnes: row.target_footprint_tonnes,
    savedCo2Kg,
  };
}

/** Inverse of the mapping above, for PATCH requests — only known DB columns are passed through. */
export function mapUserProfileToUpdate(patch: Partial<UserProfile>): EcopilotProfileUpdate {
  const update: EcopilotProfileUpdate = {};

  if (patch.district !== undefined) update.district = patch.district;
  if (patch.housingType !== undefined) update.housing_type = patch.housingType;
  if (patch.householdSize !== undefined) update.household_size = patch.householdSize;
  if (patch.livingAreaSqM !== undefined) update.living_area_sq_m = patch.livingAreaSqM;
  if (patch.heatingSystem !== undefined) update.heating_system = patch.heatingSystem;
  if (patch.electricityContract !== undefined) update.electricity_contract = patch.electricityContract;
  if (patch.saunaType !== undefined) update.sauna_type = patch.saunaType;
  if (patch.saunaTimesPerWeek !== undefined) update.sauna_times_per_week = patch.saunaTimesPerWeek;
  if (patch.commuteHabit !== undefined) update.commute_habit = patch.commuteHabit;
  if (patch.carType !== undefined) update.car_type = patch.carType;
  if (patch.carCo2GramsPerKm !== undefined) update.car_co2_grams_per_km = patch.carCo2GramsPerKm;
  if (patch.wasteManagementSystem !== undefined) update.waste_management_system = patch.wasteManagementSystem;
  if (patch.energySavingMeasures !== undefined) update.energy_saving_measures = patch.energySavingMeasures;
  if (patch.estimatedFootprintTonnes !== undefined) update.estimated_footprint_tonnes = patch.estimatedFootprintTonnes;
  if (patch.targetFootprintTonnes !== undefined) update.target_footprint_tonnes = patch.targetFootprintTonnes;

  return update;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
