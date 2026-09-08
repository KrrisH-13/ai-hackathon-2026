import type { SpotPricePoint } from "./types";

const PORSSISAHKO_URL = "https://api.porssisahko.net/v1/latest-prices.json";

function helsinkiDateStr(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date(iso));
}

function helsinkiHour(iso: string): number {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Helsinki",
    hour: "numeric",
    hour12: false,
  }).format(new Date(iso));
  return Number(formatted) % 24;
}

/**
 * Real Finnish day-ahead spot electricity prices (porssisahko.net — free,
 * open, no API key) for today, keyed by hour-of-day. Returns null on any
 * failure so callers fall back to the seasonal mock curve.
 */
export async function fetchTodaySpotPricesCentsPerKwh(): Promise<Map<number, number> | null> {
  try {
    const res = await fetch(PORSSISAHKO_URL, { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();
    const prices: { price: number; startDate: string }[] = data?.prices;
    if (!Array.isArray(prices) || prices.length === 0) return null;

    const todayStr = helsinkiDateStr(new Date().toISOString());
    const byHour = new Map<number, number>();
    for (const p of prices) {
      if (typeof p.price !== "number" || helsinkiDateStr(p.startDate) !== todayStr) continue;
      byHour.set(helsinkiHour(p.startDate), Math.round(p.price * 10) / 10);
    }

    // Expect ~24 hourly entries for today; treat a mostly-empty result as a bad fetch.
    return byHour.size >= 20 ? byHour : null;
  } catch (err) {
    console.error("fetchTodaySpotPricesCentsPerKwh:", err);
    return null;
  }
}

function classifyStatus(priceCentsKwh: number): SpotPricePoint["status"] {
  if (priceCentsKwh < 5) return "optimal";
  if (priceCentsKwh < 10) return "moderate";
  if (priceCentsKwh < 15) return "expensive";
  return "peak";
}

/**
 * Overlays live prices onto the seasonal mock curve, hour by hour — keeps
 * grid CO2 intensity and recommendation text from the mock (not live),
 * updates price + status for hours the live fetch covered.
 */
export function applyLivePrices(mockCurve: SpotPricePoint[], livePrices: Map<number, number> | null): SpotPricePoint[] {
  if (!livePrices) return mockCurve;
  return mockCurve.map((point) => {
    const live = livePrices.get(point.hour);
    if (live == null) return point;
    return { ...point, priceCentsKwh: live, status: classifyStatus(live) };
  });
}

const FINGRID_CO2_DATASET_ID = 265; // "Emission factor for electricity consumed in Finland - real time data" (gCO2/kWh, updated every 3 min)
const FINGRID_API_BASE = "https://data.fingrid.fi/api/datasets";

/** Each hour's latest reading (by timestamp, not array order — Fingrid returns newest-first) among rows falling on the given Helsinki calendar date. */
function latestByHourForDate(rows: { value: number; startTime: string }[], dateStr: string): Map<number, number> {
  const latest = new Map<number, { value: number; timeMs: number }>();
  for (const row of rows) {
    if (typeof row.value !== "number" || helsinkiDateStr(row.startTime) !== dateStr) continue;
    const hour = helsinkiHour(row.startTime);
    const timeMs = new Date(row.startTime).getTime();
    const existing = latest.get(hour);
    if (!existing || timeMs > existing.timeMs) latest.set(hour, { value: row.value, timeMs });
  }
  const byHour = new Map<number, number>();
  for (const [hour, { value }] of latest) byHour.set(hour, Math.round(value));
  return byHour;
}

/**
 * Real Finnish grid CO2 emission intensity (Fingrid open data, dataset 265),
 * keyed by hour-of-day: today's actual reading for every hour already
 * reached, and yesterday's actual reading at that same hour-of-day for the
 * rest of today — Fingrid's feed is real-time only, it can't forecast, and
 * yesterday's real grid behaviour is a far closer proxy than a synthetic
 * curve. Requires a free FINGRID_API_KEY: register at data.fingrid.fi,
 * subscribe to the "Open Data starter" plan, and set the key in .env.local.
 * Returns null on any failure (no key, network error, bad response) so
 * callers fall back to the seasonal mock curve, same as the price fetch above.
 */
export async function fetchTodayGridCo2IntensityGramsPerKwh(): Promise<Map<number, number> | null> {
  const apiKey = process.env.FINGRID_API_KEY;
  if (!apiKey) return null;

  try {
    const now = new Date();
    // Comfortably covers all of yesterday plus today so far, regardless of the UTC/EET offset.
    const start = new Date(now.getTime() - 51 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 60 * 60 * 1000);

    const res = await fetch(
      `${FINGRID_API_BASE}/${FINGRID_CO2_DATASET_ID}/data?startTime=${start.toISOString()}&endTime=${end.toISOString()}&format=json&pageSize=2000`,
      { headers: { "x-api-key": apiKey }, cache: "no-store" }
    );
    if (!res.ok) return null;

    const json = await res.json();
    const rows: { value: number; startTime: string }[] = json?.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const todayStr = helsinkiDateStr(now.toISOString());
    const yesterdayStr = helsinkiDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
    const todayByHour = latestByHourForDate(rows, todayStr);
    const yesterdayByHour = latestByHourForDate(rows, yesterdayStr);

    const merged = new Map<number, number>();
    for (let hour = 0; hour < 24; hour++) {
      const value = todayByHour.get(hour) ?? yesterdayByHour.get(hour);
      if (value != null) merged.set(hour, value);
    }

    return merged.size > 0 ? merged : null;
  } catch (err) {
    console.error("fetchTodayGridCo2IntensityGramsPerKwh:", err);
    return null;
  }
}

/** Overlays live grid CO2 intensity onto the seasonal mock curve, hour by hour — same pattern as applyLivePrices. */
export function applyLiveCo2Intensity(mockCurve: SpotPricePoint[], liveCo2: Map<number, number> | null): SpotPricePoint[] {
  if (!liveCo2) return mockCurve;
  return mockCurve.map((point) => {
    const live = liveCo2.get(point.hour);
    if (live == null) return point;
    return { ...point, gridCo2IntensityGramsKwh: live };
  });
}
