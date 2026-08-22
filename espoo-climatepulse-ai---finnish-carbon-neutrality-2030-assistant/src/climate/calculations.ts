/**
 * EcoPilot Espoo — Deterministic Climate & Energy Calculation Engine
 * CRITICAL ARCHITECTURAL DIRECTIVE:
 * - Gemini AI must NOT calculate authoritative numerical values.
 * - All CO2, monetary savings, energy values, grid flexibility shifts,
 *   EcoCredits, and recommendation rankings are computed deterministically
 *   within this module using strict, verified mathematical formulas.
 */

import { NORDIC_EMISSION_FACTORS, NORDIC_PRICING_BENCHMARKS } from './constants';
import { HeatingSystem, Season } from '../types/climate';
import { EcoPilotUserProfile, UserConstraint, UserValuePriority } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';

export const CALCULATION_ENGINE_VERSION = '2026.1-deterministic';
export const CALCULATION_ENGINE_NOTICE = 'Numbers are calculated by EcoPilot’s calculation engine. AI provides reasoning and personalisation.';
export const ECOCREDITS_DISCLAIMER = 'Prototype reward points — not financial or verified carbon credits.';

export interface ElectricityCO2Input {
  energyKWh: number;
  emissionFactorGCO2PerKWh: number;
}

export interface ElectricityCO2Result {
  energyKWh: number;
  emissionFactorGCO2PerKWh: number;
  co2Grams: number;
  co2Kg: number;
  formula: string;
  isValid: boolean;
  warnings: string[];
}

export function calculateElectricityCO2(input: ElectricityCO2Input): ElectricityCO2Result {
  const warnings: string[] = [];
  let energy = input?.energyKWh;
  let factor = input?.emissionFactorGCO2PerKWh;
  let isValid = true;

  if (typeof energy !== 'number' || isNaN(energy)) {
    warnings.push('Invalid energyKWh provided. Defaulted to 0.');
    energy = 0;
    isValid = false;
  }
  if (typeof factor !== 'number' || isNaN(factor)) {
    warnings.push('Invalid emissionFactorGCO2PerKWh. Defaulted to Finnish grid avg (45 g/kWh).');
    factor = NORDIC_EMISSION_FACTORS.GRID_FINLAND_AVERAGE;
    isValid = false;
  }
  if (energy < 0) {
    warnings.push('energyKWh cannot be negative. Clamped to 0.');
    energy = 0;
  }
  if (factor < 0) {
    warnings.push('emissionFactorGCO2PerKWh cannot be negative. Clamped to 0.');
    factor = 0;
  }

  const co2Grams = Number((energy * factor).toFixed(2));
  const co2Kg = Number((co2Grams / 1000).toFixed(4));
  const formula = `${energy} kWh × ${factor} g CO2/kWh = ${co2Grams} g CO2 (${co2Kg} kg CO2)`;

  return {
    energyKWh: energy,
    emissionFactorGCO2PerKWh: factor,
    co2Grams,
    co2Kg,
    formula,
    isValid,
    warnings,
  };
}

export interface ElectricityCostInput {
  energyKWh: number;
  electricityPriceCentsKwh?: number;
  electricityPriceEurKwh?: number;
  fixedChargesEur?: number;
  transferFeeCentsKwh?: number;
}

export interface ElectricityCostResult {
  energyKWh: number;
  spotPriceCentsKwh: number;
  energyCostEur: number;
  transferCostEur: number;
  fixedCostEur: number;
  estimatedCostEur: number;
  isNegativePrice: boolean;
  formula: string;
  isValid: boolean;
  warnings: string[];
}

export function calculateElectricityCost(input: ElectricityCostInput): ElectricityCostResult {
  const warnings: string[] = [];
  let energy = input?.energyKWh;
  let isValid = true;

  if (typeof energy !== 'number' || isNaN(energy)) {
    warnings.push('Invalid energyKWh. Defaulted to 0.');
    energy = 0;
    isValid = false;
  }
  if (energy < 0) {
    warnings.push('energyKWh was negative. Clamped to 0.');
    energy = 0;
  }

  let priceCents = input?.electricityPriceCentsKwh;
  if (priceCents === undefined && input?.electricityPriceEurKwh !== undefined) {
    priceCents = input.electricityPriceEurKwh * 100;
  }
  if (priceCents === undefined || isNaN(priceCents)) {
    warnings.push('Missing electricity price. Defaulted to Finnish day average 5.8 c/kWh.');
    priceCents = NORDIC_PRICING_BENCHMARKS.SPOT_DAY_AVERAGE_CENTS;
  }

  const fixedEur = Math.max(0, input?.fixedChargesEur ?? 0);
  const transferCents = Math.max(0, input?.transferFeeCentsKwh ?? 0);
  const isNegativePrice = priceCents < 0;

  const energyCostEur = Number(((energy * priceCents) / 100).toFixed(4));
  const transferCostEur = Number(((energy * transferCents) / 100).toFixed(4));
  const estimatedCostEur = Number((energyCostEur + transferCostEur + fixedEur).toFixed(2));
  const formula = `(${energy} kWh × ${priceCents} c/kWh / 100) + transfer(${transferCostEur}€) + fixed(${fixedEur}€) = ${estimatedCostEur}€`;

  return {
    energyKWh: energy,
    spotPriceCentsKwh: priceCents,
    energyCostEur,
    transferCostEur,
    fixedCostEur: fixedEur,
    estimatedCostEur,
    isNegativePrice,
    formula,
    isValid,
    warnings,
  };
}

export interface TimeSlotData {
  timeLabel: string;
  priceCentsKwh: number;
  emissionFactorGCO2PerKWh: number;
}

export interface ShiftComparisonInput {
  energyKWh: number;
  currentTime: TimeSlotData;
  alternativeTime: TimeSlotData;
  fixedChargesEur?: number;
  transferFeeCentsKwh?: number;
}

export interface ShiftComparisonResult {
  energyKWh: number;
  currentTimeLabel: string;
  alternativeTimeLabel: string;
  currentEstimatedCostEur: number;
  alternativeEstimatedCostEur: number;
  costDifferenceEur: number;
  costDifferencePercent: number;
  currentEstimatedCo2Grams: number;
  currentEstimatedCo2Kg: number;
  alternativeEstimatedCo2Grams: number;
  alternativeEstimatedCo2Kg: number;
  co2DifferenceKg: number;
  co2DifferencePercent: number;
  isCostBeneficial: boolean;
  isCo2Beneficial: boolean;
  summary: string;
}

export function calculateShiftComparison(input: ShiftComparisonInput): ShiftComparisonResult {
  const energy = Math.max(0, input?.energyKWh || 0);
  const current = input.currentTime;
  const alternative = input.alternativeTime;

  const currentCostRes = calculateElectricityCost({
    energyKWh: energy,
    electricityPriceCentsKwh: current.priceCentsKwh,
    fixedChargesEur: input.fixedChargesEur,
    transferFeeCentsKwh: input.transferFeeCentsKwh,
  });

  const altCostRes = calculateElectricityCost({
    energyKWh: energy,
    electricityPriceCentsKwh: alternative.priceCentsKwh,
    fixedChargesEur: input.fixedChargesEur,
    transferFeeCentsKwh: input.transferFeeCentsKwh,
  });

  const currentCo2Res = calculateElectricityCO2({
    energyKWh: energy,
    emissionFactorGCO2PerKWh: current.emissionFactorGCO2PerKWh,
  });

  const altCo2Res = calculateElectricityCO2({
    energyKWh: energy,
    emissionFactorGCO2PerKWh: alternative.emissionFactorGCO2PerKWh,
  });

  const costDifferenceEur = Number((currentCostRes.estimatedCostEur - altCostRes.estimatedCostEur).toFixed(2));
  const costDifferencePercent =
    currentCostRes.estimatedCostEur > 0
      ? Number(((costDifferenceEur / currentCostRes.estimatedCostEur) * 100).toFixed(1))
      : 0;

  const co2DifferenceKg = Number((currentCo2Res.co2Kg - altCo2Res.co2Kg).toFixed(3));
  const co2DifferencePercent =
    currentCo2Res.co2Kg > 0
      ? Number(((co2DifferenceKg / currentCo2Res.co2Kg) * 100).toFixed(1))
      : 0;

  const isCostBeneficial = costDifferenceEur > 0;
  const isCo2Beneficial = co2DifferenceKg > 0;
  const summary = `Shifting ${energy} kWh from ${current.timeLabel} to ${alternative.timeLabel} saves €${costDifferenceEur} (${costDifferencePercent}%) and ${co2DifferenceKg} kg CO2 (${co2DifferencePercent}%).`;

  return {
    energyKWh: energy,
    currentTimeLabel: current.timeLabel,
    alternativeTimeLabel: alternative.timeLabel,
    currentEstimatedCostEur: currentCostRes.estimatedCostEur,
    alternativeEstimatedCostEur: altCostRes.estimatedCostEur,
    costDifferenceEur,
    costDifferencePercent,
    currentEstimatedCo2Grams: currentCo2Res.co2Grams,
    currentEstimatedCo2Kg: currentCo2Res.co2Kg,
    alternativeEstimatedCo2Grams: altCo2Res.co2Grams,
    alternativeEstimatedCo2Kg: altCo2Res.co2Kg,
    co2DifferenceKg,
    co2DifferencePercent,
    isCostBeneficial,
    isCo2Beneficial,
    summary,
  };
}

export type TransportMode =
  | 'car_petrol'
  | 'car_diesel'
  | 'car_ev'
  | 'car_phev'
  | 'hsl_metro_train_tram'
  | 'hsl_bus_electric'
  | 'hsl_bus_diesel'
  | 'bike_walk';

export const TRANSPORT_EMISSION_FACTORS: Record<TransportMode, number> = {
  car_petrol: NORDIC_EMISSION_FACTORS.TRANSPORT_ICE_CAR_AVERAGE,
  car_diesel: 135,
  car_ev: NORDIC_EMISSION_FACTORS.TRANSPORT_EV_FINNISH_GRID,
  car_phev: NORDIC_EMISSION_FACTORS.TRANSPORT_PHEV_AVERAGE,
  hsl_metro_train_tram: NORDIC_EMISSION_FACTORS.TRANSPORT_HSL_PIKARATIKKA_15,
  hsl_bus_electric: NORDIC_EMISSION_FACTORS.TRANSPORT_HSL_ELECTRIC_BUS,
  hsl_bus_diesel: 55,
  bike_walk: 0,
};

export const TRANSPORT_COST_PER_KM: Record<TransportMode, number> = {
  car_petrol: NORDIC_PRICING_BENCHMARKS.CAR_FUEL_AND_MAINTENANCE_PER_KM_EUR,
  car_diesel: 0.25,
  car_ev: 0.08,
  car_phev: 0.18,
  hsl_metro_train_tram: 0,
  hsl_bus_electric: 0,
  hsl_bus_diesel: 0,
  bike_walk: 0.01,
};

export interface TransportImpactInput {
  distanceKm: number;
  baselineMode: TransportMode;
  alternativeMode: TransportMode;
  ticketPriceEur?: number;
  tripsPerWeek?: number;
  weeksPerYear?: number;
}

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
  annualCo2SavedKg: number;
  annualCostSavedEur: number;
  treesEquivalent: number;
  breakdown: string;
}

export function calculateTransportImpact(input: TransportImpactInput): TransportImpactResult {
  const distance = Math.max(0.5, input?.distanceKm || 10);
  const baseline = input?.baselineMode || 'car_petrol';
  const alternative = input?.alternativeMode || 'hsl_metro_train_tram';
  const ticketEur = input?.ticketPriceEur ?? NORDIC_PRICING_BENCHMARKS.HSL_AB_SINGLE_TICKET_EUR;
  const tripsWeek = Math.max(1, input?.tripsPerWeek || 10);
  const weeksYear = Math.max(1, Math.min(52, input?.weeksPerYear || 44));

  const baseFactor = TRANSPORT_EMISSION_FACTORS[baseline] ?? 142;
  const altFactor = TRANSPORT_EMISSION_FACTORS[alternative] ?? 0;

  const baselineCo2GramsPerTrip = Number((distance * baseFactor).toFixed(0));
  const alternativeCo2GramsPerTrip = Number((distance * altFactor).toFixed(0));
  const co2SavedKgPerTrip = Number(Math.max(0, (baselineCo2GramsPerTrip - alternativeCo2GramsPerTrip) / 1000).toFixed(3));

  let baselineCostEur = Number((distance * (TRANSPORT_COST_PER_KM[baseline] ?? 0.28)).toFixed(2));
  if (baseline.startsWith('car')) {
    baselineCostEur += 1.0;
  }

  let altCostEur = 0;
  if (alternative.startsWith('hsl')) {
    altCostEur = ticketEur;
  } else {
    altCostEur = Number((distance * (TRANSPORT_COST_PER_KM[alternative] ?? 0.01)).toFixed(2));
  }

  const costSavedEurPerTrip = Number(Math.max(0, baselineCostEur - altCostEur).toFixed(2));
  const totalAnnualTrips = tripsWeek * weeksYear;
  const annualCo2SavedKg = Number((co2SavedKgPerTrip * totalAnnualTrips).toFixed(0));
  const annualCostSavedEur = Number((costSavedEurPerTrip * totalAnnualTrips).toFixed(0));
  const treesEquivalent = Math.max(1, Math.round(annualCo2SavedKg / 22));
  const breakdown = `${distance} km (${baseline} -> ${alternative}): -${co2SavedKgPerTrip} kg CO2, €${costSavedEurPerTrip}/trip (~${annualCo2SavedKg} kg CO2, €${annualCostSavedEur}/yr).`;

  return {
    distanceKm: distance,
    baselineMode: baseline,
    alternativeMode: alternative,
    baselineCo2GramsPerTrip,
    alternativeCo2GramsPerTrip,
    co2SavedKgPerTrip,
    baselineCostEurPerTrip: baselineCostEur,
    alternativeCostEurPerTrip: altCostEur,
    costSavedEurPerTrip,
    annualCo2SavedKg,
    annualCostSavedEur,
    treesEquivalent,
    breakdown,
  };
}

export type ActionEffortTier = 'low' | 'medium' | 'high';

export interface EcoCreditsInput {
  effort?: ActionEffortTier;
  co2SavedKg?: number;
  moneySavedEur?: number;
  gridFlexibilityScore?: number;
  streakDays?: number;
}

export interface EcoCreditsResult {
  effortBaseCredits: number;
  co2BonusCredits: number;
  costBonusCredits: number;
  flexibilityBonusCredits: number;
  streakMultiplier: number;
  totalCreditsEarned: number;
  disclaimer: string;
  breakdown: string;
}

export function calculateEcoCredits(input: EcoCreditsInput): EcoCreditsResult {
  const effort = input?.effort || 'medium';
  let effortBase = 10;
  if (effort === 'low') effortBase = 5;
  else if (effort === 'high') effortBase = 20;

  const co2Kg = Math.max(0, input?.co2SavedKg || 0);
  const costEur = Math.max(0, input?.moneySavedEur || 0);
  const flexScore = Math.max(0, input?.gridFlexibilityScore || 0);
  const streak = Math.max(1, input?.streakDays || 1);

  const co2Bonus = Math.round(co2Kg * 10);
  const costBonus = Math.round(costEur * 5);
  const flexBonus = Math.round(flexScore);
  const streakMultiplier = Number((1 + Math.min(0.5, (streak - 1) * 0.05)).toFixed(2));
  const unmultiplied = effortBase + co2Bonus + costBonus + flexBonus;
  const totalCreditsEarned = Math.round(unmultiplied * streakMultiplier);

  const breakdown = `[Base: ${effortBase}pts (${effort} effort)] + [CO2: ${co2Bonus}pts] + [€: ${costBonus}pts] + [Flex: ${flexBonus}pts] × ${streakMultiplier} (Streak) = ${totalCreditsEarned} EcoCredits`;

  return {
    effortBaseCredits: effortBase,
    co2BonusCredits: co2Bonus,
    costBonusCredits: costBonus,
    flexibilityBonusCredits: flexBonus,
    streakMultiplier,
    totalCreditsEarned,
    disclaimer: ECOCREDITS_DISCLAIMER,
    breakdown,
  };
}

export interface RecommendationCandidate {
  id: string;
  category: string;
  action: string;
  title: string;
  titleFi?: string;
  description: string;
  descriptionFi?: string;
  estimatedCO2Kg: number;
  estimatedSavingEur: number;
  energyKWh?: number;
  effort: ActionEffortTier;
  convenienceImpact: 'minimal' | 'moderate' | 'high_effort';
  requiredFlexibility: 'none' | 'time_shift' | 'habit_change' | 'investment';
  sourceData?: {
    spotPriceCents?: number;
    gridEmissionFactor?: number;
    weatherTempCelsius?: number;
    freshness?: 'live' | 'cached' | 'demo';
  };
  confidence: number;
  excludedByConstraints?: string[];
  requiredContext?: string[];
}

export interface RecommendationScoreBreakdown {
  impactScore: number;
  costScore: number;
  convenienceScore: number;
  preferenceScore: number;
  flexibilityScore: number;
  confidenceScore: number;
  totalScore: number;
  isViolatingConstraint: boolean;
  violationReason?: string;
}

export interface RankedRecommendationItem {
  candidate: RecommendationCandidate;
  scores: RecommendationScoreBreakdown;
  authoritativeCalculations: {
    co2Kg: number;
    costEur: number;
    ecoCredits: number;
    ecoCreditsDisclaimer: string;
  };
}

export function checkUserConstraintViolation(
  candidate: RecommendationCandidate,
  userProfile: EcoPilotUserProfile
): { violates: boolean; reason?: string } {
  const userConstraints = userProfile.cannotChange || [];

  if (candidate.excludedByConstraints) {
    for (const constraint of candidate.excludedByConstraints) {
      if (userConstraints.includes(constraint as UserConstraint)) {
        return {
          violates: true,
          reason: `Violates user constraint: ${constraint}`,
        };
      }
    }
  }

  if (userConstraints.includes('renting_no_renovations') && candidate.category === 'housing_taloyhtio') {
    return { violates: true, reason: 'User is renting and cannot make taloyhtiö renovations' };
  }
  if (userConstraints.includes('no_sauna') && candidate.category === 'sauna_optimizer') {
    return { violates: true, reason: 'User has no sauna' };
  }
  if (userConstraints.includes('no_car') && (candidate.id.includes('car') || candidate.id.includes('ev'))) {
    return { violates: true, reason: 'User does not own a car' };
  }

  return { violates: false };
}

export function scoreRecommendationCandidate(
  candidate: RecommendationCandidate,
  userProfile: EcoPilotUserProfile,
  observation?: ObservationSnapshot,
  options?: any
): RecommendationScoreBreakdown {
  const constraintCheck = checkUserConstraintViolation(candidate, userProfile);
  if (constraintCheck.violates) {
    return {
      impactScore: 0,
      costScore: 0,
      convenienceScore: 0,
      preferenceScore: 0,
      flexibilityScore: 0,
      confidenceScore: 0,
      totalScore: 0,
      isViolatingConstraint: true,
      violationReason: constraintCheck.reason,
    };
  }

  const impactScore = Math.min(100, Math.round((Math.max(0, candidate.estimatedCO2Kg) / 5) * 100));
  const costScore = Math.min(100, Math.round((Math.max(0, candidate.estimatedSavingEur) / 5) * 100));

  let convenienceScore = 80;
  if (candidate.effort === 'low') convenienceScore = 95;
  else if (candidate.effort === 'medium') convenienceScore = 70;
  else if (candidate.effort === 'high') convenienceScore = 40;

  let preferenceScore = 50;
  const cares = userProfile.caresAbout || [];
  if (cares.includes('carbon_reduction') && candidate.estimatedCO2Kg > 0.5) preferenceScore += 20;
  if (cares.includes('energy_cost_savings') && candidate.estimatedSavingEur > 0.5) preferenceScore += 20;
  if (cares.includes('daily_convenience') && candidate.effort === 'low') preferenceScore += 15;

  if (userProfile.acceptedActionsHistory?.includes(candidate.id)) preferenceScore += 10;
  if (userProfile.rejectedActionsHistory?.includes(candidate.id)) preferenceScore -= 40;

  let flexibilityScore = 50;
  const canChangeItems = (userProfile.canChange || []).map((c) => c.toLowerCase());
  if (canChangeItems.some((c) => candidate.title.toLowerCase().includes(c) || candidate.category.toLowerCase().includes(c))) {
    flexibilityScore = 90;
  }

  const confidenceScore = Math.round((candidate.confidence ?? 0.9) * 100);

  const totalScore = Number(
    (
      impactScore * 0.25 +
      costScore * 0.25 +
      convenienceScore * 0.15 +
      preferenceScore * 0.15 +
      flexibilityScore * 0.1 +
      confidenceScore * 0.1
    ).toFixed(1)
  );

  return {
    impactScore,
    costScore,
    convenienceScore,
    preferenceScore,
    flexibilityScore,
    confidenceScore,
    totalScore,
    isViolatingConstraint: false,
  };
}

export function rankRecommendations(
  candidates: RecommendationCandidate[],
  userProfile: EcoPilotUserProfile,
  observation?: ObservationSnapshot
): RankedRecommendationItem[] {
  const scoredItems: RankedRecommendationItem[] = [];

  for (const candidate of candidates) {
    const scores = scoreRecommendationCandidate(candidate, userProfile, observation);
    if (scores.isViolatingConstraint) continue;

    const creditsRes = calculateEcoCredits({
      effort: candidate.effort,
      co2SavedKg: candidate.estimatedCO2Kg,
      moneySavedEur: candidate.estimatedSavingEur,
      gridFlexibilityScore: scores.flexibilityScore * 0.25,
      streakDays: userProfile.streakDays,
    });

    scoredItems.push({
      candidate,
      scores,
      authoritativeCalculations: {
        co2Kg: candidate.estimatedCO2Kg,
        costEur: candidate.estimatedSavingEur,
        ecoCredits: creditsRes.totalCreditsEarned,
        ecoCreditsDisclaimer: ECOCREDITS_DISCLAIMER,
      },
    });
  }

  return scoredItems.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
}

export function calculateDeterministicSaunaImpact(
  kiuasKw: number = 6.8,
  targetTempCelsius: number = 75,
  spotPriceCentsKwh: number = 2.4,
  gridCo2IntensityGramsKwh: number = 18
) {
  const kwhUsed = Number((kiuasKw * 1.5 * (targetTempCelsius <= 75 ? 0.75 : 1.0)).toFixed(2));
  const shift = calculateShiftComparison({
    energyKWh: kwhUsed,
    currentTime: {
      timeLabel: '18:00 Peak',
      priceCentsKwh: 17.5,
      emissionFactorGCO2PerKWh: 140,
    },
    alternativeTime: {
      timeLabel: 'Off-Peak Clean',
      priceCentsKwh: spotPriceCentsKwh,
      emissionFactorGCO2PerKWh: gridCo2IntensityGramsKwh,
    },
  });

  return {
    kwhUsed,
    costEur: shift.alternativeEstimatedCostEur,
    costSavedEurVsPeak: shift.costDifferenceEur,
    co2Grams: shift.alternativeEstimatedCo2Grams,
    co2SavedKgVsPeak: shift.co2DifferenceKg,
    gridFlexibilityBonus: spotPriceCentsKwh < 5 ? 25 : 10,
    validationStatus: 'valid' as const,
  };
}

export function calculateDeterministicHeatingAdjustment(
  livingAreaSqM: number,
  heatingSystem: HeatingSystem,
  degreesReduced: number = 1,
  season: Season = 'winter'
) {
  const validArea = Math.min(500, Math.max(20, livingAreaSqM));
  const seasonMultiplier = season === 'winter' ? 1.0 : season === 'autumn' ? 0.6 : season === 'spring' ? 0.4 : 0.05;
  const baseDailyHeatingKwh = validArea * 0.48 * seasonMultiplier;
  const heatingKwhSavedPerDay = Number((baseDailyHeatingKwh * (degreesReduced * 0.05)).toFixed(2));
  const co2SavedKgPerDay = Number(((heatingKwhSavedPerDay * 68) / 1000).toFixed(2));
  const costSavedEurPerDay = Number((heatingKwhSavedPerDay * 0.095).toFixed(2));

  return {
    heatingKwhSavedPerDay,
    costSavedEurPerDay,
    co2SavedKgPerDay,
    annualCo2SavedKg: Number((co2SavedKgPerDay * 210).toFixed(0)),
    annualCostSavedEur: Number((costSavedEurPerDay * 210).toFixed(0)),
  };
}

export function calculateDeterministicCommuteImpact(distanceKm: number, commuteDaysPerYear: number = 220) {
  const res = calculateTransportImpact({
    distanceKm,
    baselineMode: 'car_petrol',
    alternativeMode: 'hsl_metro_train_tram',
    tripsPerWeek: 10,
    weeksPerYear: Math.round(commuteDaysPerYear / 5),
  });

  return {
    distanceKm: res.distanceKm,
    transitCostEur: res.alternativeCostEurPerTrip,
    carCostEur: res.baselineCostEurPerTrip,
    singleTripCostSavedEur: res.costSavedEurPerTrip,
    carCo2Grams: res.baselineCo2GramsPerTrip,
    transitCo2Grams: res.alternativeCo2GramsPerTrip,
    singleTripCo2SavedKg: res.co2SavedKgPerTrip,
    annualCo2SavedKg: res.annualCo2SavedKg,
    annualMoneySavedEur: res.annualCostSavedEur,
    treesEquivalent: res.treesEquivalent,
  };
}
