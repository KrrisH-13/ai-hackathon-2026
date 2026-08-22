import { z } from 'zod';

/**
 * Zod Schemas for EcoPilot Gemini AI Core Layer
 * Ensures runtime validation of all model outputs — never trust raw LLM output.
 */

// ============================================================================
// FUNCTION 1 — PREFERENCE EXTRACTION SCHEMA
// ============================================================================
export const PreferenceExtractionSchema = z.object({
  constraints: z.array(z.string()).describe('Negative or hard/soft constraints stated by the user'),
  flexibleActivities: z.array(z.string()).describe('Activities the user explicitly marked as flexible or adaptable'),
  schedule: z
    .object({
      work: z.string().nullable().optional().describe('Extracted work hours or routine, e.g. "09:00-17:00"'),
      sleep: z.string().nullable().optional().describe('Extracted sleep hours or night period'),
      other: z.string().nullable().optional().describe('Other recurring daily activities'),
    })
    .nullable()
    .optional(),
  preferences: z.object({
    convenienceImportance: z.number().min(0).max(10).nullable().optional().describe('Scale 1-10 or null if unknown'),
    sustainabilityImportance: z.number().min(0).max(10).nullable().optional().describe('Scale 1-10 or null if unknown'),
    costImportance: z.number().min(0).max(10).nullable().optional().describe('Scale 1-10 or null if unknown'),
  }),
  detectedLifestyleNotes: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).default(0.9),
  assumptions: z.array(z.string()).optional().default([]),
});

export type PreferenceExtractionResult = z.infer<typeof PreferenceExtractionSchema>;

// ============================================================================
// FUNCTION 2 — RECOMMENDATION REASONING SCHEMA
// ============================================================================
export const RecommendationReasoningSchema = z.object({
  selectedActionId: z.string().describe('ID of the single most appropriate candidate action from supplied candidate actions'),
  reason: z.string().describe('Precise explanation of why this candidate was selected over others based on current context'),
  userFriendlyExplanation: z.string().describe('Clear, inspiring language for the end user'),
  confidence: z.number().min(0).max(1).describe('Model confidence score between 0.0 and 1.0'),
  assumptions: z.array(z.string()).describe('Assumptions made about user routine, home state, or conditions'),
  dataSourcesConsidered: z.array(z.string()).optional().default([]),
});

export type RecommendationReasoningResult = z.infer<typeof RecommendationReasoningSchema>;

// ============================================================================
// FUNCTION 3 — EXPLANATION SCHEMA ("Why am I seeing this?")
// ============================================================================
export const ExplanationSchema = z.object({
  actionId: z.string().optional(),
  actionTitle: z.string().optional(),
  userPreferencesMattered: z.array(z.string()).describe('Specific user constraints/preferences that led to this selection'),
  publicDataMattered: z.array(z.string()).describe('Live Fingrid/Nord Pool/Weather/HSL data points that influenced this recommendation'),
  whySelectedOverAlternatives: z.string().describe('Comparison explaining why other candidate actions were deprioritized'),
  assumptionsMade: z.array(z.string()).describe('Key assumptions made by AI about user availability or equipment'),
  aiConfidence: z.number().min(0).max(1).describe('AI confidence score'),
  dataSources: z.array(z.string()).describe('Authoritative sources cited (e.g. Fingrid, Nord Pool, HSL, HSY)'),
});

export type ExplanationResult = z.infer<typeof ExplanationSchema>;

// ============================================================================
// FUNCTION 4 — FEEDBACK LEARNING SCHEMA
// ============================================================================
export const FeedbackLearningSchema = z.object({
  feedbackType: z.enum([
    'temporary_constraint',
    'recurring_preference',
    'permanent_constraint',
    'uncertain_feedback',
  ]).describe('Classification of rejection/feedback reason'),
  affectedCategory: z.string().describe('Category or activity affected (e.g., EV charging, Sauna, Heating, Dishwasher)'),
  duration: z.string().describe('Duration of constraint, e.g. "today", "this_week", "permanent", "unknown"'),
  learning: z.string().describe('Concise takeaway rule for the recommendation engine'),
  confidence: z.number().min(0).max(1).default(0.85),
  suggestedProfileUpdates: z
    .object({
      addCannotChange: z.array(z.string()).optional(),
      removeCannotChange: z.array(z.string()).optional(),
      addFlexibleActivities: z.array(z.string()).optional(),
      temporaryBlockCategory: z.string().optional(),
    })
    .optional(),
});

export type FeedbackLearningResult = z.infer<typeof FeedbackLearningSchema>;

// ============================================================================
// FUNCTION 5 — DAILY PLAN SCHEMA
// ============================================================================
export const DailyPlanSchema = z.object({
  primaryAction: z.object({
    actionId: z.string().describe('ID of the single top recommendation'),
    headline: z.string().describe('Action headline, e.g. "🚗 EV Charging" or "🧺 Dishwasher"'),
    reason: z.string().describe('Why this is the #1 opportunity today'),
    userFriendlyExplanation: z.string().describe('Inspiring, clear user-facing description'),
    suggestedTime: z.string().describe('Suggested execution time, e.g. "Charge after 22:00" or "Run after 21:00"'),
    confidence: z.number().min(0).max(1),
    assumptions: z.array(z.string()),
    selectionCriteria: z.object({
      impact: z.enum(['high', 'medium', 'low']),
      inconvenience: z.enum(['low', 'medium', 'high']),
      personalFitScore: z.number().min(0).max(100),
    }),
  }),
  secondaryActions: z
    .array(
      z.object({
        actionId: z.string(),
        headline: z.string(),
        reason: z.string(),
        suggestedTime: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .max(2)
    .default([]),
  planSummary: z.string().describe('1-sentence overarching summary of today’s strategy'),
  overallConfidence: z.number().min(0).max(1),
  dataSourcesUsed: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type DailyPlanResult = z.infer<typeof DailyPlanSchema>;

// ============================================================================
// FUNCTION 6 — NATURAL LANGUAGE ASSISTANT SCHEMA ("Ask EcoPilot")
// ============================================================================
export const AssistantResponseSchema = z.object({
  directAnswer: z.string().describe('Grounded, helpful answer adhering strictly to available data'),
  answer: z.string().optional().describe('Alias for directAnswer'),
  userContextUsed: z.array(z.string()).describe('User profile attributes consulted'),
  publicDataUsed: z.array(z.string()).describe('Public grid/weather/transit metrics consulted'),
  assumptions: z.array(z.string()).describe('Assumptions made'),
  aiConfidence: z.number().min(0).max(1).describe('Confidence score'),
  isUncertain: z.boolean().describe('True if query is outside domain or data is insufficient'),
  suggestedNextActions: z.array(z.string()).describe('1-3 relevant prompt suggestions'),
  dataSources: z.array(z.string()).describe('Citations for Fingrid, Nord Pool, HSL, HSY, etc.'),
  dataSourcesUsed: z.array(z.string()).optional().default([]),
  constraintsRespected: z.array(z.string()).optional().default([]),
});

export type AssistantResponseResult = z.infer<typeof AssistantResponseSchema>;
export type AssistantAnswerResult = AssistantResponseResult;
