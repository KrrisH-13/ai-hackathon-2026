export type WhatIfContextType =
  | 'today'
  | 'green-window'
  | 'rewards'
  | 'rewards-item'
  | 'transport'
  | 'grocery'
  | 'recycling'
  | 'energy'
  | 'mobility'
  | 'progress'
  | 'general';

export interface WhatIfPresetOption {
  id: string;
  label: string;
  labelFi?: string;
  description?: string;
  descriptionFi?: string;
  icon?: string;
}

export interface WhatIfComparisonRow {
  label: string;
  labelFi?: string;
  co2: string;
  cost: string;
  convenienceOrTime: string;
  isHighlighted?: boolean;
}

export interface WhatIfScenarioResult {
  context: WhatIfContextType;
  scenarioTitle: string;
  scenarioTitleFi?: string;
  selectedOptionId: string;

  // Deterministic Impact Metrics
  co2DiffKg: number; // e.g. -0.9 or +0.3
  costDiffEur: number; // e.g. -0.65 or +0.45
  co2Display: string; // e.g. "↓ ~0.9 kg CO₂" or "+0.3 kg CO₂"
  costDisplay: string; // e.g. "€0.65 cheaper" or "+€0.45"
  effort: 'Easy' | 'Medium' | 'High';
  convenienceRating: number; // 1 to 5 stars

  // AI Explanation & Trade-off Synthesis
  aiExplanation: string;
  aiExplanationFi?: string;

  // Optional Comparison Matrix
  comparisonTable?: {
    columns: string[];
    rows: WhatIfComparisonRow[];
  };

  // Transparency, Formulas, Sources
  formulaUsed: string;
  dataSourceUsed: string;
  responsibleDisclaimer: string;

  // Goal & Reward specific
  projectedDaysToNextReward?: number | null;
  actionsNeededSummary?: string[];
  goalSaveable?: boolean;
  savedGoalPayload?: {
    title: string;
    titleFi?: string;
    category: string;
    scenario: string;
    estimatedCo2KgMonth: number;
    estimatedEurMonth: number;
    effort: 'Easy' | 'Medium' | 'High';
  };
}
