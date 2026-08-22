"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  CheckCircle2,
  Compass,
  Flame,
  Gift,
  Lock,
  MoreHorizontal,
  RotateCw,
  Trash2,
  Utensils,
  Zap,
} from "lucide-react";
import type { Co2LogCategory, Co2LogEntry, Co2DailyTotal, UserProfile } from "@/lib/ecopilot/types";
import { fetchCo2LogsAPI, deleteCo2LogAPI, fetchRewardsAPI, redeemRewardAPI, type RewardsSummary } from "@/lib/ecopilot/profileClient";
import { PROTOTYPE_REWARDS, PROTOTYPE_REWARDS_DISCLAIMER, getRewardTierStatus } from "@/lib/ecopilot/rewards";

interface TrackerRewardsViewProps {
  userProfile: UserProfile;
  isFinnish: boolean;
}

const CATEGORY_META: Record<Co2LogCategory, { icon: typeof Flame; fi: string; en: string }> = {
  heating: { icon: Flame, fi: "Lämmitys", en: "Heating" },
  transport: { icon: Compass, fi: "Liikenne", en: "Transport" },
  waste: { icon: RotateCw, fi: "Jäte", en: "Waste" },
  energy: { icon: Zap, fi: "Sähkö", en: "Energy" },
  food: { icon: Utensils, fi: "Ruoka", en: "Food" },
  other: { icon: MoreHorizontal, fi: "Muu", en: "Other" },
};

const HISTORY_DAYS = 30;

/**
 * Illustrative only — NOT the user's real history. Real accounts are too
 * new to show a meaningful multi-week trend, so this is a clearly-labeled
 * sample trend purely to preview what the chart looks like once populated.
 */
const SAMPLE_WEEKLY_TREND = [
  { label: "4 wks ago", points: 18, co2SavedKg: 2.1 },
  { label: "3 wks ago", points: 34, co2SavedKg: 4.6 },
  { label: "2 wks ago", points: 27, co2SavedKg: 3.2 },
  { label: "Last week", points: 52, co2SavedKg: 6.9 },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface HistoryRow {
  id: string;
  date: string;
  description: string;
  category?: Co2LogCategory;
  co2Kg?: number;
  points?: number;
  kind: "log" | "redeem";
}

export function TrackerRewardsView({ userProfile, isFinnish }: TrackerRewardsViewProps) {
  const [entries, setEntries] = useState<Co2LogEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState<Co2DailyTotal[]>([]);
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [logs, rewardsSummary] = await Promise.all([fetchCo2LogsAPI(HISTORY_DAYS), fetchRewardsAPI()]);
      setEntries(logs.entries);
      setDailyTotals(logs.dailyTotals);
      setRewards(rewardsSummary);
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

  const handleDeleteLog = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteCo2LogAPI(id);
      await load();
    } catch (err) {
      console.error(err);
      await load();
    }
  };

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

  const today = todayIso();
  const barsByDate = new Map(dailyTotals.map((d) => [d.date, d.netCo2Kg]));
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const todayTotal = barsByDate.get(today) ?? 0;
  const last7Total = last7Dates.reduce((sum, date) => sum + (barsByDate.get(date) ?? 0), 0);

  const tierStatus = rewards ? getRewardTierStatus(rewards.balance) : null;
  const redeemedIds = new Set(rewards?.redemptions.map((r) => r.reward_id) ?? []);

  // Real, combined history: every CO2 log entry, enriched with the EcoCredits
  // transaction it earned (via co2_log_id), plus standalone redemption transactions.
  const txByLogId = new Map((rewards?.transactions ?? []).filter((tx) => tx.co2_log_id).map((tx) => [tx.co2_log_id as string, tx]));
  const redemptionOnlyTx = (rewards?.transactions ?? []).filter((tx) => !tx.co2_log_id);

  const historyRows: HistoryRow[] = [
    ...entries.map((e) => ({
      id: e.id,
      date: e.occurredOn,
      description: e.description,
      category: e.category,
      co2Kg: e.co2Kg,
      points: txByLogId.get(e.id)?.amount,
      kind: "log" as const,
    })),
    ...redemptionOnlyTx.map((tx) => ({
      id: tx.id,
      date: tx.created_at.slice(0, 10),
      description: tx.reason,
      points: tx.amount,
      kind: "redeem" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const maxSampleValue = Math.max(...SAMPLE_WEEKLY_TREND.map((w) => w.points));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 border border-rose-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
              <Activity className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              {isFinnish ? "Päästöseuranta & Palkinnot" : "CO2 Tracker & Rewards"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? "Hiilijalanjälki ja EcoCreditit yhdessä paikassa" : "Your Carbon Ledger and EcoCredits, in One Place"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? "Sovelluksen muut työkalut (Kuittiskanneri, Entä jos..., AI-Ilmastoapuri) kirjaavat tapahtumat tähän automaattisesti."
              : "Other tools in the app (Receipt Scanner, What If?, AI Copilot) log entries here automatically."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs text-center shrink-0 min-w-[140px]">
          <div className="text-3xl font-black text-amber-400">{rewards?.balance ?? 0}</div>
          <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">EcoCredits</div>
        </div>
      </div>

      {/* CO2 stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label={isFinnish ? "Tänään" : "Today"} valueKg={todayTotal} isFinnish={isFinnish} />
        <StatTile label={isFinnish ? "Viimeiset 7 päivää" : "Last 7 days"} valueKg={last7Total} isFinnish={isFinnish} />
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              {isFinnish ? "Säästetty yhteensä" : "Lifetime Saved"}
            </div>
            <div className="text-xl font-black text-slate-100">-{userProfile.savedCo2Kg.toFixed(1)} kg</div>
          </div>
        </div>
      </div>

      {/* Tier progress */}
      {tierStatus && (
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
      )}

      {/* Sample weekly trend chart — explicitly labeled as demo data, not real history */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            {isFinnish ? "Viikkotrendi: EcoCreditit & säästetty CO2" : "Weekly Trend: EcoCredits & CO2 Saved"}
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold">
            {isFinnish ? "🎲 Esimerkkidata" : "🎲 Sample data"}
          </span>
        </div>
        <div className="flex items-end gap-3 h-32">
          {SAMPLE_WEEKLY_TREND.map((week) => (
            <div key={week.label} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-600">+{week.points}</span>
              <div className="w-full flex flex-col justify-end h-20">
                <div
                  style={{ height: `${Math.max(6, (week.points / maxSampleValue) * 100)}%` }}
                  className="w-full bg-amber-400 rounded-t-md"
                />
              </div>
              <span className="text-[9px] text-slate-400 font-medium">{week.label}</span>
              <span className="text-[9px] text-emerald-600 font-bold">-{week.co2SavedKg} kg</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 italic">
          {isFinnish
            ? "Havainnollistava esimerkki — ei tilisi todellista historiaa."
            : "Illustrative only — not your account's real history."}
        </p>
      </div>

      {errorMessage && <p className="text-rose-600 text-xs font-medium">{errorMessage}</p>}

      {/* Reward catalog */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          {isFinnish ? "Palkintovalikoima" : "Reward Catalog"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROTOTYPE_REWARDS.map((reward) => {
            const alreadyClaimed = redeemedIds.has(reward.id);
            const canAfford = (rewards?.balance ?? 0) >= reward.creditsCost;
            const claimedRecord = rewards?.redemptions.find((r) => r.reward_id === reward.id);

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
                    <span>{canAfford ? (isFinnish ? "Lunasta" : "Redeem") : isFinnish ? "Ei tarpeeksi pisteitä" : "Not enough credits"}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 italic">{PROTOTYPE_REWARDS_DISCLAIMER}</p>
      </div>

      {/* Unified CO2 + EcoCredits history */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900">
          {isFinnish ? "Päästö- ja Palkintohistoria" : "CO2 & Rewards History"}
        </h3>

        {historyRows.length === 0 && !isLoading ? (
          <p className="text-xs text-slate-400">{isFinnish ? "Ei tapahtumia vielä." : "No history yet."}</p>
        ) : (
          <div className="space-y-2">
            {historyRows.slice(0, 25).map((row) => {
              const Icon = row.category ? CATEGORY_META[row.category].icon : Gift;
              const isSaving = row.kind === "log" && (row.co2Kg ?? 0) < 0;

              return (
                <div key={`${row.kind}-${row.id}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{row.description}</div>
                      <div className="text-[10px] text-slate-500">{row.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {row.kind === "log" && row.co2Kg !== undefined && (
                      <span className={`text-xs font-black ${isSaving ? "text-emerald-600" : "text-rose-600"}`}>
                        {isSaving ? "" : "+"}
                        {row.co2Kg.toFixed(1)} kg
                      </span>
                    )}
                    {row.points !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                          row.points >= 0
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {row.points >= 0 ? "+" : ""}
                        {row.points} pts
                      </span>
                    )}
                    {row.kind === "log" && (
                      <button
                        onClick={() => handleDeleteLog(row.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={isFinnish ? "Poista" : "Delete"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, valueKg, isFinnish }: { label: string; valueKg: number; isFinnish: boolean }) {
  const isSaving = valueKg < 0;
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`text-xl font-black ${isSaving ? "text-emerald-600" : valueKg > 0 ? "text-rose-600" : "text-slate-900"}`}>
          {isSaving ? "" : valueKg > 0 ? "+" : ""}
          {valueKg.toFixed(1)} kg
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-400">{isFinnish ? "netto CO2" : "net CO2"}</span>
    </div>
  );
}
