import React from 'react';

export type ToolCategory = 'energy' | 'transport' | 'waste' | 'grocery' | 'simulation' | 'city';
export type ToolDataStatus = 'live' | 'public_data' | 'cached' | 'demo';

export interface ToolDataSourceInfo {
  providerName: string;
  type: 'LIVE OPEN DATA' | 'PUBLIC DATA / TRANSIT API' | 'RESEARCH AVERAGE' | 'DEMO BASELINE';
  lastUpdated: string;
  sourceUrl?: string;
  disclaimer: string;
  partnershipDisclaimer?: string;
}

export interface EcoPilotToolDefinition {
  id: string;
  name: string;
  nameFi: string;
  tagline: string;
  taglineFi: string;
  description: string;
  descriptionFi: string;
  icon: string;
  category: ToolCategory;
  status: ToolDataStatus;
  dataSource: ToolDataSourceInfo;
  badge?: string;
  badgeFi?: string;
  highlightAction?: string;
  highlightActionFi?: string;
}

export const ECO_TOOLS_REGISTRY: EcoPilotToolDefinition[] = [
  {
    id: 'green-window',
    name: 'Green Window',
    nameFi: 'Vihreä Aikaikkuna',
    tagline: 'Spot the cleanest hours for electricity',
    taglineFi: 'Tunnista puhtaimmat sähkötunnit',
    description: 'Real-time grid carbon intensity & optimal hours to run heavy appliances or charge your EV.',
    descriptionFi: 'Reaaliaikainen kantaverkon puhtaus ja parhaat tunnit kodinkoneille ja lataukselle.',
    icon: '⚡',
    category: 'energy',
    status: 'public_data',
    badge: 'Fingrid Open Data',
    badgeFi: 'Fingrid Avoin Data',
    highlightAction: 'View clean hours',
    highlightActionFi: 'Katso parhaat tunnit',
    dataSource: {
      providerName: 'Fingrid & Nord Pool (Public Open Data)',
      type: 'PUBLIC DATA / TRANSIT API',
      lastUpdated: 'Live cache (3 min)',
      sourceUrl: 'https://data.fingrid.fi',
      disclaimer: 'Based on public Finnish national transmission grid telemetry and hourly spot prices. No commercial electricity endorsement.',
      partnershipDisclaimer: 'Public Information. Not an official commercial partnership.',
    },
  },
  {
    id: 'receipt-scanner',
    name: 'Scan Receipt',
    nameFi: 'Kuitin Ilmastolaskuri',
    tagline: 'Category-level grocery footprint',
    taglineFi: 'Ruokaostosten arvioitu hiilijalanjälki',
    description: 'Scan or review supermarket grocery items to see estimated CO₂ and explore painless low-carbon swaps.',
    descriptionFi: 'Tarkastele ruokakorin tuotteiden arvioituja päästöjä ja löydä helppoja kasvipohjaisia vaihtoehtoja.',
    icon: '📷',
    category: 'grocery',
    status: 'demo',
    badge: 'Luke / SYKE Factors',
    badgeFi: 'Luke / SYKE Kertoimet',
    highlightAction: 'Analyze basket',
    highlightActionFi: 'Laske ruokakori',
    dataSource: {
      providerName: 'Natural Resources Institute Finland (Luke) & SYKE',
      type: 'RESEARCH AVERAGE',
      lastUpdated: 'Baseline Research Dataset',
      sourceUrl: 'https://www.luke.fi',
      disclaimer: 'Calculations use category averages for Finnish grocery items. Approximate estimation, not verified product-level lifecycle carbon accounting.',
      partnershipDisclaimer: 'Public Research Baseline. Not affiliated with any retail chain.',
    },
  },
  {
    id: 'what-if',
    name: 'What If? Explorer',
    nameFi: 'Mitä jos? -Simulaattori',
    tagline: 'Explore alternative decisions before committing',
    taglineFi: 'Testaa arjen päätöksiä ennen sitoutumista',
    description: 'Simulate changes in heating, sauna timing, commuting, and diet to see deterministic € and CO₂ impact.',
    descriptionFi: 'Laske lämmityksen, saunan siirron, pyöräilyn tai ruokavalion tarkat säästöt ja päästövähennykset.',
    icon: '🔮',
    category: 'simulation',
    status: 'public_data',
    badge: 'Interactive',
    badgeFi: 'Interaktiivinen',
    highlightAction: 'Simulate scenario',
    highlightActionFi: 'Kokeile skenaariota',
    dataSource: {
      providerName: 'Deterministic Nordic Climate Math Engine',
      type: 'PUBLIC DATA / TRANSIT API',
      lastUpdated: 'Live parameter engine',
      disclaimer: 'Transparent, reproducible formulas derived from Finnish Energy and Motiva standards. Fully open and auditable.',
      partnershipDisclaimer: 'Neutral civic calculation engine.',
    },
  },
  {
    id: 'transport',
    name: 'Transit & Commute',
    nameFi: 'Joukkoliikenne & Matkat',
    tagline: 'HSL metro, light rail 15 & bus routes',
    taglineFi: 'HSL metro, pikaratikka 15 ja bussit',
    description: 'Compare low-carbon transit vs car commute across Espoo corridors with exact time and cost breakdowns.',
    descriptionFi: 'Vertaa Länsimetron, pikaratikka 15:n ja autoilun kuluja, matka-aikoja ja päästöjä Espoossa.',
    icon: '🚆',
    category: 'transport',
    status: 'public_data',
    badge: 'HSL Open Data',
    badgeFi: 'HSL Avoin Data',
    highlightAction: 'Plan commute',
    highlightActionFi: 'Vertaa työmatkaa',
    dataSource: {
      providerName: 'HSL Digitransit Open API & VTT Lipasto',
      type: 'PUBLIC DATA / TRANSIT API',
      lastUpdated: 'HSL Schedule Cache',
      sourceUrl: 'https://digitransit.fi',
      disclaimer: 'Public route timetable and emission factors based on VTT Lipasto database. Zero private location harvesting.',
      partnershipDisclaimer: 'Public Open Data feed. EcoPilot is not an official HSL application.',
    },
  },
  {
    id: 'recycling',
    name: 'Recycling Guide',
    nameFi: 'HSY Kierrätys & Jätteet',
    tagline: 'Sortti stations & circular waste guide',
    taglineFi: 'Sortti-asemat ja jätteiden lajitteluohjeet',
    description: 'Instant sorting guidance for tricky items, nearest Sortti station locations, and circular economy savings.',
    descriptionFi: 'Löydä oikea jäteastia, lähin Sortti-asema Espoossa ja selvitä biojätteen hyöty biokaasuna.',
    icon: '♻️',
    category: 'waste',
    status: 'public_data',
    badge: 'HSY Waste Guide',
    badgeFi: 'HSY Jäteopas',
    highlightAction: 'Search items',
    highlightActionFi: 'Etsi jäteohje',
    dataSource: {
      providerName: 'Helsinki Region Environmental Services (HSY)',
      type: 'PUBLIC DATA / TRANSIT API',
      lastUpdated: 'HSY Waste Database',
      sourceUrl: 'https://www.hsy.fi',
      disclaimer: 'Public sorting rules and waste station locations in the Helsinki-Espoo metropolitan area.',
      partnershipDisclaimer: 'Public Information. EcoPilot is an independent civic tool, not an official HSY service.',
    },
  },
  {
    id: 'home-energy',
    name: 'Home Energy & Sauna',
    nameFi: 'Kodin Energia & Sauna',
    tagline: 'Nord Pool spot rates & heating optimization',
    taglineFi: 'Pörssisähkö, ilmalämpöpumppu ja sauna',
    description: 'Optimize heat pump setbacks, shift sauna sessions to clean wind peaks, and track dynamic electricity tariffs.',
    descriptionFi: 'Optimoi ilmalämpöpumppu, ajoita saunavuoro tuulivoimahuipuille ja seuraa pörssisähkön hintaa.',
    icon: '🏠',
    category: 'energy',
    status: 'public_data',
    badge: 'Nord Pool Spot',
    badgeFi: 'Nord Pool Pörssi',
    highlightAction: 'Optimize heating',
    highlightActionFi: 'Optimoi sähkönkäyttö',
    dataSource: {
      providerName: 'Nord Pool Spot & Fingrid Telemetry',
      type: 'LIVE OPEN DATA',
      lastUpdated: 'Hourly Price Feed',
      sourceUrl: 'https://www.nordpoolgroup.com',
      disclaimer: 'Hourly spot electricity price data for Finland price area (FI) + Fingrid real-time generation balance.',
      partnershipDisclaimer: 'Public Information. Not a commercial energy broker or retailer.',
    },
  },
  {
    id: 'espoo-2030',
    name: 'Espoo 2030 Watch',
    nameFi: 'Hiilineutraali Espoo 2030',
    tagline: 'Espoo climate neutrality roadmap',
    taglineFi: 'Espoon kaupungin ilmastovahti',
    description: 'Track municipal emissions targets, Fortum district heat decarbonization, and urban green projects.',
    descriptionFi: 'Seuraa Espoon kaupungin päästötavoitteita, kaukolämmön puhdistumista ja kaupunkisuunnittelua.',
    icon: '🏛️',
    category: 'city',
    status: 'public_data',
    badge: 'Espoo Climate Watch',
    badgeFi: 'Espoon Ilmastovahti',
    highlightAction: 'View city progress',
    highlightActionFi: 'Katso kaupungin tilanne',
    dataSource: {
      providerName: 'City of Espoo Climate Watch (Ilmastovahti)',
      type: 'PUBLIC DATA / TRANSIT API',
      lastUpdated: 'Municipal 2024-2030 Plan',
      sourceUrl: 'https://ilmastovahti.espoo.fi',
      disclaimer: 'Public municipal climate reporting data from the City of Espoo.',
      partnershipDisclaimer: 'Public Civic Information. Built for Espoo residents.',
    },
  },
  {
    id: 'ecopilot-loop',
    name: 'AI Learning Loop',
    nameFi: 'Tekoälyn Oppimissilmukka',
    tagline: 'Inspect grounded reasoning & feedback loop',
    taglineFi: 'Tarkastele suosittelun taustalogiikkaa',
    description: 'See how EcoPilot observes grid conditions, applies your constraints, and updates learned preferences.',
    descriptionFi: 'Katso miten EcoPilot yhdistää kantaverkkotiedon, rajoitteesi ja oppii antamastasi palautteesta.',
    icon: '🔄',
    category: 'simulation',
    status: 'demo',
    badge: 'Transparent AI',
    badgeFi: 'Läpinäkyvä AI',
    highlightAction: 'Inspect loop',
    highlightActionFi: 'Tarkista logiikka',
    dataSource: {
      providerName: 'EcoPilot Grounded Reasoning Architecture',
      type: 'DEMO BASELINE',
      lastUpdated: 'System state live',
      disclaimer: 'Combines deterministic constraint filtering with Gemini explanation generation.',
      partnershipDisclaimer: 'Civic AI Architecture.',
    },
  },
];
