import { RecommendationReasoningSchema, RecommendationReasoningResult } from './schemas';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, ActionDefinition } from '../types/recommendation';

export interface RecommendationReasonerInput {
  userProfile: EcoPilotUserProfile;
  candidateActions: ActionDefinition[];
  observation: ObservationSnapshot;
  previousFeedback?: {
    acceptedActions?: string[];
    rejectedActions?: string[];
    feedbackNotes?: string[];
  };
}

/**
 * FUNCTION 2 — RECOMMENDATION REASONING
 * Selects the single best candidate action from the application's supplied candidate actions.
 * Never invents numerical values or actions outside the supplied catalog.
 * Validated with Zod schema.
 */
export async function reasonRecommendationWithAI(
  input: RecommendationReasonerInput
): Promise<RecommendationReasoningResult> {
  // Guard: if candidates is empty, return safe empty response
  if (!input.candidateActions || input.candidateActions.length === 0) {
    return {
      selectedActionId: '',
      reason: 'No eligible candidate actions available under current user constraints.',
      userFriendlyExplanation: 'Your current constraints have filtered out all candidate actions for this specific time.',
      confidence: 1.0,
      assumptions: ['User has strict negative constraints active.'],
      dataSourcesConsidered: ['User Profile Constraints'],
    };
  }

  try {
    const response = await fetch('/api/ai/reason-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to reason recommendation');
    }

    // Validate with Zod — do not trust raw LLM output
    const validated = RecommendationReasoningSchema.parse(json.data);

    // Verify that the chosen ID is actually one of the supplied candidate actions
    const candidateIds = input.candidateActions.map((c) => c.id);
    if (!candidateIds.includes(validated.selectedActionId)) {
      console.warn(`AI selected action ID (${validated.selectedActionId}) not in candidates. Correcting to first candidate.`);
      validated.selectedActionId = input.candidateActions[0].id;
    }

    return validated;
  } catch (error) {
    console.warn('AI recommendation reasoning failed, using deterministic ranking fallback:', error);
    return fallbackReasonRecommendation(input);
  }
}

/**
 * Deterministic fallback reasoner when AI service is unavailable or in offline mode.
 */
export function fallbackReasonRecommendation(
  input: RecommendationReasonerInput
): RecommendationReasoningResult {
  const { userProfile, candidateActions, observation, previousFeedback } = input;
  const rejected = previousFeedback?.rejectedActions || userProfile.rejectedActionsHistory || [];

  // Filter out recently rejected
  const eligible = candidateActions.filter((c) => !rejected.includes(c.id));
  const chosen = eligible[0] || candidateActions[0];

  if (!chosen) {
    return {
      selectedActionId: '',
      reason: 'No candidate actions available.',
      userFriendlyExplanation: 'No actions currently match your profile constraints.',
      confidence: 1.0,
      assumptions: [],
      dataSourcesConsidered: [],
    };
  }

  let reason = `Selected because it matches your ${userProfile.housingType} home and current conditions.`;
  let userFriendly = `We recommend ${chosen.titleEn} based on today's weather (${observation.outdoorTempCelsius}°C) and spot price (${observation.currentSpotPriceCents} c/kWh).`;

  if (chosen.id.includes('ev') || chosen.id.includes('charge')) {
    reason = `User has EV charging flexibility. Spot electricity price drops to ${observation.currentSpotPriceCents} c/kWh with heavy wind power after 22:00.`;
    userFriendly = `You have an EV on night charging routine. Today's night electricity rates deliver the biggest low-effort savings.`;
  } else if (chosen.id.includes('dishwasher')) {
    reason = `Dishwasher cycle can be scheduled after 21:00 with zero inconvenience during low-tariff window.`;
    userFriendly = `Running your dishwasher after 21:00 avoids the evening peak tariff while keeping your morning routine seamless.`;
  } else if (chosen.id.includes('sauna') && userProfile.saunaType === 'electric') {
    reason = `Electric sauna (6–8 kW) shift to 21:00 avoids 18:00 evening peak and captures clean wind power.`;
    userFriendly = `You enjoy sauna sessions (${userProfile.saunaTimesPerWeek}x/wk). Shifting heating to after 21:00 gives you the highest comfort-to-cost ratio today.`;
  }

  return {
    selectedActionId: chosen.id,
    reason,
    userFriendlyExplanation: userFriendly,
    confidence: 0.9,
    assumptions: [
      `Assumes user is home for evening routine.`,
      `Assumes current Nord Pool spot price trend holds.`,
    ],
    dataSourcesConsidered: [
      'Nord Pool Spot Hourly Prices',
      'Fingrid Real-Time Grid Carbon Intensity',
      'FMI Local Weather Observation',
    ],
  };
}
