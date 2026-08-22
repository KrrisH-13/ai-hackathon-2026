/**
 * Ported from the "Kipinä Espoo AI" standalone prototype
 * (espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant/src/types/climate.ts).
 * Shared between the ecopilot UI (components/ecopilot/), the client fetch
 * wrappers (lib/ecopilot/client.ts), and the server-side Gemini calls
 * (lib/ecopilot/gemini.ts + app/api/ai/*).
 */

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export type HousingType = 'kerrostalo' | 'rivitalo' | 'omakotitalo' | 'paritalo';

export type EspooDistrict =
  | 'Suur-Tapiola (Tapiola, Otaniemi, Keilaniemi)'
  | 'Suur-Leppävaara (Leppävaara, Kera, Karakallio)'
  | 'Suur-Matinkylä (Matinkylä, Olari, Henttaa)'
  | 'Suur-Espoonlahti (Espoonlahti, Kivenlahti, Soukka)'
  | 'Vanha-Espoo (Espoon keskus, Tuomarila, Kauklahti)'
  | 'Pohjois-Espoo (Nuuksio, Kalajärvi, Järvenperä)';

export type HeatingSystem =
  | 'Kaukolämpö (District Heating / Fortum Clean Heat)'
  | 'Maalämpö (Geothermal Heat Pump)'
  | 'Ilmalämpöpumppu + Suora sähkö (Air Heat Pump + Electric)'
  | 'Suora sähkölämmitys (Direct Electric)'
  | 'Puulämmitys / Varaava takka (Wood / Masonry Heater)'
  | 'Öljylämmitys / Poistuva (Oil / Transitioning)';

export type ElectricityContract =
  | 'Pörssisähkö (Nord Pool Hourly Spot)'
  | 'Kiinteähintainen (Fixed-Price Contract)'
  | 'Uusiutuva / EKOenergia (100% Certified Green)';

export type CommuteHabit =
  | 'Pääosin HSL (Metro, Pikaratikka 15, Juna, Bussi)'
  | 'Kävellen ja Pyörällä (Cycling & Walking / Baana)'
  | 'Sähköauto (Electric Vehicle)'
  | 'Ladattava hybridi (PHEV)'
  | 'Polttomoottoriauto (Bensiini / Diesel)'
  | 'Etätyö / Hybridityö (Remote First)';

export interface UserProfile {
  id: string;
  name: string;
  district: EspooDistrict;
  housingType: HousingType;
  householdSize: number;
  livingAreaSqM: number;
  heatingSystem: HeatingSystem;
  electricityContract: ElectricityContract;
  saunaType: 'electric' | 'wood' | 'none';
  saunaTimesPerWeek: number;
  commuteHabit: CommuteHabit;
  dietPreference: 'omnivore' | 'flexitarian' | 'vegetarian' | 'vegan';
  estimatedFootprintTonnes: number; // e.g., 4.8 t CO2e/year
  targetFootprintTonnes: number; // e.g., 2.5 t CO2e/year by 2030
  installedGreenTech: string[]; // e.g., ['Aurinkopaneelit', 'Ilmalämpöpumppu', 'Älytermostaatti', 'LTO-ilmanvaihto']
  savedCo2Kg: number;
  activePledges: string[];
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
  | 'personal'
  | 'greenWindow'
  | 'activityLog'
  | 'receiptScanner'
  | 'whatIf';
