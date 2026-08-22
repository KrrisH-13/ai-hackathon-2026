"use client";

import { API_ROUTES } from "@/lib/constants";
import type {
  UserProfile,
  Season,
  WasteClassificationResult,
  DailyEnergyPlan,
  CommuteComparison,
  SpotPricePoint,
  GroceryReceiptResult,
  TodaysActionResult,
  WhatIfProjection,
  ActivityLogEstimate,
} from "./types";
import { estimateCo2Kg } from "./emissionFactors";

/**
 * Browser-side wrappers around app/api/ai/**. Ported from the "Kipinä Espoo
 * AI" standalone prototype's src/services/aiClient.ts. Each function falls
 * back to a canned (but realistic) response if the API call fails, so the
 * UI stays usable offline or if GEMINI_API_KEY isn't configured yet.
 */

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "AI request failed");
  }
  return data.data as T;
}

export async function chatWithClimateAssistantAPI(
  chatHistory: { role: string; content: string }[],
  userMessage: string,
  userProfile?: UserProfile,
  currentSeason: Season = "winter"
): Promise<{ reply: string; suggestedFollowUps: string[] }> {
  try {
    return await postJson(API_ROUTES.aiChat, { chatHistory, userMessage, userProfile, currentSeason });
  } catch (error) {
    console.error("Chat API client error:", error);
    return {
      reply: `Hei! Espoon 2030 ilmastotavoitteet etenevät parhaiten arkisilla valinnoilla:\n\n1. **Lämmitys**: Huonelämpötilan laskeminen 1°C säästää noin 5% kaukolämmöstä tai sähköstä.\n2. **Sauna**: Siirrä sähkökiukaan lämmitys iltahuippujen (17-20) ulkopuolelle.\n3. **Liikkuminen**: Pikaratikka 15 ja Länsimetro tarjoavat päästöttömän työmatkan ilman Kehä I:n ruuhkia.\n\nKysy minulta mistä tahansa arjen energiakysymyksestä, lajittelusta tai taloyhtiön energiaremonteista!`,
      suggestedFollowUps: [
        "Miten ajoitan saunan pörssisähkön mukaan tänään?",
        "Miten lajittelen muovin ja kartongin HSY-sääntöjen mukaan?",
        "Mitä tukia taloyhtiö voi saada energiaremonttiin Espoossa?",
      ],
    };
  }
}

/**
 * Natural-language activity logger — posts free text to Gemini function
 * calling (app/api/ai/extract-activity) and gets back a structured trip +
 * country-aware CO2 estimate. Falls back to a naive on-device guess (car,
 * Finland factor) if the API call fails, same offline-friendly pattern as
 * the other AI client wrappers here.
 */
export async function extractActivityAPI(text: string): Promise<ActivityLogEstimate> {
  try {
    return await postJson(API_ROUTES.aiExtractActivity, { text });
  } catch (error) {
    console.error("Extract activity API client error:", error);
    const extraction = { mode: "car" as const, distanceKm: 10, origin: null, destination: null, country: "Finland", rawText: text };
    const { co2Kg, gramsPerKm } = estimateCo2Kg(extraction.mode, extraction.distanceKm, extraction.country);
    return {
      extraction,
      co2Kg,
      emissionFactorGramsPerKm: gramsPerKm,
      factorNote: "Gemini was unreachable — showing a rough Finland-average car estimate instead.",
    };
  }
}

export async function classifyWasteAPI(query: string, imageBase64?: string): Promise<WasteClassificationResult> {
  try {
    return await postJson(API_ROUTES.aiClassifyWaste, { query, imageBase64 });
  } catch (error) {
    console.error("Classify waste API client error:", error);
    return {
      itemName: query,
      category: "Sekajäte",
      binColor: "Harmaa / Sekajäteastia",
      sortingInstructions: "Laita taloyhtiön sekajäteastiaan. Poltetaan sähköksi ja lämmöksi Vantaan jätevoimalassa.",
      cleaningRequired: false,
      whyItMatters: "Oikea lajittelu säästää raaka-aineita ja pienentää jätevoimalan hiilijalanjälkeä.",
      co2SavingsEstimateGrams: 150,
      nearestEspooFacility: "Mankkaan Sortti-asema / Taloyhtiön jätepiste",
      proTip: "Epäselvissä tapauksissa tarkista aina hsy.fi/jateopas.",
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
    return await postJson(API_ROUTES.aiOptimizeEnergy, { userProfile, currentSeason, outdoorTemp, spotPrices });
  } catch (error) {
    console.error("Energy optimizer API client error:", error);
    return {
      currentSeason,
      outdoorTempCelsius: outdoorTemp,
      peakSaunaWindow: {
        recommendedTime: "21:30 - 23:00",
        reason:
          "Pörssisähkön hinta putoaa illan huipputunneista 70% ja kantaverkon päästöt ovat minimissään tuulivoiman ansiosta.",
        savingsEur: "~€1.40 / saunakerta",
        co2ReductionPercent: "65% vähemmän CO2",
      },
      heatPumpTip: "Pidä ilmalämpöpumppu jatkuvalla HEAT-tilalla (+20°C, puhallusnopeus 3). Älä käytä AUTO-tilaa pakkasella.",
      laundryWindow: "13:00 - 15:00 tai yöllä 01:00 - 05:00",
      evChargingWindow: "01:00 - 05:00 (Hinta vain 1.2 - 2.0 c/kWh)",
      ventilationAdjustment: "Sulje LTO-laitteen kesäohitus ja varmista suodattimien puhtaus.",
      estimatedDailySavingsEur: 3.2,
      estimatedDailyCo2SavedKg: 4.8,
    };
  }
}

export async function compareCommuteAPI(origin: string, destination: string): Promise<CommuteComparison> {
  try {
    return await postJson(API_ROUTES.aiCompareCommute, { origin, destination });
  } catch (error) {
    console.error("Commute API client error:", error);
    return {
      origin,
      destination,
      distanceKm: 14.5,
      modes: [
        {
          name: "HSL Pikaratikka 15 & Metro",
          icon: "Train",
          durationMins: 28,
          co2Grams: 0,
          costEur: 3.1,
          convenienceScore: 9,
          routeDetails: "Pikaratikka 15 -> Länsimetro (100% uusiutuva sähkö, nollapäästöt).",
        },
        {
          name: "Sähköpyörä / Baana",
          icon: "Bike",
          durationMins: 35,
          co2Grams: 12,
          costEur: 0.1,
          caloriesBurned: 240,
          convenienceScore: 8,
          routeDetails: "Espoon pääpyöräreitti / Länsibaana.",
        },
        {
          name: "Sähköauto (EV)",
          icon: "Zap",
          durationMins: 22,
          co2Grams: 280,
          costEur: 1.8,
          convenienceScore: 7,
          routeDetails: "Kehä I & Länsiväylä.",
        },
        {
          name: "Polttomoottoriauto (Bensiini)",
          icon: "Car",
          durationMins: 24,
          co2Grams: 2450,
          costEur: 5.4,
          convenienceScore: 6,
          routeDetails: "Kehä I aamuruuhkassa.",
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

export async function projectWhatIfScenarioAPI(
  question: string,
  userProfile: UserProfile,
  currentSeason: Season = "winter"
): Promise<WhatIfProjection> {
  try {
    return await postJson(API_ROUTES.aiWhatIf, { question, userProfile, currentSeason });
  } catch (error) {
    console.error("What-if API client error:", error);
    return {
      question,
      narrative:
        "We couldn't reach the AI projection service right now, so here's a rough estimate — try again in a moment for a projection grounded in your actual logged data.",
      co2SavedKgPerYear: 0,
      moneySavedEurPerYear: 0,
      assumption: "Fallback response — not based on your logged CO2 ledger.",
      confidence: "low",
    };
  }
}

export async function scanReceiptAPI(imageBase64: string): Promise<GroceryReceiptResult> {
  try {
    return await postJson(API_ROUTES.aiScanReceipt, { imageBase64 });
  } catch (error) {
    console.error("Scan receipt API client error:", error);
    return { items: [], swapSuggestions: [] };
  }
}

export async function getTodaysActionAPI(
  userProfile: UserProfile,
  currentSeason: Season,
  outdoorTempCelsius: number
): Promise<TodaysActionResult> {
  try {
    return await postJson(API_ROUTES.aiTodaysAction, { userProfile, currentSeason, outdoorTempCelsius });
  } catch (error) {
    console.error("Today's action API client error:", error);
    return {
      headline: "Check your sauna schedule",
      reason: "Shifting electric sauna heating to off-peak hours is one of the most reliable everyday savings in Espoo.",
      category: "energy",
      estimatedCo2KgSaved: 2,
      estimatedEurSaved: 1.5,
      confidence: "LOW",
    };
  }
}
