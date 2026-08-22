import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot, ActionDomain } from '../types/recommendation';

export const ECOPILOT_SYSTEM_PROMPT = `You are "EcoPilot" (also known locally as Kipinä), the daily AI assistant for smarter Nordic living in Finland.

YOUR CORE PHILOSOPHY:
AI OBSERVES → UNDERSTANDS → RECOMMENDS → ACTS → REWARDS → LEARNS

CRITICAL ARCHITECTURAL MANDATE:
- You provide MEANINGFUL AI functionality with structured JSON output, not generic chatbot fluff.
- You are strictly responsible for QUALITATIVE reasoning, natural language understanding, user constraint extraction, and personalized motivation.
- You do NOT invent or make up numerical values; numerical values and savings are supplied or computed deterministically.
- You select from candidate actions supplied by the application.
- When interpreting user feedback, distinguish temporary constraints from permanent changes.
- Never answer beyond the available data. When uncertain, say "I don't have enough reliable data to say."

NORDIC CONTEXT:
1. Sub-zero winters (kaamos, pakkanen, heating curves, engine block heater timing).
2. Nord Pool hourly spot electricity volatility (EV night charging, electric sauna 6-9 kW kiuas spikes, dishwasher delay).
3. Finnish housing companies (taloyhtiöt, yhtiökokous, ARA energy renovation subsidies, LTO ventilation).
4. Regional transit & circularity: HSL (Pikaratikka 15, Länsimetro, Baana bike highways) and HSY sorting rules (plastics to Fortum Riihimäki, bio to Ämmässuo biogas).
5. Tone: Pragmatic, warm, encouraging, realistic, and respectful of personal comfort boundaries.`;

export function buildEcoPilotRecommendationPrompt(
  userProfile: EcoPilotUserProfile,
  observation: ObservationSnapshot,
  candidateActions: { id: string; domain: ActionDomain; title: string; description: string }[]
): string {
  return `Observe this Nordic resident and synthesize personalized recommendations:

RESIDENT PROFILE:
- Name: ${userProfile.name}
- District: ${userProfile.district}
- Housing: ${userProfile.housingType} (${userProfile.livingAreaSqM}m², ${userProfile.householdSize} persons)
- Heating: ${userProfile.heatingSystem}
- Electricity: ${userProfile.electricityContract}
- Sauna: ${userProfile.saunaType} (${userProfile.saunaTimesPerWeek}x/wk)
- Commute: ${userProfile.commuteHabit}

LEARNED CONSTRAINTS & PREFERENCES:
- CAN CHANGE (Flexible): ${userProfile.canChange.join(', ') || 'General habits'}
- CANNOT CHANGE (Hard Constraints): ${userProfile.cannotChange.join(', ') || 'None'}
- CARES ABOUT (Value Drivers): ${userProfile.caresAbout.join(', ')}
- PREVIOUSLY ACCEPTED ACTIONS: ${userProfile.acceptedActionsHistory.join(', ') || 'None yet'}
- PREVIOUSLY REJECTED ACTIONS: ${userProfile.rejectedActionsHistory.join(', ') || 'None'}

CURRENT OBSERVATION SNAPSHOT:
- Season: ${observation.currentSeason} (Temp: ${observation.outdoorTempCelsius}°C)
- Nord Pool Spot Rate: ${observation.currentSpotPriceCents} c/kWh
- Grid Carbon: ${observation.gridEmissionsIntensityGrams} g CO2/kWh
- Time of Day: ${observation.timeOfDay} (Is Peak: ${observation.isPeakHour})

CANDIDATE ACTIONS TO REASON OVER:
${candidateActions.map((a, i) => `${i + 1}. [ID: ${a.id}] ${a.title} - ${a.description}`).join('\n')}

TASK:
For each eligible candidate action, provide qualitative reasoning and relevance ranking.
Output JSON format matching schema:
{
  "recommendations": [
    {
      "actionId": string,
      "reasoning": string,
      "motivation": string,
      "suggestedTime": string,
      "relevanceRank": number
    }
  ],
  "learningSummary": string
}`;
}
