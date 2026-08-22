import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, EcoPilotRecommendation } from '../types/recommendation';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';
import { getFilteredCandidateActions, buildValidatedRecommendations } from '../recommendations/recommendationEngine';

export interface AiRecommendationResponse {
  recommendations: {
    actionId: string;
    reasoning: string;
    motivation: string;
    suggestedTime: string;
    relevanceRank: number;
  }[];
  learningSummary: string;
}

/**
 * Parses raw AI response and runs the deterministic pipeline to generate authoritative recommendations.
 */
export function processAiRecommendations(
  aiResponse: AiRecommendationResponse,
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  isFinnish: boolean = false
): { recommendations: EcoPilotRecommendation[]; learningSummary: string } {
  const reasoningMap: Record<string, { reasoning: string; motivation: string; suggestedTime?: string }> = {};
  const rankedActionIds: string[] = [];

  for (const item of aiResponse.recommendations || []) {
    reasoningMap[item.actionId] = {
      reasoning: item.reasoning,
      motivation: item.motivation,
      suggestedTime: item.suggestedTime,
    };
    if (CANDIDATE_ACTIONS.some((a) => a.id === item.actionId)) {
      rankedActionIds.push(item.actionId);
    }
  }

  // If AI missed some valid candidate actions, fill from catalog
  const filteredCandidates = getFilteredCandidateActions(userProfile, observation);
  for (const candidate of filteredCandidates) {
    if (!rankedActionIds.includes(candidate.id)) {
      rankedActionIds.push(candidate.id);
    }
  }

  const validatedRecs = buildValidatedRecommendations(
    rankedActionIds,
    reasoningMap,
    userProfile,
    observation,
    isFinnish
  );

  return {
    recommendations: validatedRecs,
    learningSummary: aiResponse.learningSummary || (isFinnish
      ? `EcoPilot mukautti toimenpiteet asuntosi profiiliin (${userProfile.housingType}, ${userProfile.heatingSystem}).`
      : `EcoPilot adapted actions to your home profile (${userProfile.housingType}, ${userProfile.heatingSystem}).`),
  };
}
