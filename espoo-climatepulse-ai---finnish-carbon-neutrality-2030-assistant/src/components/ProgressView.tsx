import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  TrendingDown,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Zap,
  Leaf,
  Heart,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  Gift,
} from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { getUserRewardStatus } from '../rewards/rewardsEngine';
import { WeeklyAiReflectionCard } from './WeeklyAiReflectionCard';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';

interface ProgressViewProps {
  userProfile: EcoPilotUserProfile;
  isFinnish?: boolean;
  onOpenPreferences?: () => void;
  onResetPreferences?: () => void;
  onOpenRewards?: () => void;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  userProfile,
  isFinnish = false,
  onOpenPreferences,
  onResetPreferences,
  onOpenRewards,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const rewardStatus = getUserRewardStatus(userProfile);
  const observation = getCurrentObservationSnapshot('winter', 21);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-800">
      {/* 1. Header & Positive Streak */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PROGRESS & HABITS
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {isFinnish ? 'Pienistä teoista pysyviksi rutiineiksi' : 'Small everyday shifts, compound impact'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isFinnish ? `Edistymisesi, ${userProfile.name}` : `Your Progress, ${userProfile.name}`}
        </h2>
        <p className="text-xs text-slate-500 max-w-xl">
          {isFinnish
            ? 'EcoPilot juhlistaa jokaista pientä tekoa. Emme rankaise väliin jääneistä päivistä — arki on aina etusijalla.'
            : "EcoPilot celebrates every small action. We never penalize missed days — sustainable living is about consistency, not perfection."}
        </p>
      </div>

      {/* 2. Positive Streak Banner (No punishment) */}
      <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {isFinnish ? `${userProfile.streakDays || 4} päivää pieniä ilmastotekoja` : `${userProfile.streakDays || 4} days of small actions`}
              </h3>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              {isFinnish
                ? 'Jokainen hyväksytty valinta vahvistaa oppimisprofiiliasi ja säästää sähkölaskua.'
                : 'Every small action reinforces your learned preferences and cuts grid emissions.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-center shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              {isFinnish ? 'Pisteet' : 'EcoCredits'}
            </span>
            <span className="text-base font-black text-amber-700 font-mono">
              {userProfile.ecoCredits}
            </span>
          </div>
        </div>
      </div>

      {/* 2b. Compact EcoCredits Card (Section 6) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌱</span>
            <h3 className="font-extrabold text-sm text-slate-900">
              {isFinnish ? 'EcoCredits Palkinnot' : 'EcoCredits'}
            </h3>
            <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              {userProfile.ecoCredits} / 200
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {isFinnish
              ? `${Math.max(0, 200 - userProfile.ecoCredits)} pistettä seuraavaan palkintoon`
              : `${Math.max(0, 200 - userProfile.ecoCredits)} credits until your next reward`}
          </p>
        </div>

        {onOpenRewards && (
          <button
            type="button"
            onClick={onOpenRewards}
            className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Gift className="w-3.5 h-3.5 text-amber-700" />
            <span>{isFinnish ? '[Katso palkinnot & lunasta]' : '[View Rewards]'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
          </button>
        )}
      </div>

      {/* 3. Total Impact Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isFinnish ? 'Yhteensä vältetty CO₂' : 'Total CO₂ Reduced'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {userProfile.savedCo2Kg.toFixed(1)} kg
          </div>
          <div className="text-[11px] text-slate-500">
            {isFinnish ? 'Vastaa ~2 400 km sähköautolla' : 'Equivalent to ~2,400 km in an EV'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isFinnish ? 'Säästetty rahana' : 'Total € Saved'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            €{userProfile.savedEurTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">
            {isFinnish ? 'Pörssisähkön hintapiikkien siirroista' : 'From spot price optimization & transit'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isFinnish ? 'Arvioitu jalanjälki' : 'Footprint Goal'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {userProfile.estimatedFootprintTonnes} <span className="text-sm font-normal text-slate-500">t / v</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            {isFinnish ? `Tavoite 2030: ${userProfile.targetFootprintTonnes} t / v` : `Target 2030: ${userProfile.targetFootprintTonnes} t / yr`}
          </div>
        </div>
      </div>

      {/* 4. Compact Weekly AI Reflection */}
      <WeeklyAiReflectionCard
        userProfile={userProfile}
        isFinnish={isFinnish}
        onOpenPreferences={onOpenPreferences}
      />

      {/* 4b. Contextual What-If: Next Week Habit Forecast */}
      <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {isFinnish ? 'Mitä jos jatkan tätä tahtia ensi viikolla?' : 'What if I maintain this pace next week?'}
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            {isFinnish
              ? 'Ennusta ensi viikon säästöt, EcoCredits-kertymä ja hiilidioksidipudotus valitsemillasi 2–4 viikkotottumuksella.'
              : 'Project next week’s € savings, EcoCredits earnings, and emissions reduction with 2–4 habits.'}
          </p>
        </div>

        <ContextualWhatIfButton
          onClick={() => setIsWhatIfOpen(true)}
          label={isFinnish ? '[🔮 Mitä jos?]' : '[🔮 What if?]'}
          variant="secondary"
          size="md"
          isFinnish={isFinnish}
        />
      </div>

      {/* 5. Completed Actions History */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {isFinnish ? 'Viimeisimmät toteutuneet teot' : 'Recent Completed Actions'}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {userProfile.acceptedActionsHistory.length} {isFinnish ? 'tekoa' : 'actions'}
          </span>
        </div>

        {userProfile.feedbackLog.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            {isFinnish ? 'Ei vielä kirjattuja tekoja.' : 'No recorded actions yet.'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {userProfile.feedbackLog.slice(0, 5).map((log, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                      log.accepted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {log.accepted ? '✓' : '✕'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {log.category || log.actionId}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {log.userNote || (log.accepted ? 'Completed' : 'Rejected')}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleDateString(isFinnish ? 'fi-FI' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContextualWhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        context="weekly"
        userProfile={userProfile}
        observation={observation}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </div>
  );
};
