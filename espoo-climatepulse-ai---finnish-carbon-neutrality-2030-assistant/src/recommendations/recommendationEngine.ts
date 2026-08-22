import { ACTION_CATALOG } from './actionCatalog';
import { rankRecommendations, RankedRecommendationItem, calculateDeterministicSaunaImpact } from '../climate/calculations';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, EcoPilotRecommendation, ActionDefinition } from '../types/recommendation';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';

export function getFilteredCandidateActions(
  userProfile: EcoPilotUserProfile,
  observation?: ObservationSnapshot
): ActionDefinition[] {
  return CANDIDATE_ACTIONS.filter((action) => {
    // 1. Check strict constraints
    const isExcluded = action.excludedByConstraints.some((constraint) =>
      userProfile.cannotChange?.includes(constraint)
    );
    if (isExcluded) return false;

    // 2. Check seasonal applicability
    if (observation && action.applicableSeasons !== 'all') {
      if (!action.applicableSeasons.includes(observation.currentSeason)) {
        return false;
      }
    }

    return true;
  });
}

export function buildValidatedRecommendations(
  rankedActionIds: string[],
  reasoningMap: Record<string, { reasoning: string; motivation: string; suggestedTime?: string }>,
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  isFinnish: boolean = false
): EcoPilotRecommendation[] {
  const results: EcoPilotRecommendation[] = [];

  for (let i = 0; i < rankedActionIds.length; i++) {
    const id = rankedActionIds[i];
    const candidate = CANDIDATE_ACTIONS.find((a) => a.id === id);
    if (!candidate) continue;

    const customReasoning = reasoningMap[id];
    const co2Kg = candidate.calcParameters.baseCo2KgSaved || 0.8;
    const costEur = candidate.calcParameters.baseEurSaved || 0.65;
    const kwh = candidate.calcParameters.baseKwhSaved || 2.5;
    const gridFlex = candidate.calcParameters.gridFlexibilityBonus || 15;
    const credits = Math.round((co2Kg * 10) + (costEur * 5) + gridFlex);

    results.push({
      id: `rec-${candidate.id}-${i}`,
      actionId: candidate.id,
      domain: candidate.domain,
      title: isFinnish ? candidate.titleFi : candidate.titleEn,
      description: isFinnish ? candidate.descriptionFi : candidate.descriptionEn,
      aiReasoning: customReasoning?.reasoning || (isFinnish
        ? `Tekoäly optimoi tämän toimenpiteen pörssisähkön hinnan ja kantaverkon puhtauden mukaan.`
        : `AI optimized this action based on Nordic spot prices and Fingrid grid telemetry.`),
      aiContextualMotivation: customReasoning?.motivation || (isFinnish
        ? `Säästää kuluja ja vähentää päästöjä Espoon 2030 -ilmastotavoitteen mukaisesti.`
        : `Saves money and reduces emissions towards Carbon Neutral Espoo 2030.`),
      aiSuggestedExecutionTime: customReasoning?.suggestedTime || 'Tänään klo 21:00+',
      deterministicOutputs: {
        co2KgSaved: co2Kg,
        costEurSaved: costEur,
        kwhSaved: kwh,
        ecoCreditsReward: credits,
        gridFlexibilityScore: gridFlex,
        calculationBreakdown: `Deterministic Engine: ${co2Kg.toFixed(2)} kg CO₂ + €${costEur.toFixed(2)} savings`,
      },
      relevanceScore: Math.max(0.6, 1.0 - (i * 0.1)),
      difficulty: candidate.baseDifficulty,
      validated: true,
    });
  }

  return results;
}

export function getRankedDailyRecommendations(
  userProfile: EcoPilotUserProfile,
  observation?: ObservationSnapshot
): RankedRecommendationItem[] {
  return rankRecommendations(ACTION_CATALOG, userProfile, observation);
}
