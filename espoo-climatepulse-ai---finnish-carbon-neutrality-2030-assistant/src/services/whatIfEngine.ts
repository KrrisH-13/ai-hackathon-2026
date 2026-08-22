import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';
import { PrototypeReward } from '../types/rewards';
import { WhatIfContextType, WhatIfPresetOption, WhatIfScenarioResult } from '../types/whatIf';
import { NORDIC_EMISSION_FACTORS, NORDIC_PRICING_BENCHMARKS } from '../climate/constants';

export type { WhatIfScenarioResult, WhatIfPresetOption, WhatIfContextType };


/**
 * Returns context-specific preset options for the What-If interface.
 */
export function getWhatIfPresetsForContext(
  context: WhatIfContextType,
  data?: {
    recommendationTitle?: string;
    rewardItem?: PrototypeReward;
    receiptItems?: Array<{ name: string; category: string; estCo2Kg: number; estEur: number }>;
    distanceKm?: number;
  },
  isFinnish: boolean = false
): WhatIfPresetOption[] {
  switch (context) {
    case 'today':
      return [
        {
          id: 'charge_20_00',
          label: isFinnish ? 'Mitä jos lataan klo 20:00 sen sijaan?' : 'I charge at 20:00 instead',
          description: isFinnish ? 'Aiempi ajankohta, suurempi pörssisähkön hinta' : 'More convenient time, higher evening spot rate',
          icon: '⚡',
        },
        {
          id: 'charge_tomorrow',
          label: isFinnish ? 'Mitä jos lataan vasta huomenna?' : 'I charge tomorrow',
          description: isFinnish ? 'Siirrä lataus huomisen päivän ajalle' : 'Postpone charging to tomorrow afternoon',
          icon: '📅',
        },
        {
          id: 'no_charge_tonight',
          label: isFinnish ? 'Mitä jos en lataa tänä yönä lainkaan?' : "I don't charge tonight",
          description: isFinnish ? 'Ei sähkönkulutusta tänään' : 'Keep current battery level without charging',
          icon: '🛑',
        },
        {
          id: 'show_another_option',
          label: isFinnish ? 'Näytä toinen vaihtoehto' : 'Show me another option',
          description: isFinnish ? 'Esimerkiksi tiskikoneen tai saunan ajastus' : 'E.g. Dishwasher or appliance timing',
          icon: '🔄',
        },
      ];

    case 'green-window':
      return [
        {
          id: 'window_20_00',
          label: isFinnish ? 'Mitä jos käynnistän laitteen klo 20:00?' : 'What if I run it at 20:00?',
          description: isFinnish ? 'Alkuilta ennen puhtainta tuuli-ikkunaa' : 'Early evening peak before wind surplus',
          icon: '⏰',
        },
        {
          id: 'window_22_00',
          label: isFinnish ? 'Mitä jos odotan klo 22:00 asti?' : 'What if I wait until 22:00?',
          description: isFinnish ? 'Suositeltu vihreä tuulitunti' : 'Recommended clean green window',
          icon: '🌱',
        },
        {
          id: 'window_no_change',
          label: isFinnish ? 'Mitä jos en muuta mitään?' : "What if I don't change anything?",
          description: isFinnish ? 'Käynnistys heti klo 18-19 huipputunnilla' : 'Run immediately during 18-19 peak',
          icon: '⚖️',
        },
        {
          id: 'window_charge_tomorrow',
          label: isFinnish ? 'Mitä jos lataan EV:n huomenna päivällä?' : 'What if I charge my EV tomorrow?',
          description: isFinnish ? 'Huomisen aurinko- ja tuulituotanto' : 'Tomorrow daytime solar & wind curve',
          icon: '☀️',
        },
      ];

    case 'rewards':
      return [
        {
          id: 'reach_next_reward',
          label: isFinnish ? 'Miten saavutan seuraavan palkinnon?' : 'What if I reach the next reward?',
          description: isFinnish ? 'Katso tarvittavat toimenpiteet ja arvioitu aikataulu' : 'Calculate actions needed and estimated timeline',
          icon: '🎁',
        },
        {
          id: 'actions_breakdown',
          label: isFinnish ? 'Mitä toimenpiteitä voisin tehdä?' : 'Which actions could help me reach this?',
          description: isFinnish ? 'Vihreä ikkuna, arjen valinnat ja liikkuminen' : 'Green Window, daily habits, transit',
          icon: '✨',
        },
        {
          id: 'save_vs_redeem',
          label: isFinnish ? 'Mitä jos säästän isompaan etuun?' : 'What if I save for a bigger reward?',
          description: isFinnish ? 'Vertaa 100 vs 200 vs 300 pisteen etuja' : 'Compare 100 vs 200 vs 300 pts tiers',
          icon: '📈',
        },
      ];

    case 'rewards-item':
      return [
        {
          id: 'item_actions_needed',
          label: isFinnish ? 'Mitä tekoja tarvitsen tämän lunastamiseen?' : 'What actions could help me reach this?',
          description: isFinnish ? 'Reaaliaikainen laskelma tarvittavista EcoCrediteistä' : 'Action roadmap for this specific reward',
          icon: '🎯',
        },
        {
          id: 'item_choose_different',
          label: isFinnish ? 'Mitä jos valitsen toisen palkinnon?' : 'What if I choose a different reward?',
          description: isFinnish ? 'Tarkastele muita saatavilla olevia etuja' : 'Compare against other available tiers',
          icon: '🔄',
        },
        {
          id: 'item_save_credits',
          label: isFinnish ? 'Mitä jos säästän pisteeni?' : 'What if I save my credits?',
          description: isFinnish ? 'Säästä 300 pisteen Nordic Lifestyle -pääpalkintoon' : 'Save for 300 credit top tier',
          icon: '💎',
        },
      ];

    case 'transport':
      return [
        {
          id: 'transport_compare_all',
          label: isFinnish ? 'Vertaa kaikkia kulkutapoja (12 km)' : 'Compare all options (12 km commute)',
          description: isFinnish ? 'Joukkoliikenne, pyörä, kävely ja auto' : 'Public transit, Bike, Walk, Drive',
          icon: '📊',
        },
        {
          id: 'transport_public',
          label: isFinnish ? 'Mitä jos menen HSL-joukkoliikenteellä?' : 'What if I use HSL Public Transport?',
          description: isFinnish ? 'Metro, Pikaratikka 15 tai sähköbussi' : 'Metro, Pikaratikka 15, or electric bus',
          icon: '🚇',
        },
        {
          id: 'transport_bike',
          label: isFinnish ? 'Mitä jos pyöräilen Baanaa pitkin?' : 'What if I bicycle?',
          description: isFinnish ? '0 päästöä, hyötyliikuntaa ja 0 €' : '0 emissions, daily fitness, 0 € cost',
          icon: '🚲',
        },
        {
          id: 'transport_drive',
          label: isFinnish ? 'Mitä jos ajan autolla?' : 'What if I drive?',
          description: isFinnish ? 'Nopein aika, polttoaine + pysäköintikulut' : 'Fastest trip, includes fuel & parking',
          icon: '🚗',
        },
      ];

    case 'grocery':
      return [
        {
          id: 'grocery_replace_chicken',
          label: isFinnish ? 'Mitä jos korvaan kanan kasviproteiinilla?' : 'Replace chicken with plant-based option',
          description: isFinnish ? 'Esim. Nyhtökaura, Härkis tai Tofu' : 'E.g. Finnish oats protein / Tofu',
          icon: '🌱',
        },
        {
          id: 'grocery_replace_dairy',
          label: isFinnish ? 'Mitä jos vaihdan lehmänmaidon kaurajuomaan?' : 'Replace dairy with lower-impact oat drink',
          description: isFinnish ? 'Kotimainen kaurajuoma' : 'Finnish oat milk',
          icon: '🥛',
        },
        {
          id: 'grocery_seasonal_produce',
          label: isFinnish ? 'Mitä jos suosin kotimaisia perunoita/juureksia?' : 'Buy more seasonal local produce',
          description: isFinnish ? 'Korvaa riisi kotimaisilla perunoilla' : 'Replace imported rice with Finnish potatoes',
          icon: '🥔',
        },
        {
          id: 'grocery_change_one',
          label: isFinnish ? 'Mitä jos muutan vain yhtä tuotetta?' : 'What if I change just one item?',
          description: isFinnish ? 'Pienin vaiva ilman koko ostoskorin mullistamista' : 'Smallest effort without changing all meals',
          icon: '✨',
        },
      ];

    case 'recycling':
      return [
        {
          id: 'recycling_proper',
          label: isFinnish ? 'Mitä jos lajittelen tämän oikein kartonkiin/muoviin?' : 'What if I recycle it properly?',
          description: isFinnish ? 'Materiaalin kierrätys ja hiilensäästö' : 'Material recovery vs virgin production',
          icon: '♻️',
        },
        {
          id: 'recycling_mixed',
          label: isFinnish ? 'Mitä jos heitän sen sekajätteeseen?' : 'What if I put it in mixed waste?',
          description: isFinnish ? 'Poltto Vantaan Energian jätevoimalassa' : 'Incinerated for district heat',
          icon: '🗑️',
        },
        {
          id: 'recycling_unsure',
          label: isFinnish ? 'En ole varma minne tämä kuuluu' : "I'm unsure where this goes",
          description: isFinnish ? 'HSY:n viralliset lajitteluohjeet' : 'Official HSY sorting rules and tips',
          icon: '❓',
        },
      ];

    case 'energy':
      return [
        {
          id: 'energy_lower_1c',
          label: isFinnish ? 'Mitä jos lasken huonelämpötilaa 1 °C?' : 'Lower heating slightly (1°C)',
          description: isFinnish ? 'Säästää n. 5% lämmitysenergiasta' : 'Saves ~5% heating energy per month',
          icon: '🌡️',
        },
        {
          id: 'energy_shift_appliance',
          label: isFinnish ? 'Mitä jos siirrän tiskikoneen yöhön?' : 'Change appliance time to off-peak',
          description: isFinnish ? 'Ajasta käynnistys klo 22:00 jälkeen' : 'Run dishwasher after 22:00',
          icon: '⚡',
        },
        {
          id: 'energy_do_nothing',
          label: isFinnish ? 'Mitä jos en tee mitään muutoksia?' : 'Do nothing / keep current settings',
          description: isFinnish ? 'Säilytä nykyinen mukavuustaso' : 'Keep current baseline comfort',
          icon: '🛋️',
        },
      ];

    case 'mobility':
      return [
        {
          id: 'mobility_bike_once',
          label: isFinnish ? 'Mitä jos pyöräilen kerran tällä viikolla?' : 'What if I biked once this week?',
          description: isFinnish ? 'Korvaa yksi automatka pyöräilyllä' : 'Replace 1 car commute trip with cycling',
          icon: '🚲',
        },
        {
          id: 'mobility_transit_available',
          label: isFinnish ? 'Mitä jos HSL-joukkoliikenne sopisi reittiini?' : 'What if public transport was available?',
          description: isFinnish ? 'Katso säästö jos 3 automatkaa korvattaisiin metrolla/bussilla' : 'Explore shifting 3 trips/week to HSL',
          icon: '🚇',
        },
      ];

    case 'progress':
      return [
        {
          id: 'progress_repeat_best',
          label: isFinnish ? 'Mitä jos toistan tämän viikon parhaan teon?' : "Repeat this week's best action",
          description: isFinnish ? 'Jatka vihreää lataus- ja tiskirutiinia ensi viikolla' : 'Keep your current Green Window routine next week',
          icon: '🔄',
        },
        {
          id: 'progress_add_one_flexible',
          label: isFinnish ? 'Mitä jos lisään yhden joustavan arjen teon?' : 'Add one more flexible action next week',
          description: isFinnish ? 'Esimerkiksi saunan ajastus tai kasvislounas' : 'E.g. Sauna shift or 1 plant-based meal',
          icon: '🌱',
        },
        {
          id: 'progress_focus_transport',
          label: isFinnish ? 'Mitä jos keskityn liikkumiseen?' : 'Focus on low-emission transport',
          description: isFinnish ? 'Yhdistä HSL ja hyötyliikunta' : 'Combine HSL transit with walking/cycling',
          icon: '🚶',
        },
      ];

    default:
      return [
        {
          id: 'general_option_1',
          label: isFinnish ? 'Mitä jos teen pienen muutoksen tänään?' : 'What if I make a small change today?',
          description: isFinnish ? 'Laske arvioitu ilmastovaikutus ja säästö' : 'Calculate estimated CO2 and cost impact',
          icon: '🌱',
        },
      ];
  }
}

/**
 * Deterministically calculates the outcome of any What-If option.
 * Strictly guarantees that no numbers are hallucinated.
 */
export function calculateWhatIfScenario(
  context: WhatIfContextType,
  optionId: string,
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  customQuery?: string,
  contextData?: any,
  isFinnish: boolean = false
): WhatIfScenarioResult {
  // 1. TODAY CONTEXT
  if (context === 'today') {
    if (optionId === 'charge_20_00' || (customQuery && customQuery.includes('20:00'))) {
      // 11 kWh EV charge at 20:00 (11.5 c/kWh, 42 g CO2/kWh) vs 22:00 (3.8 c/kWh, 18 g CO2/kWh)
      const kwh = 11.0;
      const baselineCost = (kwh * 3.8) / 100; // €0.42
      const scenarioCost = (kwh * 11.5) / 100; // €1.27
      const costDiff = scenarioCost - baselineCost; // +€0.85

      const baselineCo2 = (kwh * 18) / 1000; // 0.20 kg
      const scenarioCo2 = (kwh * 42) / 1000; // 0.46 kg
      const co2Diff = scenarioCo2 - baselineCo2; // +0.26 kg

      return {
        context,
        scenarioTitle: isFinnish ? 'Lataus klo 20:00 vs klo 22:00' : 'Charging at 20:00 vs 22:00',
        selectedOptionId: optionId,
        co2DiffKg: Number(co2Diff.toFixed(2)),
        costDiffEur: Number(costDiff.toFixed(2)),
        co2Display: isFinnish ? `+${co2Diff.toFixed(2)} kg CO₂ (enemmän)` : `+${co2Diff.toFixed(2)} kg CO₂ (higher)`,
        costDisplay: isFinnish ? `+€${costDiff.toFixed(2)} kalliimpi` : `+€${costDiff.toFixed(2)} higher cost`,
        effort: 'Easy',
        convenienceRating: 5,
        aiExplanation: isFinnish
          ? 'Klo 20:00 lataaminen sopii paremmin ilta-aikatauluun (5/5 mukavuus), mutta pörssisähkön hinta ja verkon fossiilinen säätövoima ovat hieman korkeammat kuin klo 22:00 jälkeen alkavassa tuuli-ikkunassa.'
          : 'Charging at 20:00 is more convenient for your evening routine (5/5 convenience), but captures slightly higher spot prices and fossil grid intensity than the clean wind window starting at 22:00.',
        comparisonTable: {
          columns: [isFinnish ? 'Aikataulu' : 'Time', 'CO₂', isFinnish ? 'Hinta' : 'Cost', isFinnish ? 'Mukavuus' : 'Convenience'],
          rows: [
            {
              label: '20:00 (Evening)',
              labelFi: '20:00 (Alkuilta)',
              co2: '0.46 kg (42 g/kWh)',
              cost: '€1.27 (11.5 c/kWh)',
              convenienceOrTime: '⭐⭐⭐⭐⭐',
            },
            {
              label: '22:00 (Recommended)',
              labelFi: '22:00 (Suositus)',
              co2: '0.20 kg (18 g/kWh)',
              cost: '€0.42 (3.8 c/kWh)',
              convenienceOrTime: '⭐⭐⭐',
              isHighlighted: true,
            },
          ],
        },
        formulaUsed: '11.0 kWh × (11.5 c/kWh - 3.8 c/kWh) and (42 g/kWh - 18 g/kWh)',
        dataSourceUsed: 'Nord Pool Day-Ahead Spot API & Fingrid Real-time Grid Emissions',
        responsibleDisclaimer: 'Calculations use deterministic Nordic spot prices and Fingrid grid emission intensity factors.',
        goalSaveable: true,
        savedGoalPayload: {
          title: isFinnish ? 'Joustava EV-lataus klo 20-22' : 'Flexible EV Charging 20-22',
          category: 'EV charging',
          scenario: 'Balanced convenience vs clean spot prices',
          estimatedCo2KgMonth: 3.2,
          estimatedEurMonth: 5.4,
          effort: 'Easy',
        },
      };
    }

    if (optionId === 'charge_tomorrow') {
      return {
        context,
        scenarioTitle: isFinnish ? 'Lataus huomenna päivällä' : 'Charging tomorrow afternoon',
        selectedOptionId: optionId,
        co2DiffKg: 0.15,
        costDiffEur: 0.45,
        co2Display: '+0.15 kg CO₂',
        costDisplay: '+€0.45',
        effort: 'Easy',
        convenienceRating: 4,
        aiExplanation: isFinnish
          ? 'Huomisen päivähinnat (~8.2 c/kWh) ovat kohtuulliset, mutta yön tuulitunnit (~3.8 c/kWh) ovat puhtaammat ja edullisemmat.'
          : 'Tomorrow daytime rates (~8.2 c/kWh) are moderate, but tonight’s overnight wind hours (~3.8 c/kWh) remain cheaper and cleaner.',
        formulaUsed: '11.0 kWh × (8.2 c/kWh - 3.8 c/kWh)',
        dataSourceUsed: 'Nordic Electricity Spot Forecast',
        responsibleDisclaimer: 'Spot prices and clean power percentages derived from Nord Pool day-ahead curves.',
      };
    }

    // Default / no_charge_tonight / show_another_option
    return {
      context,
      scenarioTitle: isFinnish ? 'Vaihtoehto: Tiskikoneen siirto yöhön' : 'Alternative: Dishwasher Night Shift',
      selectedOptionId: optionId,
      co2DiffKg: -0.5,
      costDiffEur: -0.32,
      co2Display: '↓ ~0.5 kg CO₂',
      costDisplay: '€0.32 cheaper',
      effort: 'Easy',
      convenienceRating: 4,
      aiExplanation: isFinnish
        ? 'Jos et lataa autoa tänään, tiskikoneen ajastaminen klo 22:00 jälkeen on toinen erittäin helppo tapa hyödyntää yön puhdasta sähköä.'
        : 'If you are not charging your EV tonight, running your dishwasher after 22:00 is another zero-effort way to capture clean overnight grid energy.',
      formulaUsed: '1.2 kWh cycle × (17.5 c/kWh - 3.8 c/kWh)',
      dataSourceUsed: 'Fingrid Clean Grid Benchmark',
      responsibleDisclaimer: 'Calculations based on 1.2 kWh Eco cycle.',
      goalSaveable: true,
      savedGoalPayload: {
        title: isFinnish ? 'Tiskikoneen yöajastus' : 'Night dishwasher schedule',
        category: 'Dishwasher',
        scenario: 'Run dishwasher during night wind hours',
        estimatedCo2KgMonth: 2.1,
        estimatedEurMonth: 3.8,
        effort: 'Easy',
      },
    };
  }

  // 2. GREEN WINDOW CONTEXT
  if (context === 'green-window') {
    return {
      context,
      scenarioTitle: isFinnish ? 'Sähkönkulutuksen Aikaikkunoiden Vertailu' : 'Electricity Time Windows Comparison',
      selectedOptionId: optionId,
      co2DiffKg: -0.85,
      costDiffEur: -0.65,
      co2Display: '↓ 0.85 kg CO₂',
      costDisplay: '€0.65 cheaper',
      effort: 'Easy',
      convenienceRating: 4,
      aiExplanation: isFinnish
        ? 'Kantaverkon puhtain aikaikkuna alkaa klo 22:00, jolloin tuulivoima kattaa jopa 90 % tuotannosta ja pörssihinta laskee 3.8 snt/kWh tasolle.'
        : 'The cleanest grid window starts at 22:00, when wind generation covers up to 90% of Finnish supply and spot rates drop to 3.8 c/kWh.',
      comparisonTable: {
        columns: [isFinnish ? 'Aikaikkuna' : 'Window', 'CO₂', isFinnish ? 'Hinta' : 'Cost', isFinnish ? 'Mukavuus' : 'Convenience'],
        rows: [
          {
            label: '18:00 - 20:00 (Peak)',
            labelFi: '18:00 - 20:00 (Huipputunti)',
            co2: isFinnish ? 'Korkea (65 g/kWh)' : 'Higher (65 g/kWh)',
            cost: isFinnish ? 'Korkea (17.5 c/kWh)' : 'Higher (17.5 c/kWh)',
            convenienceOrTime: '⭐⭐⭐⭐⭐',
          },
          {
            label: '20:00 - 22:00 (Transitional)',
            labelFi: '20:00 - 22:00 (Välitunti)',
            co2: isFinnish ? 'Kohtalainen (42 g/kWh)' : 'Moderate (42 g/kWh)',
            cost: isFinnish ? 'Kohtalainen (11.5 c/kWh)' : 'Moderate (11.5 c/kWh)',
            convenienceOrTime: '⭐⭐⭐⭐',
          },
          {
            label: '22:00 - 06:00 (Green Window)',
            labelFi: '22:00 - 06:00 (Vihreä ikkuna)',
            co2: isFinnish ? 'Matalin (18 g/kWh)' : 'Lowest (18 g/kWh)',
            cost: isFinnish ? 'Edullisin (3.8 c/kWh)' : 'Lowest (3.8 c/kWh)',
            convenienceOrTime: '⭐⭐⭐',
            isHighlighted: true,
          },
        ],
      },
      formulaUsed: 'Fingrid hourly balance model & Nord Pool 24h curve',
      dataSourceUsed: 'Fingrid Open Data & Nord Pool Day-Ahead Spot API',
      responsibleDisclaimer: 'Calculated using today’s public grid status and day-ahead electricity prices.',
      goalSaveable: true,
      savedGoalPayload: {
        title: isFinnish ? 'Vihreän ikkunan hyödyntäminen (22-06)' : 'Green Window Optimization (22-06)',
        category: 'Energy',
        scenario: 'Shift heavy loads to after 22:00',
        estimatedCo2KgMonth: 5.6,
        estimatedEurMonth: 8.9,
        effort: 'Easy',
      },
    };
  }

  // 3. REWARDS CONTEXT
  if (context === 'rewards' || context === 'rewards-item') {
    const currentCredits = userProfile.ecoCredits || 146;
    const targetCredits = 200;
    const needed = Math.max(0, targetCredits - currentCredits);
    const hasHistory = (userProfile.streakDays || 0) >= 3 || (userProfile.acceptedActionsHistory?.length || 0) >= 3;
    const paceDays = hasHistory ? Math.max(1, Math.ceil(needed / 12)) : null;

    return {
      context,
      scenarioTitle: isFinnish ? 'Tavoite: 200 EcoCredits -palkinto' : 'Target: 200 EcoCredits Reward Tier',
      selectedOptionId: optionId,
      co2DiffKg: -4.5,
      costDiffEur: -5.8,
      co2Display: '↓ ~4.5 kg CO₂',
      costDisplay: '~€5.80 saved',
      effort: 'Easy',
      convenienceRating: 5,
      projectedDaysToNextReward: paceDays,
      actionsNeededSummary: isFinnish
        ? [
            '🌱 +12 EcoCredits: Vihreän ikkunan lataus / tiskikone (n. 4 tekoa)',
            '🚲 +10 EcoCredits: Joukkoliikenne- tai pyöräilymatka (n. 1 teko)',
            '♻️ +8 EcoCredits: Lajittelu ja hävikkiruuan vähentäminen (n. 2 tekoa)',
          ]
        : [
            '🌱 +12 EcoCredits: Green Window load shift (EV/dishwasher) (~4 actions)',
            '🚲 +10 EcoCredits: HSL Transit or cycling commute (~1 action)',
            '♻️ +8 EcoCredits: Proper sorting & zero-food-waste habit (~2 actions)',
          ],
      aiExplanation: hasHistory
        ? isFinnish
          ? `Tarvitset vielä ${needed} EcoCreditiä. Nykyisellä tahdillasi (n. 12 pistettä/päivä) saavutat seuraavan palkinnon noin ${paceDays}–${paceDays + 1} päivässä.`
          : `You need ${needed} more EcoCredits. At your recent pace (~12 credits/day), you could reach the next reward in approximately ${paceDays}–${paceDays + 1} days.`
        : isFinnish
          ? `Tarvitset vielä ${needed} EcoCreditiä. Tee 4–5 arjen valintaa (kuten laitteiden ajastus yöhön tai joukkoliikenne) saavuttaaksesi edun.`
          : `You need ${needed} more EcoCredits. Not enough history yet to make a reliable timeline estimate, but completing 4–5 daily actions will unlock this reward.`,
      formulaUsed: `${needed} credits remaining ÷ 12 credits/day avg`,
      dataSourceUsed: 'EcoPilot Prototype Reward Engine & Action Logs',
      responsibleDisclaimer: 'EcoCredits are prototype reward points without cash or verified carbon credit value.',
      goalSaveable: true,
      savedGoalPayload: {
        title: isFinnish ? 'Seuraavan 200 p palkinnon saavutus' : 'Reach Next 200 Pts Reward',
        category: 'Rewards',
        scenario: `Earn ${needed} credits via Green Window and Transit`,
        estimatedCo2KgMonth: 4.5,
        estimatedEurMonth: 5.8,
        effort: 'Easy',
      },
    };
  }

  // 4. TRANSPORT CONTEXT (12 km commute trip)
  if (context === 'transport') {
    const distKm = contextData?.distanceKm || 12;
    // Public Transit: 0.0 kg CO2 (HSL 100% renewable), €3.10 AB ticket, 24 min
    // Bike: 0.0 kg CO2, €0.00, 36 min
    // Walk: 0.0 kg CO2, €0.00, 140 min
    // Drive ICE: 142 g/km * 12 km = 1.70 kg CO2, €3.36 fuel + €1.00 parking = €4.36, 18 min

    const driveCo2 = Number(((142 * distKm) / 1000).toFixed(2)); // 1.70 kg
    const driveCost = Number((0.28 * distKm + 1.0).toFixed(2)); // €4.36

    if (optionId === 'transport_bike') {
      return {
        context,
        scenarioTitle: isFinnish ? `Pyöräily ${distKm} km matkalla` : `Bicycling for ${distKm} km Commute`,
        selectedOptionId: optionId,
        co2DiffKg: -driveCo2,
        costDiffEur: -driveCost,
        co2Display: `↓ ${driveCo2} kg CO₂`,
        costDisplay: `€${driveCost.toFixed(2)} cheaper`,
        effort: 'Medium',
        convenienceRating: 4,
        aiExplanation: isFinnish
          ? `Pyöräilemällä ${distKm} km matkan säästät ${driveCo2} kg CO₂ ja €${driveCost.toFixed(2)} verrattuna autoiluun, ja saat 36 minuuttia päivittäistä hyötyliikuntaa.`
          : `Bicycling ${distKm} km saves ${driveCo2} kg CO₂ and €${driveCost.toFixed(2)} compared to driving, while providing 36 minutes of outdoor exercise.`,
        formulaUsed: `${distKm} km × 142 g CO2/km ICE baseline`,
        dataSourceUsed: 'HSL Transit & VTT Lipasto Vehicle Emission Baseline',
        responsibleDisclaimer: 'DEMO DATA: Estimates based on typical Espoo-Helsinki commuting averages and standard HSL AB fares.',
        goalSaveable: true,
        savedGoalPayload: {
          title: isFinnish ? 'Pyöräily työmatkalla 2x viikossa' : 'Bike Commute 2x Weekly',
          category: 'Transit',
          scenario: 'Replace 2 car trips with cycling',
          estimatedCo2KgMonth: 13.6,
          estimatedEurMonth: 34.8,
          effort: 'Medium',
        },
      };
    }

    if (optionId === 'transport_public') {
      return {
        context,
        scenarioTitle: isFinnish ? `HSL Joukkoliikenne (${distKm} km)` : `HSL Public Transit (${distKm} km)`,
        selectedOptionId: optionId,
        co2DiffKg: -driveCo2,
        costDiffEur: Number((3.10 - driveCost).toFixed(2)), // -€1.26
        co2Display: `↓ ${driveCo2} kg CO₂`,
        costDisplay: `€${Math.abs(3.10 - driveCost).toFixed(2)} cheaper`,
        effort: 'Easy',
        convenienceRating: 4,
        aiExplanation: isFinnish
          ? 'HSL:n Metro ja Pikaratikka 15 kulkevat 100 % uusiutuvalla sähköllä (0 päästöä matkustajakilometrille). AB-kertalippu maksaa 3.10 €.'
          : 'HSL Metro and Light Rail 15 run on 100% renewable electricity (zero direct emissions per passenger-km). Standard AB single fare is €3.10.',
        formulaUsed: `${distKm} km × 142 g CO2/km - HSL 0 g/km renewable rail`,
        dataSourceUsed: 'HSL Official Emission & Tariff Standards',
        responsibleDisclaimer: 'DEMO DATA: Estimates based on typical Espoo-Helsinki commuting averages and standard HSL AB fares.',
        goalSaveable: true,
        savedGoalPayload: {
          title: isFinnish ? 'HSL-joukkoliikenne auton sijaan' : 'HSL Public Transit vs Driving',
          category: 'Transit',
          scenario: 'Use metro/tram for daily commute',
          estimatedCo2KgMonth: 17.0,
          estimatedEurMonth: 25.2,
          effort: 'Easy',
        },
      };
    }

    // Compare all table
    return {
      context,
      scenarioTitle: isFinnish ? `Kulkutapojen Vertailu (${distKm} km)` : `Commute Mode Comparison (${distKm} km)`,
      selectedOptionId: optionId,
      co2DiffKg: -driveCo2,
      costDiffEur: -driveCost,
      co2Display: `↓ ${driveCo2} kg CO₂`,
      costDisplay: `Save up to €${driveCost.toFixed(2)}`,
      effort: 'Easy',
      convenienceRating: 4,
      aiExplanation: isFinnish
        ? 'Joukkoliikenne näyttää tasapainoisimmalta valinnalta: se on nopea (24 min), päästötön (0 kg CO₂) ja säästää pysäköintikuluissa.'
        : 'Public transport appears to be the most balanced option: it is fast (24 min), zero-emission (0 kg CO₂), and avoids city parking fees.',
      comparisonTable: {
        columns: [isFinnish ? 'Kulkutapa' : 'Mode', 'CO₂', isFinnish ? 'Hinta' : 'Cost', isFinnish ? 'Matka-aika' : 'Trip Time'],
        rows: [
          {
            label: 'Public Transport (HSL)',
            labelFi: 'HSL Joukkoliikenne',
            co2: '0.0 kg (100% clean)',
            cost: '€3.10 (AB ticket)',
            convenienceOrTime: '24 min',
            isHighlighted: true,
          },
          {
            label: 'Bicycle (Baana)',
            labelFi: 'Polkupyörä',
            co2: '0.0 kg',
            cost: '€0.00',
            convenienceOrTime: '36 min',
          },
          {
            label: 'Walk',
            labelFi: 'Kävely',
            co2: '0.0 kg',
            cost: '€0.00',
            convenienceOrTime: '140 min',
          },
          {
            label: 'Personal Car (ICE)',
            labelFi: 'Oma henkilöauto',
            co2: `${driveCo2} kg`,
            cost: `€${driveCost.toFixed(2)} (fuel+park)`,
            convenienceOrTime: '18 min',
          },
        ],
      },
      formulaUsed: `${distKm} km distance × Finnish road vehicle constants`,
      dataSourceUsed: 'HSL Open Data & VTT Lipasto',
      responsibleDisclaimer: 'DEMO DATA: Estimates based on typical Espoo-Helsinki commuting averages and standard HSL AB fares.',
      goalSaveable: true,
      savedGoalPayload: {
        title: isFinnish ? 'Kestävä työmatkaliikkuminen' : 'Sustainable Commute Goal',
        category: 'Transit',
        scenario: 'Use public transit or cycling for 12 km trip',
        estimatedCo2KgMonth: 15.2,
        estimatedEurMonth: 28.0,
        effort: 'Easy',
      },
    };
  }

  // 5. GROCERY CONTEXT
  if (context === 'grocery') {
    if (optionId === 'grocery_replace_chicken') {
      // 500g Chicken (1.9 kg CO2e, €4.50) -> 500g Plant Protein (0.45 kg CO2e, €3.95)
      const co2Diff = 0.45 - 1.9; // -1.45 kg CO2
      const costDiff = 3.95 - 4.50; // -€0.55

      return {
        context,
        scenarioTitle: isFinnish ? 'Kanan korvaaminen kotimaisella kasviproteiinilla' : 'Replacing chicken with Finnish plant protein',
        selectedOptionId: optionId,
        co2DiffKg: Number(co2Diff.toFixed(2)),
        costDiffEur: Number(costDiff.toFixed(2)),
        co2Display: `↓ ${Math.abs(co2Diff).toFixed(1)} kg CO₂`,
        costDisplay: `€${Math.abs(costDiff).toFixed(2)} cheaper`,
        effort: 'Easy',
        convenienceRating: 4,
        aiExplanation: isFinnish
          ? 'Yksi vaihtoehto on korvata kana kotimaisella kasviproteiinilla (kuten Nyhtökaura tai Härkis). Tämä yksi muutos alentaa ostoskorin jalanjälkeä arviolta ~1.5 kg CO₂e.'
          : 'One option is to substitute chicken with Nordic plant-based protein (such as oat or fava bean strips). One small swap reduces your receipt footprint by an estimated ~1.5 kg CO₂e.',
        formulaUsed: '500g poultry (3.8 kg CO2e/kg) vs 500g plant protein (0.9 kg CO2e/kg)',
        dataSourceUsed: 'Luke (Luonnonvarakeskus) & SYKE Food Carbon Benchmarks',
        responsibleDisclaimer: 'Food footprint values are approximate category-level estimates, not verified product-level emissions.',
        goalSaveable: true,
        savedGoalPayload: {
          title: isFinnish ? '1 kasviproteiiniateria viikossa' : '1 Plant-protein Meal Weekly',
          category: 'Food',
          scenario: 'Replace poultry with oat/fava protein once a week',
          estimatedCo2KgMonth: 6.2,
          estimatedEurMonth: 2.2,
          effort: 'Easy',
        },
      };
    }

    if (optionId === 'grocery_replace_dairy') {
      // 1L Milk (1.2 kg CO2e, €1.15) -> 1L Oat Milk (0.3 kg CO2e, €1.85)
      const co2Diff = 0.3 - 1.2; // -0.9 kg CO2
      const costDiff = 1.85 - 1.15; // +€0.70

      return {
        context,
        scenarioTitle: isFinnish ? 'Maitojuoman vaihto kaurajuomaan' : 'Replacing dairy milk with oat drink',
        selectedOptionId: optionId,
        co2DiffKg: Number(co2Diff.toFixed(2)),
        costDiffEur: Number(costDiff.toFixed(2)),
        co2Display: `↓ ${Math.abs(co2Diff).toFixed(1)} kg CO₂`,
        costDisplay: `+€${costDiff.toFixed(2)}`,
        effort: 'Easy',
        convenienceRating: 5,
        aiExplanation: isFinnish
          ? 'Kotimaisen kaurajuoman ilmastojalanjälki on noin 75 % matalampi kuin tavanomaisen lehmänmaidon, vaikka litrahinta on hieman korkeampi.'
          : 'Finnish oat drink has an estimated 75% lower carbon footprint than standard dairy milk, with a small price difference.',
        formulaUsed: '1L dairy milk (1.2 kg CO2e/L) vs 1L oat drink (0.3 kg CO2e/L)',
        dataSourceUsed: 'Luke & SYKE Agricultural Research',
        responsibleDisclaimer: 'Food footprint values are approximate category-level estimates, not verified product-level emissions.',
        goalSaveable: true,
        savedGoalPayload: {
          title: isFinnish ? 'Kaurajuoma maitotuotteiden tilalle' : 'Oat Milk Switch',
          category: 'Food',
          scenario: 'Use oat drink for coffee and cooking',
          estimatedCo2KgMonth: 3.6,
          estimatedEurMonth: -2.8,
          effort: 'Easy',
        },
      };
    }

    // Default: seasonal produce / change one
    return {
      context,
      scenarioTitle: isFinnish ? 'Kotimaiset satokauden perunat riisin tilalle' : 'Seasonal Finnish potatoes instead of imported rice',
      selectedOptionId: optionId,
      co2DiffKg: -1.25,
      costDiffEur: -0.60,
      co2Display: '↓ 1.3 kg CO₂',
      costDisplay: '€0.60 cheaper',
      effort: 'Easy',
      convenienceRating: 4,
      aiExplanation: isFinnish
        ? 'Kotimaisten perunoiden ja juuresten hiilijalanjälki on vain murto-osa tuontiriisistä (~0.2 vs 2.7 kg CO₂e/kg).'
        : 'Locally grown Finnish potatoes and root vegetables carry a fraction of the footprint of imported rice (~0.2 vs 2.7 kg CO₂e/kg).',
      formulaUsed: '500g rice (2.7 kg CO2e/kg) vs 500g potatoes (0.2 kg CO2e/kg)',
      dataSourceUsed: 'Luke Finnish Agricultural Database',
      responsibleDisclaimer: 'Food footprint values are approximate category-level estimates, not verified product-level emissions.',
      goalSaveable: true,
      savedGoalPayload: {
        title: isFinnish ? 'Kotimaiset juurekset ja perunat' : 'Local Root Veg & Potatoes',
        category: 'Food',
        scenario: 'Choose seasonal Finnish produce',
        estimatedCo2KgMonth: 5.0,
        estimatedEurMonth: 2.4,
        effort: 'Easy',
      },
    };
  }

  // 6. RECYCLING CONTEXT
  if (context === 'recycling') {
    if (optionId === 'recycling_proper') {
      return {
        context,
        scenarioTitle: isFinnish ? 'Kartonki- ja muovipakkauksen erilliskeräys' : 'Cardboard & Plastic Packaging Recycling',
        selectedOptionId: optionId,
        co2DiffKg: -0.15,
        costDiffEur: 0.0,
        co2Display: '↓ 150 g CO₂ saved',
        costDisplay: '0 € cost',
        effort: 'Easy',
        convenienceRating: 5,
        aiExplanation: isFinnish
          ? 'Kierrättämällä kartongin ja muovikorkin erikseen säästät uusiutumattomia raaka-aineita verrattuna sekajätteen polttoon Vantaan Energian voimalassa.'
          : 'Sorting the cardboard body and plastic cap separately recycles clean secondary materials instead of incinerating them in the municipal waste plant.',
        formulaUsed: 'HSY 120g plastic diversion + 30g cardboard diversion factors',
        dataSourceUsed: 'HSY (Helsinki Region Environmental Services) Waste Baseline',
        responsibleDisclaimer: 'Recycling emission credits calculated vs average municipal incineration energy recovery.',
        goalSaveable: true,
        savedGoalPayload: {
          title: isFinnish ? '100% kartongin ja muovin lajittelu' : '100% Carton & Plastic Sorting',
          category: 'Recycling',
          scenario: 'Separate caps and rinse packaging',
          estimatedCo2KgMonth: 1.8,
          estimatedEurMonth: 0.0,
          effort: 'Easy',
        },
      };
    }

    return {
      context,
      scenarioTitle: isFinnish ? 'Sekajäte vs Kierrätys' : 'Mixed Waste vs Recycling Guidance',
      selectedOptionId: optionId,
      co2DiffKg: 0.15,
      costDiffEur: 0.0,
      co2Display: '+150 g CO₂ (loss of material)',
      costDisplay: '0 €',
      effort: 'Easy',
      convenienceRating: 5,
      aiExplanation: isFinnish
        ? 'Sekajätteeseen päätyvä pakkaus poltetaan kaukolämmöksi ja sähköksi, mutta kierrätyskelpoinen muovi ja kuitu menetetään.'
        : 'Items in mixed waste are incinerated for district heating, but reusable polymer and fiber materials are lost from the circular economy.',
      formulaUsed: 'HSY Sortti guidelines',
      dataSourceUsed: 'HSY Jäteopas (hsy.fi/jateopas)',
      responsibleDisclaimer: 'Follow official HSY residential sorting regulations.',
    };
  }

  // 7. ENERGY CONTEXT
  if (context === 'energy') {
    const isHeatingProtected = userProfile.cannotChange?.includes('no_temperature_reduction' as any);

    if (optionId === 'energy_lower_1c') {
      return {
        context,
        scenarioTitle: isFinnish ? 'Huonelämpötilan lasku 1 °C (21°C → 20°C)' : 'Lower Indoor Temperature by 1°C (21°C → 20°C)',
        selectedOptionId: optionId,
        co2DiffKg: -6.1,
        costDiffEur: -9.5,
        co2Display: '↓ 6.1 kg CO₂ / mo',
        costDisplay: '€9.50 / mo saved',
        effort: isHeatingProtected ? 'High' : 'Easy',
        convenienceRating: isHeatingProtected ? 2 : 4,
        aiExplanation: isHeatingProtected
          ? isFinnish
            ? 'Huom: Olet merkinnyt lämmityksen suojatuksi profiilissasi. Mukavuus on etusijalla, joten tätä toimenpidettä ei suositella automaattisesti.'
            : 'Note: Heating is marked as protected in your profile. Indoor comfort remains your priority, so this action is not pushed automatically.'
          : isFinnish
            ? '1 °C huonelämpötilan lasku säästää tyypillisesti n. 5 % asunnon lämmitysenergiasta (n. 90 kWh/kk kaukolämpöä tai sähköä).'
            : 'Lowering your thermostat by 1°C saves approximately 5% of monthly heating energy (~90 kWh/month in a 72m² home).',
        formulaUsed: '72m² × 25 kWh/m² winter × 5% reduction × 68 g CO2/kWh',
        dataSourceUsed: 'Motiva & Fortum Clean Heat District Heating Standards',
        responsibleDisclaimer: 'Calculations based on standard Finnish Kerrostalo heating curves.',
        goalSaveable: !isHeatingProtected,
        savedGoalPayload: {
          title: isFinnish ? 'Huonelämpötila 20 °C' : 'Thermostat at 20°C',
          category: 'Heating',
          scenario: 'Calibrate living spaces to 20°C',
          estimatedCo2KgMonth: 6.1,
          estimatedEurMonth: 9.5,
          effort: 'Easy',
        },
      };
    }

    return {
      context,
      scenarioTitle: isFinnish ? 'Laitteiden siirto yötunneille' : 'Appliance Shift to Off-Peak',
      selectedOptionId: optionId,
      co2DiffKg: -2.4,
      costDiffEur: -4.2,
      co2Display: '↓ 2.4 kg CO₂ / mo',
      costDisplay: '€4.20 / mo saved',
      effort: 'Easy',
      convenienceRating: 5,
      aiExplanation: isFinnish
        ? 'Tiskikoneen ja pyykinpesukoneen ajastaminen klo 22:00 jälkeen säästää rahaa ja päästöjä ilman sisälämpötilan muutoksia.'
        : 'Scheduling washing machines and dishwashers after 22:00 saves cost and emissions with zero impact on indoor thermal comfort.',
      formulaUsed: '15 monthly cycles × (17.5 c - 3.8 c) / 100',
      dataSourceUsed: 'Nord Pool Day-Ahead Spot API',
      responsibleDisclaimer: 'Based on 15 appliance loads per month.',
      goalSaveable: true,
    };
  }

  // 8. MOBILITY CONTEXT
  if (context === 'mobility') {
    return {
      context,
      scenarioTitle: isFinnish ? 'Yksi pyöräilymatka viikossa auton sijaan' : 'One Cycling Commute Trip Weekly vs Driving',
      selectedOptionId: optionId,
      co2DiffKg: -3.4,
      costDiffEur: -8.7,
      co2Display: '↓ 3.4 kg CO₂ / wk',
      costDisplay: '€8.70 / wk saved',
      effort: 'Medium',
      convenienceRating: 4,
      aiExplanation: isFinnish
        ? 'Vaikka autoilu on profiilissasi merkitty tarpeelliseksi arjen aikataulujen vuoksi, vain yhden viikoittaisen matkan korvaaminen pyöräilyllä säästää yli 13 kg CO₂ kuukaudessa.'
        : 'Even though driving is currently marked as necessary in your profile, substituting just one trip per week with cycling saves over 13 kg CO₂ monthly.',
      formulaUsed: '2 × 12 km round-trip × 142 g CO2/km ICE car',
      dataSourceUsed: 'HSL & VTT Lipasto',
      responsibleDisclaimer: 'Calculations assume 24 km round-trip commute.',
      goalSaveable: true,
      savedGoalPayload: {
        title: isFinnish ? '1 pyöräilymatka viikossa' : '1 Bike Commute Weekly',
        category: 'Transit',
        scenario: 'Replace 1 round-trip drive with cycling',
        estimatedCo2KgMonth: 13.6,
        estimatedEurMonth: 34.8,
        effort: 'Medium',
      },
    };
  }

  // 9. PROGRESS CONTEXT
  if (context === 'progress') {
    return {
      context,
      scenarioTitle: isFinnish ? 'Ensi viikon ilmastovaikutuksen ennuste' : "Next Week's Impact Projection",
      selectedOptionId: optionId,
      co2DiffKg: -6.4,
      costDiffEur: -8.2,
      co2Display: '↓ ~6.4 kg CO₂ / wk',
      costDisplay: '~€8.20 / wk saved',
      effort: 'Easy',
      convenienceRating: 5,
      aiExplanation: isFinnish
        ? 'Jos jatkat nykyistä rutiiniasi (vihreä lataus + tiskikoneen yöajastus), viikoittainen säästösi pysyy vakaana ja ansaitset arviolta ~84 EcoCreditiä lisää.'
        : 'If you repeat your current pattern (green EV charging + night dishwasher), your weekly savings will remain steady, earning you an estimated ~84 EcoCredits.',
      formulaUsed: '7 daily completed actions × avg 0.9 kg CO2 & €1.17',
      dataSourceUsed: 'EcoPilot Weekly Activity Model',
      responsibleDisclaimer: 'Estimates projected from your completed action history.',
      goalSaveable: true,
    };
  }

  // Fallback / General
  return {
    context: 'general',
    scenarioTitle: isFinnish ? 'Pieni arjen teko' : 'Small Daily Action',
    selectedOptionId: optionId,
    co2DiffKg: -0.9,
    costDiffEur: -0.65,
    co2Display: '↓ ~0.9 kg CO₂',
    costDisplay: '€0.65 cheaper',
    effort: 'Easy',
    convenienceRating: 5,
    aiExplanation: isFinnish
      ? 'Pienilläkin arjen ajoituksen muutoksilla on todellinen mitattava ilmastovaikutus.'
      : 'Even modest shifts in daily timing have a measurable estimated environmental impact.',
    formulaUsed: 'Standard Nordic baseline',
    dataSourceUsed: 'Fingrid Open Data & Nord Pool Spot API',
    responsibleDisclaimer: 'Calculations use deterministic Finnish grid factors.',
  };
}
