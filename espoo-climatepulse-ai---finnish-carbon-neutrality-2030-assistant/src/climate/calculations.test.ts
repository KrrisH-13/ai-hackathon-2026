import {
  calculateElectricityCO2,
  calculateElectricityCost,
  calculateShiftComparison,
  calculateTransportImpact,
  calculateEcoCredits,
  rankRecommendations,
  RecommendationCandidate,
  ECOCREDITS_DISCLAIMER,
} from './calculations';
import { EcoPilotUserProfile } from '../types/user';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
}

export function runAllCalculationEngineTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function assert(suite: string, name: string, condition: boolean, actual?: any, expected?: any) {
    results.push({
      suite,
      name,
      passed: Boolean(condition),
      actual,
      expected,
    });
  }

  // 1. Electricity CO2
  const res1 = calculateElectricityCO2({ energyKWh: 10, emissionFactorGCO2PerKWh: 45 });
  assert('Electricity CO2', '10 kWh @ 45 g/kWh produces 450g (0.45 kg)', res1.co2Grams === 450 && res1.co2Kg === 0.45);

  const resZero = calculateElectricityCO2({ energyKWh: 0, emissionFactorGCO2PerKWh: 140 });
  assert('Zero Consumption', '0 kWh produces 0g CO2', resZero.co2Grams === 0 && resZero.co2Kg === 0);

  // 2. Electricity Cost
  const resCost = calculateElectricityCost({ energyKWh: 10, electricityPriceCentsKwh: 10 });
  assert('Electricity Cost', '10 kWh @ 10 c/kWh produces €1.00', resCost.estimatedCostEur === 1.00);

  // Negative Price
  const resNeg = calculateElectricityCost({ energyKWh: 20, electricityPriceCentsKwh: -2.5, transferFeeCentsKwh: 0, fixedChargesEur: 0 });
  assert('Negative Prices', '20 kWh @ -2.5 c/kWh produces -€0.50', resNeg.estimatedCostEur === -0.50);

  // 3. Shift comparison
  const shiftRes = calculateShiftComparison({
    energyKWh: 10,
    currentTime: { timeLabel: '18:00 Peak', priceCentsKwh: 20, emissionFactorGCO2PerKWh: 150 },
    alternativeTime: { timeLabel: '22:00 Wind', priceCentsKwh: 4, emissionFactorGCO2PerKWh: 20 },
  });
  assert('Shift Comparison', 'Saves €1.60 and 1.30 kg CO2', shiftRes.costDifferenceEur === 1.60 && shiftRes.co2DifferenceKg === 1.30);

  // 4. EcoCredits
  const lowEffort = calculateEcoCredits({ effort: 'low', co2SavedKg: 0, moneySavedEur: 0 });
  assert('EcoCredits', 'Low effort base is 5 points', lowEffort.effortBaseCredits === 5);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
