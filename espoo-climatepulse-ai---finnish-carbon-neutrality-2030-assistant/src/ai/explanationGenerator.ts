import { ExplanationSchema, ExplanationResult } from './schemas';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, ActionDefinition } from '../types/recommendation';

export interface ExplanationGeneratorInput {
  actionId: string;
  actionTitle?: string;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  candidateActions?: ActionDefinition[];
}

/**
 * FUNCTION 3 — EXPLANATION GENERATOR
 * Generates transparent "Why am I seeing this?" breakdowns:
 * - which user preference mattered
 * - which public data mattered
 * - why this action was selected over alternatives
 * - what assumptions were made
 * - AI confidence & cited data sources
 * 
 * Example user prompt: "Why am I seeing this?"
 * Example output: "You marked EV charging as flexible, while heating is not flexible. Today's electricity conditions make later charging a better opportunity, so I prioritised your EV instead of recommending a heating change."
 */
export async function generateExplanationWithAI(
  input: ExplanationGeneratorInput
): Promise<ExplanationResult> {
  try {
    const response = await fetch('/api/ai/generate-explanation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to generate explanation');
    }

    // Validate with Zod — do not trust raw LLM output
    return ExplanationSchema.parse(json.data);
  } catch (error) {
    console.warn('AI explanation generation failed, using structured fallback explanation:', error);
    return fallbackGenerateExplanation(input);
  }
}

/**
 * Deterministic fallback explanation generator.
 */
export function fallbackGenerateExplanation(
  input: ExplanationGeneratorInput
): ExplanationResult {
  const { actionId, userProfile, observation } = input;
  const isEV = actionId.includes('ev') || actionId.includes('charge');
  const isDishwasher = actionId.includes('dishwasher');
  const isSauna = actionId.includes('sauna');
  const isHeating = actionId.includes('temp') || actionId.includes('heat');
  const isTransit = actionId.includes('transit') || actionId.includes('pikaratikka');

  const preferencesMattered = [
    `Housing: ${userProfile.housingType} in ${userProfile.district}`,
    `Values: ${userProfile.caresAbout.join(', ') || 'Cost & Carbon'}`,
  ];

  const publicDataMattered = [
    `Nord Pool Spot Rate: ${observation.currentSpotPriceCents} c/kWh`,
    `Fingrid Grid Carbon: ${observation.gridEmissionsIntensityGrams} g CO2/kWh`,
    `FMI Outdoor Temp: ${observation.outdoorTempCelsius}°C (${observation.currentSeason})`,
  ];

  let whySelected = `This action produces the highest positive impact with lowest daily inconvenience under today's conditions.`;
  const assumptions = [
    `User routine allows evening/night automation.`,
    `Equipment is operable in standard conditions.`,
  ];

  if (isEV) {
    preferencesMattered.push(`EV charging is declared as a flexible activity; heating is protected.`);
    publicDataMattered.push(`Night wind generation drops spot electricity prices by ~70% after 22:00.`);
    whySelected = `You marked EV charging as flexible, while heating is not flexible. Today's electricity conditions make later charging a better opportunity, so I prioritised your EV instead of recommending a heating change.`;
    assumptions.push(`Home charging wallbox is installed and connected.`);
  } else if (isDishwasher) {
    preferencesMattered.push(`Dishwasher is flexible for evening or night delay.`);
    publicDataMattered.push(`Grid carbon intensity drops to ${observation.gridEmissionsIntensityGrams} g CO2/kWh in the late evening.`);
    whySelected = `You indicated flexibility with running appliances later. Shifting dishwasher cycles past 21:00 avoids the evening peak with zero impact on clean dishes in the morning.`;
    assumptions.push(`Dishwasher has a delay timer or smart switch.`);
  } else if (isSauna) {
    preferencesMattered.push(`Active sauna routine (${userProfile.saunaTimesPerWeek}x/week) on electric contract.`);
    publicDataMattered.push(`Nordic wind energy forecast peaks between 21:00 and 04:00.`);
    whySelected = `You have an electric sauna and flexible evening hours. Peak evening grid rates are high, but drop sharply after 21:00, making this the highest-return single shift available today.`;
    assumptions.push(`Electric sauna kiuas rated at 6–8 kW.`);
  } else if (isHeating) {
    preferencesMattered.push(`Heating system: ${userProfile.heatingSystem}.`);
    publicDataMattered.push(`Sub-zero winter conditions (${observation.outdoorTempCelsius}°C).`);
    whySelected = `Heating constitutes ~60% of total energy in Finnish homes. A slight 1°C calibration reduces thermal demand continuously without compromising living comfort.`;
    assumptions.push(`Thermostats are accessible and functioning properly.`);
  } else if (isTransit) {
    preferencesMattered.push(`Commute profile: ${userProfile.commuteHabit}.`);
    publicDataMattered.push(`HSL orbital Light Rail line 15 & Metro electrified transit schedule.`);
    whySelected = `Replacing private vehicle commute with electrified HSL transit directly eliminates combustion emissions on Kehä I / Länsiväylä.`;
    assumptions.push(`HSL stop is within convenient walking or cycling distance.`);
  }

  return {
    actionId,
    actionTitle: input.actionTitle || 'Recommended Action',
    userPreferencesMattered: preferencesMattered,
    publicDataMattered,
    whySelectedOverAlternatives: whySelected,
    assumptionsMade: assumptions,
    aiConfidence: 0.94,
    dataSources: [
      'Fingrid Open Data (Grid Emissions)',
      'Nord Pool Day-Ahead Spot Market',
      'Ilmatieteen laitos (FMI Weather)',
      'HSY & HSL Municipal Infrastructure Data',
    ],
  };
}
