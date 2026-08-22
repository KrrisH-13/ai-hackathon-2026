import React, { useState } from 'react';
import { Bell, Sparkles, X, ChevronRight, CheckCircle2, RefreshCw } from 'lucide-react';

interface DailyNotificationCardProps {
  userName: string;
  actionTitle: string;
  suggestedTime: string;
  savingsEur: number;
  co2Kg: number;
  isFinnish: boolean;
  onOpenSuggestion: () => void;
  onGenerateNewSuggestion: () => void;
  isGenerating?: boolean;
}

export const DailyNotificationCard: React.FC<DailyNotificationCardProps> = ({
  userName,
  actionTitle,
  suggestedTime,
  savingsEur,
  co2Kg,
  isFinnish,
  onOpenSuggestion,
  onGenerateNewSuggestion,
  isGenerating = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-sm relative overflow-hidden text-white">
      {/* Decorative subtle accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <Bell className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                {isFinnish ? 'Päivittäinen ilmoitus' : "EcoPilot suggestion"}
              </span>
              <span className="text-xs text-slate-400">
                {isFinnish ? 'Päivittäisen avustajan simulaatio' : 'Simulated Daily Assistant Push'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              {actionTitle} — {suggestedTime}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {isFinnish
                ? `Säästö: €${savingsEur.toFixed(2)} | CO₂-hyöty: ${co2Kg.toFixed(1)} kg`
                : `Est. saving: €${savingsEur.toFixed(2)} | CO₂ benefit: ${co2Kg.toFixed(1)} kg`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGenerateNewSuggestion}
            disabled={isGenerating}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            title="Simulate daily assistant engine trigger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isFinnish ? 'Luo päivän ehdotus' : "Generate today's suggestion"}</span>
          </button>
          <button
            onClick={onOpenSuggestion}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-xs"
          >
            <span>{isFinnish ? 'Tarkastele' : 'View Action'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
