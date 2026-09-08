import { GoogleGenAI, Type, FunctionCallingConfigMode } from "@google/genai";
import type { FunctionDeclaration, FunctionCall } from "@google/genai";
import type {
  UserProfile,
  Season,
  WasteClassificationResult,
  DailyEnergyPlan,
  CommuteComparison,
  GroceryReceiptResult,
  TodaysActionResult,
  Co2LogEntry,
  Co2LogCategory,
  WhatIfProjection,
  ActivityExtraction,
  TripActivityExtraction,
} from "./types";
import { ACTIVITY_MODES } from "./types";
import { DEFAULT_COUNTRY } from "./emissionFactors";

/**
 * Server-only Gemini calls backing the ecopilot feature. Ported from the
 * "Kipinä Espoo AI" standalone prototype
 * (espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant/src/server/geminiService.ts).
 * Only import this from route handlers (app/api/ai/**\/route.ts) — never
 * from a Client Component, since it reads GEMINI_API_KEY.
 */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-3.5-flash-lite";

/** "Car" alone doesn't tell the model much — fold in car type/CO2 when it's set. */
function describeCommute(userProfile: UserProfile): string {
  if (userProfile.commuteHabit !== "Car" || !userProfile.carType) return userProfile.commuteHabit;
  const co2 = userProfile.carCo2GramsPerKm != null ? `, ~${userProfile.carCo2GramsPerKm} g CO2/km` : "";
  return `Car (${userProfile.carType}${co2})`;
}

/**
 * 1. AI Assistant Chat tailored for Finland, Espoo 2030, and Finnish daily routines
 */
export async function chatWithClimateAssistant(
  chatHistory: { role: string; content: string }[],
  userMessage: string,
  userProfile?: UserProfile
): Promise<{ reply: string; suggestedFollowUps: string[] }> {
  const systemPrompt = `You are "Kipinä", the premier AI Climate & Living Assistant specifically tailored to life in Finland and the City of Espoo's Carbon-Neutral Espoo 2030 Roadmap (Hiilineutraali Espoo 2030 / Ilmastovahti).

Context & Core Domain Knowledge:
- Geography & Microclimate: City of Espoo (Suur-Tapiola, Leppävaara, Matinkylä, Espoonlahti, Vanha-Espoo, Pohjois-Espoo/Nuuksio).
- Weather & Seasons: Sub-zero Finnish winters (kaamos, pakkanen, lohkolämmitin, tiivisteet, ilmalämpöpumpun sulatus), spring melt (pyöräilykauden avaus, aurinkosähkökausi), summer cottage living (kesämökki, puukiuas, kuiva koivuklapi, sytytys päältä), and autumn ruska (patterien ilmaus, sadekausi).
- Energy Systems: Nord Pool hourly spot electricity (pörssisähkö c/kWh), electric sauna power spikes (6-9 kW kiuas optimization, 70°C vs 90°C saves 25%), Fortum Clean Heat & Microsoft Data Center waste heat reuse (Hepokorpi & Kolabacka), ground-source geothermal (maalämpö), solar energy communities (taloyhtiöiden aurinkovoimalat), and ARA energy renovation grants.
- Transit: HSL network (Länsimetro to Tapiola/Matinkylä/Kivenlahti, Pikaratikka 15 orbital light rail, commuter trains E/U/L to Leppävaara/Espoon keskus, Baana bike highways, HSL kaupunkipyörät).
- Waste & Circular Economy: HSY (Helsingin seudun ympäristöpalvelut) strict sorting guidelines (biojäte, muovipakkaukset, kartonki, lasi, metalli, poistotekstiilit, vaarallinen jäte, Pantti bottle refunds, Sortti-asemat at Mankkaa & Ämmässuo).
- Tone: Extremely practical, warm, encouraging, realistic, and deeply knowledgeable about Finnish regulations, housing company (taloyhtiö) dynamics, and local municipal climate measures.
- Language: Respond in the language used by the user (primarily English or Finnish / Suomi, or Swedish / Svenska). If the user writes in English, you can weave in authentic Finnish terminology with clear explanations (e.g. "pörssisähkö", "kiuas", "taloyhtiö", "Sortti-asema", "kaukolämpö").

User Context:
${
  userProfile
    ? `Resident: ${userProfile.name}, District: ${userProfile.district}, Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m², ${userProfile.householdSize} persons), Heating: ${userProfile.heatingSystems.join(", ")}, Electricity: ${userProfile.electricityContract}, Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek}x/wk), Commute: ${describeCommute(userProfile)}, Current Footprint: ${userProfile.estimatedFootprintTonnes} t CO2e (Target: ${userProfile.targetFootprintTonnes} t).`
    : "General Espoo resident."
}

Deliver concise, actionable advice with concrete numbers (savings in € and kg CO2e) whenever applicable.`;

  const formattedContents = [
    ...chatHistory.slice(-6).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: formattedContents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    },
  });

  const replyText =
    response.text || "I am ready to help you optimize your daily routines and lower your carbon footprint in Espoo!";

  const isFinnishQuery = /[äöå]/i.test(userMessage) || /miten|paljonko|milloin|mikä|onko/i.test(userMessage);
  const suggestedFollowUps = isFinnishQuery
    ? [
        "Milloin kannattaa lämmittää sähkösauna tänään?",
        "Miten lajittelen muovipakkaukset ja öljyiset kartongit HSY-ohjeiden mukaan?",
        "Miten Espoon 2030 ilmastovahti etenee omassa kaupunginosassani?",
      ]
    : [
        "When is the cheapest time to heat my sauna tonight?",
        "How do I sort greasy pizza boxes and milk cartons according to HSY?",
        "How does the Espoo 2030 Climate Watch track district heating progress?",
      ];

  return { reply: replyText, suggestedFollowUps };
}

/**
 * 2. AI Waste & Recycling Classifier (HSY & Sortti-asema rules)
 */
export async function classifyWaste(query: string, imageBase64?: string): Promise<WasteClassificationResult> {
  const prompt = `Classify this item according to the official HSY (Helsingin seudun ympäristöpalvelut) and City of Espoo recycling regulations.
Item query / description: "${query}"

Return a JSON object with:
- itemName: precise name in Finnish and English
- category: one of 'Biojäte', 'Muovipakkaukset', 'Kartonki ja pahvi', 'Lasi', 'Metalli', 'Sekajäte', 'Vaarallinen jäte', 'Poistotekstiili', 'Pantti (Palpa)', 'Sortti-asema'
- binColor: standard Finnish bin color identifier
- sortingInstructions: exact steps (e.g. cold water rinse, flatten, separate lid, bag type)
- cleaningRequired: boolean
- whyItMatters: material cycle destination (e.g. Fortum Riihimäki plastics refinery, Ämmässuo biogas plant, Vantaa waste-to-energy plant)
- co2SavingsEstimateGrams: estimated grams of CO2 saved compared to mixed waste incineration
- nearestEspooFacility: specific facility or collection point in Espoo (e.g. Mankkaan Sortti-asema, Ämmässuon ekoteollisuuskeskus, Kauppakeskus Sello Rinki-piste, Iso Omena Rinki-piste, or housing company bin)
- proTip: insider Finnish recycling tip`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      },
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          category: { type: Type.STRING },
          binColor: { type: Type.STRING },
          sortingInstructions: { type: Type.STRING },
          cleaningRequired: { type: Type.BOOLEAN },
          whyItMatters: { type: Type.STRING },
          co2SavingsEstimateGrams: { type: Type.NUMBER },
          nearestEspooFacility: { type: Type.STRING },
          proTip: { type: Type.STRING },
        },
        required: [
          "itemName",
          "category",
          "binColor",
          "sortingInstructions",
          "cleaningRequired",
          "whyItMatters",
          "co2SavingsEstimateGrams",
          "nearestEspooFacility",
          "proTip",
        ],
      },
    },
  });

  return JSON.parse(response.text || "{}") as WasteClassificationResult;
}

/**
 * 3. Daily Energy & Sauna Scheduler with Nord Pool Spot Prices & Finnish Weather
 */
export async function optimizeDailyEnergy(
  userProfile: UserProfile,
  outdoorTemp: number,
  spotPrices: { hour: number; priceCentsKwh: number; gridCo2IntensityGramsKwh: number }[]
): Promise<DailyEnergyPlan> {
  const prompt = `Analyze today's Finnish Nord Pool hourly spot prices and outdoor temperature (${outdoorTemp}°C) for this Espoo household:
Resident: ${userProfile.name}, Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m²), Heating: ${userProfile.heatingSystems.join(", ")}, Electricity Contract: ${userProfile.electricityContract}, Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek}x/wk), Commute: ${describeCommute(userProfile)}.

Hourly spot price snapshot:
${spotPrices.map((p) => `Hour ${p.hour}:00 -> ${p.priceCentsKwh} c/kWh, ${p.gridCo2IntensityGramsKwh} g CO2/kWh`).join("\n")}

Generate the optimal daily energy action plan tailored to Finnish living:
1. Peak sauna heating window: best hour to heat electric/wood sauna with exact savings vs evening peak (17:00-19:00), recommended thermostat (70-75°C vs 90°C), and CO2 cut.
2. Heat pump / heating curve adjustment for ${outdoorTemp}°C (continuous HEAT mode, defrost tips, room thermostat advice).
3. Laundry / dishwasher window (best cheap clean hour).
4. EV charging window (if applicable).
5. Ventilation heat recovery (LTO) tip for this weather.
6. Estimated daily financial savings in € and CO2 emissions cut in kg.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          outdoorTempCelsius: { type: Type.NUMBER },
          peakSaunaWindow: {
            type: Type.OBJECT,
            properties: {
              recommendedTime: { type: Type.STRING },
              reason: { type: Type.STRING },
              savingsEur: { type: Type.STRING },
              co2ReductionPercent: { type: Type.STRING },
            },
            required: ["recommendedTime", "reason", "savingsEur", "co2ReductionPercent"],
          },
          heatPumpTip: { type: Type.STRING },
          laundryWindow: { type: Type.STRING },
          evChargingWindow: { type: Type.STRING },
          ventilationAdjustment: { type: Type.STRING },
          estimatedDailySavingsEur: { type: Type.NUMBER },
          estimatedDailyCo2SavedKg: { type: Type.NUMBER },
        },
        required: [
          "peakSaunaWindow",
          "heatPumpTip",
          "laundryWindow",
          "evChargingWindow",
          "ventilationAdjustment",
          "estimatedDailySavingsEur",
          "estimatedDailyCo2SavedKg",
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return { ...parsed, outdoorTempCelsius: outdoorTemp } as DailyEnergyPlan;
}

/** Collapses the raw ledger into per-category totals — cheaper to feed to the model than every row. */
function summarizeCo2Logs(logs: Co2LogEntry[]): string {
  if (logs.length === 0) return "No logged activity yet.";

  const byCategory = new Map<string, { count: number; totalKg: number }>();
  for (const log of logs) {
    const cur = byCategory.get(log.category) ?? { count: 0, totalKg: 0 };
    cur.count += 1;
    cur.totalKg += log.co2Kg;
    byCategory.set(log.category, cur);
  }

  const spanDays =
    Math.round(
      (new Date(logs[0].occurredOn).getTime() - new Date(logs[logs.length - 1].occurredOn).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  const lines = Array.from(byCategory.entries()).map(
    ([category, { count, totalKg }]) => `- ${category}: ${count} entries, net ${totalKg.toFixed(1)} kg CO2e`
  );

  return `Over the last ${spanDays} days (${logs.length} logged entries):\n${lines.join("\n")}\n\nRecent entries (newest first):\n${logs
    .slice(0, 15)
    .map((l) => `${l.occurredOn} [${l.category}] ${l.description}: ${l.co2Kg > 0 ? "+" : ""}${l.co2Kg} kg CO2e (${l.source})`)
    .join("\n")}`;
}

/**
 * 4b. "What If" Scenario Projector — answers a free-form hypothetical
 * ("what if I biked instead of driving 3x/week?") by reasoning over the
 * resident's own logged CO2 ledger + profile instead of generic averages.
 */
export async function projectWhatIfScenario(
  question: string,
  userProfile: UserProfile,
  recentLogs: Co2LogEntry[]
): Promise<WhatIfProjection> {
  const prompt = `A resident of Espoo, Finland is asking a hypothetical "what if" question about changing a daily habit. Ground your answer in their actual logged data below — do not just use generic national averages if their own data suggests different numbers. If their logs don't contain enough relevant data to project confidently, say so via a lower confidence and explain the assumption you fell back on.

Resident profile: ${userProfile.name}, District: ${userProfile.district}, Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m², ${userProfile.householdSize} persons), Heating: ${userProfile.heatingSystems.join(", ")}, Electricity: ${userProfile.electricityContract}, Commute: ${describeCommute(userProfile)}, Current footprint: ${userProfile.estimatedFootprintTonnes} t CO2e/year (Target: ${userProfile.targetFootprintTonnes} t).

Their logged CO2 ledger:
${summarizeCo2Logs(recentLogs)}

Question: "${question}"

Project the annual impact of this change (CO2 kg saved/year and € saved/year), state the assumption you used to get there (ideally citing the logged data), and rate your confidence given how much relevant logged data was available.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING },
          co2SavedKgPerYear: { type: Type.NUMBER },
          moneySavedEurPerYear: { type: Type.NUMBER },
          assumption: { type: Type.STRING },
          confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
        },
        required: ["narrative", "co2SavedKgPerYear", "moneySavedEurPerYear", "assumption", "confidence"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return { question, ...parsed } as WhatIfProjection;
}

/**
 * 4c. Heating Optimization Suggestions — proposes concrete, structural
 * changes for this specific home's heating system(s) (not the daily Nord
 * Pool schedule optimizeDailyEnergy already covers), grounded in the
 * resident's logged heating/energy CO2 entries where there are any.
 */
export async function suggestHeatingOptimizations(
  userProfile: UserProfile,
  recentLogs: Co2LogEntry[]
): Promise<WhatIfProjection[]> {
  const heatingLogs = recentLogs.filter((l) => l.category === "heating" || l.category === "energy");

  const prompt = `A resident of Espoo, Finland wants ideas to cut both the cost and CO2 footprint of their home's heating, structurally — not just today's Nord Pool schedule.

Home: ${userProfile.housingType}, ${userProfile.livingAreaSqM}m², ${userProfile.householdSize} person household, District: ${userProfile.district}.
Heating system(s): ${userProfile.heatingSystems.join(", ") || "none set"}.
Electricity contract: ${userProfile.electricityContract}.

${heatingLogs.length > 0 ? `Their logged heating/energy CO2 entries:\n${summarizeCo2Logs(heatingLogs)}` : "No heating/energy entries logged yet — reason from the profile and typical Finnish housing data."}

Suggest 2-3 distinct, concrete optimizations for THIS home's heating setup (e.g. a heating-curve/thermostat setback schedule, swapping a fossil element for a heat pump, improving insulation or ventilation heat recovery, or a housing-company energy renovation grant) — each phrased as a short "what if" question, with the projected annual CO2 kg saved and € saved, the assumption behind that number, and your confidence.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                narrative: { type: Type.STRING },
                co2SavedKgPerYear: { type: Type.NUMBER },
                moneySavedEurPerYear: { type: Type.NUMBER },
                assumption: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
              },
              required: ["question", "narrative", "co2SavedKgPerYear", "moneySavedEurPerYear", "assumption", "confidence"],
            },
          },
        },
        required: ["suggestions"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return (parsed.suggestions ?? []) as WhatIfProjection[];
}

/**
 * 4. HSL Commute & Journey Carbon Analyzer (Espoo routes, Pikaratikka 15, Metro, E-bike, Car)
 */
export async function compareCommuteEmissions(origin: string, destination: string): Promise<CommuteComparison> {
  const prompt = `Compare daily commuting options between "${origin}" and "${destination}" in the Helsinki/Espoo metropolitan area.
Include realistic options:
1. HSL Public Transit (Länsimetro, Pikaratikka 15, Commuter train E/U/L, or express bus)
2. Cycling / E-bike (via Espoo Baana network)
3. Electric Vehicle (EV charged on Finnish average grid)
4. Petrol / Diesel ICE Car (in peak Kehä I / Länsiväylä traffic)

Provide real distance (km), duration (mins), CO2 emissions per trip (grams), single trip cost (€), calories burned (if active), and yearly savings (CO2 kg and €) if switching 220 working days/year from private car to HSL transit.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          origin: { type: Type.STRING },
          destination: { type: Type.STRING },
          distanceKm: { type: Type.NUMBER },
          modes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                icon: { type: Type.STRING },
                durationMins: { type: Type.NUMBER },
                co2Grams: { type: Type.NUMBER },
                costEur: { type: Type.NUMBER },
                caloriesBurned: { type: Type.NUMBER },
                convenienceScore: { type: Type.NUMBER },
                routeDetails: { type: Type.STRING },
              },
              required: ["name", "icon", "durationMins", "co2Grams", "costEur", "convenienceScore", "routeDetails"],
            },
          },
          yearlySavingIfSwitchingToTransit: {
            type: Type.OBJECT,
            properties: {
              co2Kg: { type: Type.NUMBER },
              moneyEur: { type: Type.NUMBER },
              treesEquivalent: { type: Type.NUMBER },
            },
            required: ["co2Kg", "moneyEur", "treesEquivalent"],
          },
        },
        required: ["origin", "destination", "distanceKm", "modes", "yearlySavingIfSwitchingToTransit"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as CommuteComparison;
}

export interface RoadmapPlan {
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
}

/**
 * 5. Personalized Espoo 2030 7-Day Action Plan Generator
 */
export async function generatePersonalizedRoadmapPlan(userProfile: UserProfile, season: Season): Promise<RoadmapPlan> {
  const prompt = `Create a 7-day personalized climate action sprint for this resident to support the Carbon-Neutral Espoo 2030 Roadmap:
Resident: ${userProfile.name}
Espoo District: ${userProfile.district}
Housing Type: ${userProfile.housingType} (${userProfile.livingAreaSqM} m², ${userProfile.householdSize} persons)
Heating: ${userProfile.heatingSystems.join(", ")}
Electricity Contract: ${userProfile.electricityContract}
Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek} times/week)
Commute: ${describeCommute(userProfile)}
Current Footprint: ${userProfile.estimatedFootprintTonnes} tonnes CO2e/year (Target: ${userProfile.targetFootprintTonnes} tonnes)
Season: ${season}

The plan must feature practical Finnish daily routines:
- Day 1: Heating & Thermostat calibration for ${season}
- Day 2: Nord Pool Spot Electricity & Sauna Scheduling
- Day 3: HSL Transit / Pikaratikka 15 / Baana Cycling Commute test
- Day 4: HSY Zero-Waste & Plastic/Bio separation mastery
- Day 5: Nordic Plant-based domestic nutrition (Härkis, Nyhtökaura, local root vegetables, berry foraging)
- Day 6: Housing company (taloyhtiö) / neighborhood energy & solar collaboration
- Day 7: Weekend carbon-neutral nature relaxation in Espoo (Nuuksio / Espoon rantaraitti) + personal weekly footprint review.

Return a rich structured JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personalizedTagline: { type: Type.STRING },
          roadmapSummary: { type: Type.STRING },
          weeklyActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                actionTitle: { type: Type.STRING },
                category: { type: Type.STRING },
                impactDescription: { type: Type.STRING },
                co2KgSaved: { type: Type.NUMBER },
                moneyEurSaved: { type: Type.NUMBER },
                howToExecute: { type: Type.STRING },
              },
              required: ["day", "actionTitle", "category", "impactDescription", "co2KgSaved", "moneyEurSaved", "howToExecute"],
            },
          },
          housingCompanyAdvice: { type: Type.STRING },
          communityImpactText: { type: Type.STRING },
        },
        required: ["personalizedTagline", "roadmapSummary", "weeklyActions", "housingCompanyAdvice", "communityImpactText"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as RoadmapPlan;
}

/**
 * 6. Grocery Receipt CO2 Estimator (Gemini vision) — same inlineData image
 * pattern classifyWaste() above uses, applied to a photographed receipt.
 */
export async function classifyGroceryReceipt(imageBase64: string): Promise<GroceryReceiptResult> {
  const prompt = `Read this grocery/purchase receipt image and identify each purchased item.
For each item, estimate:
- category: a short food/product category (e.g. "Meat", "Dairy", "Produce", "Grains", "Packaged", "Household")
- estimatedCo2Kg: a rough lifecycle carbon footprint estimate in kg CO2e for the purchased quantity, using well-known Nordic/Finnish food carbon benchmarks (e.g. beef ~28 kg CO2e/kg, chicken ~3.8, plant protein ~0.9, dairy milk ~1.2/L, oat milk ~0.3/L, rice ~2.7/kg, root vegetables ~0.2/kg)
- estimatedEur: the item's price if visible on the receipt, else a reasonable Finnish grocery price estimate

Also suggest up to 3 concrete lower-carbon swaps for the highest-impact items (e.g. "swap beef for Härkis/Nyhtökaura").

If the image is not a legible receipt, return an empty items array and no suggestions.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64.replace(/^data:image\/\w+;base64,/, "") } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                estimatedCo2Kg: { type: Type.NUMBER },
                estimatedEur: { type: Type.NUMBER },
              },
              required: ["name", "category", "estimatedCo2Kg", "estimatedEur"],
            },
          },
          swapSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["items", "swapSuggestions"],
      },
    },
  });

  return JSON.parse(response.text || '{"items":[],"swapSuggestions":[]}') as GroceryReceiptResult;
}

/**
 * 7. Today's Best Action — one concrete, grounded suggestion for right now.
 * The model picks and explains; it never computes the headline number from
 * nothing — it's told to keep estimates conservative and grounded in the
 * facts handed to it, same discipline as the rest of this file's prompts.
 */
export async function generateTodaysBestAction(
  userProfile: UserProfile,
  outdoorTempCelsius: number,
  recentLogsSummary: string
): Promise<TodaysActionResult> {
  const prompt = `Recommend exactly ONE concrete, practical action this Espoo resident could take TODAY to cut their carbon footprint or save money, grounded strictly in the facts below. Do not invent numbers beyond what a reasonable person could estimate from these facts — keep estimates conservative and round.

Resident: ${userProfile.name}, District: ${userProfile.district}, Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m²), Heating: ${userProfile.heatingSystems.join(", ")}, Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek}x/wk), Commute: ${describeCommute(userProfile)}, Waste sorting: ${userProfile.wasteManagementSystem}.
Outdoor temperature: ${outdoorTempCelsius}°C.
Recent logged activity: ${recentLogsSummary || "No activity logged yet."}

Pick ONE single best action (not a list). Categorize it as one of: heating, transport, waste, energy, food, other.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          reason: { type: Type.STRING },
          category: { type: Type.STRING },
          estimatedCo2KgSaved: { type: Type.NUMBER },
          estimatedEurSaved: { type: Type.NUMBER },
          confidence: { type: Type.STRING },
        },
        required: ["headline", "reason", "category", "estimatedCo2KgSaved", "estimatedEurSaved", "confidence"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as TodaysActionResult;
}

/** Tool: a travel/commute trip — priced afterwards by the country-aware factor table. */
const LOG_TRIP_FUNCTION: FunctionDeclaration = {
  name: "log_trip",
  description:
    "Records a single travel/commute trip from a resident's diary entry — any entry about going somewhere by car, EV, train, bus, bike, walking, plane or ferry.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: {
        type: Type.STRING,
        enum: [...ACTIVITY_MODES],
        description: "Primary mode of transport used for the trip (use 'ev' only if an electric car/vehicle is explicitly implied).",
      },
      distanceKm: {
        type: Type.NUMBER,
        description:
          "Best-estimate one-way trip distance in kilometers. If the user didn't state a distance, infer a realistic one from the named places (e.g. Espoo to Helsinki ~18km, Helsinki to Turku ~165km, Espoo to Oslo ~800km).",
      },
      origin: { type: Type.STRING, description: "Starting place mentioned in the text, if any." },
      destination: { type: Type.STRING, description: "Destination place mentioned in the text, if any." },
      country: {
        type: Type.STRING,
        description:
          "The country the trip took place in, inferred from the place names (e.g. 'Finland', 'Norway', 'Poland'). Default to 'Finland' if there's no other clue.",
      },
    },
    required: ["mode", "distanceKm", "country"],
  },
};

/** Tool: anything that isn't travel — food, home energy/heating, waste, purchases. Gemini estimates the CO2 itself. */
const LOG_GENERAL_ACTIVITY_FUNCTION: FunctionDeclaration = {
  name: "log_general_activity",
  description:
    "Records a NON-travel activity (a meal or food item, home electricity or heating use, waste & recycling, a purchase, or anything else that isn't going somewhere) together with your own rough lifecycle CO2 estimate. Never use this for trips — use log_trip for those.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        enum: ["food", "energy", "heating", "waste", "other"],
        description: "Best-fit ledger category for the activity.",
      },
      description: {
        type: Type.STRING,
        description: "Short summary of the activity, e.g. 'Beef burger dinner' or '3 loads of laundry at 60°C'.",
      },
      co2Kg: {
        type: Type.NUMBER,
        description:
          "Your rough lifecycle estimate in kg CO2e. Positive = emitted, negative = avoided/saved versus a typical baseline. Use well-known Finnish/Nordic benchmarks (beef ~28 kg CO2e/kg, cheese ~10, chicken ~3.8, pork ~5.5, rice ~2.7/kg, dairy milk ~1.2/L, oat drink ~0.3/L, root vegetables ~0.2/kg; 1 kWh of Finnish grid electricity ~0.08 kg; a hot shower ~0.5 kg; a mixed-waste bag ~0.2 kg).",
      },
      note: { type: Type.STRING, description: "One sentence explaining the assumptions behind the estimate." },
    },
    required: ["category", "description", "co2Kg", "note"],
  },
};

interface LogTripArgs {
  mode?: string;
  distanceKm?: number;
  origin?: string | null;
  destination?: string | null;
  country?: string;
}

interface LogGeneralActivityArgs {
  category?: string;
  description?: string;
  co2Kg?: number;
  note?: string;
}

const GENERAL_ACTIVITY_CATEGORIES = ["food", "energy", "heating", "waste", "other"] as const;

function normalizeGeneralCategory(category: string | undefined): Co2LogCategory {
  return (GENERAL_ACTIVITY_CATEGORIES as readonly string[]).includes(category ?? "")
    ? (category as Co2LogCategory)
    : "other";
}

/**
 * 6. Natural-language Activity Logger — Gemini function calling turns free
 * text into a structured activity. Trips ("drove to Turku today", "took the
 * train from Espoo to Helsinki") go through log_trip, where the country it
 * returns makes the emission-factor lookup (lib/ecopilot/emissionFactors.ts)
 * Nordic-aware — the same "ev" mode maps to a very different gCO2/km depending
 * on whether the grid behind it is Norwegian hydro or coal-heavier elsewhere.
 * Everything else ("beef burger for lunch", "ran the sauna for an hour") goes
 * through log_general_activity, where Gemini estimates the lifecycle CO2 itself.
 */
export async function extractActivityFromText(text: string): Promise<ActivityExtraction> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents:
      `A resident logged this in their climate diary: "${text}"\n` +
      `If it describes travelling somewhere, call log_trip. Otherwise call log_general_activity with your own CO2 estimate.`,
    config: {
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ["log_trip", "log_general_activity"],
        },
      },
      tools: [{ functionDeclarations: [LOG_TRIP_FUNCTION, LOG_GENERAL_ACTIVITY_FUNCTION] }],
    },
  });

  const calls = response.functionCalls ?? [];
  const tripCall = calls.find((c: FunctionCall) => c.name === "log_trip");
  const generalCall = calls.find((c: FunctionCall) => c.name === "log_general_activity");

  if (generalCall && !tripCall) {
    const args = (generalCall.args ?? {}) as LogGeneralActivityArgs;
    return {
      kind: "general",
      category: normalizeGeneralCategory(args.category),
      description: args.description?.trim() || text.trim(),
      co2Kg: Math.round((Number(args.co2Kg) || 0) * 100) / 100,
      note: args.note?.trim() || "Rough estimate based on typical Nordic lifecycle benchmarks.",
      rawText: text,
    };
  }

  const args = (tripCall?.args ?? {}) as LogTripArgs;
  const mode = (ACTIVITY_MODES as readonly string[]).includes(args.mode ?? "") ? (args.mode as TripActivityExtraction["mode"]) : "car";

  return {
    kind: "trip",
    mode,
    distanceKm: Math.max(0, Number(args.distanceKm) || 0),
    origin: args.origin?.trim() || null,
    destination: args.destination?.trim() || null,
    country: args.country?.trim() || DEFAULT_COUNTRY,
    rawText: text,
  };
}

