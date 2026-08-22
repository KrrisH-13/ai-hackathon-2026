import React, { useEffect, useState } from 'react';
import { X, Brain, CheckCircle2, ShieldCheck, Sparkles, AlertCircle, RefreshCw, BarChart2, Database, Calculator } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';
import { generateExplanationWithAI } from '../ai/explanationGenerator';
import { CANDIDATE_ACTIONS } from '../data/actions/candidateActions';
import { ExplanationResult } from '../ai/schemas';

interface ExplanationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string;
  actionTitle: string;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  onOpenDataSources?: () => void;
  onOpenCalculationEngine?: () => void;
  isFinnish?: boolean;
}

export const ExplanationDrawer: React.FC<ExplanationDrawerProps> = ({
  isOpen,
  onClose,
  actionId,
  actionTitle,
  userProfile,
  observation,
  onOpenDataSources,
  onOpenCalculationEngine,
  isFinnish = false,
}) => {
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    generateExplanationWithAI({
      actionId,
      actionTitle,
      userProfile,
      observation,
      candidateActions: CANDIDATE_ACTIONS,
    })
      .then((res) => {
        setExplanation(res);
      })
      .catch((err) => {
        console.error('Explanation generation failed:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, actionId, userProfile.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto text-slate-800 space-y-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {isFinnish ? 'Miksi näet tämän suosituksen?' : 'Why this recommendation?'}
                </h3>
                <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{actionTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-mono">
                {isFinnish ? 'Tekoäly koostaa perustelua...' : 'Synthesizing transparent rationale...'}
              </span>
            </div>
          ) : explanation ? (
            <div className="space-y-4 text-xs">
              {/* Natural Language Explanation */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                <span className="font-bold text-blue-900 text-xs uppercase tracking-wider block">
                  {isFinnish ? 'Tekoälyn Perustelu' : 'Reasoning'}
                </span>
                <p className="text-blue-800 leading-relaxed text-xs">
                  {explanation.userFriendlyExplanation}
                </p>
              </div>

              {/* 1. Relevant User Preference */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block">
                  {isFinnish ? '1. Huomioitu käyttäjäprofiili & jousto' : '1. Relevant User Preference'}
                </span>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  ✓ {explanation.constraintsRespected || 'Flexible scheduling enabled for EV/appliances, comfort prioritized for heating.'}
                </p>
              </div>

              {/* 2. Public Data Used */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                  {isFinnish ? '2. Käytetty julkinen avoin data' : '2. Public Open Data Used'}
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {explanation.dataPointsSummary || `Spot price: ${observation.currentSpotPriceCents} c/kWh, Grid clean share: ${observation.cleanEnergySharePercent}%, Weather: ${observation.outdoorTempCelsius}°C (${observation.currentSeason}).`}
                </p>
              </div>

              {/* 3. Major Assumptions */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                  {isFinnish ? '3. Keskeinen oletus' : '3. Major Assumption'}
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {userProfile.housingType.includes('house') || userProfile.housingType.includes('terrace')
                    ? 'Assumes private home EV charger/smart appliance scheduling is available.'
                    : 'Assumes standard household appliances with timer delay capability.'}
                </p>
              </div>

              {/* Note: Structured Application Data */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-mono space-y-1">
                <div className="font-bold text-slate-700">✓ Deterministic Integrity</div>
                <p>CO₂ and € estimates are calculated using structured application data, not generative approximations.</p>
              </div>

              {/* Progressive Disclosure Action Links */}
              <div className="pt-2 flex flex-col gap-2">
                {onOpenCalculationEngine && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCalculationEngine();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isFinnish ? '[Näytä laskentakaavat]' : '[Show calculation formulas]'}</span>
                  </button>
                )}

                {onOpenDataSources && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDataSources();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-700" />
                    <span>{isFinnish ? '[Näytä tietolähteet]' : '[Show data sources & APIs]'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              Failed to load explanation. Please try again.
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
        >
          {isFinnish ? 'Sulje' : 'Close'}
        </button>
      </div>
    </div>
  );
};
