export interface DataSourceItem {
  id: string;
  name: string;
  nameFi: string;
  provider: string;
  category: 'transit' | 'electricity_grid' | 'electricity_market' | 'weather' | 'waste' | 'food';
  description: string;
  descriptionFi: string;
  updateFrequency: string;
  publicApiUrl?: string;
  methodologyRef: string;
  license: string;
  currentStatus: 'Live Telemetry' | 'Day-Ahead Indexed' | 'Reference Factor';
}

export const OPEN_DATA_SOURCES: DataSourceItem[] = [
  {
    id: 'hsl-transit',
    name: 'HSL Digitransit & Emissions Reference',
    nameFi: 'HSL Digitransit & Päästölaskenta',
    provider: 'Helsingin seudun liikenne (HSL)',
    category: 'transit',
    description: 'Digitransit routing API and HSL published Journey Planner emission baselines (170 g CO₂e/km car reference factor; 0 g CO₂e/km for 100% renewable electric rail).',
    descriptionFi: 'Digitransit-reittirajapinta ja HSL Reittioppaan virallinen päästölaskentamalli (170 g CO₂e/km henkilöauton vertailuarvo, 0 g CO₂e/km 100% uusiutuvalle raideliikenteelle).',
    updateFrequency: 'Real-time GTFS-RT + Annual Fleet Audits',
    publicApiUrl: 'https://digitransit.fi/en/developers/',
    methodologyRef: 'https://www.hsl.fi/en/hsl/electric-buses/environmental-performance-in-figures',
    license: 'CC BY 4.0 Open Data',
    currentStatus: 'Live Telemetry',
  },
  {
    id: 'fingrid-grid',
    name: 'Fingrid Real-Time Power System Telemetry',
    nameFi: 'Fingrid Kantaverkon Reaaliaikadata',
    provider: 'Fingrid Oyj (Finnish Transmission System Operator)',
    category: 'electricity_grid',
    description: 'Minute-by-minute Finnish electricity production mix, wind power generation volume, and realtime grid CO₂ emission intensity (g CO₂/kWh).',
    descriptionFi: 'Suomen sähköntuotantojakauma, tuulivoimantuotanto ja sähkön reaaliaikainen hiilidioksidipäästökerroin (g CO₂/kWh) 3 minuutin välein.',
    updateFrequency: 'Every 3 minutes',
    publicApiUrl: 'https://data.fingrid.fi',
    methodologyRef: 'Fingrid Open Data API v2 Specification',
    license: 'Creative Commons Attribution 4.0 International',
    currentStatus: 'Live Telemetry',
  },
  {
    id: 'nordpool-spot',
    name: 'Nord Pool Day-Ahead Hourly Spot Prices',
    nameFi: 'Nord Pool Vuorokausimarkkinan Spot-hinnat',
    provider: 'Nord Pool European Power Exchange (Area FI)',
    category: 'electricity_market',
    description: 'Official hourly electricity spot market prices for Finland price area (FI), published daily around 13:45 EET for the following 24 hours.',
    descriptionFi: 'Suomen hinta-alueen (FI) viralliset tuntikohtaiset pörssisähkön spot-hinnat seuraavalle vuorokaudelle.',
    updateFrequency: 'Daily at 13:45 EET',
    publicApiUrl: 'https://www.nordpoolgroup.com',
    methodologyRef: 'Nord Pool Day-Ahead Auction Protocol',
    license: 'Public market indices',
    currentStatus: 'Day-Ahead Indexed',
  },
  {
    id: 'fmi-weather',
    name: 'FMI Open Meteorological Observations',
    nameFi: 'Ilmatieteen Laitoksen Havainto- ja Säädata',
    provider: 'Ilmatieteen laitos (Finnish Meteorological Institute)',
    category: 'weather',
    description: 'Hourly outdoor temperature, wind speed, solar irradiation, and heating degree day baselines across Espoo Tapiola and Nuuksio weather stations.',
    descriptionFi: 'Espoon Tapiolan ja Nuuksion säähavaintoasemien ulkolämpötila-, tuuli- ja lämmitystarvelukudata.',
    updateFrequency: 'Hourly updates',
    publicApiUrl: 'https://en.ilmatieteenlaitos.fi/open-data',
    methodologyRef: 'FMI WFS Open Weather API',
    license: 'CC BY 4.0',
    currentStatus: 'Live Telemetry',
  },
  {
    id: 'hsy-waste',
    name: 'HSY Circular Economy & Waste Benchmarks',
    nameFi: 'HSY Jäte- ja Kiertotalousindeksit',
    provider: 'Helsingin seudun ympäristöpalvelut (HSY)',
    category: 'waste',
    description: 'Household biowaste, plastic recycling GHG diversion factors, and municipal taloyhtiö waste reduction benchmarks for the Helsinki metropolitan area.',
    descriptionFi: 'Pääkaupunkiseudun kotitalouksien biojätteen ja muovin lajittelun päästövähennyskertoimet.',
    updateFrequency: 'Quarterly updates',
    publicApiUrl: 'https://www.hsy.fi/en/waste-and-recycling/',
    methodologyRef: 'HSY Pääkaupunkiseudun jätevirtojen ilmastovaikutusmalli',
    license: 'Open public guidelines',
    currentStatus: 'Reference Factor',
  },
  {
    id: 'luke-syke-food',
    name: 'Luke & SYKE Food Carbon Baselines',
    nameFi: 'Luken ja SYKEn Ruuan Ilmastovaikutuskannat',
    provider: 'Natural Resources Institute Finland (Luke) & SYKE',
    category: 'food',
    description: 'Carbon footprints of Nordic groceries, beef/dairy baselines (e.g. Finnish beef ~14 kg CO₂e/kg, oat milk ~0.3 kg CO₂e/l) and seasonal grocery emissions.',
    descriptionFi: 'Suomalaisen ruokaketjun tuotekohtaiset hiilijalanjäljet ja elintarvikkeiden päästökertoimet.',
    updateFrequency: 'Annual environmental audits',
    publicApiUrl: 'https://www.luke.fi/en/natural-resources/food-and-nutrition',
    methodologyRef: 'Luke Ruuan Ilmastovaikutukset -tutkimusjulkaisut',
    license: 'Scientific Open Data',
    currentStatus: 'Reference Factor',
  },
];
