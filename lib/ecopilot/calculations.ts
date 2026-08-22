import type { Season } from "./types";

/**
 * Deterministic CO2/cost/EcoCredits math, ported from the expanded
 * "Kipinä Espoo AI" prototype's climate/calculations.ts +
 * services/ecoCreditsEngine.ts. Every formula here is plain arithmetic —
 * no Gemini call ever computes a number; the AI explains, this calculates.
 * Pure functions, no I/O.
 */

export const CALCULATION_ENGINE_VERSION = "ecopilot-2026.1-deterministic";
export const ECOCREDITS_DISCLAIMER = "Prototype reward points — not financial or verified carbon credits.";

export const NORDIC_EMISSION_FACTORS = {
  GRID_FINLAND_AVERAGE: 45, // g CO2/kWh
  GRID_PEAK_FOSSIL: 140,
  GRID_WIND_CLEAN: 18,
  DISTRICT_HEAT_ESPOO_2026: 68,
  DISTRICT_HEAT_TARGET_2030: 12,
  DIRECT_ELECTRIC: 45,
  OIL: 268,
  WOOD_NET: 25,
} as const;

export const NORDIC_PRICING_BENCHMARKS = {
  SPOT_EVENING_PEAK_CENTS: 17.5,
  SPOT_OFF_PEAK_NIGHT_CENTS: 2.4,
  SPOT_DAY_AVERAGE_CENTS: 5.8,
  HSL_AB_SINGLE_TICKET_EUR: 3.1,
} as const;

export const TRANSPORT_MODES = [
  "car_petrol",
  "car_diesel",
  "car_ev",
  "car_phev",
  "hsl_metro_train_tram",
  "hsl_bus_electric",
  "hsl_bus_diesel",
  "bike_walk",
] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

/** g CO2 per passenger-km. */
export const TRANSPORT_EMISSION_FACTORS: Record<TransportMode, number> = {
  car_petrol: 142,
  car_diesel: 135,
  car_ev: 19,
  car_phev: 65,
  hsl_metro_train_tram: 0,
  hsl_bus_electric: 8,
  hsl_bus_diesel: 55,
  bike_walk: 0,
};

/** EUR per km (excludes the flat parking/ticket add-ons applied in calculateTransportImpact). */
export const TRANSPORT_COST_PER_KM: Record<TransportMode, number> = {
  car_petrol: 0.28,
  car_diesel: 0.25,
  car_ev: 0.08,
  car_phev: 0.18,
  hsl_metro_train_tram: 0,
  hsl_bus_electric: 0,
  hsl_bus_diesel: 0,
  bike_walk: 0.01,
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clampMin(value: number | undefined, min: number, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.max(min, value);
}

function clampRange(value: number | undefined, min: number, max: number, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

// ============================================================
// Electricity
// ============================================================

export interface ElectricityCO2Result {
  co2Grams: number;
  co2Kg: number;
  warnings: string[];
}

export function calculateElectricityCO2(input: { energyKWh: number; emissionFactorGCO2PerKWh?: number }): ElectricityCO2Result {
  const warnings: string[] = [];

  let energy = input.energyKWh;
  if (!Number.isFinite(energy) || energy < 0) {
    warnings.push(`Invalid energy value (${input.energyKWh}); treated as 0 kWh.`);
    energy = 0;
  }

  let factor = input.emissionFactorGCO2PerKWh;
  if (factor == null || !Number.isFinite(factor)) {
    factor = NORDIC_EMISSION_FACTORS.GRID_FINLAND_AVERAGE;
    warnings.push(`No emission factor provided; defaulted to Finland grid average (${factor} g CO2/kWh).`);
  }

  const co2Grams = round(energy * factor, 2);
  return { co2Grams, co2Kg: round(co2Grams / 1000, 4), warnings };
}

export interface ElectricityCostResult {
  energyCostEur: number;
  transferCostEur: number;
  estimatedCostEur: number;
  isNegativePrice: boolean;
  warnings: string[];
}

export function calculateElectricityCost(input: {
  energyKWh: number;
  priceCentsPerKWh?: number;
  transferCentsPerKWh?: number;
  fixedChargesEur?: number;
}): ElectricityCostResult {
  const warnings: string[] = [];

  let energy = input.energyKWh;
  if (!Number.isFinite(energy) || energy < 0) {
    warnings.push(`Invalid energy value (${input.energyKWh}); treated as 0 kWh.`);
    energy = 0;
  }

  let price = input.priceCentsPerKWh;
  if (price == null || !Number.isFinite(price)) {
    price = NORDIC_PRICING_BENCHMARKS.SPOT_DAY_AVERAGE_CENTS;
    warnings.push(`No spot price provided; defaulted to the day-average benchmark (${price} c/kWh).`);
  }

  const transfer = Math.max(0, input.transferCentsPerKWh ?? 0);
  const fixed = Math.max(0, input.fixedChargesEur ?? 0);

  const energyCostEur = round((energy * price) / 100, 4);
  const transferCostEur = round((energy * transfer) / 100, 4);
  const estimatedCostEur = round(energyCostEur + transferCostEur + fixed, 2);

  return { energyCostEur, transferCostEur, estimatedCostEur, isNegativePrice: price < 0, warnings };
}

export interface ShiftComparisonResult {
  current: { cost: ElectricityCostResult; co2: ElectricityCO2Result };
  alternative: { cost: ElectricityCostResult; co2: ElectricityCO2Result };
  costDifferenceEur: number;
  costDifferencePercent: number;
  co2DifferenceKg: number;
  co2DifferencePercent: number;
  isCostBeneficial: boolean;
  isCo2Beneficial: boolean;
}

/** Compares running the same load now vs. at an alternative time (e.g. sauna at 18:00 vs 22:00). */
export function calculateShiftComparison(input: {
  energyKWh: number;
  currentTime: { priceCentsPerKWh: number; emissionFactorGCO2PerKWh: number };
  alternativeTime: { priceCentsPerKWh: number; emissionFactorGCO2PerKWh: number };
  fixedChargesEur?: number;
  transferFeeCentsKwh?: number;
}): ShiftComparisonResult {
  const currentCost = calculateElectricityCost({
    energyKWh: input.energyKWh,
    priceCentsPerKWh: input.currentTime.priceCentsPerKWh,
    transferCentsPerKWh: input.transferFeeCentsKwh,
    fixedChargesEur: input.fixedChargesEur,
  });
  const currentCo2 = calculateElectricityCO2({
    energyKWh: input.energyKWh,
    emissionFactorGCO2PerKWh: input.currentTime.emissionFactorGCO2PerKWh,
  });
  const altCost = calculateElectricityCost({
    energyKWh: input.energyKWh,
    priceCentsPerKWh: input.alternativeTime.priceCentsPerKWh,
    transferCentsPerKWh: input.transferFeeCentsKwh,
    fixedChargesEur: input.fixedChargesEur,
  });
  const altCo2 = calculateElectricityCO2({
    energyKWh: input.energyKWh,
    emissionFactorGCO2PerKWh: input.alternativeTime.emissionFactorGCO2PerKWh,
  });

  const costDifferenceEur = round(currentCost.estimatedCostEur - altCost.estimatedCostEur, 2);
  const costDifferencePercent =
    currentCost.estimatedCostEur !== 0 ? round((costDifferenceEur / currentCost.estimatedCostEur) * 100, 1) : 0;

  const co2DifferenceKg = round(currentCo2.co2Kg - altCo2.co2Kg, 4);
  const co2DifferencePercent = currentCo2.co2Kg !== 0 ? round((co2DifferenceKg / currentCo2.co2Kg) * 100, 1) : 0;

  return {
    current: { cost: currentCost, co2: currentCo2 },
    alternative: { cost: altCost, co2: altCo2 },
    costDifferenceEur,
    costDifferencePercent,
    co2DifferenceKg,
    co2DifferencePercent,
    isCostBeneficial: costDifferenceEur > 0,
    isCo2Beneficial: co2DifferenceKg > 0,
  };
}

// ============================================================
// Transport
// ============================================================

export interface TransportImpactResult {
  distanceKm: number;
  baselineMode: TransportMode;
  alternativeMode: TransportMode;
  baselineCo2GramsPerTrip: number;
  alternativeCo2GramsPerTrip: number;
  co2SavedKgPerTrip: number;
  baselineCostEurPerTrip: number;
  alternativeCostEurPerTrip: number;
  costSavedEurPerTrip: number;
  tripsPerWeek: number;
  weeksPerYear: number;
  annualCo2SavedKg: number;
  annualCostSavedEur: number;
  treesEquivalent: number;
}

export function calculateTransportImpact(input: {
  distanceKm: number;
  baselineMode: TransportMode;
  alternativeMode: TransportMode;
  ticketPriceEur?: number;
  tripsPerWeek?: number;
  weeksPerYear?: number;
}): TransportImpactResult {
  const distance = clampMin(input.distanceKm, 0.5, 10);
  const tripsPerWeek = clampMin(input.tripsPerWeek, 1, 10);
  const weeksPerYear = clampRange(input.weeksPerYear, 1, 52, 44);

  const baseFactor = TRANSPORT_EMISSION_FACTORS[input.baselineMode] ?? TRANSPORT_EMISSION_FACTORS.car_petrol;
  const altFactor = TRANSPORT_EMISSION_FACTORS[input.alternativeMode] ?? TRANSPORT_EMISSION_FACTORS.car_petrol;

  const baselineCo2GramsPerTrip = round(distance * baseFactor, 0);
  const alternativeCo2GramsPerTrip = round(distance * altFactor, 0);
  const co2SavedKgPerTrip = round(Math.max(0, (baselineCo2GramsPerTrip - alternativeCo2GramsPerTrip) / 1000), 3);

  const baseCostPerKm = TRANSPORT_COST_PER_KM[input.baselineMode] ?? TRANSPORT_COST_PER_KM.car_petrol;
  const altCostPerKm = TRANSPORT_COST_PER_KM[input.alternativeMode] ?? TRANSPORT_COST_PER_KM.car_petrol;

  const baselineCostEurPerTrip = round(distance * baseCostPerKm, 2) + (input.baselineMode.startsWith("car") ? 1.0 : 0);
  const alternativeCostEurPerTrip = input.alternativeMode.startsWith("hsl")
    ? input.ticketPriceEur ?? NORDIC_PRICING_BENCHMARKS.HSL_AB_SINGLE_TICKET_EUR
    : round(distance * altCostPerKm, 2);
  const costSavedEurPerTrip = round(Math.max(0, baselineCostEurPerTrip - alternativeCostEurPerTrip), 2);

  const annualCo2SavedKg = round(co2SavedKgPerTrip * tripsPerWeek * weeksPerYear, 0);
  const annualCostSavedEur = round(costSavedEurPerTrip * tripsPerWeek * weeksPerYear, 2);
  const treesEquivalent = Math.max(1, round(annualCo2SavedKg / 22, 0));

  return {
    distanceKm: distance,
    baselineMode: input.baselineMode,
    alternativeMode: input.alternativeMode,
    baselineCo2GramsPerTrip,
    alternativeCo2GramsPerTrip,
    co2SavedKgPerTrip,
    baselineCostEurPerTrip,
    alternativeCostEurPerTrip,
    costSavedEurPerTrip,
    tripsPerWeek,
    weeksPerYear,
    annualCo2SavedKg,
    annualCostSavedEur,
    treesEquivalent,
  };
}

// ============================================================
// EcoCredits (confidence-discounted, capped, auditable)
// ============================================================

export type EcoCreditConfidence = "HIGH" | "MEDIUM" | "LOW";

const CONFIDENCE_MULTIPLIERS: Record<EcoCreditConfidence, number> = { HIGH: 1.0, MEDIUM: 0.7, LOW: 0.0 };
const ECOCREDIT_CAP_LIMIT = 50;

export interface EcoCreditCalculationInput {
  actionId: string;
  actionTitle: string;
  avoidedCo2Kg: number;
  confidence?: EcoCreditConfidence;
  streakDays?: number;
}

export interface EcoCreditCalculationResult {
  actionId: string;
  actionTitle: string;
  avoidedCo2Kg: number;
  rawCredits: number;
  confidenceMultiplier: number;
  confidence: EcoCreditConfidence;
  cappedCredits: number;
  streakBonusCredits: number;
  finalCreditsAwarded: number;
  isCapped: boolean;
  capLimit: number;
  calculationSteps: string[];
  formula: string;
  disclaimer: string;
}

/** 10 credits per kg CO2 avoided, discounted by confidence, capped per action, +streak bonus. */
export function calculateEcoCreditsForImpact(input: EcoCreditCalculationInput): EcoCreditCalculationResult {
  const co2Kg = Math.max(0, Number(input.avoidedCo2Kg) || 0);
  const rawCredits = round(co2Kg * 10, 0);

  const confidence = input.confidence ?? "HIGH";
  const confidenceMultiplier = CONFIDENCE_MULTIPLIERS[confidence];
  const confidenceAdjusted = round(rawCredits * confidenceMultiplier, 0);

  const cappedCredits = Math.min(ECOCREDIT_CAP_LIMIT, confidenceAdjusted);
  const isCapped = confidenceAdjusted > ECOCREDIT_CAP_LIMIT;

  const streak = Math.max(1, input.streakDays || 1);
  const streakBonusCredits = Math.min(5, Math.floor((streak - 1) / 5));

  const finalCreditsAwarded = Math.max(1, cappedCredits + streakBonusCredits);

  return {
    actionId: input.actionId,
    actionTitle: input.actionTitle,
    avoidedCo2Kg: co2Kg,
    rawCredits,
    confidenceMultiplier,
    confidence,
    cappedCredits,
    streakBonusCredits,
    finalCreditsAwarded,
    isCapped,
    capLimit: ECOCREDIT_CAP_LIMIT,
    calculationSteps: [
      `Avoided CO2: ${co2Kg} kg`,
      `Raw credits (10 credits/kg): ${rawCredits}`,
      `Confidence (${confidence} × ${confidenceMultiplier}): ${confidenceAdjusted}`,
      `Capped at ${ECOCREDIT_CAP_LIMIT}/action: ${cappedCredits}${isCapped ? " (capped)" : ""}`,
      `Streak bonus (day ${streak}): +${streakBonusCredits}`,
      `Final credits awarded: ${finalCreditsAwarded}`,
    ],
    formula: "credits = max(1, min(50, round(avoidedCo2Kg * 10 * confidenceMultiplier)) + min(5, floor((streakDays-1)/5)))",
    disclaimer: ECOCREDITS_DISCLAIMER,
  };
}

// ============================================================
// Domain-specific deterministic helpers (What-If simulator)
// ============================================================

/** Default 6.8kW kiuas, 1.5h session; 70-75°C uses 25% less energy than a full 90°C session. */
export function calculateDeterministicSaunaImpact(
  kiuasKw = 6.8,
  targetTempCelsius = 75,
  spotPriceCentsKwh = 2.4,
  gridCo2IntensityGramsKwh = 18
): { kwhUsed: number; shiftComparison: ShiftComparisonResult; gridFlexibilityBonus: number } {
  const kwhUsed = round(kiuasKw * 1.5 * (targetTempCelsius <= 75 ? 0.75 : 1.0), 2);

  const shiftComparison = calculateShiftComparison({
    energyKWh: kwhUsed,
    currentTime: {
      priceCentsPerKWh: NORDIC_PRICING_BENCHMARKS.SPOT_EVENING_PEAK_CENTS,
      emissionFactorGCO2PerKWh: NORDIC_EMISSION_FACTORS.GRID_PEAK_FOSSIL,
    },
    alternativeTime: { priceCentsPerKWh: spotPriceCentsKwh, emissionFactorGCO2PerKWh: gridCo2IntensityGramsKwh },
  });

  return { kwhUsed, shiftComparison, gridFlexibilityBonus: spotPriceCentsKwh < 5 ? 25 : 10 };
}

const HEATING_SEASON_MULTIPLIER: Record<Season, number> = { winter: 1.0, autumn: 0.6, spring: 0.4, summer: 0.05 };
const HEATING_DAYS_PER_YEAR = 210;

export interface HeatingAdjustmentResult {
  heatingKwhSavedPerDay: number;
  co2SavedKgPerDay: number;
  costSavedEurPerDay: number;
  annualCo2SavedKg: number;
  annualCostSavedEur: number;
}

/** Every 1°C of thermostat reduction saves ~5% of the day's heating energy. */
export function calculateDeterministicHeatingAdjustment(
  livingAreaSqM: number,
  degreesReduced = 1,
  season: Season = "winter"
): HeatingAdjustmentResult {
  const area = clampRange(livingAreaSqM, 20, 500, 60);
  const baseDailyHeatingKwh = area * 0.48 * HEATING_SEASON_MULTIPLIER[season];
  const heatingKwhSavedPerDay = round(baseDailyHeatingKwh * degreesReduced * 0.05, 2);
  const co2SavedKgPerDay = round((heatingKwhSavedPerDay * NORDIC_EMISSION_FACTORS.DISTRICT_HEAT_ESPOO_2026) / 1000, 2);
  const costSavedEurPerDay = round(heatingKwhSavedPerDay * 0.095, 2);

  return {
    heatingKwhSavedPerDay,
    co2SavedKgPerDay,
    costSavedEurPerDay,
    annualCo2SavedKg: round(co2SavedKgPerDay * HEATING_DAYS_PER_YEAR, 1),
    annualCostSavedEur: round(costSavedEurPerDay * HEATING_DAYS_PER_YEAR, 2),
  };
}

/** Commute impact of switching a petrol car commute to HSL transit, defaulting to 220 workdays/year. */
export function calculateDeterministicCommuteImpact(distanceKm: number, commuteDaysPerYear = 220): TransportImpactResult {
  return calculateTransportImpact({
    distanceKm,
    baselineMode: "car_petrol",
    alternativeMode: "hsl_metro_train_tram",
    tripsPerWeek: 10,
    weeksPerYear: round(commuteDaysPerYear / 5, 0),
  });
}
