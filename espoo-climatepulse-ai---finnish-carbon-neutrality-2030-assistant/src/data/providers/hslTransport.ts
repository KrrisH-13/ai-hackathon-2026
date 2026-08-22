import { HslRoutePlan } from '../schemas/hslSchema';
import { calculateTransportImpact } from '../../climate/calculations';

export function getHslEspooRoutePlans(): HslRoutePlan[] {
  const routes = [
    {
      fromName: 'Otaniemi (Aalto-yliopisto)',
      toName: 'Leppävaara (Sello)',
      distanceKm: 6.8,
      transitDurationMinutes: 14,
      carDurationMinutes: 12,
      transitLines: ['Pikaratikka 15 (Light Rail)'],
      transitMode: 'hsl_metro_train_tram',
    },
    {
      fromName: 'Matinkylä (Iso Omena)',
      toName: 'Keilaniemi',
      distanceKm: 8.2,
      transitDurationMinutes: 11,
      carDurationMinutes: 15,
      transitLines: ['Länsimetro (Metro)'],
      transitMode: 'hsl_metro_train_tram',
    },
    {
      fromName: 'Tapiola',
      toName: 'Kamppi (Helsinki Keskusta)',
      distanceKm: 9.5,
      transitDurationMinutes: 13,
      carDurationMinutes: 20,
      transitLines: ['Länsimetro (Metro)'],
      transitMode: 'hsl_metro_train_tram',
    },
    {
      fromName: 'Kivenlahti',
      toName: 'Otaniemi',
      distanceKm: 16.0,
      transitDurationMinutes: 22,
      carDurationMinutes: 18,
      transitLines: ['Länsimetro + Pikaratikka 15'],
      transitMode: 'hsl_metro_train_tram',
    },
  ];

  return routes.map((r) => {
    const impact = calculateTransportImpact({
      distanceKm: r.distanceKm,
      baselineMode: 'car_petrol',
      alternativeMode: 'hsl_metro_train_tram',
      ticketPriceEur: 3.10,
    });

    return {
      fromName: r.fromName,
      toName: r.toName,
      distanceKm: r.distanceKm,
      transitDurationMinutes: r.transitDurationMinutes,
      carDurationMinutes: r.carDurationMinutes,
      transitLines: r.transitLines,
      transitMode: r.transitMode,
      transitCo2Grams: impact.alternativeCo2GramsPerTrip,
      carCo2Grams: impact.baselineCo2GramsPerTrip,
      co2SavedGrams: impact.baselineCo2GramsPerTrip - impact.alternativeCo2GramsPerTrip,
      ticketPriceEur: 3.10,
      carCostEur: impact.baselineCostEurPerTrip,
      costSavedEur: impact.costSavedEurPerTrip,
      source: 'Digitransit / HSL Open Routing API',
      freshness: 'demo' as const,
    };
  });
}
