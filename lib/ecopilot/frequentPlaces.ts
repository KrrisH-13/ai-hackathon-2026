import type {
  ActivityMode,
  CarType,
  CommuteHabit,
  FrequentPlace,
  FrequentPlaceTransportMode,
  UserProfile,
} from "./types";
import { DEFAULT_COUNTRY, getEmissionFactorGramsPerKm } from "./emissionFactors";

/**
 * Everything the profile's "frequently visited places" list feeds into:
 * the default transport mode a new place inherits, the straight-line →
 * road-distance estimate between home and a place, and the one-click
 * "quick trip" rows the activity logger renders from both.
 *
 * Pure functions and plain data only (no React, no I/O) so the profile
 * editor, the activity logger and any server-side caller can share them.
 */

/** Short bilingual labels for a per-place transport mode. */
export const PLACE_MODE_LABEL: Record<FrequentPlaceTransportMode, { en: string; fi: string }> = {
  car: { en: "Car", fi: "Auto" },
  ev: { en: "EV", fi: "Sähköauto" },
  bus: { en: "Bus", fi: "Bussi" },
  train: { en: "Train / metro", fi: "Juna / metro" },
  bike: { en: "Bike", fi: "Pyörä" },
  walk: { en: "Walk", fi: "Kävely" },
};

/** Profile-level preferred transport → the closest per-place transport mode. */
const COMMUTE_HABIT_MODE: Record<CommuteHabit, FrequentPlaceTransportMode> = {
  Car: "car",
  "Public Transport": "bus",
  "Bike / Walk": "bike",
};

/**
 * The transport mode a newly added place starts with: whatever the user
 * already told us they usually travel by. Always editable per place — this
 * only seeds the field so the common case needs no extra clicks.
 */
export function defaultPlaceTransportMode(profile: {
  commuteHabit: CommuteHabit;
  carType: CarType | null;
}): FrequentPlaceTransportMode {
  // A car commuter driving an EV gets the much cleaner 'ev' factor; every
  // other car type (petrol/diesel/hybrid/phev) is priced as 'car', refined
  // further by the profile's own g/km figure in resolveTripEmissionFactor.
  if (profile.commuteHabit === "Car" && profile.carType === "ev") return "ev";
  return COMMUTE_HABIT_MODE[profile.commuteHabit];
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle ("as the crow flies") distance between two coordinates, in km. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Rough "how much longer is the real route than the crow-flies line"
 * multiplier per mode. A bus detours via its route and stops, a car follows
 * the street grid, a bike or a walk can cut through. Illustrative averages
 * for a hackathon estimate — an exact figure would need a routing API.
 */
const ROUTE_DETOUR_FACTOR: Record<ActivityMode, number> = {
  car: 1.3,
  ev: 1.3,
  bus: 1.4,
  train: 1.25,
  bike: 1.2,
  walk: 1.2,
  plane: 1.0,
  ferry: 1.1,
};

/** Estimated real-world one-way travel distance between two coordinates, in km (1 decimal). */
export function estimateRouteDistanceKm(from: GeoPoint, to: GeoPoint, mode: ActivityMode): number {
  const km = haversineKm(from, to) * ROUTE_DETOUR_FACTOR[mode];
  return Math.max(0.1, Math.round(km * 10) / 10);
}

export interface TripEmissionFactor {
  gramsPerKm: number;
  /** True when the profile's own car g/km figure was used instead of the country average. */
  isOwnCarFactor: boolean;
}

/**
 * g CO2/km for a trip: the user's own car figure when they drove their own
 * car (they entered it from the registration papers, so it beats a national
 * average), otherwise the country-aware table in emissionFactors.ts.
 */
export function resolveTripEmissionFactor(
  mode: ActivityMode,
  profile: Pick<UserProfile, "carType" | "carCo2GramsPerKm">,
  country: string = DEFAULT_COUNTRY
): TripEmissionFactor {
  const ownCarFactor = profile.carCo2GramsPerKm;
  if ((mode === "car" || mode === "ev") && profile.carType && profile.carType !== "none" && ownCarFactor) {
    return { gramsPerKm: ownCarFactor, isOwnCarFactor: true };
  }
  return { gramsPerKm: getEmissionFactorGramsPerKm(mode, country).gramsPerKm, isOwnCarFactor: false };
}

/** kg CO2e for `distanceKm` at `gramsPerKm`, rounded the same way estimateCo2Kg rounds. */
export function tripCo2Kg(gramsPerKm: number, distanceKm: number): number {
  return Math.round(((gramsPerKm * Math.max(0, distanceKm)) / 1000) * 100) / 100;
}

/** One home ↔ place trip the activity logger can log in a single click. */
export interface QuickTrip {
  place: FrequentPlace;
  mode: FrequentPlaceTransportMode;
  /** Whether `mode` came from the place itself, or fell back to the profile's preferred transport. */
  modeSource: "place" | "profile";
  /** Estimated one-way distance in km. */
  distanceKm: number;
  /** Estimated one-way emissions in kg CO2e. */
  co2Kg: number;
  gramsPerKm: number;
  isOwnCarFactor: boolean;
}

/**
 * Every frequent place that can be turned into a one-click trip: it needs
 * coordinates of its own (picked from address autocomplete) and a home
 * address with coordinates to measure from.
 */
export function buildQuickTrips(profile: UserProfile): QuickTrip[] {
  if (profile.homeLat == null || profile.homeLon == null) return [];
  const home: GeoPoint = { lat: profile.homeLat, lon: profile.homeLon };

  return profile.frequentPlaces.flatMap((place) => {
    if (place.lat == null || place.lon == null) return [];
    const mode = place.transportMode ?? defaultPlaceTransportMode(profile);
    const distanceKm = estimateRouteDistanceKm(home, { lat: place.lat, lon: place.lon }, mode);
    const { gramsPerKm, isOwnCarFactor } = resolveTripEmissionFactor(mode, profile);
    return [
      {
        place,
        mode,
        modeSource: place.transportMode ? ("place" as const) : ("profile" as const),
        distanceKm,
        co2Kg: tripCo2Kg(gramsPerKm, distanceKm),
        gramsPerKm,
        isOwnCarFactor,
      },
    ];
  });
}

/** Saved places that can't be quick-logged yet because they have no looked-up address. */
export function countPlacesWithoutCoordinates(profile: UserProfile): number {
  return profile.frequentPlaces.filter((p) => p.lat == null || p.lon == null).length;
}
