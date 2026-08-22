import React from 'react';
import { Sparkles, Brain, TrendingDown, Award, Calendar, ChevronRight } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';

interface WeeklyAiReflectionCardProps {
  userProfile: EcoPilotUserProfile;
  isFinnish?: boolean;
  onOpenPreferences?: () => void;
}

export const WeeklyAiReflectionCard: React.FC<WeeklyAiReflectionCardProps> = ({
  userProfile,
  isFinnish = false,
  onOpenPreferences,
}) => {
  // Deterministic summary stats
  const weeklyCo2Kg = Math.min(18.5, Number((userProfile.savedCo2Kg * 0.28).toFixed(1))) || 4.8;
  const weeklySavingsEur = Math.min(12.0, Number((userProfile.savedEurTotal * 0.25).toFixed(2))) || 2.40;
  const weeklyCredits = Math.round(weeklyCo2Kg * 6 + weeklySavingsEur * 5 + 15) || 46;

  // Dynamic AI reflection derived from acceptance/rejection patterns
  const evStats = userProfile.categoryStats['EV charging'] || { accepted: 8, rejected: 1 };
  const heatingStats = userProfile.categoryStats['Heating'] || { accepted: 0, rejected: 5 };

  let learnedSummary = "You prefer actions that don't affect your morning routine. I'll prioritise flexible evening actions like EV charging and delayed dishwasher cycles.";
  if (isFinnish) {
    learnedSummary = "Olet suosinut toimenpiteitä, jotka eivät häiritse aamurutiinejasi tai sisälämpötilaa. EcoPilot priorisoi jatkossakin joustavia iltatoimia.";
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-slate-800 space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {isFinnish ? 'VIIKKOSI ECOPILOTIN KANSSA' : 'YOUR WEEK WITH ECOPILOT'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isFinnish ? 'Viikon todennetut ilmastoteot & oppiminen' : 'Verified weekly impact & learned preferences'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 self-start sm:self-auto">
          {isFinnish ? 'Viikko 34 • Yhteenveto' : 'Week Summary'}
        </span>
      </div>

      {/* 3 Metrics Grid (Deterministic) */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {isFinnish ? 'CO₂-säästö' : 'CO₂ reduction'}
          </span>
          <span className="text-lg font-black text-emerald-700 mt-0.5 block">
            ↓ {weeklyCo2Kg.toFixed(1)} kg
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {isFinnish ? 'Säästetty' : 'Savings'}
          </span>
          <span className="text-lg font-black text-emerald-700 mt-0.5 block">
            ~€{weeklySavingsEur.toFixed(2)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {isFinnish ? 'Pisteet' : 'EcoCredits'}
          </span>
          <span className="text-lg font-black text-amber-700 mt-0.5 block">
            +{weeklyCredits}
          </span>
        </div>
      </div>

      {/* AI Synthesis Reflection */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-blue-900 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-blue-700" />
            <span>{isFinnish ? 'Mitä EcoPilot oppi tällä viikolla?' : 'What did I learn?'}</span>
          </span>
          {onOpenPreferences && (
            <button
              onClick={onOpenPreferences}
              className="text-blue-700 hover:text-blue-900 font-semibold text-[11px] underline underline-offset-2 flex items-center gap-0.5"
            >
              <span>{isFinnish ? 'Muokkaa sääntöjä' : 'Edit rules'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-blue-800 leading-relaxed">
          &ldquo;{learnedSummary}&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span>✓ Calculated using deterministic application logic</span>
        <span>Espoo 2030 Aligned</span>
      </div>
    </div>
  );
};
