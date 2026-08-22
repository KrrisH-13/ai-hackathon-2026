import { EcoCreditTransaction } from './user';
export type { PrototypeReward } from '../rewards/rewardsEngine';
export { PROTOTYPE_REWARDS } from '../rewards/rewardsEngine';

export interface Badge {
  id: string;
  name: string;
  nameFi: string;
  description: string;
  descriptionFi: string;
  icon: string;
  category: 'energy' | 'mobility' | 'circular' | 'streak' | 'mastery';
  unlocked: boolean;
  unlockedAt?: string;
  creditsBonus: number;
}

export interface RewardPerk {
  id: string;
  title: string;
  titleFi: string;
  partner: string;
  costCredits: number;
  category: 'hsl_ticket' | 'sauna_pass' | 'rinki_voucher' | 'tree_planting' | 'local_cafe';
  description: string;
  descriptionFi: string;
  redeemed: boolean;
}

export interface EcoPilotRewardsState {
  currentBalance: number;
  lifetimeEarned: number;
  currentStreakDays: number;
  tierName: string;
  tierLevel: number;
  nextTierThreshold: number;
  badges: Badge[];
  history: EcoCreditTransaction[];
  availablePerks: RewardPerk[];
}
