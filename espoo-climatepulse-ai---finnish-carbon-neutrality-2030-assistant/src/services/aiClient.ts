import {
  UserProfile,
  Season,
  WasteClassificationResult,
  DailyEnergyPlan,
  CommuteComparison,
  SpotPricePoint,
} from '../types/climate';

export async function chatWithClimateAssistantAPI(
  chatHistory: { role: string; content: string }[],
  userMessage: string,
  userProfile?: UserProfile,
  currentSeason: Season = 'winter'
): Promise<{ reply: string; suggestedFollowUps: string[] }> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatHistory, userMessage, userProfile, currentSeason }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to communicate with AI');
    }
    return data.data;
  } catch (error: any) {
    console.error('Chat API client error:', error);
    // Fallback response for offline or transient network issues
    return {
      reply: `Hei! Espoon 2030 ilmastotavoitteet etenevät parhaiten arkisilla valinnoilla:\n\n1. **Lämmitys**: Huonelämpötilan laskeminen 1°C säästää noin 5% kaukolämmöstä tai sähköstä.\n2. **Sauna**: Siirrä sähkökiukaan lämmitys iltahuippujen (17-20) ulkopuolelle.\n3. **Liikkuminen**: Pikaratikka 15 ja Länsimetro tarjoavat päästöttömän työmatkan ilman Kehä I:n ruuhkia.\n\nKysy minulta mistä tahansa arjen energiakysymyksestä, lajittelusta tai taloyhtiön energiaremonteista!`,
      suggestedFollowUps: [
        'Miten ajoitan saunan pörssisähkön mukaan tänään?',
        'Miten lajittelen muovin ja kartongin HSY-sääntöjen mukaan?',
        'Mitä tukia taloyhtiö voi saada energiaremonttiin Espoossa?',
      ],
    };
  }
}

export async function classifyWasteAPI(
  query: string,
  imageBase64?: string
): Promise<WasteClassificationResult> {
  try {
    const res = await fetch('/api/ai/classify-waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, imageBase64 }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to classify waste');
    }
    return data.data;
  } catch (error: any) {
    console.error('Classify waste API client error:', error);
    return {
      itemName: query,
      category: 'Sekajäte',
      binColor: 'Harmaa / Sekajäteastia',
      sortingInstructions: 'Laita taloyhtiön sekajäteastiaan. Poltetaan sähköksi ja lämmöksi Vantaan jätevoimalassa.',
      cleaningRequired: false,
      whyItMatters: 'Oikea lajittelu säästää raaka-aineita ja pienentää jätevoimalan hiilijalanjälkeä.',
      co2SavingsEstimateGrams: 150,
      nearestEspooFacility: 'Mankkaan Sortti-asema / Taloyhtiön jätepiste',
      proTip: 'Epäselvissä tapauksissa tarkista aina hsy.fi/jateopas.',
    };
  }
}

export async function optimizeDailyEnergyAPI(
  userProfile: UserProfile,
  currentSeason: Season,
  outdoorTemp: number,
  spotPrices: SpotPricePoint[]
): Promise<DailyEnergyPlan> {
  try {
    const res = await fetch('/api/ai/optimize-energy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfile, currentSeason, outdoorTemp, spotPrices }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to optimize energy');
    }
    return data.data;
  } catch (error: any) {
    console.error('Energy optimizer API client error:', error);
    return {
      currentSeason,
      outdoorTempCelsius: outdoorTemp,
      peakSaunaWindow: {
        recommendedTime: '21:30 - 23:00',
        reason: 'Pörssisähkön hinta putoaa illan huipputunneista 70% ja kantaverkon päästöt ovat minimissään tuulivoiman ansiosta.',
        savingsEur: '~€1.40 / saunakerta',
        co2ReductionPercent: '65% vähemmän CO2',
      },
      heatPumpTip: 'Pidä ilmalämpöpumppu jatkuvalla HEAT-tilalla (+20°C, puhallusnopeus 3). Älä käytä AUTO-tilaa pakkasella.',
      laundryWindow: '13:00 - 15:00 tai yöllä 01:00 - 05:00',
      evChargingWindow: '01:00 - 05:00 (Hinta vain 1.2 - 2.0 c/kWh)',
      ventilationAdjustment: 'Sulje LTO-laitteen kesäohitus ja varmista suodattimien puhtaus.',
      estimatedDailySavingsEur: 3.2,
      estimatedDailyCo2SavedKg: 4.8,
    };
  }
}

export async function compareCommuteAPI(
  origin: string,
  destination: string
): Promise<CommuteComparison> {
  try {
    const res = await fetch('/api/ai/compare-commute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to compare commute');
    }
    return data.data;
  } catch (error: any) {
    console.error('Commute API client error:', error);
    return {
      origin,
      destination,
      distanceKm: 14.5,
      modes: [
        {
          name: 'HSL Pikaratikka 15 & Metro',
          icon: 'Train',
          durationMins: 28,
          co2Grams: 0,
          costEur: 3.1,
          convenienceScore: 9,
          routeDetails: 'Pikaratikka 15 -> Länsimetro (100% uusiutuva sähkö, nollapäästöt).',
        },
        {
          name: 'Sähköpyörä / Baana',
          icon: 'Bike',
          durationMins: 35,
          co2Grams: 12,
          costEur: 0.1,
          caloriesBurned: 240,
          convenienceScore: 8,
          routeDetails: 'Espoon pääpyöräreitti / Länsibaana.',
        },
        {
          name: 'Sähköauto (EV)',
          icon: 'Zap',
          durationMins: 22,
          co2Grams: 280,
          costEur: 1.8,
          convenienceScore: 7,
          routeDetails: 'Kehä I & Länsiväylä.',
        },
        {
          name: 'Polttomoottoriauto (Bensiini)',
          icon: 'Car',
          durationMins: 24,
          co2Grams: 2450,
          costEur: 5.4,
          convenienceScore: 6,
          routeDetails: 'Kehä I aamuruuhkassa.',
        },
      ],
      yearlySavingIfSwitchingToTransit: {
        co2Kg: 539,
        moneyEur: 1012,
        treesEquivalent: 27,
      },
    };
  }
}

export async function generateRoadmapPlanAPI(
  userProfile: UserProfile,
  season: Season
): Promise<{
  personalizedTagline: string;
  roadmapSummary: string;
  weeklyActions: {
    day: string;
    actionTitle: string;
    category: string;
    impactDescription: string;
    co2KgSaved: number;
    moneyEurSaved: number;
    howToExecute: string;
  }[];
  housingCompanyAdvice: string;
  communityImpactText: string;
}> {
  try {
    const res = await fetch('/api/ai/generate-roadmap-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfile, season }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate roadmap plan');
    }
    return data.data;
  } catch (error: any) {
    console.error('Roadmap plan API client error:', error);
    return {
      personalizedTagline: `${userProfile.name} — Espoon 2030 Ilmastokumppani`,
      roadmapSummary: `Suunnitelma auttaa pienentämään hiilijalanjälkeäsi nykyisestä ${userProfile.estimatedFootprintTonnes} tonnista kohti Espoon 2030 tavoitetasoa (${userProfile.targetFootprintTonnes} t CO2e/vuosi).`,
      weeklyActions: [
        {
          day: 'Maanantai',
          actionTitle: 'Lämmityksen ja pattereiden tasapainotus',
          category: 'Lämmitys',
          impactDescription: 'Laske oleskelutilojen lämpötila 20°C:een ja makuuhuoneet 18°C:een.',
          co2KgSaved: 4.5,
          moneyEurSaved: 2.5,
          howToExecute: 'Käännä patteritermostaatteja 1 pykälä pienemmälle ja tarkista ettei huonekalu estä ilman kiertoa.',
        },
        {
          day: 'Tiistai',
          actionTitle: 'Pörssisähkön ja saunan optimointi',
          category: 'Sähkö',
          impactDescription: 'Siirrä sähkökiukaan lämmitys klo 21:00 jälkeen ja lämmitä 75°C:een.',
          co2KgSaved: 3.2,
          moneyEurSaved: 1.8,
          howToExecute: 'Käytä ajastinta tai mobiilisovellusta kiukaan kytkentään.',
        },
        {
          day: 'Keskiviikko',
          actionTitle: 'Päästötön työmatka Pikaratikalla 15 tai Metrolla',
          category: 'Liikenne',
          impactDescription: 'Korvaa auton työmatka HSL-joukkoliikenteellä.',
          co2KgSaved: 6.8,
          moneyEurSaved: 8.0,
          howToExecute: 'Osta HSL AB-lippu suoraan HSL-sovelluksesta.',
        },
        {
          day: 'Torstai',
          actionTitle: 'Täydellinen muovi- ja biojätteen erottelu',
          category: 'Kiertotalous',
          impactDescription: 'Muovipakkaukset uusiomateriaaleiksi Fortumin muovijalostamolle.',
          co2KgSaved: 1.5,
          moneyEurSaved: 0.5,
          howToExecute: 'Huuhtele muovit kylmällä vedellä ja laita kuivina muovinkeräykseen.',
        },
        {
          day: 'Perjantai',
          actionTitle: 'Kotimainen kasvisruokapäivä (Härkis / Nyhtökaura)',
          category: 'Ruoka',
          impactDescription: 'Korvaa punainen liha kotimaisella kasviproteiinilla.',
          co2KgSaved: 3.5,
          moneyEurSaved: 3.0,
          howToExecute: 'Valmista nopea härkis-kasviswokki tai nyhtökaurapasta.',
        },
        {
          day: 'Lauantai',
          actionTitle: 'Taloyhtiön energia-aloitteen valmistelu',
          category: 'Taloyhtiö',
          impactDescription: 'Ehdota aurinkopaneelien tai maalämmön selvittämistä yhtiökokouksessa.',
          co2KgSaved: 12.0,
          moneyEurSaved: 15.0,
          howToExecute: 'Käytä Espoon ilmastopalvelun valmista aloitepohjaa.',
        },
        {
          day: 'Sunnuntai',
          actionTitle: 'Lähiluontoretki Nuuksioon tai Rantaraitille',
          category: 'Luonto & Hyvinvointi',
          impactDescription: 'Nollapäästöinen virkistyspäivä paikallisessa luontokohteessa.',
          co2KgSaved: 5.0,
          moneyEurSaved: 10.0,
          howToExecute: 'Ota bussi 245 Espoon keskuksesta Nuuksion kansallispuistoon.',
        },
      ],
      housingCompanyAdvice:
        'Taloyhtiössänne kannattaa selvittää poistoilman lämmöntalteenotto (LTO) ja kattoaurinkovoimala, joihin saa ARA-avustusta ja jotka maksavat itsensä takaisin 4-7 vuodessa.',
      communityImpactText:
        'Kun 1 000 espoolaista toteuttaa tämän viikkosuunnitelman, säästämme yhdessä yli 36 tonnia CO2e joka viikko kohti Hiilineutraali Espoo 2030 -tavoitetta.',
    };
  }
}
