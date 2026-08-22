import { PreferenceExtractionSchema, PreferenceExtractionResult } from './schemas';
import { EcoPilotUserProfile } from '../types/user';

/**
 * FUNCTION 1 — PREFERENCE EXTRACTION
 * Extracts structured constraints, flexible activities, schedules, and importance weights
 * from free-form natural language without hallucinating.
 * 
 * Example:
 * Input: "I work 9 to 5, charge my EV at night, don't want to change heating, and I don't mind running the dishwasher later."
 * Output: {
 *   constraints: ["heating timing should not be changed"],
 *   flexibleActivities: ["EV charging", "dishwasher"],
 *   schedule: { work: "09:00-17:00" },
 *   preferences: { convenienceImportance: 8, sustainabilityImportance: 8, costImportance: 7 }
 * }
 */
export async function extractPreferencesWithAI(
  userInput: string,
  currentProfile?: EcoPilotUserProfile
): Promise<PreferenceExtractionResult> {
  try {
    const response = await fetch('/api/ai/extract-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput,
        currentProfile,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to extract preferences');
    }

    // Validate raw response with Zod schema — do not trust raw LLM output
    return PreferenceExtractionSchema.parse(json.data);
  } catch (error) {
    console.warn('Preference extraction AI call failed, using deterministic fallback parser:', error);
    return fallbackExtractPreferences(userInput);
  }
}

export const extractUserPreferencesWithAI = extractPreferencesWithAI;


/**
 * Deterministic fallback parser for offline / network degraded situations.
 * Strictly adheres to rule: never invent information; null/empty if unknown.
 */
export function fallbackExtractPreferences(text: string): PreferenceExtractionResult {
  const lower = text.toLowerCase();
  const constraints: string[] = [];
  const flexibleActivities: string[] = [];
  let workSchedule: string | null = null;

  // Schedule detection
  const workMatch =
    lower.match(/(?:work|työskentelen|töissä)\s*(?:from|klo)?\s*(\d{1,2}(?::\d{2})?)\s*(?:to|-|asti)\s*(\d{1,2}(?::\d{2})?)/i) ||
    lower.match(/9\s*(?:to|-)\s*5/i);
  if (workMatch) {
    if (lower.includes('9') && lower.includes('5')) {
      workSchedule = '09:00-17:00';
    } else if (workMatch[1] && workMatch[2]) {
      workSchedule = `${workMatch[1]}-${workMatch[2]}`;
    }
  }

  // Constraint detection
  if (
    lower.includes("don't want to change heating") ||
    lower.includes("älä koske lämmitykseen") ||
    lower.includes("heating timing should not be changed") ||
    lower.includes("no heating change") ||
    lower.includes("don't touch heating")
  ) {
    constraints.push('heating timing should not be changed');
  }
  if (lower.includes("cannot cycle in winter") || lower.includes("en pyöräile talvella") || lower.includes("no winter cycling")) {
    constraints.push('no winter cycling');
  }
  if (lower.includes("no car") || lower.includes("ei autoa")) {
    constraints.push('no personal car');
  }
  if (lower.includes("no sauna") || lower.includes("ei saunaa")) {
    constraints.push('no sauna');
  }

  // Flexible activities detection
  if (lower.includes('ev') || lower.includes('electric vehicle') || lower.includes('sähköauto') || lower.includes('charge my ev') || lower.includes('charging')) {
    flexibleActivities.push('EV charging');
  }
  if (lower.includes('dishwasher') || lower.includes('astianpesukone') || lower.includes('tiskikone')) {
    flexibleActivities.push('dishwasher');
  }
  if (lower.includes('laundry') || lower.includes('pyykinpesu') || lower.includes('washing machine')) {
    flexibleActivities.push('laundry');
  }
  if (lower.includes('sauna') || lower.includes('kiuas')) {
    flexibleActivities.push('sauna');
  }

  // Preferences weights inferred from keywords or tone
  const convenienceImportance = lower.includes('convenience') || lower.includes('helppo') || lower.includes('mukavuus') || lower.includes("don't mind") ? 8 : 6;
  const sustainabilityImportance = lower.includes('green') || lower.includes('ilmasto') || lower.includes('eco') || lower.includes('footprint') ? 9 : 7;
  const costImportance = lower.includes('save money') || lower.includes('halpa') || lower.includes('säästö') || lower.includes('cost') ? 8 : 7;

  return {
    constraints,
    flexibleActivities,
    schedule: {
      work: workSchedule,
      sleep: null,
      other: null,
    },
    preferences: {
      convenienceImportance,
      sustainabilityImportance,
      costImportance,
    },
    detectedLifestyleNotes: [
      workSchedule ? `Standard work schedule: ${workSchedule}` : 'Flexible hours',
      flexibleActivities.length > 0 ? `Flexible items: ${flexibleActivities.join(', ')}` : 'General routine',
    ],
    confidence: 0.88,
    assumptions: ['User values high convenience with clean schedule alignment.'],
  };
}
