import { EspooDistrict, HousingType, HeatingSystem, ElectricityContract, CommuteHabit } from './climate';

export type UserConstraint =
  | 'no_car'
  | 'no_ev'
  | 'has_ev'
  | 'cannot_cycle_winter'
  | 'inflexible_work_hours'
  | 'renting_no_renovations'
  | 'electric_sauna_only'
  | 'wood_sauna_only'
  | 'no_sauna'
  | 'no_temperature_reduction'
  | 'mobility_limitations'
  | 'strict_schedule'
  | 'no_transit_route'
  | 'strict_budget_focus'
  | 'dietary_restrictions';

export type UserValuePriority =
  | 'carbon_reduction'
  | 'energy_cost_savings'
  | 'daily_convenience'
  | 'home_comfort_warmth'
  | 'grid_flexibility'
  | 'rewards_ecocredits'
  | 'community_impact'
  | 'community_leadership';

export interface ActionFeedbackRecord {
  actionId: string;
  category: string;
  accepted: boolean;
  timestamp: string;
  userNote?: string;
}

export interface ActionAcceptanceStat {
  category: string;
  acceptedCount: number;
  rejectedCount: number;
  inferredFlexibility: 'high' | 'medium' | 'low' | 'protected';
}

export interface EcoCreditTransaction {
  id: string;
  title: string;
  titleFi?: string;
  amount: number; // positive for earned (+12), negative for redeemed (-100)
  dateLabel: string;
  timestamp: string;
  category: string;
  type: 'earned' | 'redeemed';
  voucherCode?: string;
  co2SavedKg?: number;
}

export interface PrototypeRedeemedReward {
  id: string;
  rewardId: string;
  rewardTitle: string;
  creditsUsed: number;
  voucherCode: string;
  redeemedAt: string;
}

export interface SavedGoal {
  id: string;
  title: string;
  titleFi?: string;
  category: string;
  scenario: string;
  estimatedCo2KgMonth: number;
  estimatedEurMonth: number;
  effort: 'Easy' | 'Medium' | 'High';
  savedAt: string;
}

export interface EcoPilotUserProfile {
  id: string;
  name: string;
  district?: EspooDistrict;
  neighborhood?: string;
  postcode?: string;
  municipality?: 'Espoo' | 'Helsinki' | 'Vantaa' | 'Kauniainen' | 'Other HSL area' | 'Other Finland';
  locationSharingEnabled?: boolean;

  // Housing Profile & Lifestyle
  housingType: HousingType;
  housingTypeCategory?: 'Apartment' | 'Terraced house' | 'Detached house' | 'Student housing' | 'Other';
  householdSize: number;
  livingAreaSqM: number;
  homeSizeCategory?: 'Under 40 m²' | '40–70 m²' | '70–120 m²' | '120+ m²' | 'Prefer not to say';
  heatingSystem: HeatingSystem;
  heatingTypeDetail?: 'District heating' | 'Electric heating' | 'Heat pump' | 'Geothermal' | 'Wood' | 'Unknown' | 'Prefer not to say';
  controlsHeating?: 'Yes' | 'No' | 'Not sure';
  electricityContract: ElectricityContract;
  saunaType: 'electric' | 'wood' | 'none';
  saunaTimesPerWeek: number;
  commuteHabit: CommuteHabit;
  dietPreference: 'omnivore' | 'flexitarian' | 'vegetarian' | 'vegan';

  // Transport Profile
  primaryTransport?: 'Public transport' | 'Car' | 'Bicycle' | 'Walking' | 'Mixed' | 'Other';
  carOwnership?: 'None' | 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric' | 'Plug-in hybrid' | 'Prefer not to say';
  hasEv?: boolean;
  evChargingFlexibility?: 'Very flexible' | 'Somewhat flexible' | 'Not flexible' | "I don't know";
  publicTransportUsage?: 'Rarely' | '1–2 days/week' | '3–4 days/week' | 'Daily';
  cyclingFrequency?: 'Rarely' | 'Sometimes' | 'Frequently';
  walkingFrequency?: 'Rarely' | 'Sometimes' | 'Frequently';

  // Commute Profile
  commuteOrigin?: string;
  commuteDestination?: string;
  commuteDistanceKm?: number;
  commuteDaysPerWeek?: number;
  commuteMode?: 'Public transport' | 'Car' | 'Bicycle' | 'Walking' | 'Mixed';
  commuteDepartureTime?: string;
  commuteReturnTime?: string;
  carOccupancy?: number;

  // User Constraints & Preferences
  avoidBefore07?: boolean;
  avoidAfter22?: boolean;
  preserveMorningRoutine?: boolean;
  maxInconvenienceMinutes?: number; // 5, 10, 20, 999 (flexible)
  preferSavingMoney?: boolean;
  preferReducingCo2?: boolean;
  preferConvenience?: boolean;
  preferPublicTransport?: boolean;
  preferWalkingCycling?: boolean;
  preferFlexibleHousehold?: boolean;

  // Necessity Model ("Necessary vs Flexible")
  necessityModel?: Record<string, 'Protected' | 'Flexible' | 'Necessary'>;

  // EcoPilot Specific Learning Context
  canChange: string[];
  cannotChange: UserConstraint[];
  caresAbout: UserValuePriority[];

  // Historical Feedback & Acceptance Stats
  acceptedActionsHistory: string[];
  rejectedActionsHistory: string[];
  categoryStats?: Record<string, { accepted: number; rejected: number }>;
  feedbackLog: ActionFeedbackRecord[];

  // Gamification & Verified Impacts
  ecoCredits: number;
  savedCo2Kg: number;
  savedEurTotal: number;
  streakDays: number;
  estimatedFootprintTonnes?: number;
  targetFootprintTonnes?: number;
  installedGreenTech?: string[];
  activePledges?: string[];
  notes?: string;

  // Prototype Rewards & Transactions
  ecoCreditTransactions?: EcoCreditTransaction[];
  redeemedRewards?: PrototypeRedeemedReward[];

  // User-Saved Goals from What-If Scenarios
  savedGoals?: SavedGoal[];
}



