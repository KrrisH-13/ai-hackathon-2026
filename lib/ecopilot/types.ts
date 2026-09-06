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
 * derived from it, and lib/validation.ts + ProfileEditView reuse the
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
  'District Heating',
  'Geothermal Heat Pump',
  'Air Heat Pump',
  'Electric Heating',
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
  'Partial Sorting with Home Composting (Some categories sorted, biowaste composted at home)',
  'No Sorting (Mixed waste only)',
] as const;
export type WasteManagementSystem = (typeof WASTE_MANAGEMENT_SYSTEMS)[number];

export const SAUNA_TYPES = ['electric', 'wood', 'none'] as const;
export type SaunaType = (typeof SAUNA_TYPES)[number];

/**
 * Quick-select icon keys for a frequently-visited place. Kept as opaque
 * strings here (the string → lucide component map lives in
 * components/ecopilot/frequentPlaceIcons.tsx) so this file stays UI-free and
 * lib/validation.ts can reuse the list.
 */
export const FREQUENT_PLACE_ICON_KEYS = [
  'work',
  'grocery',
  'daycare',
  'school',
  'gym',
  'health',
  'family',
  'transit',
  'home',
  'other',
] as const;
export type FrequentPlaceIconKey = (typeof FREQUENT_PLACE_ICON_KEYS)[number];

/**
 * Local transport modes offered per frequent place — a curated subset of
 * ActivityMode (no plane/ferry) so a later "log a trip to this place" feature
 * can hand the value straight to the activity logger.
 */
export const FREQUENT_PLACE_TRANSPORT_MODES = ['car', 'ev', 'bus', 'train', 'bike', 'walk'] as const;

/**
 * A place the user visits often (work, grocery store, a child's day care, a
 * hobby class…). Stored on the profile as a small list; other features
 * reference an entry by its stable `id`.
 */
export interface FrequentPlace {
  /** Stable client-generated id — the key other features use to refer to this place. */
  id: string;
  /** User-facing name, e.g. "Work" or "Iso Omena". */
  label: string;
  /** Quick-select icon (see FREQUENT_PLACE_ICON_KEYS). */
  icon: FrequentPlaceIconKey;
  /** Optional usual way the user travels there; null when unset. */
  transportMode: ActivityMode | null;
  /** Street address (currently Finland-only lookup); null when not set. */
  address: string | null;
  /** Latitude captured when the address was picked from autocomplete; null for a hand-typed address. */
  lat: number | null;
  /** Longitude, paired with `lat`. */
  lon: number | null;
}

export interface UserProfile {
  /** The Supabase auth user id this profile belongs to. */
  id: string;
  name: string;
  district: EspooDistrict;
  /** Home street address (Finland lookup); null when not set. */
  homeAddress: string | null;
  /** Coordinates captured when the home address was picked from autocomplete; null otherwise. */
  homeLat: number | null;
  homeLon: number | null;
  housingType: HousingType;
  householdSize: number;
  livingAreaSqM: number;
  /** Multi-select — a home can combine e.g. an air heat pump with electric backup. */
  heatingSystems: HeatingSystem[];
  electricityContract: ElectricityContract;
  saunaType: SaunaType;
  saunaTimesPerWeek: number;
  /** Preferred/primary transport mode. */
  commuteHabit: CommuteHabit;
  /** Only meaningful when commuteHabit involves driving. */
  carType: CarType | null;
  carCo2GramsPerKm: number | null;
  /** Places the user visits often — used here for context and by later trip-logging features. */
  frequentPlaces: FrequentPlace[];
  wasteManagementSystem: WasteManagementSystem;
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
  | 'guide'
  | 'energy'
  | 'recycling'
  | 'transit'
  | 'roadmap'
  | 'activityLog'
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

/** A travel/commute trip Gemini extracted from a free-text log entry — priced by the country-aware factor table. */
export interface TripActivityExtraction {
  kind: 'trip';
  mode: ActivityMode;
  distanceKm: number;
  origin: string | null;
  destination: string | null;
  /** Country the trip took place in — drives which grid/emission factor table applies. */
  country: string;
  rawText: string;
}

/** A non-travel activity (a meal, home energy use, waste, a purchase…) with Gemini's own lifecycle CO2 estimate. */
export interface GeneralActivityExtraction {
  kind: 'general';
  /** Best-fit ledger category (never 'transport' — that path is a TripActivityExtraction). */
  category: Co2LogCategory;
  /** Short human-readable summary of the activity, e.g. "Beef burger dinner". */
  description: string;
  /** Gemini's rough lifecycle estimate in kg CO2e — positive = emitted, negative = avoided/saved. */
  co2Kg: number;
  /** One-sentence explanation of the assumptions behind the estimate. */
  note: string;
  rawText: string;
}

/** Structured activity Gemini extracted from a single free-text log entry — either a trip or a general activity. */
export type ActivityExtraction = TripActivityExtraction | GeneralActivityExtraction;

/** Extraction + the CO2 estimate computed from it, ready to log or discard. */
export interface ActivityLogEstimate {
  extraction: ActivityExtraction;
  co2Kg: number;
  /** g CO2/km factor used for a trip; null for a general activity (Gemini estimated the total directly). */
  emissionFactorGramsPerKm: number | null;
  /** Human-readable explanation of how the estimate was reached, for the UI. */
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
