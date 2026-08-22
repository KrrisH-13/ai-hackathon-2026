/**
 * Reward catalog and tier thresholds — ported from the expanded prototype's
 * rewardsEngine.ts, English-only wording to match the rest of the app.
 * Purely static reference data; balances/redemptions are real and persisted
 * (see supabase/migrations/20260823130000_ecopilot_rewards.sql).
 */

export interface RewardTier {
  tierName: string;
  minCredits: number;
  badge: string;
}

export const REWARD_TIERS: RewardTier[] = [
  { tierName: "Nordic Seedling", minCredits: 0, badge: "🌱" },
  { tierName: "Clean Pioneer", minCredits: 100, badge: "🌲" },
  { tierName: "Espoo Climate Champion", minCredits: 500, badge: "👑" },
];

export interface PrototypeReward {
  id: string;
  icon: string;
  title: string;
  creditsCost: number;
  category: "mobility" | "cafe" | "climate" | "lifestyle" | "circular";
  description: string;
}

export const PROTOTYPE_REWARDS: PrototypeReward[] = [
  {
    id: "climate-action",
    icon: "🌍",
    title: "Plant a Tree (Symbolic)",
    creditsCost: 50,
    category: "climate",
    description: "A symbolic pledge toward Espoo's urban tree-planting initiative.",
  },
  {
    id: "local-cafe",
    icon: "☕",
    title: "Local Café Shoutout",
    creditsCost: 75,
    category: "cafe",
    description: "Unlock a shoutout card for a local Espoo café on your profile.",
  },
  {
    id: "mobility",
    icon: "🚆",
    title: "HSL Champion Badge",
    creditsCost: 100,
    category: "mobility",
    description: "A badge recognizing sustained public-transit commuting.",
  },
  {
    id: "nordic-lifestyle",
    icon: "🧖",
    title: "Sauna Optimizer Badge",
    creditsCost: 150,
    category: "lifestyle",
    description: "A badge for consistently scheduling sauna heating to off-peak hours.",
  },
  {
    id: "circular-economy",
    icon: "♻️",
    title: "Circular Economy Champion",
    creditsCost: 200,
    category: "circular",
    description: "A badge for sustained, careful HSY waste sorting.",
  },
];

/** No real voucher/monetary value — these are prototype reward points, not verified carbon credits. */
export const PROTOTYPE_REWARDS_DISCLAIMER = "Prototype reward points — not financial or verified carbon credits.";

export interface RewardTierStatus {
  currentTier: RewardTier;
  nextTier: RewardTier | null;
  creditsToNextTier: number;
  progressToNextTierPercent: number;
}

export function getRewardTierStatus(creditsBalance: number): RewardTierStatus {
  let currentTier = REWARD_TIERS[0];
  for (const tier of REWARD_TIERS) {
    if (creditsBalance >= tier.minCredits) currentTier = tier;
  }

  const currentIndex = REWARD_TIERS.indexOf(currentTier);
  const nextTier = REWARD_TIERS[currentIndex + 1] ?? null;

  if (!nextTier) {
    return { currentTier, nextTier: null, creditsToNextTier: 0, progressToNextTierPercent: 100 };
  }

  const creditsToNextTier = Math.max(0, nextTier.minCredits - creditsBalance);
  const progressToNextTierPercent = Math.min(
    100,
    Math.round(((creditsBalance - currentTier.minCredits) / (nextTier.minCredits - currentTier.minCredits)) * 100)
  );

  return { currentTier, nextTier, creditsToNextTier, progressToNextTierPercent };
}
