import { ElectricityPriceDay, HourlyElectricityPrice } from '../schemas/electricityPriceSchema';
import { globalDataCache } from '../cache/dataCache';

export async function fetchElectricityPrices(): Promise<ElectricityPriceDay> {
  const cached = globalDataCache.get<ElectricityPriceDay>('electricity-prices');
  if (cached && cached.freshness === 'live') {
    return cached.data;
  }

  try {
    const res = await fetch('/api/data/electricity-prices');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        globalDataCache.set('electricity-prices', json.data, 600000, 'live', 'Nordic Day-Ahead API');
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Using client fallback for electricity prices:', err);
  }

  // Fallback realistic Nordic model
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const hourlyBaseCents = [
    3.2, 2.8, 2.4, 2.1, 2.5, 4.8, 8.9, 14.2, 16.5, 12.1,
    9.4, 8.6, 7.8, 6.9, 8.2, 11.4, 15.8, 19.4, 17.2, 11.5,
    6.8, 4.2, 3.8, 3.4,
  ];

  const hourlyPrices: HourlyElectricityPrice[] = hourlyBaseCents.map((cents, h) => ({
    timestamp: `${dateStr}T${String(h).padStart(2, '0')}:00:00.000Z`,
    hour: h,
    priceCentsPerKWh: cents,
    priceEurPerKWh: Number((cents / 100).toFixed(4)),
    area: 'FI',
    source: 'Nordic Electricity Spot Baseline Model',
    freshness: 'demo',
    isCleanPeak: h >= 21 || h <= 5,
    isPriceValley: cents <= 4.5,
  }));

  const currentHour = now.getHours();
  const currentPrice = hourlyPrices[currentHour]?.priceCentsPerKWh ?? 8.5;
  const avg = Number((hourlyBaseCents.reduce((a, b) => a + b, 0) / hourlyBaseCents.length).toFixed(2));
  const min = Math.min(...hourlyBaseCents);
  const max = Math.max(...hourlyBaseCents);

  const result: ElectricityPriceDay = {
    currentHourPriceCents: currentPrice,
    averagePriceCents: avg,
    minPriceCents: min,
    maxPriceCents: max,
    bestSaunaWindow: '21:30 - 23:30 (Night wind peak)',
    bestSaunaPriceCents: 3.2,
    hourlyPrices,
    source: 'Nordic Day-Ahead Spot API',
    freshness: 'demo',
    lastUpdated: now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
  };

  globalDataCache.set('electricity-prices', result, 600000, 'demo', 'Nordic Day-Ahead API');
  return result;
}
