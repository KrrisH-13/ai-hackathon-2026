/**
 * HSL-Aligned Deterministic Transport Impact Engine
 * 
 * Sources:
 * - HSL Journey Planner (Reittiopas) official emission reference:
 *   Average passenger car in HSL area = 170 g CO₂e / km
 * - HSL Rail (Metro, Pikaratikka 15, Commuter train): 0 g CO₂e / km (100% renewable electricity - wind & hydro certified)
 * - HSL Bus mix (Helsinki metropolitan region): 45 g CO₂e / passenger-km (composite fleet)
 * - HSL Electric Bus: 8 g CO₂e / passenger-km
 * - Cycling & Walking: 0 g CO₂e / km
 */

export interface TransportEmissionFactor {
  modeKey: string;
  name: string;
  nameFi: string;
  gCo2ePerKm: number;
  sourceDescription: string;
  sourceUrl: string;
  isZeroDirectEmission: boolean;
  costPerKmEur: number;
}

export const HSL_TRANSPORT_FACTORS: Record<string, TransportEmissionFactor> = {
  car_single: {
    modeKey: 'car_single',
    name: 'Private Passenger Car (1 person)',
    nameFi: 'Henkilöauto (1 hlö)',
    gCo2ePerKm: 170,
    sourceDescription: 'HSL Journey Planner official baseline for private passenger car in HSL region (170 g CO₂e/km).',
    sourceUrl: 'https://www.hsl.fi/en/hsl/electric-buses/environmental-performance-in-figures',
    isZeroDirectEmission: false,
    costPerKmEur: 0.32, // fuel, wear, maintenance, parking amortized
  },
  car_carpool_2: {
    modeKey: 'car_carpool_2',
    name: 'Carpool Passenger Car (2 people)',
    nameFi: 'Kimppakyyti (2 hlö)',
    gCo2ePerKm: 85,
    sourceDescription: 'HSL car baseline (170 g/km) divided by 2 occupants (85 g CO₂e/passenger-km).',
    sourceUrl: 'https://www.hsl.fi/en/hsl/electric-buses/environmental-performance-in-figures',
    isZeroDirectEmission: false,
    costPerKmEur: 0.16,
  },
  hsl_electric_rail: {
    modeKey: 'hsl_electric_rail',
    name: 'HSL Rail (Metro, Pikaratikka 15, Commuter Train)',
    nameFi: 'HSL Raideliikenne (Metro, Pikaratikka 15, Lähijuna)',
    gCo2ePerKm: 0,
    sourceDescription: '100% certified renewable electricity (hydro and Nordic wind power) contracted by HSL for rail operations.',
    sourceUrl: 'https://www.hsl.fi/en/hsl/electric-buses/environmental-performance-in-figures',
    isZeroDirectEmission: true,
    costPerKmEur: 0.12, // ticket equivalent / km
  },
  hsl_bus_average: {
    modeKey: 'hsl_bus_average',
    name: 'HSL Bus (Average Fleet Mix)',
    nameFi: 'HSL Bussiliikenne (Laivaston keskiarvo)',
    gCo2ePerKm: 45,
    sourceDescription: 'HSL composite bus fleet average including renewable diesel and electric buses.',
    sourceUrl: 'https://www.hsl.fi/en/hsl/electric-buses/environmental-performance-in-figures',
    isZeroDirectEmission: false,
    costPerKmEur: 0.12,
  },
  hsl_electric_bus: {
    modeKey: 'hsl_electric_bus',
    name: 'HSL Fully Electric Bus',
    nameFi: 'HSL Täyssähköbussi',
    gCo2ePerKm: 8,
    sourceDescription: 'HSL zero-tailpipe electric bus powered by certified Nordic renewable grid mix.',
    sourceUrl: 'https://www.hsl.fi/en/hsl/electric-buses/environmental-performance-in-figures',
    isZeroDirectEmission: true,
    costPerKmEur: 0.12,
  },
  bicycle: {
    modeKey: 'bicycle',
    name: 'Bicycle / City Bike / E-bike',
    nameFi: 'Polkupyörä / Kaupunkipyörä / Sähköpyörä',
    gCo2ePerKm: 0,
    sourceDescription: 'Active mobility with 0 direct fossil fuel combustion.',
    sourceUrl: 'https://www.hsl.fi/en/citybikes',
    isZeroDirectEmission: true,
    costPerKmEur: 0.01,
  },
  walking: {
    modeKey: 'walking',
    name: 'Walking (Kävely)',
    nameFi: 'Kävely',
    gCo2ePerKm: 0,
    sourceDescription: 'Active human-powered mobility with 0 emissions.',
    sourceUrl: 'https://www.hsl.fi',
    isZeroDirectEmission: true,
    costPerKmEur: 0.00,
  },
};

export interface CommuteCalculationInput {
  distanceKm: number;
  commuteDaysPerWeek?: number;
  weeksPerYear?: number;
  baselineMode?: string; // default 'car_single'
  chosenMode?: string; // default 'hsl_electric_rail'
  carOccupancy?: number;
  isRoundTrip?: boolean;
}

export interface CommuteImpactResult {
  distanceOneWayKm: number;
  totalDistanceKm: number; // single trip or round trip
  tripsPerWeek: number;
  annualTrips: number;
  baselineFactor: TransportEmissionFactor;
  chosenFactor: TransportEmissionFactor;
  
  // Single instance / day trip impact
  baselineCo2Kg: number;
  chosenCo2Kg: number;
  avoidedCo2Kg: number;
  baselineCostEur: number;
  chosenCostEur: number;
  savedCostEur: number;
  
  // Weekly, monthly, and annual impact
  weeklyAvoidedCo2Kg: number;
  monthlyAvoidedCo2Kg: number;
  annualAvoidedCo2Kg: number;
  weeklySavedEur: number;
  monthlySavedEur: number;
  annualSavedEur: number;
  
  // Transparency & Citations
  methodology: string;
  sourceCitation: string;
  formulaDescription: string;
  assumptions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function calculateTransportTripImpact(input: CommuteCalculationInput): CommuteImpactResult {
  const distanceOneWay = Math.max(0.5, Number(input.distanceKm) || 12);
  const isRoundTrip = input.isRoundTrip ?? true;
  const tripDistance = isRoundTrip ? distanceOneWay * 2 : distanceOneWay;
  const daysPerWeek = Math.max(1, Math.min(7, input.commuteDaysPerWeek ?? 5));
  const weeksYear = Math.max(1, Math.min(52, input.weeksPerYear ?? 44));
  const tripsPerWeek = isRoundTrip ? daysPerWeek : daysPerWeek;
  const annualTrips = tripsPerWeek * weeksYear;

  const baselineKey = input.baselineMode || 'car_single';
  const chosenKey = input.chosenMode || 'hsl_electric_rail';

  const baselineFactor = HSL_TRANSPORT_FACTORS[baselineKey] || HSL_TRANSPORT_FACTORS.car_single;
  const chosenFactor = HSL_TRANSPORT_FACTORS[chosenKey] || HSL_TRANSPORT_FACTORS.hsl_electric_rail;

  // Compute grams then convert to kg
  const baselineGrams = tripDistance * baselineFactor.gCo2ePerKm;
  const chosenGrams = tripDistance * chosenFactor.gCo2ePerKm;

  const baselineCo2Kg = Number((baselineGrams / 1000).toFixed(2));
  const chosenCo2Kg = Number((chosenGrams / 1000).toFixed(2));
  const avoidedCo2Kg = Number(Math.max(0, baselineCo2Kg - chosenCo2Kg).toFixed(2));

  // Cost estimates: Car baseline includes fuel + parking/wear (€0.32/km + ~€1.50 parking if >5km)
  let baseCost = tripDistance * baselineFactor.costPerKmEur;
  if (baselineKey.startsWith('car')) {
    baseCost += 1.50; // nominal parking & parking fee amortized
  }
  const chosenCost = chosenKey.startsWith('hsl') ? 3.10 : tripDistance * chosenFactor.costPerKmEur; // HSL AB zone single or fractional season ticket
  
  const baselineCostEur = Number(baseCost.toFixed(2));
  const chosenCostEur = Number(chosenCost.toFixed(2));
  const savedCostEur = Number(Math.max(0, baselineCostEur - chosenCostEur).toFixed(2));

  const weeklyAvoidedCo2Kg = Number((avoidedCo2Kg * daysPerWeek).toFixed(1));
  const monthlyAvoidedCo2Kg = Number((weeklyAvoidedCo2Kg * 4.33).toFixed(1));
  const annualAvoidedCo2Kg = Number((avoidedCo2Kg * annualTrips).toFixed(0));

  const weeklySavedEur = Number((savedCostEur * daysPerWeek).toFixed(2));
  const monthlySavedEur = Number((weeklySavedEur * 4.33).toFixed(2));
  const annualSavedEur = Number((savedCostEur * annualTrips).toFixed(0));

  const formulaDescription = isRoundTrip
    ? `${distanceOneWay} km × 2 = ${tripDistance} km round-trip: (${tripDistance} km × ${baselineFactor.gCo2ePerKm} g/km) - (${tripDistance} km × ${chosenFactor.gCo2ePerKm} g/km) = ${avoidedCo2Kg} kg CO₂e avoided.`
    : `${tripDistance} km one-way: (${tripDistance} km × ${baselineFactor.gCo2ePerKm} g/km) - (${tripDistance} km × ${chosenFactor.gCo2ePerKm} g/km) = ${avoidedCo2Kg} kg CO₂e avoided.`;

  const assumptions = [
    `Baseline car emissions: ${baselineFactor.gCo2ePerKm} g CO₂e/km (HSL official Journey Planner baseline for private car).`,
    `Chosen mode emissions: ${chosenFactor.gCo2ePerKm} g CO₂e/km (${chosenFactor.sourceDescription}).`,
    `Distance based on specified commute origin & destination (${distanceOneWay} km one-way).`,
    `Cost includes fuel, vehicle wear, and parking amortisation vs standard HSL AB ticket pricing.`,
  ];

  return {
    distanceOneWayKm: distanceOneWay,
    totalDistanceKm: tripDistance,
    tripsPerWeek,
    annualTrips,
    baselineFactor,
    chosenFactor,
    baselineCo2Kg,
    chosenCo2Kg,
    avoidedCo2Kg,
    baselineCostEur,
    chosenCostEur,
    savedCostEur,
    weeklyAvoidedCo2Kg,
    monthlyAvoidedCo2Kg,
    annualAvoidedCo2Kg,
    weeklySavedEur,
    monthlySavedEur,
    annualSavedEur,
    methodology: 'HSL Official Journey Planner Environmental Performance Model (2025/2026)',
    sourceCitation: baselineFactor.sourceUrl,
    formulaDescription,
    assumptions,
    confidence: 'HIGH',
  };
}
