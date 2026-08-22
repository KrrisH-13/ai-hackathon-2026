import type { Season } from "./types";

/** Espoo, Finland. */
const ESPOO_LATITUDE = 60.2055;
const ESPOO_LONGITUDE = 24.6559;

/** Northern-hemisphere meteorological seasons (Dec-Feb winter, Mar-May spring, etc). */
export function currentSeason(now: Date): Season {
  const month = now.getMonth(); // 0-11
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

/**
 * Current outdoor temperature in Espoo from Open-Meteo (open-source,
 * no API key required). Returns null on any failure so callers can fall
 * back to the season's typical mock temperature.
 */
export async function fetchCurrentEspooTemperatureCelsius(): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${ESPOO_LATITUDE}&longitude=${ESPOO_LONGITUDE}&current=temperature_2m&timezone=Europe%2FHelsinki`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();
    const temperature = data?.current?.temperature_2m;
    return typeof temperature === "number" ? temperature : null;
  } catch (err) {
    console.error("fetchCurrentEspooTemperatureCelsius:", err);
    return null;
  }
}
