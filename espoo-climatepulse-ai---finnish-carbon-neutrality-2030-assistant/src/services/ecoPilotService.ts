import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, ActionDefinition, EcoPilotRecommendation } from '../types/recommendation';
import { Season } from '../types/climate';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';
import { calculateActionCo2Saving, calculateActionMoneySaving, calculateEcoCreditsForAction } from '../data/actions/candidateActions';
import { rankRecommendations } from '../climate/calculations';

export function getCurrentObservationSnapshot(
  season: Season = 'winter',
  currentHour: number = new Date().getHours()
): ObservationSnapshot {
  const isNight = currentHour >= 22 || currentHour <= 5;
  const isPeak = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 20);

  const spotPrice = isNight ? 2.4 : isPeak ? 17.5 : 8.5;
  const emissionFactor = isNight ? 22 : isPeak ? 95 : 45;
  const cleanShare = isNight ? 92 : isPeak ? 74 : 85;

  let outdoorTemp = -4.5;
  if (season === 'spring') outdoorTemp = 7.5;
  if (season === 'summer') outdoorTemp = 21.0;
  if (season === 'autumn') outdoorTemp = 5.0;

  return {
    timestamp: new Date().toISOString(),
    currentHour,
    currentSeason: season,
    currentSpotPriceCents: spotPrice,
    gridEmissionFactorGCO2: emissionFactor,
    cleanEnergySharePercent: cleanShare,
    outdoorTempCelsius: outdoorTemp,
    isCleanPeakHours: isNight,
    isPriceValleyHours: spotPrice <= 4.0,
    publicDataSourceMeta: [
      { id: 'nordpool', name: 'Nord Pool Day-Ahead Spot', freshness: 'demo', sourceUrl: 'https://nordpoolspot.com' },
      { id: 'fingrid', name: 'Fingrid Open Data', freshness: 'demo', sourceUrl: 'https://data.fingrid.fi' },
      { id: 'fmi', name: 'FMI Weather', freshness: 'demo', sourceUrl: 'https://ilmatieteenlaitos.fi' },
    ],
  };
}

export function executeEcoPilotAction(
  action: ActionDefinition,
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot
) {
  const co2Kg = calculateActionCo2Saving(action);
  const eurSaved = calculateActionMoneySaving(action);
  const credits = calculateEcoCreditsForAction(action, userProfile.streakDays);

  const updatedProfile: EcoPilotUserProfile = {
    ...userProfile,
    ecoCredits: userProfile.ecoCredits + credits,
    savedCo2Kg: Number((userProfile.savedCo2Kg + co2Kg).toFixed(2)),
    savedEurTotal: Number((userProfile.savedEurTotal + eurSaved).toFixed(2)),
    streakDays: userProfile.streakDays + 1,
    acceptedActionsHistory: Array.from(new Set([...userProfile.acceptedActionsHistory, action.id])),
    feedbackLog: [
      {
        actionId: action.id,
        category: action.domain,
        accepted: true,
        timestamp: new Date().toISOString(),
        userNote: `Completed: ${action.titleEn}`,
      },
      ...userProfile.feedbackLog,
    ],
  };

  return {
    updatedProfile,
    co2Kg,
    eurSaved,
    credits,
    message: `Action executed! +${credits} EcoCredits, -${co2Kg.toFixed(2)} kg CO2, +€${eurSaved.toFixed(2)} saved.`,
  };
}
