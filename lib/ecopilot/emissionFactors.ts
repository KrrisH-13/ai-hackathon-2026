import type { ActivityMode } from "./types";

/**
 * Country-aware gCO2e/km factors per transport mode. The same mode can vary
 * wildly by country because "car"/"ev" emissions depend on the local
 * electricity grid mix — an EV in hydro-powered Norway is near-zero, the
 * same EV in coal-heavy Poland is not. This table (and getEmissionFactorGramsPerKm
 * below) is the "Nordic-aware" nuance the natural-language activity logger
 * demo leans on. Figures are rough, illustrative averages for a hackathon
 * demo, not audited LCA data.
 */

export const DEFAULT_COUNTRY = "Finland";

type ModeFactors = Partial<Record<ActivityMode, number>>;

export const COUNTRY_EMISSION_FACTORS_G_PER_KM: Record<string, ModeFactors> = {
  // Nordics — mostly hydro/nuclear/wind grids, so EV & rail are very clean.
  Finland: { car: 165, ev: 20, train: 6, bus: 75, bike: 0, walk: 0, plane: 230, ferry: 110 },
  Norway: { car: 160, ev: 4, train: 2, bus: 70, bike: 0, walk: 0, plane: 230, ferry: 95 },
  Sweden: { car: 155, ev: 8, train: 2, bus: 70, bike: 0, walk: 0, plane: 230, ferry: 100 },
  Denmark: { car: 160, ev: 35, train: 8, bus: 75, bike: 0, walk: 0, plane: 230, ferry: 110 },
  Iceland: { car: 160, ev: 2, train: 0, bus: 70, bike: 0, walk: 0, plane: 230, ferry: 90 },
  // Coal-heavier European grids — same "EV"/"train" mode, much higher factor.
  Poland: { car: 175, ev: 145, train: 45, bus: 90, bike: 0, walk: 0, plane: 230, ferry: 130 },
  Germany: { car: 168, ev: 95, train: 25, bus: 80, bike: 0, walk: 0, plane: 230, ferry: 120 },
  Estonia: { car: 168, ev: 110, train: 30, bus: 80, bike: 0, walk: 0, plane: 230, ferry: 120 },
  "United States": { car: 180, ev: 130, train: 60, bus: 90, bike: 0, walk: 0, plane: 250, ferry: 130 },
};

/** Grid/world-average fallback for any country not explicitly modeled above. */
const FALLBACK_FACTORS: Required<ModeFactors> = {
  car: 170,
  ev: 100,
  train: 35,
  bus: 85,
  bike: 0,
  walk: 0,
  plane: 230,
  ferry: 120,
};

const COUNTRY_ALIASES: Record<string, string> = {
  finland: "Finland",
  suomi: "Finland",
  norway: "Norway",
  norge: "Norway",
  sweden: "Sweden",
  sverige: "Sweden",
  denmark: "Denmark",
  danmark: "Denmark",
  iceland: "Iceland",
  poland: "Poland",
  polska: "Poland",
  germany: "Germany",
  deutschland: "Germany",
  estonia: "Estonia",
  eesti: "Estonia",
  usa: "United States",
  "u.s.a.": "United States",
  "united states": "United States",
  "united states of america": "United States",
};

function normalizeCountryName(country: string): string {
  const trimmed = country.trim();
  return COUNTRY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export interface EmissionFactorLookup {
  gramsPerKm: number;
  /** The country name the factor table was actually keyed on (after alias normalization). */
  matchedCountry: string;
  /** True when the country wasn't in our table and the grid-average fallback was used. */
  isFallback: boolean;
}

export function getEmissionFactorGramsPerKm(mode: ActivityMode, country: string): EmissionFactorLookup {
  const matchedCountry = normalizeCountryName(country);
  const table = COUNTRY_EMISSION_FACTORS_G_PER_KM[matchedCountry];
  const factor = table?.[mode];

  if (factor != null) {
    return { gramsPerKm: factor, matchedCountry, isFallback: false };
  }
  return { gramsPerKm: FALLBACK_FACTORS[mode], matchedCountry, isFallback: true };
}

export interface Co2Estimate extends EmissionFactorLookup {
  co2Kg: number;
}

export function estimateCo2Kg(mode: ActivityMode, distanceKm: number, country: string): Co2Estimate {
  const lookup = getEmissionFactorGramsPerKm(mode, country);
  const co2Kg = Math.round(((lookup.gramsPerKm * Math.max(0, distanceKm)) / 1000) * 100) / 100;
  return { ...lookup, co2Kg };
}
