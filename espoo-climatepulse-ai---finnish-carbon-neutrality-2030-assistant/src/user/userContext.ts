import { EcoPilotUserProfile } from '../types/user';

export const INITIAL_PROFILES: EcoPilotUserProfile[] = [
  {
    id: 'user-alex',
    name: 'Alex',
    municipality: 'Espoo',
    district: 'Suur-Tapiola (Tapiola, Otaniemi, Keilaniemi)',
    neighborhood: 'Tapiola',
    postcode: '02100',
    locationSharingEnabled: false,

    // Housing & Lifestyle
    housingType: 'kerrostalo',
    housingTypeCategory: 'Apartment',
    householdSize: 2,
    livingAreaSqM: 72,
    homeSizeCategory: '70–120 m²',
    heatingSystem: 'Kaukolämpö (District Heating / Fortum Clean Heat)',
    heatingTypeDetail: 'District heating',
    controlsHeating: 'No', // Central apartment building heating; protected
    electricityContract: 'Pörssisähkö (Nord Pool Hourly Spot)',
    saunaType: 'electric',
    saunaTimesPerWeek: 2,
    commuteHabit: 'Pääosin HSL (Metro, Pikaratikka 15, Juna, Bussi)',
    dietPreference: 'flexitarian',

    // Transport Profile
    primaryTransport: 'Mixed',
    carOwnership: 'Petrol',
    hasEv: false,
    evChargingFlexibility: "I don't know",
    publicTransportUsage: '3–4 days/week',
    cyclingFrequency: 'Sometimes',
    walkingFrequency: 'Frequently',

    // Commute Profile
    commuteOrigin: 'Tapiola, Espoo',
    commuteDestination: 'Otaniemi / Keilaniemi Innovation Hub, Espoo',
    commuteDistanceKm: 12,
    commuteDaysPerWeek: 4,
    commuteMode: 'Mixed',
    commuteDepartureTime: '08:15',
    commuteReturnTime: '16:45',
    carOccupancy: 1,

    // User Constraints & Preferences
    avoidBefore07: true,
    avoidAfter22: false,
    preserveMorningRoutine: true,
    maxInconvenienceMinutes: 10, // Max 10 minutes inconvenience tolerance
    preferSavingMoney: true,
    preferReducingCo2: true,
    preferConvenience: true,
    preferPublicTransport: true,
    preferWalkingCycling: true,
    preferFlexibleHousehold: true,

    // Necessity Model ("Necessary vs Flexible")
    necessityModel: {
      'Heating': 'Protected',
      'EV charging': 'Flexible',
      'Morning commute': 'Necessary',
      'Dishwasher': 'Flexible',
      'Sauna': 'Flexible',
      'Laundry': 'Flexible',
    },

    canChange: ['EV charging', 'dishwasher', 'laundry', 'transit_commute'],
    cannotChange: ['renting_no_renovations', 'no_temperature_reduction'],
    caresAbout: ['daily_convenience', 'carbon_reduction', 'energy_cost_savings', 'rewards_ecocredits'],
    acceptedActionsHistory: ['action-hsl-commute-shift', 'action-dishwasher-post-21'],
    rejectedActionsHistory: ['action-room-temp-1deg'],
    feedbackLog: [
      {
        actionId: 'action-hsl-commute-shift',
        category: 'Transit',
        accepted: true,
        timestamp: '2026-08-21T08:15:00Z',
        userNote: 'Took Pikaratikka 15 instead of driving (12 km). Quick and zero emissions.',
      },
      {
        actionId: 'action-room-temp-1deg',
        category: 'Heating',
        accepted: false,
        timestamp: '2026-08-19T08:00:00Z',
        userNote: 'Cannot lower heating in rental apartment; prefer comfortable warmth.',
      },
    ],
    categoryStats: {
      'Transit': { accepted: 8, rejected: 1 },
      'Heating': { accepted: 0, rejected: 5 },
      'Dishwasher': { accepted: 5, rejected: 1 },
      'Sauna': { accepted: 4, rejected: 2 },
      'Waste & Recycling': { accepted: 9, rejected: 0 },
    },
    estimatedFootprintTonnes: 4.8,
    targetFootprintTonnes: 2.2,
    installedGreenTech: ['Älytermostaatti', 'LTO-ilmanvaihto'],
    savedCo2Kg: 28.6,
    savedEurTotal: 34.2,
    ecoCredits: 146,
    streakDays: 4,
    activePledges: [
      'HSL light rail & metro for 12 km commute',
      'Dishwasher after 21:00 peak',
      '100% plastic and biowaste sorting',
    ],
    redeemedRewards: [],
    ecoCreditTransactions: [
      {
        id: 'tx-1',
        title: 'HSL Commute instead of Driving (12 km)',
        titleFi: 'HSL-työmatka auton sijaan (12 km)',
        amount: 41,
        dateLabel: 'Today',
        timestamp: '2026-08-22T08:00:00Z',
        category: 'Transit',
        type: 'earned',
        co2SavedKg: 4.08,
      },
      {
        id: 'tx-2',
        title: 'Dishwasher shifted to night',
        titleFi: 'Tiskikoneen yökäynnistys',
        amount: 8,
        dateLabel: 'Yesterday',
        timestamp: '2026-08-21T21:30:00Z',
        category: 'Dishwasher',
        type: 'earned',
        co2SavedKg: 0.5,
      },
      {
        id: 'tx-3',
        title: 'HSL Pikaratikka 15 trip',
        titleFi: 'HSL Pikaratikka 15 matka',
        amount: 15,
        dateLabel: 'Aug 20',
        timestamp: '2026-08-20T08:15:00Z',
        category: 'Transit',
        type: 'earned',
        co2SavedKg: 2.1,
      },
      {
        id: 'tx-4',
        title: 'Smart sauna timing',
        titleFi: 'Saunan ajastus halpaan tuntiin',
        amount: 18,
        dateLabel: 'Aug 18',
        timestamp: '2026-08-18T21:00:00Z',
        category: 'Sauna',
        type: 'earned',
        co2SavedKg: 1.8,
      },
      {
        id: 'tx-5',
        title: 'Bio & plastic sorting',
        titleFi: 'Muovi- ja biojätteen lajittelu',
        amount: 10,
        dateLabel: 'Aug 16',
        timestamp: '2026-08-16T19:00:00Z',
        category: 'Recycling',
        type: 'earned',
        co2SavedKg: 0.8,
      },
    ],
  },
  {
    id: 'user-leppavaara',
    name: 'Matti & Elina',
    district: 'Suur-Leppävaara (Leppävaara, Kera, Karakallio)',
    housingType: 'rivitalo',
    householdSize: 3,
    livingAreaSqM: 98,
    heatingSystem: 'Ilmalämpöpumppu + Suora sähkö (Air Heat Pump + Electric)',
    electricityContract: 'Pörssisähkö (Nord Pool Hourly Spot)',
    saunaType: 'electric',
    saunaTimesPerWeek: 3,
    commuteHabit: 'Ladattava hybridi (PHEV)',
    dietPreference: 'omnivore',
    canChange: ['EV charging', 'dishwasher', 'sauna_timing'],
    cannotChange: ['cannot_cycle_winter', 'inflexible_work_hours'],
    caresAbout: ['home_comfort_warmth', 'energy_cost_savings', 'grid_flexibility'],
    acceptedActionsHistory: ['action-ev-night-charge', 'action-sauna-timing'],
    rejectedActionsHistory: [],
    feedbackLog: [],
    categoryStats: {
      'EV charging': { accepted: 6, rejected: 0 },
      'Heating': { accepted: 2, rejected: 3 },
      'Dishwasher': { accepted: 4, rejected: 1 },
      'Sauna': { accepted: 7, rejected: 1 },
    },
    estimatedFootprintTonnes: 6.2,
    targetFootprintTonnes: 2.5,
    installedGreenTech: ['Ilmalämpöpumppu', 'Sähköauton älylaturi'],
    savedCo2Kg: 780,
    savedEurTotal: 280.0,
    ecoCredits: 1650,
    streakDays: 4,
    activePledges: ['Auton lataus vain yötunneilla (klo 01-05)'],
  },
  {
    id: 'user-nuuksio',
    name: 'Jussi',
    district: 'Pohjois-Espoo (Nuuksio, Kalajärvi, Järvenperä)',
    housingType: 'omakotitalo',
    householdSize: 4,
    livingAreaSqM: 145,
    heatingSystem: 'Maalämpö (Geothermal Heat Pump)',
    electricityContract: 'Uusiutuva / EKOenergia (100% Certified Green)',
    saunaType: 'wood',
    saunaTimesPerWeek: 2,
    commuteHabit: 'Sähköauto (Electric Vehicle)',
    dietPreference: 'flexitarian',
    canChange: ['EV charging', 'solar_water_heater_sync', 'composting'],
    cannotChange: ['wood_sauna_only'],
    caresAbout: ['carbon_reduction', 'community_impact', 'home_comfort_warmth'],
    acceptedActionsHistory: ['action-ev-night-charge', 'action-hsy-plastic-bio'],
    rejectedActionsHistory: [],
    feedbackLog: [],
    categoryStats: {
      'EV charging': { accepted: 12, rejected: 0 },
      'Heating': { accepted: 1, rejected: 1 },
      'Dishwasher': { accepted: 3, rejected: 0 },
      'Sauna': { accepted: 5, rejected: 0 },
    },
    estimatedFootprintTonnes: 5.1,
    targetFootprintTonnes: 2.0,
    installedGreenTech: ['Maalämpöpumppu', 'Aurinkopaneelit (8.4 kWp)', 'Varaava takka'],
    savedCo2Kg: 1650,
    savedEurTotal: 420.0,
    ecoCredits: 2900,
    streakDays: 12,
    activePledges: ['Oman aurinkosähkön maksimointi'],
  },
];

export const ECOPILOT_INITIAL_PROFILES = INITIAL_PROFILES;

/**
 * Updates user learning profile upon accepting or rejecting an action.
 */
export function recordActionFeedbackInProfile(
  profile: EcoPilotUserProfile,
  actionId: string,
  category: string,
  accepted: boolean,
  userNote?: string
): EcoPilotUserProfile {
  const newFeedback = {
    actionId,
    category,
    accepted,
    timestamp: new Date().toISOString(),
    userNote,
  };

  const updatedAccepted = accepted
    ? Array.from(new Set([...profile.acceptedActionsHistory, actionId]))
    : profile.acceptedActionsHistory.filter((id) => id !== actionId);

  const updatedRejected = !accepted
    ? Array.from(new Set([...profile.rejectedActionsHistory, actionId]))
    : profile.rejectedActionsHistory.filter((id) => id !== actionId);

  // Update category stats for gradual flexibility understanding
  const catStats = { ...(profile.categoryStats || {}) };
  const currentStat = catStats[category] || { accepted: 0, rejected: 0 };
  catStats[category] = {
    accepted: currentStat.accepted + (accepted ? 1 : 0),
    rejected: currentStat.rejected + (!accepted ? 1 : 0),
  };

  // Update canChange / cannotChange if strong signal exists
  let canChange = [...profile.canChange];
  if (accepted && !canChange.includes(category)) {
    canChange.push(category);
  }

  return {
    ...profile,
    acceptedActionsHistory: updatedAccepted,
    rejectedActionsHistory: updatedRejected,
    categoryStats: catStats,
    canChange,
    feedbackLog: [newFeedback, ...profile.feedbackLog],
    streakDays: accepted ? profile.streakDays + 1 : profile.streakDays,
  };
}
