import { FeedbackLearningSchema, FeedbackLearningResult } from './schemas';
import { EcoPilotUserProfile } from '../types/user';

export interface FeedbackLearnerInput {
  actionId: string;
  actionTitle?: string;
  userFeedback: string;
  userProfile: EcoPilotUserProfile;
}

/**
 * FUNCTION 4 — FEEDBACK LEARNING
 * Interprets user feedback upon recommendation rejection or modification.
 * 
 * Strictly distinguishes:
 * - temporary_constraint (e.g. "I'm travelling today", "I need it now") -> short-lived block, DO NOT mutate permanent profile
 * - recurring_preference (e.g. "I always sauna on Saturdays", "I prefer charging at work")
 * - permanent_constraint (e.g. "I sold my EV", "I don't have a sauna") -> updates profile constraints
 * - uncertain_feedback -> safe logging without hard filtering
 * 
 * Validated via Zod schema.
 */
export async function learnFromFeedbackWithAI(
  input: FeedbackLearnerInput
): Promise<FeedbackLearningResult> {
  try {
    const response = await fetch('/api/ai/learn-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to learn from feedback');
    }

    // Validate with Zod — do not trust raw LLM output
    return FeedbackLearningSchema.parse(json.data);
  } catch (error) {
    console.warn('AI feedback learning failed, using deterministic fallback interpreter:', error);
    return fallbackLearnFeedback(input);
  }
}

/**
 * Deterministic fallback interpreter for user feedback.
 */
export function fallbackLearnFeedback(input: FeedbackLearnerInput): FeedbackLearningResult {
  const { userFeedback, actionId } = input;
  const lower = (userFeedback || '').toLowerCase();
  const category = determineCategoryFromActionId(actionId);

  // 1. Temporary constraints (e.g. "I'm travelling today", "I need it now", "Not convenient right now")
  if (
    lower.includes('today') ||
    lower.includes('tänään') ||
    lower.includes('travelling') ||
    lower.includes('traveling') ||
    lower.includes('matkoilla') ||
    lower.includes('reissussa') ||
    lower.includes('need it now') ||
    lower.includes('tarvitsen nyt') ||
    lower.includes('not convenient') ||
    lower.includes('ei sovi tänään') ||
    lower.includes('sick') ||
    lower.includes('kiire') ||
    lower.includes('busy tonight')
  ) {
    let specificLearning = `Do not recommend ${category} today due to temporary schedule or travel constraint.`;
    if (lower.includes('travelling') || lower.includes('traveling')) {
      specificLearning = `${category} is temporarily unavailable today because you're travelling.`;
    } else if (lower.includes('need it now')) {
      specificLearning = `${category} is needed immediately today; temporary schedule override applied.`;
    }

    return {
      feedbackType: 'temporary_constraint',
      affectedCategory: category,
      duration: 'today',
      learning: specificLearning,
      confidence: 0.95,
      suggestedProfileUpdates: {
        temporaryBlockCategory: category,
      },
    };
  }

  // 2. Permanent constraints (e.g. "I sold my EV", "I don't have a sauna", "I moved to a rental")
  if (
    lower.includes('never') ||
    lower.includes('koskaan') ||
    lower.includes('sold') ||
    lower.includes('myin') ||
    lower.includes("don't have") ||
    lower.includes('ei ole') ||
    lower.includes('no sauna') ||
    lower.includes('no car') ||
    lower.includes('no ev') ||
    lower.includes('renting') ||
    lower.includes('vuokralla')
  ) {
    const suggestedAdds: string[] = [];
    if (lower.includes('sauna')) suggestedAdds.push('no_sauna');
    if (lower.includes('car') || lower.includes('auto') || lower.includes('ev')) suggestedAdds.push('no_car');
    if (lower.includes('rent') || lower.includes('vuokra')) suggestedAdds.push('renting_no_renovations');

    return {
      feedbackType: 'permanent_constraint',
      affectedCategory: category,
      duration: 'permanent',
      learning: `Permanently exclude actions related to ${category}.`,
      confidence: 0.96,
      suggestedProfileUpdates: {
        addCannotChange: suggestedAdds.length > 0 ? suggestedAdds : undefined,
      },
    };
  }

  // 3. Recurring preferences (e.g. "I always sauna on Fridays", "I prefer laundry on weekends")
  if (
    lower.includes('usually') ||
    lower.includes('yleensä') ||
    lower.includes('weekend') ||
    lower.includes('viikonloppu') ||
    lower.includes('prefer') ||
    lower.includes('mieluummin') ||
    lower.includes('always') ||
    lower.includes('aina')
  ) {
    return {
      feedbackType: 'recurring_preference',
      affectedCategory: category,
      duration: 'recurring',
      learning: `User prefers custom recurring schedule for ${category}.`,
      confidence: 0.88,
    };
  }

  // 4. Default: uncertain feedback
  return {
    feedbackType: 'uncertain_feedback',
    affectedCategory: category,
    duration: 'unknown',
    learning: `Feedback recorded for flexibility scoring without changing profile constraints.`,
    confidence: 0.7,
  };
}

function determineCategoryFromActionId(actionId: string): string {
  if (actionId.includes('ev') || actionId.includes('charge')) return 'EV charging';
  if (actionId.includes('dishwasher')) return 'Dishwasher';
  if (actionId.includes('laundry')) return 'Laundry';
  if (actionId.includes('sauna')) return 'Sauna';
  if (actionId.includes('temp') || actionId.includes('heat')) return 'Heating';
  if (actionId.includes('transit') || actionId.includes('pikaratikka')) return 'Transit & Commute';
  if (actionId.includes('waste') || actionId.includes('plastic')) return 'Waste & Recycling';
  if (actionId.includes('protein') || actionId.includes('food')) return 'Nordic Diet';
  return 'Daily Action';
}
