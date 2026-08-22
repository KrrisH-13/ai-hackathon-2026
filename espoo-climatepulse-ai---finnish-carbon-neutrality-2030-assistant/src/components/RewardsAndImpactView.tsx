import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  Zap,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowRight,
  Gift,
  Clock,
  Database,
  Calculator,
  X,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { EcoPilotUserProfile, PrototypeRedeemedReward, SavedGoal } from '../types/user';
import {
  PROTOTYPE_REWARDS,
  PrototypeReward,
  FUTURE_PARTNER_CATEGORIES,
  getUserRewardStatus,
  redeemPrototypeReward,
} from '../rewards/rewardsEngine';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';
import { ObservationSnapshot } from '../types/recommendation';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';

interface RewardsAndImpactViewProps {
  userProfile: EcoPilotUserProfile;
  isFinnish: boolean;
  onUpdateProfile: (updated: EcoPilotUserProfile) => void;
  onResetToAlex?: () => void;
  onOpenDataSources?: () => void;
  onOpenCalculationEngine?: () => void;
  onNavigateToToday?: () => void;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

export const RewardsAndImpactView: React.FC<RewardsAndImpactViewProps> = ({
  userProfile,
  isFinnish,
  onUpdateProfile,
  onResetToAlex,
  onOpenDataSources,
  onOpenCalculationEngine,
  onNavigateToToday,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [selectedReward, setSelectedReward] = useState<PrototypeReward | null>(null);
  const [justClaimedReward, setJustClaimedReward] = useState<{
    reward: PrototypeReward;
    redemption: PrototypeRedeemedReward;
    remainingCredits: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [copiedVoucher, setCopiedVoucher] = useState<boolean>(false);
  const [isRewardsWhatIfOpen, setIsRewardsWhatIfOpen] = useState<boolean>(false);
  const [whatIfTargetReward, setWhatIfTargetReward] = useState<PrototypeReward | null>(null);
  const [isRewardItemWhatIfOpen, setIsRewardItemWhatIfOpen] = useState<boolean>(false);

  const observation = getCurrentObservationSnapshot('winter', 21);
  const rewardStatus = getUserRewardStatus(userProfile);
  const redeemedList = userProfile.redeemedRewards || [];
  const transactions = userProfile.ecoCreditTransactions || [];

  // Calculate total completed flexible actions (from accepted list or transactions)
  const totalCompletedActions = Math.max(
    12,
    userProfile.acceptedActionsHistory.length +
      (userProfile.categoryStats
        ? Object.values(userProfile.categoryStats).reduce(
            (acc: number, curr: { accepted: number; rejected: number }) => acc + curr.accepted,
            0
          )
        : 0)
  );

  const handleClaimReward = (reward: PrototypeReward) => {
    setErrorMessage(null);
    const res = redeemPrototypeReward(userProfile, reward.id);
    if (!res.success || !res.updatedProfile || !res.redeemed) {
      setErrorMessage(res.error || 'Could not claim reward.');
      return;
    }

    onUpdateProfile(res.updatedProfile);
    setJustClaimedReward({
      reward,
      redemption: res.redeemed,
      remainingCredits: res.updatedProfile.ecoCredits,
    });
  };

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedVoucher(true);
    setTimeout(() => setCopiedVoucher(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-800">
      {/* 1. Header & Reset Demo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              REWARDS & IMPACT
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isFinnish ? 'Palkinnot ja todellinen arjen vaikutus' : 'Prototype Rewards & Measured Impact'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? 'Palkinnot & Vaikutus' : 'Rewards & Impact'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            {isFinnish
              ? `Olet ansainnut nämä pisteet ${totalCompletedActions} kestävästä arjen teosta.`
              : `You earned these from ${totalCompletedActions} sustainable actions.`}
          </p>
        </div>

        {onResetToAlex && (
          <button
            type="button"
            onClick={onResetToAlex}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            title="Reset Alex Demo Profile to 146 EcoCredits"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isFinnish ? 'Palauta Alex (Demo: 146 pts)' : 'Reset Demo (146 pts)'}</span>
          </button>
        )}
      </div>

      {/* 2. Top Stats Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* EcoCredits Balance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1 relative">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>🌱</span>
              <span>{isFinnish ? 'EcoCredits Saldo' : 'EcoCredits Balance'}</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
            {userProfile.ecoCredits}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-amber-800 font-medium">
              {isFinnish ? 'Prototyyppipisteet' : 'Prototype points'}
            </span>
            <ContextualWhatIfButton
              onClick={() => setIsRewardsWhatIfOpen(true)}
              label="[🔮 What if?]"
              variant="pill"
              size="xs"
              isFinnish={isFinnish}
            />
          </div>
        </div>

        {/* Estimated CO2 Impact */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>🌍</span>
            <span>{isFinnish ? 'Vältetty CO₂' : 'CO₂ Impact'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {userProfile.savedCo2Kg.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isFinnish ? 'Deterministinen laskenta' : 'Estimated reduction'}
          </div>
        </div>

        {/* Estimated € Savings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>💶</span>
            <span>{isFinnish ? 'Säästetty rahana' : 'Est. Savings'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            €{userProfile.savedEurTotal.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">
            {isFinnish ? 'Spot-siirroista & matkoista' : 'From smart timing'}
          </div>
        </div>

        {/* Flexible Actions Completed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>⚡</span>
            <span>{isFinnish ? 'Joustoja tehty' : 'Actions Completed'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalCompletedActions}
          </div>
          <div className="text-[10px] text-slate-400">
            {isFinnish ? 'Vahvistettua valintaa' : 'Small sustainable habits'}
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 shadow-xs">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>{isFinnish ? 'Huomautus:' : 'Notice:'}</strong>{' '}
          {isFinnish
            ? 'EcoCredits ovat arjen tekoihin kannustavia prototyyppipisteitä. Niillä ei ole rahallista arvoa, eivätkä ne ole virallisia päästöoikeuksia tai kompensointeja.'
            : 'EcoCredits are prototype reward points based on estimated actions. They have no monetary value and are not verified carbon credits.'}
        </p>
      </div>

      {/* Error Message if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Reward Catalogue Section */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">
                {isFinnish ? 'Saatavilla olevat edut' : 'Available Rewards'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isFinnish
                ? 'Lunasta prototyyppietuja kertyneillä EcoCredits-pisteilläsi.'
                : 'Redeem prototype reward vouchers with your accumulated EcoCredits.'}
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5 self-start sm:self-auto">
            <span>🌱</span>
            <span>{userProfile.ecoCredits} pts available</span>
          </div>
        </div>

        {/* Catalogue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROTOTYPE_REWARDS.map((reward) => {
            const isClaimed = redeemedList.some((r) => r.rewardId === reward.id);
            const claimedRecord = redeemedList.find((r) => r.rewardId === reward.id);
            const canAfford = userProfile.ecoCredits >= reward.creditsCost;
            const creditsNeeded = Math.max(0, reward.creditsCost - userProfile.ecoCredits);

            return (
              <div
                key={reward.id}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                  isClaimed
                    ? 'bg-slate-50/80 border-slate-200 opacity-90'
                    : canAfford
                    ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200/80 opacity-75'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                        {reward.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {isFinnish ? reward.titleFi : reward.title}
                        </h4>
                        <span className="text-xs font-black text-amber-800 font-mono">
                          {reward.creditsCost} EcoCredits
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isClaimed ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        {isFinnish ? 'Lunastettu ✓' : 'Claimed ✓'}
                      </span>
                    ) : canAfford ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isFinnish ? 'Saatavilla' : 'Available'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {isFinnish ? `Tarvitset ${creditsNeeded} lisää` : `Need ${creditsNeeded} more`}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isFinnish ? reward.descriptionFi : reward.description}
                  </p>

                  <p className="text-[10px] text-slate-400 font-medium">
                    {reward.prototypeDisclaimer}
                  </p>
                </div>

                {/* Card Action Button */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                  {isClaimed ? (
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="font-mono text-[11px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {claimedRecord?.voucherCode}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isFinnish ? 'Käytetty' : 'Redeemed'}
                      </span>
                    </div>
                  ) : canAfford ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => handleClaimReward(reward)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{isFinnish ? 'Lunasta etu' : 'Redeem'}</span>
                      </button>
                      <ContextualWhatIfButton
                        onClick={() => {
                          setWhatIfTargetReward(reward);
                          setIsRewardItemWhatIfOpen(true);
                        }}
                        label="[🔮 What if?]"
                        variant="secondary"
                        size="sm"
                        isFinnish={isFinnish}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed text-center"
                      >
                        {isFinnish ? `Tarvitset ${creditsNeeded} pistettä lisää` : `Need ${creditsNeeded} more`}
                      </button>
                      <ContextualWhatIfButton
                        onClick={() => {
                          setWhatIfTargetReward(reward);
                          setIsRewardItemWhatIfOpen(true);
                        }}
                        label="[🔮 What if?]"
                        variant="secondary"
                        size="sm"
                        isFinnish={isFinnish}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. "How did I earn this?" Transaction History */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {isFinnish ? 'Miten ansaitsin nämä pisteet?' : 'How did I earn this?'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {isFinnish ? 'Perustuu arvioituihin toimiin' : 'Based on estimated actions'}
          </span>
        </div>

        <div className="space-y-2.5">
          {transactions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              {isFinnish ? 'Ei vielä kirjattuja tapahtumia.' : 'No transactions recorded yet.'}
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      tx.type === 'earned'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tx.type === 'earned' ? '+' : '−'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isFinnish && tx.titleFi ? tx.titleFi : tx.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{tx.dateLabel}</span>
                      {tx.co2SavedKg && (
                        <span>• ↓ ~{tx.co2SavedKg} kg CO₂</span>
                      )}
                      {tx.voucherCode && (
                        <span className="font-mono text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {tx.voucherCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`font-mono font-bold text-sm ${
                    tx.type === 'earned' ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
          <span>{isFinnish ? 'Kaikki päästölaskelmat ovat arvioita eivätkä edusta sertifioituja päästöoikeuksia.' : 'All emissions figures are estimated models and do not represent verified certified carbon reductions.'}</span>
        </div>
      </div>

      {/* 5. Future Partner Rewards Concept (Section 10) */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              FUTURE CONCEPT
            </span>
            <h3 className="font-bold text-sm text-white">
              {isFinnish ? 'Tulevat kumppaniedut' : 'Future Partner Rewards'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {isFinnish ? 'Ei aktiivisia kaupallisia sopimuksia' : 'Demonstration roadmap only'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isFinnish
            ? 'Tulevaisuudessa EcoCredits-järjestelmä voidaan integroida suoraan kaupungin ja yritysten kestävyysohjelmiin:'
            : 'In future releases, EcoCredits can connect with local sustainable business perks and civic incentives:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {FUTURE_PARTNER_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                <span>{cat.icon}</span>
                <span>{isFinnish ? cat.titleFi : cat.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isFinnish ? cat.examplesFi : cat.examples}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Responsible AI & Transparency Expandable ("How EcoCredits work") */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                {isFinnish ? 'Miten EcoCredits-pisteet toimivat?' : 'How EcoCredits work'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isFinnish ? 'Vastuullinen tekoäly ja laskennan läpinäkyvyys' : 'Responsible AI and calculation integrity'}
              </p>
            </div>
          </div>
          {isHowItWorksOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isHowItWorksOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs text-slate-600 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="leading-relaxed">
                &ldquo;EcoCredits are prototype reward points designed to encourage sustainable behaviour. They are calculated from predefined application rules and estimated environmental impact. They are not verified carbon credits, financial assets, offsets or proof of certified emissions reductions.&rdquo;
              </p>
              <p className="leading-relaxed font-semibold text-slate-800">
                &ldquo;CO₂ and savings estimates are calculated using structured application data, not generated by Gemini.&rdquo;
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {onOpenCalculationEngine && (
                <button
                  type="button"
                  onClick={onOpenCalculationEngine}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isFinnish ? '[Näytä laskentakaavat]' : '[Show calculation formulas]'}</span>
                </button>
              )}
              {onOpenDataSources && (
                <button
                  type="button"
                  onClick={onOpenDataSources}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Database className="w-3.5 h-3.5 text-blue-700" />
                  <span>{isFinnish ? '[Näytä tietolähteet]' : '[Show data sources & APIs]'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. REDEMPTION CONFIRMATION MODAL */}
      {justClaimedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 text-slate-800"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-3xl shadow-xs">
                🎉
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {isFinnish ? 'Etu lunastettu!' : 'Reward claimed'}
              </h3>
              <p className="text-sm font-bold text-slate-700">
                {isFinnish ? justClaimedReward.reward.titleFi : justClaimedReward.reward.title}
              </p>
            </div>

            {/* Credit Transaction Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{isFinnish ? 'Käytetyt pisteet:' : 'EcoCredits used:'}</span>
                <span className="font-mono font-bold text-rose-700">
                  −{justClaimedReward.reward.creditsCost} pts
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                <span>{isFinnish ? 'Jäljellä oleva saldo:' : 'Remaining balance:'}</span>
                <span className="font-mono text-emerald-700 text-sm">
                  {justClaimedReward.remainingCredits} EcoCredits
                </span>
              </div>
            </div>

            {/* Voucher Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                {isFinnish ? 'Prototyyppikoodi' : 'Prototype voucher'}
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-black text-lg tracking-wider text-emerald-900 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-xs">
                  {justClaimedReward.redemption.voucherCode}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyVoucher(justClaimedReward.redemption.voucherCode)}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition"
                  title="Copy code"
                >
                  {copiedVoucher ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-emerald-800 font-medium">
                &ldquo;This is a demonstration reward and has no monetary value.&rdquo;
              </p>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setJustClaimedReward(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              {isFinnish ? 'Valmis' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* What-If Modal for Overall Rewards */}
      <ContextualWhatIfModal
        isOpen={isRewardsWhatIfOpen}
        onClose={() => setIsRewardsWhatIfOpen(false)}
        context="rewards"
        userProfile={userProfile}
        observation={observation}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />

      {/* What-If Modal for Specific Selected Reward Item */}
      <ContextualWhatIfModal
        isOpen={isRewardItemWhatIfOpen}
        onClose={() => {
          setIsRewardItemWhatIfOpen(false);
          setWhatIfTargetReward(null);
        }}
        context="rewards-item"
        userProfile={userProfile}
        observation={observation}
        contextData={{
          rewardTitle: whatIfTargetReward?.title,
          creditsCost: whatIfTargetReward?.creditsCost,
          creditsNeeded: whatIfTargetReward ? Math.max(0, whatIfTargetReward.creditsCost - userProfile.ecoCredits) : 0,
        }}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </div>
  );
};
