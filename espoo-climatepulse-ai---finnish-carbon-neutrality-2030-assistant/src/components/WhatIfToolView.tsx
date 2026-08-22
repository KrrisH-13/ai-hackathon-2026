import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Train,
  Apple,
  Home,
  Flame,
  CheckCircle2,
  BookmarkPlus,
  Info,
  TrendingDown,
  Layers,
  HelpCircle,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { Season } from '../types/climate';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import {
  calculateWhatIfScenario,
  getWhatIfPresetsForContext,
  WhatIfScenarioResult,
  WhatIfContextType,
} from '../services/whatIfEngine';
import { ECO_TOOLS_REGISTRY } from '../tools/toolsRegistry';

interface WhatIfToolViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onBackToTools: () => void;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

export const WhatIfToolView: React.FC<WhatIfToolViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  onBackToTools,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [selectedContext, setSelectedContext] = useState<WhatIfContextType>('today');
  const [selectedOptionId, setSelectedOptionId] = useState<string>('charge_20_00');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const observation = getCurrentObservationSnapshot(currentSeason || 'winter', 21);
  const toolMeta = ECO_TOOLS_REGISTRY.find((t) => t.id === 'what-if')!;

  const presetOptions = getWhatIfPresetsForContext(selectedContext, undefined, isFinnish);

  // If selectedOptionId is not in current presets, reset to first preset
  const activeOptionId = presetOptions.some((p) => p.id === selectedOptionId)
    ? selectedOptionId
    : presetOptions[0]?.id || 'charge_20_00';

  const result: WhatIfScenarioResult = calculateWhatIfScenario(
    selectedContext,
    activeOptionId,
    userProfile,
    observation,
    undefined,
    undefined,
    isFinnish
  );

  const handleSaveAsGoal = () => {
    if (onSaveGoal) {
      const payload = result.savedGoalPayload;
      onSaveGoal({
        id: `goal-${Date.now()}`,
        title: (isFinnish && payload?.titleFi) ? payload.titleFi : (payload?.title || result.scenarioTitle),
        titleFi: payload?.titleFi || result.scenarioTitleFi || result.scenarioTitle,
        category: payload?.category || selectedContext,
        scenario: payload?.scenario || result.aiExplanation,
        estimatedCo2KgMonth: payload?.estimatedCo2KgMonth || Math.abs(result.co2DiffKg * 4),
        estimatedEurMonth: payload?.estimatedEurMonth || Math.abs(result.costDiffEur * 4),
        effort: payload?.effort || result.effort || 'Easy',
        savedAt: new Date().toISOString(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const contexts: Array<{ id: WhatIfContextType; label: string; icon: string }> = [
    {
      id: 'today',
      label: isFinnish ? 'Tämän päivän valinnat' : 'Today Options',
      icon: '🌱',
    },
    {
      id: 'green-window',
      label: isFinnish ? 'Vihreä Ikkuna' : 'Green Window',
      icon: '⚡',
    },
    {
      id: 'transport',
      label: isFinnish ? 'HSL Työmatka' : 'HSL Commute',
      icon: '🚆',
    },
    {
      id: 'grocery',
      label: isFinnish ? 'Ruokavalinnat' : 'Food Swaps',
      icon: '🛒',
    },
    {
      id: 'energy',
      label: isFinnish ? 'Kodin Lämpö' : 'Home Heat',
      icon: '🌡️',
    },
    {
      id: 'rewards',
      label: isFinnish ? 'Palkintotavoite' : 'Reward Goals',
      icon: '🎁',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn text-slate-800">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBackToTools}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            {toolMeta.dataSource.type}
          </span>
          <span className="text-slate-400 text-[11px]">
            {toolMeta.dataSource.providerName}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-lg">
            🔮
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isFinnish ? toolMeta.nameFi : toolMeta.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {isFinnish ? toolMeta.taglineFi : toolMeta.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Domain Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {contexts.map((ctx) => (
          <button
            key={ctx.id}
            type="button"
            onClick={() => {
              setSelectedContext(ctx.id);
              const nextPresets = getWhatIfPresetsForContext(ctx.id, undefined, isFinnish);
              if (nextPresets.length > 0) {
                setSelectedOptionId(nextPresets[0].id);
              }
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
              selectedContext === ctx.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{ctx.icon}</span>
            <span>{ctx.label}</span>
          </button>
        ))}
      </div>

      {/* Context Scenario Questions */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          {isFinnish ? 'Valitse simuloitava kysymys:' : 'Select What-If scenario to calculate:'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {presetOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedOptionId(opt.id)}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 shadow-2xs ${
                activeOptionId === opt.id
                  ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">{opt.icon || '✨'}</span>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">
                  {isFinnish && opt.labelFi ? opt.labelFi : opt.label}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {isFinnish && opt.descriptionFi ? opt.descriptionFi : opt.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Calculated Scenario Card */}
      <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-200">
              {isFinnish ? 'LASKETTU SKENAARIO' : 'PROJECTED SCENARIO'}
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {isFinnish && result.scenarioTitleFi ? result.scenarioTitleFi : result.scenarioTitle}
            </h2>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              {isFinnish && result.aiExplanationFi ? result.aiExplanationFi : result.aiExplanation}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAsGoal}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{isFinnish ? 'Tavoite Tallennettu!' : 'Goal Saved to Me!'}</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                <span>{isFinnish ? 'Tallenna Tavoitteeksi' : 'Save as My Goal'}</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 text-center">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
              {isFinnish ? 'CO₂e Vaikutus' : 'CO₂e Impact'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
              {result.co2Display}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">
              {isFinnish ? 'per kerta / kuukausi' : 'per action/month'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {isFinnish ? 'Kustannusvaikutus' : 'Cost Difference'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {result.costDisplay}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {isFinnish ? 'sähkö- ja polttoaine' : 'spot / fuel'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1 text-center">
            <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
              {isFinnish ? 'Vaivannäkö & Mukavuus' : 'Effort & Convenience'}
            </span>
            <div className="text-lg sm:text-xl font-black text-purple-950 mt-1">
              {'⭐'.repeat(result.convenienceRating || 4)}
            </div>
            <span className="text-[11px] text-purple-700 font-medium">
              {result.effort} Effort
            </span>
          </div>
        </div>

        {/* Comparison Table if available */}
        {result.comparisonTable && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">
              {isFinnish ? 'Vaihtoehtojen vertailumatriisi:' : 'Comparison Matrix:'}
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    {result.comparisonTable.columns.map((c, i) => (
                      <th key={i} className="pb-2 pr-3">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {result.comparisonTable.rows.map((r, i) => (
                    <tr
                      key={i}
                      className={r.isHighlighted ? 'bg-emerald-50/70 font-semibold text-emerald-950' : ''}
                    >
                      <td className="py-2.5 pr-3">{isFinnish && r.labelFi ? r.labelFi : r.label}</td>
                      <td className="py-2.5 pr-3">{r.co2}</td>
                      <td className="py-2.5 pr-3">{r.cost}</td>
                      <td className="py-2.5 pr-3">{r.convenienceOrTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Math & Transparency Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Info className="w-4 h-4 text-slate-500" />
            <span>{isFinnish ? 'Laskentakaava & Kertoimet (Deterministinen):' : 'Deterministic Formula & Data Source:'}</span>
          </div>
          <p className="text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
            {result.formulaUsed}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 flex-wrap gap-2">
            <span>{isFinnish ? 'Tietolähde:' : 'Data Source:'} {result.dataSourceUsed}</span>
            <span className="text-[10px] text-slate-400">{result.responsibleDisclaimer}</span>
          </div>
        </div>
      </div>

      {/* Ask AI Contextual Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              {isFinnish ? 'Haluatko kysyä tarkemmin tästä skenaariosta?' : 'Have a custom question about this scenario?'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {isFinnish
              ? 'EcoPilot-avustaja osaa perustella miten tämä sopii arkeesi ja Espoon olosuhteisiin.'
              : 'Ask EcoPilot can reason through your specific housing and commute details.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onOpenAskAssistant?.(
              `What if I choose this scenario: ${result.scenarioTitle}? How does it fit my profile?`,
              'What-If Simulation'
            )
          }
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-xs shrink-0"
        >
          <span>{isFinnish ? 'Kysy EcoPilotilta' : 'Ask EcoPilot'}</span>
        </button>
      </div>
    </div>
  );
};
