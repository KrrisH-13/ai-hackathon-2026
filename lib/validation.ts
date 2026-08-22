import { z } from "zod";
import {
  ESPOO_DISTRICTS,
  HOUSING_TYPES,
  HEATING_SYSTEMS,
  ELECTRICITY_CONTRACTS,
  COMMUTE_HABITS,
  CAR_TYPES,
  WASTE_MANAGEMENT_SYSTEMS,
  SAUNA_TYPES,
  CO2_LOG_CATEGORIES,
} from "@/lib/ecopilot/types";

/** Shared between SubmissionForm and the /api/submissions route handler. */
export const submissionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;

/** Shared between ProfileCustomizerModal and PATCH /api/ecopilot/profile. */
export const ecopilotProfileUpdateSchema = z
  .object({
    district: z.enum(ESPOO_DISTRICTS),
    housingType: z.enum(HOUSING_TYPES),
    householdSize: z.number().int().min(1).max(20),
    livingAreaSqM: z.number().min(10).max(1000),
    heatingSystem: z.enum(HEATING_SYSTEMS),
    electricityContract: z.enum(ELECTRICITY_CONTRACTS),
    saunaType: z.enum(SAUNA_TYPES),
    saunaTimesPerWeek: z.number().int().min(0).max(14),
    commuteHabit: z.enum(COMMUTE_HABITS),
    carType: z.enum(CAR_TYPES).nullable(),
    carCo2GramsPerKm: z.number().min(0).max(1000).nullable(),
    wasteManagementSystem: z.enum(WASTE_MANAGEMENT_SYSTEMS),
    energySavingMeasures: z.array(z.string().min(1).max(80)).max(20),
    estimatedFootprintTonnes: z.number().min(0).max(50),
    targetFootprintTonnes: z.number().min(0).max(50),
  })
  .partial();

export type EcopilotProfileFormData = z.infer<typeof ecopilotProfileUpdateSchema>;

/** Shared between the CO2 tracker's log form and POST /api/ecopilot/co2-logs. */
export const co2LogInsertSchema = z.object({
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .optional(),
  category: z.enum(CO2_LOG_CATEGORIES),
  description: z.string().min(3, "Description must be at least 3 characters").max(200),
  co2Kg: z.number().min(-1000).max(1000),
});

export type Co2LogFormData = z.infer<typeof co2LogInsertSchema>;
