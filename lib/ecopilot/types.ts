/**
 * Ported from the "Kipinä Espoo AI" standalone prototype
 * (espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant/src/types/climate.ts).
 * Shared between the ecopilot UI (components/ecopilot/), the client fetch
 * wrappers (lib/ecopilot/client.ts), and the server-side Gemini calls
 * (lib/ecopilot/gemini.ts + app/api/ai/*).
 */

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/**
 * Each list below is the single source of truth for its field — the type is
 * derived from it, and lib/validation.ts + ProfileCustomizerModal reuse the
 * same array instead of re-listing the options a third time.
 */
export const HOUSING_TYPES = ['kerrostalo', 'rivitalo', 'omakotitalo', 'paritalo'] as const;
export type HousingType = (typeof HOUSING_TYPES)[number];

export const ESPOO_DISTRICTS = [
  'Suur-Tapiola (Tapiola, Otaniemi, Keilaniemi)',
  'Suur-Leppävaara (Leppävaara, Kera, Karakallio)',
  'Suur-Matinkylä (Matinkylä, Olari, Henttaa)',
  'Suur-Espoonlahti (Espoonlahti, Kivenlahti, Soukka)',
  'Vanha-Espoo (Espoon keskus, Tuomarila, Kauklahti)',
  'Pohjois-Espoo (Nuuksio, Kalajärvi, Järvenperä)',
] as const;
export type EspooDistrict = (typeof ESPOO_DISTRICTS)[number];

export const HEATING_SYSTEMS = [
  'District Heating (Fortum Clean Heat)',
  'Geothermal Heat Pump',
  'Air Heat Pump + Electric',
  'Direct Electric Heating',
  'Wood / Masonry Heater',
  'Oil Heating (Transitioning Away)',
] as const;
export type HeatingSystem = (typeof HEATING_SYSTEMS)[number];

export const ELECTRICITY_CONTRACTS = [
  'Nord Pool Hourly Spot Price',
  'Fixed-Price Contract',
  'Renewable / Certified Green (100%)',
] as const;
export type ElectricityContract = (typeof ELECTRICITY_CONTRACTS)[number];

export const COMMUTE_HABITS = ['Car', 'Public Transport', 'Bike / Walk'] as const;
export type CommuteHabit = (typeof COMMUTE_HABITS)[number];

export const CAR_TYPES = ['petrol', 'diesel', 'hybrid', 'phev', 'ev', 'none'] as const;
export type CarType = (typeof CAR_TYPES)[number];

export const WASTE_MANAGEMENT_SYSTEMS = [
  'Full Sorting (Sorts everything per HSY guide)',
  'Partial Sorting (Some categories sorted)',
  'No Sorting (Mixed waste only)',
] as const;
export type WasteManagementSystem = (typeof WASTE_MANAGEMENT_SYSTEMS)[number];

export const SAUNA_TYPES = ['electric', 'wood', 'none'] as const;
export type SaunaType = (typeof SAUNA_TYPES)[number];

export interface UserProfile {
  /** The Supabase auth user id this profile belongs to. */
  id: string;
  name: string;
  district: EspooDistrict;
  housingType: HousingType;
  householdSize: number;
  livingAreaSqM: number;
  heatingSystem: HeatingSystem;
  electricityContract: ElectricityContract;
  saunaType: SaunaType;
  saunaTimesPerWeek: number;
  /** Preferred/primary transport mode. */
  commuteHabit: CommuteHabit;
  /** Only meaningful when commuteHabit involves driving. */
  carType: CarType | null;
  carCo2GramsPerKm: number | null;
  wasteManagementSystem: WasteManagementSystem;
  /** Other measures already in place (solar panels, smart thermostat, etc). */
  energySavingMeasures: string[];
  estimatedFootprintTonnes: number; // e.g., 4.8 t CO2e/year
  targetFootprintTonnes: number; // e.g., 2.5 t CO2e/year by 2030
  /** Derived from the CO2 ledger (lib/ecopilot/queries.ts), not stored directly. */
  savedCo2Kg: number;
}

export interface SpotPricePoint {
  hour: number; // 0-23
  timeLabel: string; // e.g. "14:00 - 15:00"
  priceCentsKwh: number; // e.g. 5.4 c/kWh
  gridCo2IntensityGramsKwh: number; // e.g. 45 g CO2/kWh
  status: 'optimal' | 'moderate' | 'expensive' | 'peak';
  recommendation: string;
}

export interface WasteClassificationResult {
  itemName: string;
  category:
    | 'Biojäte'
    | 'Muovipakkaukset'
    | 'Kartonki ja pahvi'
    | 'Lasi'
    | 'Metalli'
    | 'Sekajäte'
    | 'Vaarallinen jäte'
    | 'Poistotekstiili'
    | 'Pantti (Palpa)'
    | 'Sortti-asema';
  binColor: string;
  sortingInstructions: string;
  cleaningRequired: boolean;
  whyItMatters: string;
  co2SavingsEstimateGrams: number;
  nearestEspooFacility: string;
  proTip: string;
}

export interface EspooRoadmapMeasure {
  id: string;
  title: string;
  sector: 'District Heating' | 'Transport & Mobility' | 'Electricity & Energy' | 'Circular Economy' | 'Carbon Sinks & Nature';
  status: 'accelerated' | 'on_track' | 'planned' | 'achieved';
  currentEmissionsReductionKtons: number;
  targetEmissionsReductionKtons: number;
  leadPartner: string;
  description: string;
  residentImpact: string;
  linkToIlmastovahti: string;
}

export interface DailyEnergyPlan {
  currentSeason: Season;
  outdoorTempCelsius: number;
  peakSaunaWindow: {
    recommendedTime: string;
    reason: string;
    savingsEur: string;
    co2ReductionPercent: string;
  };
  heatPumpTip: string;
  laundryWindow: string;
  evChargingWindow: string;
  ventilationAdjustment: string;
  estimatedDailySavingsEur: number;
  estimatedDailyCo2SavedKg: number;
}

export interface CommuteComparison {
  origin: string;
  destination: string;
  distanceKm: number;
  modes: {
    name: string;
    icon: string;
    durationMins: number;
    co2Grams: number;
    costEur: number;
    caloriesBurned?: number;
    convenienceScore: number;
    routeDetails: string;
  }[];
  yearlySavingIfSwitchingToTransit: {
    co2Kg: number;
    moneyEur: number;
    treesEquivalent: number;
  };
}

export interface ClimateActionItem {
  id: string;
  title: string;
  category: 'Heating & Energy' | 'Mobility' | 'Food & Diet' | 'Circular Living' | 'Housing Company';
  season: Season | 'all';
  impactKgCo2Year: number;
  savingsEurYear: number;
  difficulty: 'Helppo (5 min)' | 'Kohtalainen' | 'Investointi / Taloyhtiö';
  completed: boolean;
  description: string;
  espooRoadmapAlignment: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedPrompts?: string[];
  actionLinks?: { label: string; action: string }[];
}

export type EcopilotTab =
  | 'chat'
  | 'energy'
  | 'recycling'
  | 'transit'
  | 'roadmap'
  | 'activityLog'
  | 'receiptScanner'
  | 'whatIf'
  | 'trackerRewards';

export const CO2_LOG_CATEGORIES = ['heating', 'transport', 'waste', 'energy', 'food', 'other'] as const;
export type Co2LogCategory = (typeof CO2_LOG_CATEGORIES)[number];

export interface Co2LogEntry {
  id: string;
  occurredOn: string; // YYYY-MM-DD
  category: Co2LogCategory;
  description: string;
  co2Kg: number; // positive = emitted, negative = saved/avoided
  source: string;
}

/**
 * Natural-language activity logger (Gemini function calling extracts these
 * from free text like "drove to Turku today"). See lib/ecopilot/gemini.ts
 * and lib/ecopilot/emissionFactors.ts for the country-aware CO2 math.
 */
export const ACTIVITY_MODES = ['car', 'ev', 'train', 'bus', 'bike', 'walk', 'plane', 'ferry'] as const;
export type ActivityMode = (typeof ACTIVITY_MODES)[number];

/** Structured trip Gemini extracted from a single free-text log entry. */
export interface ActivityExtraction {
  mode: ActivityMode;
  distanceKm: number;
  origin: string | null;
  destination: string | null;
  /** Country the trip took place in — drives which grid/emission factor table applies. */
  country: string;
  rawText: string;
}

/** Extraction + the country-aware CO2 estimate computed from it, ready to log or discard. */
export interface ActivityLogEstimate {
  extraction: ActivityExtraction;
  co2Kg: number;
  emissionFactorGramsPerKm: number;
  /** Human-readable explanation of which country's factor was used (and why), for the UI. */
  factorNote: string;
}

export interface Co2DailyTotal {
  date: string; // YYYY-MM-DD
  netCo2Kg: number;
}

export interface GroceryReceiptItem {
  name: string;
  category: string;
  estimatedCo2Kg: number;
  estimatedEur: number;
}

export interface GroceryReceiptResult {
  items: GroceryReceiptItem[];
  swapSuggestions: string[];
}

export interface TodaysActionResult {
  headline: string;
  reason: string;
  category: Co2LogCategory;
  estimatedCo2KgSaved: number;
  estimatedEurSaved: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface WhatIfProjection {
  question: string;
  narrative: string;
  co2SavedKgPerYear: number;
  moneySavedEurPerYear: number;
  /** What the projection assumed about current habits, e.g. derived from the logged data used. */
  assumption: string;
  confidence: 'high' | 'medium' | 'low';
}
