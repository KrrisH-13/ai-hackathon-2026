import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  BookmarkPlus,
  CheckCircle2,
  HelpCircle,
  Database,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Scale,
  Zap,
  TrendingDown,
  Info,
} from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';
import { WhatIfContextType, WhatIfScenarioResult, WhatIfPresetOption } from '../types/whatIf';
import { getWhatIfPresetsForContext, calculateWhatIfScenario } from '../services/whatIfEngine';

export interface ContextualWhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: WhatIfContextType;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  contextData?: any;
  initialOptionId?: string;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (initialQuery?: string, contextTitle?: string) => void;
  isFinnish?: boolean;
}

export const ContextualWhatIfModal: React.FC<ContextualWhatIfModalProps> = ({
  isOpen,
  onClose,
  context,
  userProfile,
  observation,
  contextData,
  initialOptionId,
  onSaveGoal,
  onOpenAskAssistant,
  isFinnish = false,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialOptionId || null);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<WhatIfScenarioResult | null>(null);
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);
  const [goalSavedToast, setGoalSavedToast] = useState<boolean>(false);

  const presets: WhatIfPresetOption[] = getWhatIfPresetsForContext(context, contextData, isFinnish);

  // Initialize or reset when modal opens or option changes
  useEffect(() => {
    if (isOpen) {
      setGoalSavedToast(false);
      setShowCalculationDetails(false);
      const opt = initialOptionId || presets[0]?.id || 'default';
      setSelectedOptionId(opt);
      setIsCustomMode(false);
      setCustomQuestion('');
      const res = calculateWhatIfScenario(
        context,
        opt,
        userProfile,
        observation,
        undefined,
        contextData,
        isFinnish
      );
      setCurrentResult(res);
    }
  }, [isOpen, context, initialOptionId]);

  if (!isOpen) return null;

  const handleSelectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
    setIsCustomMode(false);
    setGoalSavedToast(false);
    const res = calculateWhatIfScenario(
      context,
      optionId,
      userProfile,
      observation,
      undefined,
      contextData,
      isFinnish
    );
    setCurrentResult(res);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setGoalSavedToast(false);
    const res = calculateWhatIfScenario(
      context,
      'custom',
      userProfile,
      observation,
      customQuestion,
      contextData,
      isFinnish
    );
    setCurrentResult(res);
  };

  const handleSaveAsGoal = () => {
    if (!currentResult || !onSaveGoal) return;
    const payload = currentResult.savedGoalPayload;
    const newGoal: SavedGoal = {
      id: `goal-${Date.now()}`,
      title: payload?.title || currentResult.scenarioTitle,
      titleFi: payload?.titleFi,
      category: payload?.category || 'Lifestyle',
      scenario: payload?.scenario || currentResult.scenarioTitle,
      estimatedCo2KgMonth: payload?.estimatedCo2KgMonth || Math.abs(currentResult.co2DiffKg * 4),
      estimatedEurMonth: payload?.estimatedEurMonth || Math.abs(currentResult.costDiffEur * 4),
      effort: currentResult.effort,
      savedAt: new Date().toISOString(),
    };
    onSaveGoal(newGoal);
    setGoalSavedToast(true);
  };

  const getContextTitle = () => {
    switch (context) {
      case 'today':
        return isFinnish ? 'Mitä jos? • Päivän suositus' : 'What If? • Today Recommendation';
      case 'green-window':
        return isFinnish ? 'Mitä jos? • Vihreä sähköikkuna' : 'What If? • Green Electricity Window';
      case 'rewards':
      case 'rewards-item':
        return isFinnish ? 'Mitä jos? • EcoCredits & Palkinnot' : 'What If? • EcoCredits & Rewards';
      case 'transport':
        return isFinnish ? 'Mitä jos? • Työmatka & Liikkuminen' : 'What If? • Commute & Transit';
      case 'grocery':
        return isFinnish ? 'Mitä jos? • Ostoskori & Ruoka' : 'What If? • Grocery Footprint';
      case 'recycling':
        return isFinnish ? 'Mitä jos? • HSY Kierrätys' : 'What If? • Recycling Impact';
      case 'energy':
        return isFinnish ? 'Mitä jos? • Kodin energia' : 'What If? • Home Energy';
      case 'progress':
        return isFinnish ? 'Mitä jos? • Ensi viikon suunnitelma' : 'What If? • Next Week Plan';
      default:
        return isFinnish ? 'Mitä jos? • EcoPilot-assistentti' : 'What If? • EcoPilot Assistant';
    }
  };

  return (
    <div
      id="what-if-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-200 block">
                {getContextTitle()}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {isFinnish ? 'Mitä tapahtuisi jos muuttaisin tätä?' : 'What would happen if I changed this?'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. Context Options List (Quick Scenarios) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>{isFinnish ? 'Valitse skenaario:' : 'Select a scenario:'}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 underline underline-offset-2"
              >
                {isCustomMode
                  ? isFinnish ? '← Valitse valmis vaihtoehto' : '← Choose from presets'
                  : isFinnish ? 'Kysy oma kysymys...' : 'Ask my own question...'}
              </button>
            </div>

            {isCustomMode ? (
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder={
                    isFinnish
                      ? 'Esim. Mitä jos pyöräilen 3 kertaa viikossa?'
                      : 'E.g. What if I biked 3 times a week?'
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shrink-0"
                >
                  {isFinnish ? 'Laske' : 'Calculate'}
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((preset) => {
                  const isSelected = selectedOptionId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectOption(preset.id)}
                      className={`text-left p-3 rounded-2xl border transition flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0 mt-0.5">{preset.icon || '○'}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${isSelected ? 'text-purple-950' : 'text-slate-900'}`}>
                          {preset.label}
                        </div>
                        {preset.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {preset.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Calculated Result Card */}
          {currentResult && (
            <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-5 space-y-5 shadow-xs">
              {/* Scenario Title Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                    {isFinnish ? 'Laskettu vaikutus' : 'Calculated Scenario'}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {currentResult.scenarioTitle}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  {currentResult.convenienceRating}/5 ⭐
                </span>
              </div>

              {/* 3 Core Impact Metrics */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {isFinnish ? 'CO₂-vaikutus' : 'CO₂ Impact'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-emerald-700">
                    {currentResult.co2Display}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {isFinnish ? 'Kustannus' : 'Cost Impact'}
                  </span>
                  <div className="text-base sm:text-lg font-black text-slate-800">
                    {currentResult.costDisplay}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {isFinnish ? 'Vaivannäkö' : 'Effort Level'}
                  </span>
                  <div className="text-sm sm:text-base font-bold text-purple-900 mt-0.5">
                    {currentResult.effort === 'Easy'
                      ? (isFinnish ? 'Helppo' : 'Easy')
                      : currentResult.effort === 'Medium'
                      ? (isFinnish ? 'Kohtalainen' : 'Medium')
                      : (isFinnish ? 'Vaativa' : 'High')}
                  </div>
                </div>
              </div>

              {/* Comparison Table if Available */}
              {currentResult.comparisonTable && (
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 text-[11px] font-bold">
                      <tr>
                        {currentResult.comparisonTable.columns.map((col, idx) => (
                          <th key={idx} className="p-2.5 font-bold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentResult.comparisonTable.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.isHighlighted ? 'bg-purple-50/80 font-bold text-purple-950' : 'hover:bg-slate-50'}
                        >
                          <td className="p-2.5 flex items-center gap-1.5">
                            {row.isHighlighted && <span className="text-purple-600">✓</span>}
                            <span>{row.label}</span>
                          </td>
                          <td className="p-2.5 text-emerald-700">{row.co2}</td>
                          <td className="p-2.5 font-medium">{row.cost}</td>
                          <td className="p-2.5">{row.convenienceOrTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* AI Explanation Quote */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs space-y-1 text-blue-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-blue-800 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isFinnish ? 'EcoPilot-analyysi:' : 'EcoPilot Explanation:'}</span>
                </div>
                <p>&ldquo;{currentResult.aiExplanation}&rdquo;</p>
              </div>

              {/* Actions Needed List for Rewards */}
              {currentResult.actionsNeededSummary && currentResult.actionsNeededSummary.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                  <span className="font-extrabold text-amber-900 text-[11px] uppercase tracking-wider block">
                    {isFinnish ? 'Mahdolliset arjen toimenpiteet:' : 'Possible Everyday Actions:'}
                  </span>
                  <ul className="space-y-1 text-amber-950 font-medium">
                    {currentResult.actionsNeededSummary.map((act, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span>•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons: [Save as goal], [Ask EcoPilot] */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {currentResult.goalSaveable && (
                    <button
                      type="button"
                      onClick={handleSaveAsGoal}
                      disabled={goalSavedToast}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs ${
                        goalSavedToast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {goalSavedToast ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isFinnish ? '✓ Tallennettu tavoitteeksi!' : '✓ Saved as Goal!'}</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>{isFinnish ? '[Tallenna tavoitteeksi]' : '[Save as goal]'}</span>
                        </>
                      )}
                    </button>
                  )}

                  {onOpenAskAssistant && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAskAssistant(
                          `Tell me more about: ${currentResult.scenarioTitle}`,
                          getContextTitle()
                        );
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                      <span>{isFinnish ? 'Kysy lisää' : 'Ask EcoPilot'}</span>
                    </button>
                  )}
                </div>

                {/* Transparency Toggle */}
                <button
                  type="button"
                  onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 underline underline-offset-2"
                >
                  <Scale className="w-3 h-3 text-slate-400" />
                  <span>
                    {showCalculationDetails
                      ? isFinnish ? 'Piilota laskentakaava' : 'Hide calculation'
                      : isFinnish ? '[Näytä laskentakaava]' : '[Show calculation]'}
                  </span>
                  {showCalculationDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Expandable Calculation & Data Source Details */}
              {showCalculationDetails && (
                <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-600 space-y-2 animate-in fade-in duration-200">
                  <div>
                    <span className="font-bold text-slate-700 block">{isFinnish ? 'Käytetty kaava:' : 'Deterministic Formula:'}</span>
                    <span className="font-mono text-slate-800">{currentResult.formulaUsed}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">{isFinnish ? 'Julkinen datalähde:' : 'Public Data Source:'}</span>
                    <span>{currentResult.dataSourceUsed}</span>
                  </div>
                  <div className="pt-1 text-[10px] text-slate-400 italic">
                    {currentResult.responsibleDisclaimer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1 text-[11px]">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Deterministic engine ensures zero numerical hallucinations</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition"
          >
            {isFinnish ? 'Sulje' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
