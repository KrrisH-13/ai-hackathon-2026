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
} from "@/lib/ecopilot/types";

/** PATCH /api/ecopilot/profile body — all fields optional, only known columns validated. */
export const ecopilotProfileUpdateSchema = z.object({
  district: z.enum(ESPOO_DISTRICTS).optional(),
  housingType: z.enum(HOUSING_TYPES).optional(),
  householdSize: z.number().int().min(1).max(12).optional(),
  livingAreaSqM: z.number().min(15).max(500).optional(),
  heatingSystem: z.enum(HEATING_SYSTEMS).optional(),
  electricityContract: z.enum(ELECTRICITY_CONTRACTS).optional(),
  saunaType: z.enum(SAUNA_TYPES).optional(),
  saunaTimesPerWeek: z.number().int().min(0).max(7).optional(),
  commuteHabit: z.enum(COMMUTE_HABITS).optional(),
  carType: z.enum(CAR_TYPES).nullable().optional(),
  carCo2GramsPerKm: z.number().min(0).max(1000).nullable().optional(),
  wasteManagementSystem: z.enum(WASTE_MANAGEMENT_SYSTEMS).optional(),
  energySavingMeasures: z.array(z.string()).optional(),
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
  source: z.enum(["manual", "activity-logger"]).optional(),
});

export type Co2LogFormData = z.infer<typeof co2LogInsertSchema>;

/** Shared between ActivityLoggerView and POST /api/ai/extract-activity. */
export const activityExtractRequestSchema = z.object({
  text: z.string().min(3, "Describe the trip in a few words").max(300),
});

export type ActivityExtractRequestData = z.infer<typeof activityExtractRequestSchema>;
