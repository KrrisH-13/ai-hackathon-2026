import { FingridGridStatus } from '../schemas/fingridSchema';
import { globalDataCache } from '../cache/dataCache';

export async function fetchFingridGridStatus(): Promise<FingridGridStatus> {
  const cached = globalDataCache.get<FingridGridStatus>('fingrid-grid');
  if (cached && cached.freshness === 'live') {
    return cached.data;
  }

  try {
    const res = await fetch('/api/data/fingrid');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        globalDataCache.set('fingrid-grid', json.data, 180000, 'live', 'Fingrid Open Data API');
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Using client fallback for Fingrid data:', err);
  }

  const now = new Date();
  const hour = now.getHours();
  const isNight = hour >= 23 || hour <= 5;
  const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
  const baseConsumption = isNight ? 7850 : isPeak ? 11100 : 9650;
  const nuclearMW = 4380;
  const windMW = 2400 + Math.round(Math.sin(hour / 3) * 550);
  const hydroMW = 2100 + (isPeak ? 650 : 0);
  const solarMW = hour >= 6 && hour <= 19 ? Math.max(0, Math.round(Math.sin(((hour - 6) / 13) * Math.PI) * 420)) : 0;
  const chpMW = 1150;
  const totalProd = nuclearMW + windMW + hydroMW + solarMW + chpMW;
  const netBalance = totalProd - baseConsumption;
  const cleanShare = Math.min(99, Math.round(((nuclearMW + windMW + hydroMW + solarMW) / totalProd) * 100));
  const emissionFactor = Math.round(36 + (100 - cleanShare) * 1.1);

  const fallback: FingridGridStatus = {
    timestamp: now.toISOString(),
    consumptionMW: baseConsumption,
    productionMW: totalProd,
    windProductionMW: windMW,
    nuclearProductionMW: nuclearMW,
    hydroProductionMW: hydroMW,
    solarProductionMW: solarMW,
    netExportImportMW: netBalance,
    emissionFactorGCO2PerKWh: emissionFactor,
    systemStatus: {
      timestamp: now.toISOString(),
      state: 'NORMAL',
      stateDescription: 'Kantaverkon käyttötila normaali (Fingrid Grid Balance Normal)',
      surplusDeficitMW: netBalance,
      freshness: 'demo',
      source: 'Fingrid Open Data Baseline Model',
    },
    cleanEnergySharePercent: cleanShare,
    source: 'Fingrid Open Data (data.fingrid.fi)',
    freshness: 'demo',
    lastUpdated: now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
  };

  globalDataCache.set('fingrid-grid', fallback, 180000, 'demo', 'Fingrid Open Data API');
  return fallback;
}
