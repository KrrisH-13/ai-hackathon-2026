import { GoogleGenAI, Type } from "@google/genai";
import type {
  UserProfile,
  Season,
  WasteClassificationResult,
  DailyEnergyPlan,
  CommuteComparison,
  GroceryReceiptResult,
  TodaysActionResult,
} from "./types";

/**
 * Server-only Gemini calls backing the ecopilot feature. Ported from the
 * "Kipinä Espoo AI" standalone prototype
 * (espoo-climatepulse-ai---finnish-carbon-neutrality-2030-assistant/src/server/geminiService.ts).
 * Only import this from route handlers (app/api/ai/**\/route.ts) — never
 * from a Client Component, since it reads GEMINI_API_KEY.
 */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-3.7-flash";

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
  userProfile?: UserProfile,
  currentSeason: Season = "winter"
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
    ? `Resident: ${userProfile.name}, District: ${userProfile.district}, Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m², ${userProfile.householdSize} persons), Heating: ${userProfile.heatingSystem}, Electricity: ${userProfile.electricityContract}, Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek}x/wk), Commute: ${describeCommute(userProfile)}, Current Footprint: ${userProfile.estimatedFootprintTonnes} t CO2e (Target: ${userProfile.targetFootprintTonnes} t).`
    : "General Espoo resident."
}
Current Season: ${currentSeason}

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
  currentSeason: Season,
  outdoorTemp: number,
  spotPrices: { hour: number; priceCentsKwh: number; gridCo2IntensityGramsKwh: number }[]
): Promise<DailyEnergyPlan> {
  const prompt = `Analyze today's Finnish Nord Pool hourly spot prices and outdoor temperature (${outdoorTemp}°C, Season: ${currentSeason}) for this Espoo household:
Resident: ${userProfile.name}, Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m²), Heating: ${userProfile.heatingSystem}, Electricity Contract: ${userProfile.electricityContract}, Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek}x/wk), Commute: ${describeCommute(userProfile)}.

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
          currentSeason: { type: Type.STRING },
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
  return { ...parsed, currentSeason, outdoorTempCelsius: outdoorTemp } as DailyEnergyPlan;
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
Heating: ${userProfile.heatingSystem}
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
  currentSeason: Season,
  outdoorTempCelsius: number,
  recentLogsSummary: string
): Promise<TodaysActionResult> {
  const prompt = `Recommend exactly ONE concrete, practical action this Espoo resident could take TODAY to cut their carbon footprint or save money, grounded strictly in the facts below. Do not invent numbers beyond what a reasonable person could estimate from these facts — keep estimates conservative and round.

Resident: ${userProfile.name}, District: ${userProfile.district}, Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m²), Heating: ${userProfile.heatingSystem}, Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek}x/wk), Commute: ${describeCommute(userProfile)}, Waste sorting: ${userProfile.wasteManagementSystem}.
Season: ${currentSeason}, Outdoor temperature: ${outdoorTempCelsius}°C.
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
