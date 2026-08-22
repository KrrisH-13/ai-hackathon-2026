import { EcoPilotUserProfile, EcoCreditTransaction, PrototypeRedeemedReward } from '../types/user';
import { calculateEcoCredits, ECOCREDITS_DISCLAIMER } from '../climate/calculations';

export interface RewardTier {
  tierName: string;
  minCredits: number;
  badge: string;
  perks: string[];
}

export const REWARD_TIERS: RewardTier[] = [
  {
    tierName: 'Nordic Seedling (Alku)',
    minCredits: 0,
    badge: '🌱',
    perks: ['Daily smart recommendations', 'Real-time Nord Pool price insights'],
  },
  {
    tierName: 'Clean Pioneer (Edelläkävijä)',
    minCredits: 100,
    badge: '🌲',
    perks: ['Unlock dynamic sauna planner', '5% Streak EcoCredit boost'],
  },
  {
    tierName: 'Espoo Climate Champion (Mestari)',
    minCredits: 500,
    badge: '👑',
    perks: ['City of Espoo Climate Leader badge', 'Share verified community impact score'],
  },
];

export interface PrototypeReward {
  id: string;
  icon: string;
  title: string;
  titleFi: string;
  creditsCost: number;
  category: 'mobility' | 'cafe' | 'climate' | 'lifestyle' | 'circular';
  description: string;
  descriptionFi: string;
  prototypeDisclaimer: string;
}

export const PROTOTYPE_REWARDS: PrototypeReward[] = [
  {
    id: 'reward-climate-action',
    icon: '🌳',
    title: 'Climate Action Contribution',
    titleFi: 'Ilmastotekolahjoitus',
    creditsCost: 50,
    category: 'climate',
    description: 'Demonstration allocation supporting local urban biodiversity and meadow preservation.',
    descriptionFi: 'Demonstraatiolahjoitus paikallisen luonnon monimuotoisuuden ja niittyjen tukemiseen.',
    prototypeDisclaimer: 'Prototype reward — no real voucher or monetary value.',
  },
  {
    id: 'reward-local-cafe',
    icon: '☕',
    title: 'Local Café Benefit',
    titleFi: 'Lähikahvilan etu',
    creditsCost: 75,
    category: 'cafe',
    description: 'Demonstration voucher for plant-based or oat milk coffee beverage at local venues.',
    descriptionFi: 'Demonstraatioetu kasvipohjaiseen tai kauramaitokahviin paikallisissa kahviloissa.',
    prototypeDisclaimer: 'Prototype reward — no real voucher or monetary value.',
  },
  {
    id: 'reward-mobility',
    icon: '🚌',
    title: 'Mobility Benefit',
    titleFi: 'Kestävän liikkumisen etu',
    creditsCost: 100,
    category: 'mobility',
    description: 'Demonstration voucher for sustainable public and active transit options.',
    descriptionFi: 'Demonstraatioetu kestävään julkiseen ja kevyeen liikenteeseen.',
    prototypeDisclaimer: 'Prototype reward — no real voucher or monetary value.',
  },
  {
    id: 'reward-nordic-lifestyle',
    icon: '🔥',
    title: 'Nordic Lifestyle Benefit',
    titleFi: 'Pohjoismaisen arjen etu',
    creditsCost: 150,
    category: 'lifestyle',
    description: 'Demonstration voucher for energy-efficient sauna hours and public wellness sessions.',
    descriptionFi: 'Demonstraatioetu energiatehokkaisiin sauna- ja hyvinvointivuoroihin.',
    prototypeDisclaimer: 'Prototype reward — no real voucher or monetary value.',
  },
  {
    id: 'reward-circular-economy',
    icon: '♻️',
    title: 'Circular Economy Benefit',
    titleFi: 'Kiertotalous- ja korjausetu',
    creditsCost: 200,
    category: 'circular',
    description: 'Demonstration voucher for appliance repair, tool sharing, or secondhand items.',
    descriptionFi: 'Demonstraatioetu laitekorjauksiin, lainaamoihin tai kierrätystorille.',
    prototypeDisclaimer: 'Prototype reward — no real voucher or monetary value.',
  },
];

export interface FuturePartnerCategory {
  title: string;
  titleFi: string;
  icon: string;
  examples: string;
  examplesFi: string;
}

export const FUTURE_PARTNER_CATEGORIES: FuturePartnerCategory[] = [
  {
    title: 'Public Transport & Shared Mobility',
    titleFi: 'Julkinen liikenne ja yhteiskäyttö',
    icon: '🚆',
    examples: 'Zero-emission city bikes, tram, metro & shared EV mobility credits',
    examplesFi: 'Päästöttömät kaupunkipyörät, ratikka, metro ja yhteiskäyttösähköautot',
  },
  {
    title: 'Local Businesses & Cafés',
    titleFi: 'Paikalliset yritykset ja kahvilat',
    icon: '🥐',
    examples: 'Discounts on plant-based menus, seasonal produce & oat drinks',
    examplesFi: 'Alennuksia kasvisannoksista, satokauden tuotteista ja kaurajuomista',
  },
  {
    title: 'Repair & Reuse Services',
    titleFi: 'Korjaus- ja kiertotalouspalvelut',
    icon: '🔧',
    examples: 'Electronics maintenance, tool lending libraries & clothing repair',
    examplesFi: 'Elektroniikkahuolto, työkalulainaamot ja vaatekorjaukset',
  },
  {
    title: 'Urban Climate Initiatives',
    titleFi: 'Kaupunkiluonnon ilmastohankkeet',
    icon: '🌱',
    examples: 'Community carbon sink gardens, pollinator meadows & tree planting',
    examplesFi: 'Yhteisölliset hiilinielupuutarhat, pölyttäjäniityt ja puunistutukset',
  },
  {
    title: 'Energy Company Flexibility Programmes',
    titleFi: 'Energiayhtiöiden kysyntäjoustot',
    icon: '⚡',
    examples: 'Dynamic spot rebate boosts & automated grid stabilization perks',
    examplesFi: 'Dynaamiset spot-hyvitykset ja kantaverkon vakautuksen lisäedut',
  },
];

export function getUserRewardStatus(userProfile: EcoPilotUserProfile) {
  const credits = userProfile.ecoCredits;
  let currentTier = REWARD_TIERS[0];

  for (const tier of REWARD_TIERS) {
    if (credits >= tier.minCredits) {
      currentTier = tier;
    }
  }

  const nextTierIndex = REWARD_TIERS.findIndex((t) => t.tierName === currentTier.tierName) + 1;
  const nextTier = REWARD_TIERS[nextTierIndex] || null;
  const creditsToNext = nextTier ? Math.max(0, nextTier.minCredits - credits) : 0;
  const progressToNext = nextTier
    ? Math.min(100, Math.round(((credits - currentTier.minCredits) / (nextTier.minCredits - currentTier.minCredits)) * 100))
    : 100;

  // Find next unredeemed reward target (e.g. 200 pts for Circular Economy if balance is 146)
  const redeemedIds = (userProfile.redeemedRewards || []).map((r) => r.rewardId);
  const nextAvailableReward = PROTOTYPE_REWARDS.find(
    (r) => !redeemedIds.includes(r.id) && r.creditsCost > credits
  );
  const targetRewardCost = nextAvailableReward ? nextAvailableReward.creditsCost : 200;
  const creditsUntilNextReward = Math.max(0, targetRewardCost - credits);

  return {
    currentTier,
    nextTier,
    creditsToNext,
    progressToNext,
    targetRewardCost,
    creditsUntilNextReward,
    disclaimer: ECOCREDITS_DISCLAIMER,
  };
}

export function redeemPrototypeReward(
  userProfile: EcoPilotUserProfile,
  rewardId: string
): { success: boolean; updatedProfile?: EcoPilotUserProfile; redeemed?: PrototypeRedeemedReward; error?: string } {
  const reward = PROTOTYPE_REWARDS.find((r) => r.id === rewardId);
  if (!reward) {
    return { success: false, error: 'Reward not found' };
  }

  if (userProfile.ecoCredits < reward.creditsCost) {
    return {
      success: false,
      error: `Not enough EcoCredits. Need ${reward.creditsCost - userProfile.ecoCredits} more.`,
    };
  }

  const existingRedemptions = userProfile.redeemedRewards || [];
  if (existingRedemptions.some((r) => r.rewardId === rewardId)) {
    return { success: false, error: 'This reward has already been claimed.' };
  }

  // Generate deterministic/clean demo voucher code: ECO-DEMO-XXXX
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const voucherCode = `ECO-DEMO-${randomSuffix}`;
  const nowIso = new Date().toISOString();

  const newRedeemed: PrototypeRedeemedReward = {
    id: `redemption-${Date.now()}`,
    rewardId: reward.id,
    rewardTitle: reward.title,
    creditsUsed: reward.creditsCost,
    voucherCode,
    redeemedAt: nowIso,
  };

  const newTransaction: EcoCreditTransaction = {
    id: `tx-redeem-${Date.now()}`,
    title: `Redeemed: ${reward.title}`,
    titleFi: `Lunastettu: ${reward.titleFi}`,
    amount: -reward.creditsCost,
    dateLabel: 'Today',
    timestamp: nowIso,
    category: reward.category,
    type: 'redeemed',
    voucherCode,
  };

  const currentTransactions = userProfile.ecoCreditTransactions || [];

  const updatedProfile: EcoPilotUserProfile = {
    ...userProfile,
    ecoCredits: Math.max(0, userProfile.ecoCredits - reward.creditsCost),
    redeemedRewards: [newRedeemed, ...existingRedemptions],
    ecoCreditTransactions: [newTransaction, ...currentTransactions],
  };

  return {
    success: true,
    updatedProfile,
    redeemed: newRedeemed,
  };
}
