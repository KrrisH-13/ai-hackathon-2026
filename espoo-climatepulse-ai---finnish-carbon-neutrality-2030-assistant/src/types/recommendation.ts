import { Season } from './climate';
import { UserConstraint } from './user';

export type ActionDomain =
  | 'energy_spot'
  | 'heating_climate'
  | 'sauna_optimizer'
  | 'transit_hsl'
  | 'circular_waste'
  | 'nordic_nutrition'
  | 'housing_taloyhtio';

export interface ActionDefinition {
  id: string;
  domain: ActionDomain;
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  applicableSeasons: Season[] | 'all';
  excludedByConstraints: UserConstraint[];
  baseDifficulty: 'easy' | 'moderate' | 'investment';
  calcParameters: {
    baseKwhSaved?: number;
    baseCo2KgSaved: number;
    baseEurSaved: number;
    peakHourShift?: boolean;
    gridFlexibilityBonus?: number;
  };
}

export interface EcoPilotRecommendation {
  id: string;
  actionId: string;
  domain: ActionDomain;
  title: string;
  description: string;
  aiReasoning: string;
  aiContextualMotivation: string;
  aiSuggestedExecutionTime?: string;
  deterministicOutputs: {
    co2KgSaved: number;
    costEurSaved: number;
    kwhSaved: number;
    ecoCreditsReward: number;
    gridFlexibilityScore: number;
    calculationBreakdown: string;
  };
  relevanceScore: number;
  difficulty: 'easy' | 'moderate' | 'investment';
  validated: boolean;
  userAccepted?: boolean;
}

export interface ObservationSnapshot {
  timestamp?: string;
  currentHour?: number;
  currentSeason: Season;
  outdoorTempCelsius: number;
  currentSpotPriceCents: number;
  gridEmissionsIntensityGrams?: number;
  gridEmissionFactorGCO2?: number;
  cleanEnergySharePercent?: number;
  timeOfDay?: string;
  isPeakHour?: boolean;
  upcomingSaunaDay?: boolean;
  isCleanPeakHours?: boolean;
  isPriceValleyHours?: boolean;
  publicDataSourceMeta?: Array<{
    id: string;
    name: string;
    freshness: 'live' | 'cached' | 'demo';
    sourceUrl: string;
  }>;
}
