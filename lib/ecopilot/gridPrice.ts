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
 * failure so callers fall back to the seasonal mock curve. Grid CO2
 * intensity per hour still comes from that mock curve — a real grid-mix
 * feed (Fingrid Datahub) needs a registered API key we don't have, so we
 * don't fake that part as live (see applyLivePrices below).
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
