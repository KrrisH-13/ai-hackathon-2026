import { ActionDefinition } from '../../types/recommendation';
import { calculateEcoCreditsForImpact } from '../../services/ecoCreditsEngine';

export const CANDIDATE_ACTIONS: ActionDefinition[] = [
  {
    id: 'action-hsl-commute-shift',
    domain: 'transit_hsl',
    titleEn: 'Take HSL Light Rail / Metro instead of driving today',
    titleFi: 'Käytä HSL-ratikkaa tai metroa autoilun sijaan tänään',
    descriptionEn: 'Switch your 12 km commute trip from Tapiola to 100% renewable HSL rail. Saves ~€4.20 and avoids 4.08 kg CO₂e.',
    descriptionFi: 'Korvaa 12 km Tapiolan työmatkaautoilu 100% uusiutuvalla HSL-raideliikenteellä. Säästää ~4,20 € ja välttää 4,08 kg CO₂e.',
    applicableSeasons: 'all',
    excludedByConstraints: [],
    baseDifficulty: 'easy',
    calcParameters: {
      baseCo2KgSaved: 4.08,
      baseEurSaved: 4.20,
      gridFlexibilityBonus: 10,
    },
  },
  {
    id: 'action-ev-night-charge',
    domain: 'energy_spot',
    titleEn: 'Charge EV after 22:00 (Night Wind Window)',
    titleFi: 'Lataa sähköauto klo 22:00 jälkeen (Yön tuulivoimatunnit)',
    descriptionEn: 'Shift EV home charging to overnight hours (22:00–05:00) when Nord Pool spot rates drop ~70% and clean wind generation surges.',
    descriptionFi: 'Lataa sähköauto yöllä kun pörssisähkön hinta on alimmillaan ja kantaverkossa puhdasta tuulivoimaa.',
    applicableSeasons: 'all',
    excludedByConstraints: ['no_car', 'no_ev'],
    baseDifficulty: 'easy',
    calcParameters: {
      baseKwhSaved: 18.0,
      baseCo2KgSaved: 0.9,
      baseEurSaved: 0.65,
      peakHourShift: true,
      gridFlexibilityBonus: 30,
    },
  },
  {
    id: 'action-dishwasher-post-21',
    domain: 'energy_spot',
    titleEn: 'Run Dishwasher after 21:00',
    titleFi: 'Käynnistä tiskikone klo 21:00 jälkeen',
    descriptionEn: 'Delay the dishwasher cycle to the evening price valley to avoid 17:00–20:00 peak grid stress.',
    descriptionFi: 'Ajasta tiskikone iltahuippujen ulkopuolelle edullisempaan ja puhtaampaan tuntihintaan.',
    applicableSeasons: 'all',
    excludedByConstraints: [],
    baseDifficulty: 'easy',
    calcParameters: {
      baseKwhSaved: 1.4,
      baseCo2KgSaved: 0.18,
      baseEurSaved: 0.22,
      peakHourShift: true,
      gridFlexibilityBonus: 15,
    },
  },
  {
    id: 'action-sauna-timing',
    domain: 'sauna_optimizer',
    titleEn: 'Shift Electric Sauna to Clean Wind Hours (21:00+)',
    titleFi: 'Siirrä kiukaan lämmitys yölyylyihin (klo 21:00 jälkeen)',
    descriptionEn: 'Heat a 7 kW electric kiuas after 21:00 when Nord Pool spot rates drop ~70% and wind energy surges.',
    descriptionFi: 'Lämmitä 7 kW kiuas klo 21 jälkeen jolloin pörssisähkö on ~70% halvempaa ja kantaverkossa runsaasti tuulivoimaa.',
    applicableSeasons: 'all',
    excludedByConstraints: ['no_sauna', 'wood_sauna_only'],
    baseDifficulty: 'easy',
    calcParameters: {
      baseKwhSaved: 2.5,
      baseCo2KgSaved: 1.2,
      baseEurSaved: 1.45,
      peakHourShift: true,
      gridFlexibilityBonus: 25,
    },
  },
  {
    id: 'action-room-temp-1deg',
    domain: 'heating_climate',
    titleEn: 'Lower Living Area Thermostat by 1°C (21°C -> 20°C)',
    titleFi: 'Laske huonelämpötilaa 1°C (21°C -> 20°C)',
    descriptionEn: 'Every 1°C reduction cuts total household heating consumption by 5% in sub-zero Nordic winters.',
    descriptionFi: 'Jokainen 1°C pudotus säästää 5% asunnon lämmitysenergiasta talvikaudella.',
    applicableSeasons: ['winter', 'autumn', 'spring'],
    excludedByConstraints: ['no_temperature_reduction'],
    baseDifficulty: 'easy',
    calcParameters: {
      baseKwhSaved: 4.8,
      baseCo2KgSaved: 0.32,
      baseEurSaved: 0.45,
      gridFlexibilityBonus: 15,
    },
  },
  {
    id: 'action-pikaratikka-commute',
    domain: 'transit_hsl',
    titleEn: 'Take Pikaratikka 15 / Länsimetro for Daily Trips',
    titleFi: 'Käytä Pikaratikkaa 15 tai Länsimetroa työmatkoihin',
    descriptionEn: 'Replace Kehä I / Länsiväylä car traffic with 100% renewable HSL orbital light rail and metro.',
    descriptionFi: 'Korvaa Kehä I:n autoruuhkat 100% uusiutuvalla HSL-pikaraitiotiellä ja metrolla.',
    applicableSeasons: 'all',
    excludedByConstraints: [],
    baseDifficulty: 'moderate',
    calcParameters: {
      baseCo2KgSaved: 3.1,
      baseEurSaved: 4.2,
      gridFlexibilityBonus: 10,
    },
  },
  {
    id: 'action-hsy-plastic-bio',
    domain: 'circular_waste',
    titleEn: 'Flawless Packaging & Bio-waste Separation (100%)',
    titleFi: '100% muovipakkausten ja biojätteen erottelu',
    descriptionEn: 'Divert plastics to Fortum Riihimäki refinery and organics to Ämmässuo biogas production.',
    descriptionFi: 'Ohjaa muovit Fortumin Riihimäen jalostamolle ja biojäte Ämmässuon biokaasutuotantoon.',
    applicableSeasons: 'all',
    excludedByConstraints: [],
    baseDifficulty: 'easy',
    calcParameters: {
      baseCo2KgSaved: 0.65,
      baseEurSaved: 0.15,
      gridFlexibilityBonus: 5,
    },
  },
  {
    id: 'action-domestic-plant-protein',
    domain: 'nordic_nutrition',
    titleEn: 'Replace Red Meat with Nordic Fava Protein (Härkis / Nyhtökaura)',
    titleFi: 'Korvaa liha kotimaisella kasviproteiinilla (Härkis / Nyhtökaura)',
    descriptionEn: 'Choose Finnish oats and fava beans for dinner 3 times this week.',
    descriptionFi: 'Valitse kotimaista härkäpapua tai kauraa illalliseksi 3 kertaa viikossa.',
    applicableSeasons: 'all',
    excludedByConstraints: ['dietary_restrictions'],
    baseDifficulty: 'easy',
    calcParameters: {
      baseCo2KgSaved: 2.8,
      baseEurSaved: 2.5,
      gridFlexibilityBonus: 0,
    },
  },
];

export function calculateActionCo2Saving(action: ActionDefinition): number {
  return action.calcParameters.baseCo2KgSaved || 0.5;
}

export function calculateActionMoneySaving(action: ActionDefinition): number {
  return action.calcParameters.baseEurSaved || 0.5;
}

export function calculateEcoCreditsForAction(action: ActionDefinition, streakDays: number = 0): number {
  const result = calculateEcoCreditsForImpact({
    actionId: action.id,
    actionTitle: action.titleEn,
    avoidedCo2Kg: action.calcParameters.baseCo2KgSaved,
    confidence: 'HIGH',
    savedEur: action.calcParameters.baseEurSaved,
    streakDays,
  });
  return result.finalCreditsAwarded;
}


