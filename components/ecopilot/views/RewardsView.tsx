"use client";

import { useEffect, useState } from "react";
import { Award, Gift, RotateCw, Lock, CheckCircle2 } from "lucide-react";
import { PROTOTYPE_REWARDS, PROTOTYPE_REWARDS_DISCLAIMER, getRewardTierStatus } from "@/lib/ecopilot/rewards";
import { fetchRewardsAPI, redeemRewardAPI, type RewardsSummary } from "@/lib/ecopilot/profileClient";

interface RewardsViewProps {
  isFinnish: boolean;
}

export function RewardsView({ isFinnish }: RewardsViewProps) {
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRewardsAPI();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    setErrorMessage(null);
    try {
      await redeemRewardAPI(rewardId);
      await load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to redeem");
    } finally {
      setRedeemingId(null);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="h-52 flex items-center justify-center text-slate-400 text-xs gap-2">
          <RotateCw className="w-4 h-4 animate-spin" />
          {isFinnish ? "Ladataan..." : "Loading..."}
        </div>
      </div>
    );
  }

  const tierStatus = getRewardTierStatus(summary.balance);
  const redeemedIds = new Set(summary.redemptions.map((r) => r.reward_id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/60 border border-amber-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            {isFinnish ? "EcoCredits & Palkinnot" : "EcoCredits & Rewards"}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? "Ansaitse ja lunasta EcoCreditit" : "Earn and Redeem EcoCredits"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? "Joka kerta kun kirjaat CO2-säästön Päästöseurannassa, ansaitset EcoCrediittejä. 10 pistettä per säästetty kg CO2."
              : "Every CO2-saving entry you log in the tracker earns real EcoCredits — 10 points per kg CO2 saved."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs text-center shrink-0 min-w-[140px]">
          <div className="text-3xl font-black text-amber-400">{summary.balance}</div>
          <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">EcoCredits</div>
        </div>
      </div>

      {/* Tier progress */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tierStatus.currentTier.badge}</span>
            <div>
              <div className="text-sm font-extrabold text-slate-900">{tierStatus.currentTier.tierName}</div>
              <div className="text-[11px] text-slate-500">
                {tierStatus.nextTier
                  ? isFinnish
                    ? `${tierStatus.creditsToNextTier} pistettä seuraavaan tasoon (${tierStatus.nextTier.tierName})`
                    : `${tierStatus.creditsToNextTier} credits to ${tierStatus.nextTier.tierName}`
                  : isFinnish
                    ? "Korkein taso saavutettu"
                    : "Highest tier reached"}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${tierStatus.progressToNextTierPercent}%` }} />
        </div>
      </div>

      {errorMessage && <p className="text-rose-600 text-xs font-medium">{errorMessage}</p>}

      {/* Reward catalog */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">{isFinnish ? "Palkintovalikoima" : "Reward Catalog"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROTOTYPE_REWARDS.map((reward) => {
            const alreadyClaimed = redeemedIds.has(reward.id);
            const canAfford = summary.balance >= reward.creditsCost;
            const claimedRecord = summary.redemptions.find((r) => r.reward_id === reward.id);

            return (
              <div key={reward.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{reward.icon}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                      {reward.creditsCost} pts
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{reward.title}</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{reward.description}</p>
                </div>

                {alreadyClaimed ? (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {claimedRecord?.voucher_code}
                  </div>
                ) : (
                  <button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!canAfford || redeemingId === reward.id}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    {redeemingId === reward.id ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : canAfford ? (
                      <Gift className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {canAfford ? (isFinnish ? "Lunasta" : "Redeem") : isFinnish ? "Ei tarpeeksi pisteitä" : "Not enough credits"}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 italic">{PROTOTYPE_REWARDS_DISCLAIMER}</p>
      </div>

      {/* Transaction history */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">{isFinnish ? "Tapahtumat" : "Transaction History"}</h3>
        {summary.transactions.length === 0 ? (
          <p className="text-xs text-slate-400">{isFinnish ? "Ei tapahtumia vielä." : "No transactions yet."}</p>
        ) : (
          <div className="space-y-2">
            {summary.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{tx.reason}</div>
                  <div className="text-[10px] text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs font-black shrink-0 ${tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
