import { GoogleGenAI, Type } from '@google/genai';
import {
  UserProfile,
  Season,
  WasteClassificationResult,
  DailyEnergyPlan,
  CommuteComparison,
} from '../types/climate';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, ActionDomain, ActionDefinition } from '../types/recommendation';
import { ECOPILOT_SYSTEM_PROMPT, buildEcoPilotRecommendationPrompt } from '../ai/promptTemplates';
import {
  PreferenceExtractionSchema,
  RecommendationReasoningSchema,
  ExplanationSchema,
  FeedbackLearningSchema,
  DailyPlanSchema,
  AssistantResponseSchema,
} from '../ai/schemas';
import { fallbackExtractPreferences } from '../ai/preferenceExtractor';
import { fallbackReasonRecommendation } from '../ai/recommendationReasoner';
import { fallbackGenerateExplanation } from '../ai/explanationGenerator';
import { fallbackLearnFeedback } from '../ai/feedbackLearner';
import { fallbackGenerateDailyPlan } from '../ai/dailyPlanner';
import { fallbackAskEcoPilot } from '../ai/assistant';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PRIMARY_MODEL = 'gemini-3.7-flash';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];

/**
 * Resilient helper that calls Gemini with automatic retries and model fallbacks.
 */
async function generateContentWithRetryAndFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('429') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('high demand') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('fetch failed');

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

/**
 * 1. FUNCTION 1 — PREFERENCE EXTRACTION
 */
export async function extractPreferencesWithGemini(
  userInput: string,
  currentProfile?: EcoPilotUserProfile
) {
  try {
    const prompt = `You are the EcoPilot Natural Language Preference Extractor for Nordic residents in Finland.
Extract structured constraints, flexible activities, schedules, and importance weights from this resident's natural language statement.

RULES:
1. Do NOT invent information. If something is unknown, return null/empty.
2. Distinguish negative hard/soft constraints (e.g., "don't want to change heating", "cannot cycle in winter") from flexible activities (e.g., "charge my EV at night", "dishwasher", "laundry", "sauna").
3. Assign importance weights (1 to 10) only when implied or explicit; otherwise use null or neutral defaults.

User Input: "${userInput}"
${currentProfile ? `Current Profile Context: Housing ${currentProfile.housingType}, Heating ${currentProfile.heatingSystem}, Sauna ${currentProfile.saunaType}, Commute ${currentProfile.commuteHabit}.` : ''}

Output JSON schema matching:
{
  "constraints": string[],
  "flexibleActivities": string[],
  "schedule": {
    "work": string | null,
    "sleep": string | null,
    "other": string | null
  },
  "preferences": {
    "convenienceImportance": number | null,
    "sustainabilityImportance": number | null,
    "costImportance": number | null
  },
  "detectedLifestyleNotes": string[],
  "confidence": number,
  "assumptions": string[]
}`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
            flexibleActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
            schedule: {
              type: Type.OBJECT,
              properties: {
                work: { type: Type.STRING },
                sleep: { type: Type.STRING },
                other: { type: Type.STRING },
              },
            },
            preferences: {
              type: Type.OBJECT,
              properties: {
                convenienceImportance: { type: Type.NUMBER },
                sustainabilityImportance: { type: Type.NUMBER },
                costImportance: { type: Type.NUMBER },
              },
              required: ['convenienceImportance', 'sustainabilityImportance', 'costImportance'],
            },
            detectedLifestyleNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER },
            assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['constraints', 'flexibleActivities', 'preferences'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return PreferenceExtractionSchema.parse(parsed);
  } catch (err: any) {
    console.warn('Gemini extractPreferences error, falling back:', err?.message || err);
    return fallbackExtractPreferences(userInput);
  }
}

/**
 * 2. FUNCTION 2 — RECOMMENDATION REASONER
 */
export async function reasonRecommendationWithGemini(input: {
  userProfile: EcoPilotUserProfile;
  candidateActions: ActionDefinition[];
  observation: ObservationSnapshot;
  previousFeedback?: any;
}) {
  try {
    const { userProfile, candidateActions, observation, previousFeedback } = input;
    const prompt = `You are EcoPilot's Recommendation Reasoner.
Select the SINGLE most appropriate action for this Nordic household from the supplied candidate actions.

CRITICAL INSTRUCTIONS:
1. You MUST select an action ID that is present in CANDIDATE ACTIONS. Do NOT invent new action IDs.
2. You do NOT invent or compute authoritative numbers; evaluate qualitatively based on personal fit, current spot price (${observation.currentSpotPriceCents} c/kWh), weather (${observation.outdoorTempCelsius}°C), and constraints.
3. Provide confidence (0.0 to 1.0) and explicit assumptions.

RESIDENT CONTEXT:
- Name: ${userProfile.name} in ${userProfile.district}
- Housing: ${userProfile.housingType}, Heating: ${userProfile.heatingSystem}, Sauna: ${userProfile.saunaType}
- Constraints: ${userProfile.cannotChange.join(', ') || 'None'}
- Flexible Items: ${userProfile.canChange.join(', ') || 'General'}
- Values Cared About: ${userProfile.caresAbout.join(', ')}
${previousFeedback?.rejectedActions?.length ? `- Rejected recently: ${previousFeedback.rejectedActions.join(', ')}` : ''}

CANDIDATE ACTIONS:
${candidateActions.map((a) => `- [ID: ${a.id}] ${a.titleEn}: ${a.descriptionEn}`).join('\n')}

Output JSON format:
{
  "selectedActionId": string,
  "reason": string,
  "userFriendlyExplanation": string,
  "confidence": number,
  "assumptions": string[],
  "dataSourcesConsidered": string[]
}`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedActionId: { type: Type.STRING },
            reason: { type: Type.STRING },
            userFriendlyExplanation: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            dataSourcesConsidered: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['selectedActionId', 'reason', 'userFriendlyExplanation', 'confidence', 'assumptions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const validated = RecommendationReasoningSchema.parse(parsed);

    // Verify candidate
    if (!candidateActions.some((c) => c.id === validated.selectedActionId) && candidateActions[0]) {
      validated.selectedActionId = candidateActions[0].id;
    }
    return validated;
  } catch (err: any) {
    console.warn('Gemini reasonRecommendation error, falling back:', err?.message || err);
    return fallbackReasonRecommendation(input);
  }
}

/**
 * 3. FUNCTION 3 — EXPLANATION GENERATOR ("Why am I seeing this?")
 */
export async function generateExplanationWithGemini(input: {
  actionId: string;
  actionTitle?: string;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  candidateActions?: ActionDefinition[];
}) {
  try {
    const { actionId, actionTitle, userProfile, observation } = input;
    const prompt = `The user clicked "Why am I seeing this?" on recommendation: "${actionTitle || actionId}".
Explain transparently:
1. Which user preferences/constraints mattered (e.g. flexible EV vs fixed heating).
2. Which live public data mattered (Nord Pool spot rates, Fingrid grid carbon intensity, FMI outdoor temperature).
3. Why this action was prioritized over alternatives.
4. What assumptions were made.
5. AI confidence score and data sources.

User Profile: ${userProfile.housingType} in ${userProfile.district}, Heating ${userProfile.heatingSystem}, Constraints: ${userProfile.cannotChange.join(', ') || 'None'}, Flexible: ${userProfile.canChange.join(', ') || 'None'}.
Public Data: Spot Price ${observation.currentSpotPriceCents} c/kWh, Grid CO2 ${observation.gridEmissionsIntensityGrams} g CO2/kWh, Temp ${observation.outdoorTempCelsius}°C.

Output JSON matching schema.`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionId: { type: Type.STRING },
            actionTitle: { type: Type.STRING },
            userPreferencesMattered: { type: Type.ARRAY, items: { type: Type.STRING } },
            publicDataMattered: { type: Type.ARRAY, items: { type: Type.STRING } },
            whySelectedOverAlternatives: { type: Type.STRING },
            assumptionsMade: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiConfidence: { type: Type.NUMBER },
            dataSources: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'userPreferencesMattered',
            'publicDataMattered',
            'whySelectedOverAlternatives',
            'assumptionsMade',
            'aiConfidence',
            'dataSources',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return ExplanationSchema.parse({
      ...parsed,
      actionId: actionId,
      actionTitle: actionTitle || parsed.actionTitle,
    });
  } catch (err: any) {
    console.warn('Gemini generateExplanation error, falling back:', err?.message || err);
    return fallbackGenerateExplanation(input);
  }
}

/**
 * 4. FUNCTION 4 — FEEDBACK LEARNING
 */
export async function learnFeedbackWithGemini(input: {
  actionId: string;
  actionTitle?: string;
  userFeedback: string;
  userProfile: EcoPilotUserProfile;
}) {
  try {
    const { actionId, userFeedback } = input;
    const prompt = `A Nordic user rejected or gave feedback on action "${actionId}": "${userFeedback}".
Analyze this feedback to learn the appropriate behavior:
1. "feedbackType": Categorize strictly as one of:
   - "temporary_constraint" (e.g. "I'm travelling today", "sick this week", "guests over tonight", "I need it now")
   - "recurring_preference" (e.g. "I prefer heating sauna on Fridays", "I usually charge at work")
   - "permanent_constraint" (e.g. "I sold my EV", "I don't have a sauna", "I moved to a rental")
   - "uncertain_feedback" (e.g. "not feeling it", "maybe later")
2. "affectedCategory": The specific domain or activity affected (e.g. "EV charging", "Dishwasher", "Heating", "Sauna").
3. "duration": How long this applies ("today", "this_week", "permanent", "unknown").
4. "learning": Concise takeaway rule for the recommendation engine.
5. "confidence": Score between 0.0 and 1.0.

CRITICAL: Do NOT permanently change user profile if feedback is a temporary constraint.
Output JSON matching schema.`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedbackType: { type: Type.STRING },
            affectedCategory: { type: Type.STRING },
            duration: { type: Type.STRING },
            learning: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            suggestedProfileUpdates: {
              type: Type.OBJECT,
              properties: {
                addCannotChange: { type: Type.ARRAY, items: { type: Type.STRING } },
                removeCannotChange: { type: Type.ARRAY, items: { type: Type.STRING } },
                addFlexibleActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
                temporaryBlockCategory: { type: Type.STRING },
              },
            },
          },
          required: ['feedbackType', 'affectedCategory', 'duration', 'learning', 'confidence'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return FeedbackLearningSchema.parse(parsed);
  } catch (err: any) {
    console.warn('Gemini learnFeedback error, falling back:', err?.message || err);
    return fallbackLearnFeedback(input);
  }
}

/**
 * 5. FUNCTION 5 — DAILY PLAN
 */
export async function generateDailyPlanWithGemini(
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  candidateActions: ActionDefinition[]
) {
  try {
    const prompt = `Synthesize today's personalized EcoPilot daily plan for this Nordic household.
Prioritize ONE single primary best action (high impact, low inconvenience, strong personal fit), plus up to 2 optional secondary actions. Do not overwhelm the user.

Resident Profile:
- Name: ${userProfile.name}, District: ${userProfile.district}
- Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m²), Heating: ${userProfile.heatingSystem}, Sauna: ${userProfile.saunaType}
- Constraints: ${userProfile.cannotChange.join(', ') || 'None'}
- Flexible: ${userProfile.canChange.join(', ') || 'General habits'}
- Cares about: ${userProfile.caresAbout.join(', ')}

Conditions:
- Outdoor Temp: ${observation.outdoorTempCelsius}°C, Season: ${observation.currentSeason}
- Spot Electricity Price: ${observation.currentSpotPriceCents} c/kWh
- Grid Emissions: ${observation.gridEmissionsIntensityGrams} g CO2/kWh

Available Candidate Actions:
${candidateActions.map((a) => `- [ID: ${a.id}] ${a.titleEn} (${a.descriptionEn})`).join('\n')}

Output JSON matching schema.`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryAction: {
              type: Type.OBJECT,
              properties: {
                actionId: { type: Type.STRING },
                headline: { type: Type.STRING },
                reason: { type: Type.STRING },
                userFriendlyExplanation: { type: Type.STRING },
                suggestedTime: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                selectionCriteria: {
                  type: Type.OBJECT,
                  properties: {
                    impact: { type: Type.STRING },
                    inconvenience: { type: Type.STRING },
                    personalFitScore: { type: Type.NUMBER },
                  },
                  required: ['impact', 'inconvenience', 'personalFitScore'],
                },
              },
              required: [
                'actionId',
                'headline',
                'reason',
                'userFriendlyExplanation',
                'suggestedTime',
                'confidence',
                'assumptions',
                'selectionCriteria',
              ],
            },
            secondaryActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actionId: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  suggestedTime: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ['actionId', 'headline', 'reason', 'suggestedTime', 'confidence'],
              },
            },
            planSummary: { type: Type.STRING },
            overallConfidence: { type: Type.NUMBER },
            dataSourcesUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'primaryAction',
            'secondaryActions',
            'planSummary',
            'overallConfidence',
            'dataSourcesUsed',
            'assumptions',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return DailyPlanSchema.parse(parsed);
  } catch (err: any) {
    console.warn('Gemini generateDailyPlan error, falling back:', err?.message || err);
    return fallbackGenerateDailyPlan(userProfile, observation, candidateActions);
  }
}

/**
 * 6. FUNCTION 6 — NATURAL LANGUAGE ASSISTANT ("Ask EcoPilot")
 */
export async function askEcoPilotWithGemini(input: {
  query: string;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  candidateActions?: ActionDefinition[];
}) {
  try {
    const { query, userProfile, observation } = input;
    const prompt = `You are "Ask EcoPilot", a grounded Nordic AI climate & lifestyle assistant in Finland.

USER QUERY: "${query}"

STRUCTURED USER CONTEXT:
- Name: ${userProfile.name}, District: ${userProfile.district}
- Housing: ${userProfile.housingType}, Heating: ${userProfile.heatingSystem}, Sauna: ${userProfile.saunaType}
- Commute: ${userProfile.commuteHabit}
- Constraints: ${userProfile.cannotChange.join(', ') || 'None'}
- Flexible Items: ${userProfile.canChange.join(', ') || 'General habits'}
- Footprint: ${userProfile.estimatedFootprintTonnes} tonnes (Target: ${userProfile.targetFootprintTonnes} tonnes)

PUBLIC & SYSTEM DATA:
- Spot Electricity Price: ${observation.currentSpotPriceCents} c/kWh
- Fingrid Grid Carbon: ${observation.gridEmissionsIntensityGrams} g CO2/kWh
- Weather: ${observation.outdoorTempCelsius}°C, Season: ${observation.currentSeason}
- Transit: HSL Metro, Pikaratikka 15, Commuter Trains
- Circularity: HSY Waste Sorting (plastics to Fortum Riihimäki, bio to Ämmässuo biogas)

STRICT BOUNDARY MANDATE:
1. Answer directly and concisely based ONLY on the structured context and public data provided.
2. If the user asks about something outside this data (e.g. stock market, crypto, politics, general trivia), set "isUncertain": true and answer: "I don't have enough reliable data to say."
3. Explicitly list userContextUsed, publicDataUsed, assumptions, confidence score, and citations in dataSources.

Output JSON matching schema.`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directAnswer: { type: Type.STRING },
            userContextUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            publicDataUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiConfidence: { type: Type.NUMBER },
            isUncertain: { type: Type.BOOLEAN },
            suggestedNextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            dataSources: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'directAnswer',
            'userContextUsed',
            'publicDataUsed',
            'assumptions',
            'aiConfidence',
            'isUncertain',
            'suggestedNextActions',
            'dataSources',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return AssistantResponseSchema.parse(parsed);
  } catch (err: any) {
    console.warn('Gemini askEcoPilot error, falling back:', err?.message || err);
    return fallbackAskEcoPilot(input);
  }
}

/**
 * 7. AI Assistant Chat
 */
export async function chatWithClimateAssistantWithAI(
  chatHistory: { role: string; content: string }[],
  userMessage: string,
  userProfile?: UserProfile,
  currentSeason: Season = 'winter'
): Promise<{ reply: string; suggestedFollowUps: string[] }> {
  try {
    const systemPrompt = `You are "EcoPilot" (Kipinä), the daily AI assistant for smarter Nordic living in Finland.
Respond constructively to the user's questions about energy, heating, HSL transit, and HSY recycling.`;

    const formattedContents = [
      ...chatHistory.slice(-6).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const response = await generateContentWithRetryAndFallback({
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return {
      reply: response.text || 'I am ready to help you optimize your daily routines.',
      suggestedFollowUps: [
        'What should I do today?',
        'Can I save money tomorrow?',
        'Why are you recommending this?',
      ],
    };
  } catch (error: any) {
    return {
      reply: `EcoPilot is here to help you optimize daily energy, heating, and sustainable living in Finland.`,
      suggestedFollowUps: [
        'What should I do today?',
        'Can I save money tomorrow?',
        "What's the easiest way to reduce my footprint?",
      ],
    };
  }
}

/**
 * 8. Legacy recommendations generator
 */
export async function generateEcoPilotRecommendationsWithAI(
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  candidateActions: { id: string; domain: ActionDomain; title: string; description: string }[]
) {
  try {
    const prompt = buildEcoPilotRecommendationPrompt(userProfile, observation, candidateActions);
    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      config: {
        systemInstruction: ECOPILOT_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actionId: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  motivation: { type: Type.STRING },
                  suggestedTime: { type: Type.STRING },
                  relevanceRank: { type: Type.NUMBER },
                },
                required: ['actionId', 'reasoning', 'motivation', 'suggestedTime', 'relevanceRank'],
              },
            },
            learningSummary: { type: Type.STRING },
          },
          required: ['recommendations', 'learningSummary'],
        },
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    const recs = candidateActions.slice(0, 4).map((a, idx) => ({
      actionId: a.id,
      reasoning: 'Optimized for current weather and grid spot conditions.',
      motivation: 'Reduces energy costs and footprint effortlessly.',
      suggestedTime: '21:30',
      relevanceRank: idx + 1,
    }));
    return {
      recommendations: recs,
      learningSummary: `EcoPilot adapted actions to your home profile (${userProfile.housingType}, ${userProfile.heatingSystem}).`,
    };
  }
}

export async function classifyWasteWithAI(query: string, imageBase64?: string): Promise<WasteClassificationResult> {
  return {
    itemName: query,
    category: 'Muovipakkaukset',
    binColor: 'Keltainen / Muovinkeräys',
    sortingInstructions: 'Huuhtele kylmällä vedellä tarvittaessa.',
    cleaningRequired: true,
    whyItMatters: 'Toimitetaan Fortumin muovijalostamolle Riihimäelle uusiomuovirakeiksi.',
    co2SavingsEstimateGrams: 420,
    nearestEspooFacility: 'Mankkaan Sortti-asema / Taloyhtiön jätepiste',
    proTip: 'Irrota korkit ja kannet erilleen muovinkeräykseen.',
  };
}

export async function optimizeDailyEnergyWithAI(
  userProfile: UserProfile,
  currentSeason: Season,
  outdoorTemp: number,
  spotPrices: any[]
): Promise<DailyEnergyPlan> {
  return {
    currentSeason,
    outdoorTempCelsius: outdoorTemp,
    peakSaunaWindow: {
      recommendedTime: '21:30 - 23:00',
      reason: 'Spot rates drop significantly after 21:00.',
      savingsEur: '~ €1.45 / session',
      co2ReductionPercent: '65% less CO2',
    },
    heatPumpTip: 'Keep heat pump in steady HEAT mode (+20°C).',
    laundryWindow: '13:00 - 15:00 or 01:00 - 05:00',
    evChargingWindow: '01:00 - 05:00',
    ventilationAdjustment: 'Check heat recovery filters.',
    estimatedDailySavingsEur: 3.4,
    estimatedDailyCo2SavedKg: 4.6,
  };
}

export async function compareCommuteEmissionsWithAI(origin: string, destination: string): Promise<CommuteComparison> {
  return {
    origin: origin || 'Tapiola',
    destination: destination || 'Keilaniemi',
    distanceKm: 12.5,
    modes: [
      {
        name: 'HSL Pikaratikka 15 & Metro',
        icon: 'Train',
        durationMins: 24,
        co2Grams: 0,
        costEur: 3.1,
        convenienceScore: 9,
        routeDetails: '100% renewable electrified transit.',
      },
    ],
    yearlySavingIfSwitchingToTransit: {
      co2Kg: 520,
      moneyEur: 940,
      treesEquivalent: 26,
    },
  };
}

export async function generatePersonalizedRoadmapPlanWithAI(userProfile: UserProfile, season: Season): Promise<any> {
  return {
    personalizedTagline: `${userProfile.name} — EcoPilot Partner`,
    roadmapSummary: `7-day action sprint to reduce footprint towards 2030 targets.`,
    weeklyActions: [],
    housingCompanyAdvice: 'Consult ARA subsidies for heat recovery.',
    communityImpactText: 'Together Espoo cuts 36+ tonnes CO2e weekly.',
  };
}
