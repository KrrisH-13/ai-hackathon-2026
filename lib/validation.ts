import { z } from "zod";
import {
  HOUSING_TYPES,
  ESPOO_DISTRICTS,
  HEATING_SYSTEMS,
  ELECTRICITY_CONTRACTS,
  COMMUTE_HABITS,
  CAR_TYPES,
  WASTE_MANAGEMENT_SYSTEMS,
  SAUNA_TYPES,
  CO2_LOG_CATEGORIES,
  FREQUENT_PLACE_ICON_KEYS,
  FREQUENT_PLACE_TRANSPORT_MODES,
} from "@/lib/ecopilot/types";

/** One frequently-visited place on the profile — see FrequentPlace in types.ts. */
export const frequentPlaceSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().trim().min(1).max(60),
  icon: z.enum(FREQUENT_PLACE_ICON_KEYS),
  transportMode: z.enum(FREQUENT_PLACE_TRANSPORT_MODES).nullable(),
  address: z.string().trim().max(200).nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lon: z.number().min(-180).max(180).nullable(),
});

/** PATCH /api/ecopilot/profile body — all fields optional, only known columns validated. */
export const ecopilotProfileUpdateSchema = z.object({
  district: z.enum(ESPOO_DISTRICTS).optional(),
  homeAddress: z.string().trim().max(200).nullable().optional(),
  homeLat: z.number().min(-90).max(90).nullable().optional(),
  homeLon: z.number().min(-180).max(180).nullable().optional(),
  housingType: z.enum(HOUSING_TYPES).optional(),
  householdSize: z.number().int().min(1).max(12).optional(),
  livingAreaSqM: z.number().min(15).max(500).optional(),
  heatingSystems: z.array(z.enum(HEATING_SYSTEMS)).min(1).optional(),
  electricityContract: z.enum(ELECTRICITY_CONTRACTS).optional(),
  saunaType: z.enum(SAUNA_TYPES).optional(),
  saunaTimesPerWeek: z.number().int().min(0).max(7).optional(),
  commuteHabit: z.enum(COMMUTE_HABITS).optional(),
  carType: z.enum(CAR_TYPES).nullable().optional(),
  carCo2GramsPerKm: z.number().min(0).max(1000).nullable().optional(),
  frequentPlaces: z.array(frequentPlaceSchema).max(12).optional(),
  wasteManagementSystem: z.enum(WASTE_MANAGEMENT_SYSTEMS).optional(),
  estimatedFootprintTonnes: z.number().min(0).optional(),
  targetFootprintTonnes: z.number().min(0).optional(),
});

/** POST /api/ecopilot/co2-logs body — a single manually-logged CO2 ledger entry. */
export const co2LogInsertSchema = z.object({
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "occurredOn must be YYYY-MM-DD").optional(),
  category: z.enum(CO2_LOG_CATEGORIES),
  description: z.string().min(1),
  co2Kg: z.number(),
  /** Only sources an API caller may set directly — the rest are reserved for other server-side flows. */
  source: z.enum(["manual", "activity-logger", "what-if"]).optional(),
});

export type Co2LogFormData = z.infer<typeof co2LogInsertSchema>;

/** Shared between ActivityLoggerView and POST /api/ai/extract-activity. */
export const activityExtractRequestSchema = z.object({
  text: z.string().min(3, "Describe the trip in a few words").max(300),
});

export type ActivityExtractRequestData = z.infer<typeof activityExtractRequestSchema>;
