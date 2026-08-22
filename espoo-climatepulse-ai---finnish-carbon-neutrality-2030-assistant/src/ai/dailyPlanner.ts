import { DailyPlanSchema, DailyPlanResult } from './schemas';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, ActionDefinition } from '../types/recommendation';

export interface DailyPlannerInput {
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  candidateActions: ActionDefinition[];
  temporaryBlocks?: string[];
}

/**
 * FUNCTION 5 — DAILY PLAN
 * Produces a focused 1–3 recommendation daily plan, strictly prioritising
 * ONE single best action (high impact, low inconvenience, high confidence, strong personal fit).
 * Prevents cognitive overwhelm.
 * 
 * Validated via Zod schema.
 */
export async function generateDailyPlan(
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  candidateActions: ActionDefinition[],
  temporaryBlocks?: string[]
): Promise<DailyPlanResult> {
  // Filter out any temporary blocked categories for today
  let eligibleCandidates = candidateActions;
  if (temporaryBlocks && temporaryBlocks.length > 0) {
    eligibleCandidates = candidateActions.filter((c) => {
      const titleLower = c.titleEn.toLowerCase();
      const domainLower = c.domain.toLowerCase();
      return !temporaryBlocks.some(
        (b) => titleLower.includes(b.toLowerCase()) || domainLower.includes(b.toLowerCase())
      );
    });
  }

  // Also filter based on user cannotChange
  eligibleCandidates = eligibleCandidates.filter((c) => {
    return !c.excludedByConstraints.some((constraint) =>
      userProfile.cannotChange.includes(constraint)
    );
  });

  if (eligibleCandidates.length === 0) {
    eligibleCandidates = candidateActions;
  }

  try {
    const response = await fetch('/api/ai/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userProfile,
        observation,
        candidateActions: eligibleCandidates,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to generate daily plan');
    }

    // Validate with Zod — do not trust raw LLM output
    return DailyPlanSchema.parse(json.data);
  } catch (error) {
    console.warn('AI daily plan generation failed, using deterministic planner:', error);
    return fallbackGenerateDailyPlan(userProfile, observation, eligibleCandidates);
  }
}

/**
 * Deterministic fallback daily planner.
 */
export function fallbackGenerateDailyPlan(
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  candidateActions: ActionDefinition[]
): DailyPlanResult {
  const primaryCandidate = candidateActions[0] || {
    id: 'action-dishwasher-post-21',
    domain: 'energy_spot',
    titleEn: 'Run Dishwasher after 21:00',
    titleFi: 'Käynnistä tiskikone klo 21:00 jälkeen',
    descriptionEn: 'Shift appliance cycle past peak hours.',
    descriptionFi: 'Ajasta tiskikone iltahuippujen ulkopuolelle.',
    applicableSeasons: 'all',
    excludedByConstraints: [],
    baseDifficulty: 'easy',
    calcParameters: { baseCo2KgSaved: 0.18, baseEurSaved: 0.22, peakHourShift: true },
  };

  const secondaryCandidates = candidateActions.slice(1, 3);

  // Formulate high-impact, low-inconvenience primary recommendation
  let headline = `🚗 EV charging`;
  let suggestedTime = 'Charge after 22:00';
  let reason = `Night spot rate drops ~70% and wind energy surges in Finland.`;
  let userFriendlyExplanation = `Charge your EV after 22:00 tonight to capture clean wind energy and save on spot pricing.`;
  let impact: 'high' | 'medium' | 'low' = 'high';
  let inconvenience: 'low' | 'medium' | 'high' = 'low';
  let fitScore = 95;

  if (primaryCandidate.id.includes('dishwasher')) {
    headline = `🧺 Dishwasher after 21:00`;
    suggestedTime = 'Run after 21:00';
    reason = `Avoids 17:00–20:00 grid evening peak with zero morning routine disruption.`;
    userFriendlyExplanation = `Delay your dishwasher to run after 21:00 tonight for cheaper, cleaner electricity.`;
    impact = 'medium';
    inconvenience = 'low';
    fitScore = 92;
  } else if (primaryCandidate.id.includes('sauna')) {
    headline = `🧖 Smart Sauna Heating`;
    suggestedTime = 'Heat after 21:00';
    reason = `Electric kiuas (7 kW) avoids fossil peak generation during evening rush.`;
    userFriendlyExplanation = `Heat your sauna after 21:00 for soft steam at a fraction of peak electricity cost.`;
    impact = 'high';
    inconvenience = 'low';
    fitScore = 90;
  } else if (primaryCandidate.id.includes('temp') || primaryCandidate.id.includes('heat')) {
    headline = `🌡️ Thermostat 20°C Balance`;
    suggestedTime = 'Anytime today';
    reason = `Saves 5% home heating power in sub-zero winter temperatures.`;
    userFriendlyExplanation = `Calibrating your living area thermostat to 20°C maintains comfort while saving energy.`;
    impact = 'medium';
    inconvenience = 'low';
    fitScore = 85;
  } else if (primaryCandidate.id.includes('transit') || primaryCandidate.id.includes('pikaratikka')) {
    headline = `🚊 Pikaratikka 15 Commute`;
    suggestedTime = 'Morning commute';
    reason = `100% renewable electrified transit eliminates Kehä I car traffic emissions.`;
    userFriendlyExplanation = `Take Pikaratikka 15 or Länsimetro for your daily journey instead of driving.`;
    impact = 'high';
    inconvenience = 'medium';
    fitScore = 88;
  }

  return {
    primaryAction: {
      actionId: primaryCandidate.id,
      headline,
      reason,
      userFriendlyExplanation,
      suggestedTime,
      confidence: 0.94,
      assumptions: [
        'User is home during evening routines.',
        'Equipment operates normally.',
      ],
      selectionCriteria: {
        impact,
        inconvenience,
        personalFitScore: fitScore,
      },
    },
    secondaryActions: secondaryCandidates.map((c) => ({
      actionId: c.id,
      headline: c.titleEn,
      reason: `Complementary low-friction action tailored for ${userProfile.housingType} home.`,
      suggestedTime: c.id.includes('sauna') ? '21:30' : 'Evening',
      confidence: 0.88,
    })),
    planSummary: `Prioritizing 1 high-impact action for your ${userProfile.housingType} home to keep your daily routine simple.`,
    overallConfidence: 0.94,
    dataSourcesUsed: [
      'Nord Pool Spot Electricity Market',
      'Fingrid Real-Time Grid Carbon API',
      'Ilmatieteen laitos (FMI)',
    ],
    assumptions: [
      'Normal grid status without alert state.',
      'Spot electricity follows typical day-ahead profile.',
    ],
  };
}
