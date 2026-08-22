/**
 * EcoCredits Deterministic Reward Calculation Engine
 * 
 * CORE PRINCIPLES:
 * 1. Base rule: 1 EcoCredit per 0.1 kg CO₂e estimated avoided. (10 EcoCredits per 1.0 kg CO₂e avoided)
 * 2. Confidence scaling:
 *    - HIGH (verified distance/device data): 1.0 multiplier
 *    - MEDIUM (general profile average): 0.7 multiplier
 *    - LOW (unverified/rough estimate): 0.0 multiplier (withheld)
 * 3. Reasonable Cap: Maximum 50 EcoCredits per single action to ensure economic and ecological balance.
 * 4. Transparent Calculation: Returns human-readable formula steps and authoritative citations.
 */

export const ECOCREDITS_PROTOTYPE_DISCLAIMER =
  'EcoCredits are prototype reward points based on estimated impact. They are not verified carbon credits, offsets or monetary value.';

export type EcoCreditConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EcoCreditCalculationInput {
  actionId: string;
  actionTitle: string;
  avoidedCo2Kg: number;
  confidence?: EcoCreditConfidence;
  savedEur?: number;
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

export function calculateEcoCreditsForImpact(input: EcoCreditCalculationInput): EcoCreditCalculationResult {
  const co2Kg = Math.max(0, Number(input.avoidedCo2Kg) || 0);
  const confidence: EcoCreditConfidence = input.confidence || 'HIGH';
  
  // 1. Raw calculation: 1 credit per 0.1 kg CO2e (= 10 credits per kg)
  const rawCredits = Math.round(co2Kg * 10);
  
  // 2. Confidence multiplier
  let confidenceMultiplier = 1.0;
  if (confidence === 'MEDIUM') confidenceMultiplier = 0.7;
  else if (confidence === 'LOW') confidenceMultiplier = 0.0;

  const confidenceAdjusted = Math.round(rawCredits * confidenceMultiplier);
  
  // 3. Cap per individual action
  const CAP_LIMIT = 50;
  const isCapped = confidenceAdjusted > CAP_LIMIT;
  const cappedCredits = Math.min(CAP_LIMIT, confidenceAdjusted);

  // 4. Streak bonus (small incentive: +1 credit per 5 streak days, up to +5 max)
  const streak = Math.max(1, input.streakDays || 1);
  const streakBonusCredits = Math.min(5, Math.floor((streak - 1) / 5));

  const finalCreditsAwarded = Math.max(1, cappedCredits + streakBonusCredits);

  const calculationSteps = [
    `1. Avoided emissions: ${co2Kg.toFixed(2)} kg CO₂e`,
    `2. Base conversion rule: 1 EcoCredit per 0.1 kg CO₂e (${co2Kg.toFixed(2)} kg × 10 = ${rawCredits} base credits)`,
    `3. Confidence factor: ${confidence} (${(confidenceMultiplier * 100).toFixed(0)}% multiplier = ${confidenceAdjusted} credits)`,
    isCapped ? `4. Action cap applied: Maximum ${CAP_LIMIT} credits per individual action.` : `4. Action cap check: Within ${CAP_LIMIT} credit ceiling.`,
    streakBonusCredits > 0 ? `5. Streak bonus: +${streakBonusCredits} credits (${streak}-day streak)` : `5. Streak bonus: +0 credits`,
    `6. Total awarded: +${finalCreditsAwarded} EcoCredits`,
  ];

  const formula = `${co2Kg.toFixed(2)} kg CO₂e avoided × 10 credits/kg × ${confidenceMultiplier} confidence = ${finalCreditsAwarded} EcoCredits (capped at ${CAP_LIMIT})`;

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
    capLimit: CAP_LIMIT,
    calculationSteps,
    formula,
    disclaimer: ECOCREDITS_PROTOTYPE_DISCLAIMER,
  };
}
