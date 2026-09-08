/**
 * Static reference data for the ecopilot feature. The three-persona
 * DEFAULT_PROFILES demo dataset from the original "Kipinä Espoo AI"
 * prototype (espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant/src/data/espooData.ts)
 * has been replaced by a real per-account profile — see
 * lib/ecopilot/queries.ts and supabase/migrations/20260822090000_*.sql.
 */
import type { EspooRoadmapMeasure, SpotPricePoint, ClimateActionItem, CarType } from './types';
import { WASTE_MANAGEMENT_SYSTEMS } from './types';

export const CAR_TYPE_OPTIONS: { value: CarType; label: string }[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'phev', label: 'Plug-in Hybrid (PHEV)' },
  { value: 'ev', label: 'Electric Vehicle (EV)' },
  { value: 'none', label: 'No car' },
];

/** Rough Finnish-average tailpipe/grid gCO2/km per car type — prefilled, user-editable. */
export const CAR_TYPE_DEFAULT_CO2_G_PER_KM: Record<CarType, number> = {
  petrol: 170,
  diesel: 160,
  hybrid: 110,
  phev: 60,
  ev: 25,
  none: 0,
};

/** Re-exported so form components can import options for a field from one place. */
export const WASTE_MANAGEMENT_OPTIONS = WASTE_MANAGEMENT_SYSTEMS;

export const ESPOO_2030_ROADMAP_MEASURES: EspooRoadmapMeasure[] = [
  {
    id: 'fortum-clean-heat',
    title: 'Fortum Espoo Clean Heat & Microsoft Data Center Heat Reuse',
    sector: 'District Heating',
    status: 'accelerated',
    currentEmissionsReductionKtons: 240,
    targetEmissionsReductionKtons: 390,
    leadPartner: 'Fortum Oyj & Microsoft Corp & City of Espoo',
    description:
      'Replacing coal and fossil gas in district heating with waste heat recovery from Microsoft’s mega data centers in Hepokorpi and Kolabacka, combined with large-scale heat pumps and bioenergy.',
    residentImpact:
      'Directly reduces heating emissions for ~85% of Espoo residents in apartments and connected housing without any renovations required from the resident.',
    linkToIlmastovahti: 'https://ilmastovahti.espoo.fi/measures/heating-decarbonization',
  },
  {
    id: 'pikaratikka-15',
    title: 'Pikaratikka 15 & Espoo Sustainable Mobility Hubs',
    sector: 'Transport & Mobility',
    status: 'achieved',
    currentEmissionsReductionKtons: 45,
    targetEmissionsReductionKtons: 70,
    leadPartner: 'HSL & Kaupunkiliikenne Oy & Espoon kaupunki',
    description:
      'Zero-emission orbital light rail connecting Keilaniemi, Aalto University Otaniemi, and Leppävaara with high frequency, complemented by 150km+ of upgraded all-weather cycling baanas.',
    residentImpact:
      'Cuts cross-Espoo transit travel times by 30% and eliminates car dependency for daily work, university, and shopping commutes.',
    linkToIlmastovahti: 'https://ilmastovahti.espoo.fi/measures/pikaratikka-15',
  },
  {
    id: 'kera-circular-district',
    title: 'Kera Zero-Emission & Circular Ecosystem',
    sector: 'Circular Economy',
    status: 'on_track',
    currentEmissionsReductionKtons: 28,
    targetEmissionsReductionKtons: 65,
    leadPartner: 'S-Ryhmä, Sitowise & Espoo Urban Development',
    description:
      'Transforming former logistics halls in Kera into a 14,000-resident carbon-neutral district featuring shared geothermal networks, community solar microgrids, and localized circular food loops.',
    residentImpact:
      'Provides a live testbed for circular living, shared electric mobility hubs, and localized sorting for up to 90% recycling rates.',
    linkToIlmastovahti: 'https://ilmastovahti.espoo.fi/measures/kera-district',
  },
  {
    id: 'taloyhtio-energy-renovations',
    title: 'Housing Company Energy Transition Accelerator (Taloyhtiöt)',
    sector: 'Electricity & Energy',
    status: 'on_track',
    currentEmissionsReductionKtons: 62,
    targetEmissionsReductionKtons: 110,
    leadPartner: 'Espoon ilmasto-ohjelma & ARA & Energiavirasto',
    description:
      'Municipal advisory service helping apartment buildings (asunto-osakeyhtiöt) transition to geothermal, smart heat recovery (LTO), and rooftop solar energy communities with ARA subsidies.',
    residentImpact:
      'Residents save 30-50% on maintenance charges (hoitovastike) and protect their property value while cutting housing company carbon footprint.',
    linkToIlmastovahti: 'https://ilmastovahti.espoo.fi/measures/housing-energy',
  },
  {
    id: 'nuuksio-carbon-sinks',
    title: 'Nuuksio Peatland Restoration & Urban Carbon Sinks',
    sector: 'Carbon Sinks & Nature',
    status: 'on_track',
    currentEmissionsReductionKtons: 35,
    targetEmissionsReductionKtons: 55,
    leadPartner: 'Metsähallitus & Espoon ympäristökeskus',
    description:
      'Rewetting drained peatlands and expanding protected continuous-cover forestry corridors in Northern Espoo and Nuuksio to enhance long-term biological carbon sequestration and flood resilience.',
    residentImpact:
      'Preserves recreational nature trails, enhances biodiversity, and neutralizes residual municipal emissions by 2030.',
    linkToIlmastovahti: 'https://ilmastovahti.espoo.fi/measures/nuuksio-sinks',
  },
];

/**
 * CO2 figures below are calibrated to Finland's actual grid mix (nuclear +
 * hydro + wind baseload, rarely leaning on fossil peakers or imports) rather
 * than a generic European curve — a live Fingrid reading on a normal day
 * runs roughly 5-90 g CO2/kWh, not the 140g "fossil peakers active" shape
 * this used to have. See lib/ecopilot/gridPrice.ts for the live overlay;
 * these are just the fallback for hours it can't cover (no key, or hours
 * later than "now" — Fingrid's feed is real-time only, it can't forecast).
 */
export const MOCK_HOURLY_SPOT_PRICES: SpotPricePoint[] = [
  { hour: 0, timeLabel: '00:00 - 01:00', priceCentsKwh: 1.8, gridCo2IntensityGramsKwh: 12, status: 'optimal', recommendation: 'Super cheap! Ideal for EV charging & water heater.' },
  { hour: 1, timeLabel: '01:00 - 02:00', priceCentsKwh: 1.2, gridCo2IntensityGramsKwh: 10, status: 'optimal', recommendation: 'Lowest price of the night. Max clean wind power.' },
  { hour: 2, timeLabel: '02:00 - 03:00', priceCentsKwh: 1.4, gridCo2IntensityGramsKwh: 9, status: 'optimal', recommendation: 'Optimal for dishwasher & washing machine timer.' },
  { hour: 3, timeLabel: '03:00 - 04:00', priceCentsKwh: 1.7, gridCo2IntensityGramsKwh: 9, status: 'optimal', recommendation: 'Low grid demand, minimal emissions.' },
  { hour: 4, timeLabel: '04:00 - 05:00', priceCentsKwh: 2.1, gridCo2IntensityGramsKwh: 10, status: 'optimal', recommendation: 'Cheap off-peak window.' },
  { hour: 5, timeLabel: '05:00 - 06:00', priceCentsKwh: 3.5, gridCo2IntensityGramsKwh: 14, status: 'moderate', recommendation: 'Morning demand starting to rise.' },
  { hour: 6, timeLabel: '06:00 - 07:00', priceCentsKwh: 6.8, gridCo2IntensityGramsKwh: 22, status: 'moderate', recommendation: 'Moderate pricing.' },
  { hour: 7, timeLabel: '07:00 - 08:00', priceCentsKwh: 12.4, gridCo2IntensityGramsKwh: 35, status: 'expensive', recommendation: 'Morning peak! Avoid high-power appliances.' },
  { hour: 8, timeLabel: '08:00 - 09:00', priceCentsKwh: 14.8, gridCo2IntensityGramsKwh: 42, status: 'peak', recommendation: 'Peak hours. Reserve heating or switch to eco-mode.' },
  { hour: 9, timeLabel: '09:00 - 10:00', priceCentsKwh: 9.2, gridCo2IntensityGramsKwh: 32, status: 'moderate', recommendation: 'Normal daytime rate.' },
  { hour: 10, timeLabel: '10:00 - 11:00', priceCentsKwh: 5.6, gridCo2IntensityGramsKwh: 24, status: 'moderate', recommendation: 'Good daytime window.' },
  { hour: 11, timeLabel: '11:00 - 12:00', priceCentsKwh: 4.8, gridCo2IntensityGramsKwh: 18, status: 'moderate', recommendation: 'Solar generation picking up.' },
  { hour: 12, timeLabel: '12:00 - 13:00', priceCentsKwh: 3.9, gridCo2IntensityGramsKwh: 14, status: 'optimal', recommendation: 'Solar surplus period. Great for laundry!' },
  { hour: 13, timeLabel: '13:00 - 14:00', priceCentsKwh: 3.4, gridCo2IntensityGramsKwh: 13, status: 'optimal', recommendation: 'Low daytime price.' },
  { hour: 14, timeLabel: '14:00 - 15:00', priceCentsKwh: 4.1, gridCo2IntensityGramsKwh: 14, status: 'optimal', recommendation: 'Affordable power.' },
  { hour: 15, timeLabel: '15:00 - 16:00', priceCentsKwh: 5.9, gridCo2IntensityGramsKwh: 20, status: 'moderate', recommendation: 'Afternoon transition.' },
  { hour: 16, timeLabel: '16:00 - 17:00', priceCentsKwh: 9.8, gridCo2IntensityGramsKwh: 30, status: 'moderate', recommendation: 'Pre-evening rise.' },
  { hour: 17, timeLabel: '17:00 - 18:00', priceCentsKwh: 15.6, gridCo2IntensityGramsKwh: 45, status: 'peak', recommendation: 'EVENING PEAK! Delay sauna heating until 21:00.' },
  { hour: 18, timeLabel: '18:00 - 19:00', priceCentsKwh: 18.2, gridCo2IntensityGramsKwh: 52, status: 'peak', recommendation: 'National peak demand — price spikes more than emissions on Finland’s clean grid.' },
  { hour: 19, timeLabel: '19:00 - 20:00', priceCentsKwh: 13.5, gridCo2IntensityGramsKwh: 40, status: 'expensive', recommendation: 'High price period.' },
  { hour: 20, timeLabel: '20:00 - 21:00', priceCentsKwh: 8.4, gridCo2IntensityGramsKwh: 28, status: 'moderate', recommendation: 'Prices easing.' },
  { hour: 21, timeLabel: '21:00 - 22:00', priceCentsKwh: 4.5, gridCo2IntensityGramsKwh: 18, status: 'optimal', recommendation: '✨ BEST SAUNA WINDOW! 75% cheaper than 18:00.' },
  { hour: 22, timeLabel: '22:00 - 23:00', priceCentsKwh: 3.1, gridCo2IntensityGramsKwh: 14, status: 'optimal', recommendation: 'Great for night sauna & heating boost.' },
  { hour: 23, timeLabel: '23:00 - 24:00', priceCentsKwh: 2.2, gridCo2IntensityGramsKwh: 12, status: 'optimal', recommendation: 'Night rate starts. Set EV timer.' },
];

export const COMMON_CLIMATE_ACTIONS: ClimateActionItem[] = [
  {
    id: 'action-sauna-timing',
    title: 'Time Electric Sauna to Nord Pool Off-Peak Hours',
    category: 'Heating & Energy',
    season: 'all',
    impactKgCo2Year: 180,
    savingsEurYear: 145,
    difficulty: 'Helppo (5 min)',
    completed: true,
    description:
      'Heating a 6 kW kiuas at 21:30 (3 c/kWh, 30g CO2/kWh) instead of 18:00 (18 c/kWh, 135g CO2/kWh) saves ~€1.50 per session and 75% emissions.',
    espooRoadmapAlignment: 'Supports Espoo 2030 flexible grid demand response.',
  },
  {
    id: 'action-room-temp-1deg',
    title: 'Drop Indoor Temperature by 1°C (21°C -> 20°C)',
    category: 'Heating & Energy',
    season: 'winter',
    impactKgCo2Year: 220,
    savingsEurYear: 110,
    difficulty: 'Helppo (5 min)',
    completed: true,
    description:
      'In a Finnish home, every 1°C reduction saves approximately 5% of all heating energy while improving indoor air freshness and sleep quality.',
    espooRoadmapAlignment: 'Directly aids Fortum Clean Heat district heating transition.',
  },
  {
    id: 'action-pikaratikka-commute',
    title: 'Switch 3 Weekly Commutes to Pikaratikka 15 / Länsimetro',
    category: 'Mobility',
    season: 'all',
    impactKgCo2Year: 680,
    savingsEurYear: 820,
    difficulty: 'Kohtalainen',
    completed: false,
    description:
      'Replacing a 20 km daily roundtrip car commute across Kehä I / Länsiväylä with HSL transit cuts 680 kg CO2/year and eliminates fuel & parking costs.',
    espooRoadmapAlignment: 'Advances Espoo sustainable transport target (-70k tons CO2 by 2030).',
  },
  {
    id: 'action-hsy-plastic-bio',
    title: 'Flawless HSY Plastic & Bio-waste Separation (100%)',
    category: 'Circular Living',
    season: 'all',
    impactKgCo2Year: 140,
    savingsEurYear: 45,
    difficulty: 'Helppo (5 min)',
    completed: true,
    description:
      'Separating plastics sends them to Fortum Riihimäki plastics refinery for new raw materials instead of incineration at Vantaa waste-to-energy plant. Bio-waste produces biogas for HSL buses.',
    espooRoadmapAlignment: 'Aligns with HSY regional circular economy 2030 targets.',
  },
  {
    id: 'action-taloyhtio-geothermal',
    title: 'Propose Geothermal / Solar Survey to Housing Company Board',
    category: 'Housing Company',
    season: 'all',
    impactKgCo2Year: 1200,
    savingsEurYear: 450,
    difficulty: 'Investointi / Taloyhtiö',
    completed: false,
    description:
      'Put forward an energy renovation initiative at the annual general meeting (yhtiökokous) utilizing ARA municipal grants for rooftop solar or exhaust air heat recovery (LTO).',
    espooRoadmapAlignment: 'Espoo Housing Company Energy Accelerator measure.',
  },
  {
    id: 'action-plant-based-lunch',
    title: 'Choose Domestic Plant-Based Protein (Härkis / Nyhtökaura / Kauramaito)',
    category: 'Food & Diet',
    season: 'all',
    impactKgCo2Year: 310,
    savingsEurYear: 180,
    difficulty: 'Helppo (5 min)',
    completed: false,
    description:
      'Replacing Finnish beef/pork with Nordic fava beans (härkäpapu) or oat protein 4 times a week cuts dietary footprint by 40%.',
    espooRoadmapAlignment: 'Supports sustainable Nordic food systems.',
  },
];

export const HSY_RECYCLING_GUIDE_QUICK_SAMPLES = [
  {
    item: 'Maitotölkki (Oat / Milk carton with plastic spout)',
    category: 'Kartonki ja pahvi',
    binColor: 'Blue / Cardboard',
    instructions: 'Huuhtele kylmällä vedellä, litistä ja taita sisäkkäin. Muovikorkin voi jättää kiinni tai laittaa muovinkeräykseen.',
    facility: 'Kaikki taloyhtiöiden jätekatokset & Rinki-ekopisteet Espoossa',
  },
  {
    item: 'Voipaperi / Rasvainen voipaketin kääre (Butter wrapper with grease & foil)',
    category: 'Sekajäte (Mixed Waste)',
    binColor: 'Grey / Black',
    instructions: 'Alumiinipitoinen rasvainen paperi ei kelpaa kartonkiin tai muoviin. Laita sekajätteeseen (poltetaan energiaksi Vantaalla).',
    facility: 'Taloyhtiön sekajäteastia',
  },
  {
    item: 'Rikkinäiset talvisaappaat ja villapaidat (Damaged textiles)',
    category: 'Poistotekstiili / Sekajäte',
    binColor: 'Sortti Poistotekstiili',
    instructions: 'Puhtaat ja kuivat mutta rikkinäiset vaatteet muovipussissa HSY Sortti-asemalle tai Sello/Iso Omena keräyspisteeseen.',
    facility: 'Mankkaan Sortti-asema, Ämmässuo, Kauppakeskus Sello / Iso Omena',
  },
  {
    item: 'LED-lamput, loisteputket ja paristot (Lightbulbs & Batteries)',
    category: 'Vaarallinen jäte & SER (Sähköromu)',
    binColor: 'Red / Hazardous / Store bin',
    instructions: 'Paristojen navat teipataan. Lamput ja paristot voi palauttaa ilmaiseksi mihin tahansa lamppuja/paristoja myyvään kauppaan (K-Citymarket, Prisma, Motonet).',
    facility: 'Prisma Iso Omena, K-Citymarket Sello, Mankkaan Sortti',
  },
];
