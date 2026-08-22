import { WeatherSnapshot } from '../schemas/weatherSchema';
import { Season } from '../../types/climate';

export function getFmiWeatherObservation(season: Season = 'winter'): WeatherSnapshot {
  const now = new Date();
  let temp = -4.5;
  let wind = 4.2;
  let desc = 'Overcast, light snow (Pilvistä, heikkoa lumisadetta)';
  let hdd = 1.25;
  let hint = 'Keep room heating at 21°C and optimize electric heating cycles to night hours.';

  if (season === 'spring') {
    temp = 8.5;
    wind = 5.0;
    desc = 'Clear spring sun (Aurinkoista, kevätsää)';
    hdd = 0.6;
    hint = 'Solar panels start peak production in Espoo. Great time for laundry and heat pump airing.';
  } else if (season === 'summer') {
    temp = 21.0;
    wind = 3.1;
    desc = 'Warm, partly cloudy (Lämmin kesäsää)';
    hdd = 0.0;
    hint = 'Zero heating needed. Take advantage of outdoor drying and bike commutes on Rantaraitilla.';
  } else if (season === 'autumn') {
    temp = 5.0;
    wind = 7.5;
    desc = 'Brisk wind, rainy (Tuulista ja sateista)';
    hdd = 0.85;
    hint = 'High wind generation lowers spot prices. Ideal time for evening electric sauna.';
  }

  return {
    location: 'Espoo Tapiola / Otaniemi Weather Radar',
    temperatureCelsius: temp,
    windSpeedMs: wind,
    weatherDescription: desc,
    heatingDegreeDayFactor: hdd,
    season,
    recommendationHint: hint,
    source: 'FMI Open Data (Ilmatieteen laitos)',
    freshness: 'demo',
    lastUpdated: now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
  };
}
