/** Espoo, Finland. */
const ESPOO_LATITUDE = 60.2055;
const ESPOO_LONGITUDE = 24.6559;

/** Fallback outdoor temperature (°C) when the live weather fetch fails. */
export const FALLBACK_OUTDOOR_TEMP_CELSIUS = 5;

/**
 * Current outdoor temperature in Espoo from Open-Meteo (open-source,
 * no API key required). Returns null on any failure so callers can fall
 * back to FALLBACK_OUTDOOR_TEMP_CELSIUS.
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
