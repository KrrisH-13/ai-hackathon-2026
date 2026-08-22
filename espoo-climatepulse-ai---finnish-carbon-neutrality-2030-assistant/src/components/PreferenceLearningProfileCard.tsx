import React from 'react';
import { Sliders, ShieldCheck, CheckCircle2, XCircle, RotateCcw, Edit3, Sparkles, Brain } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';

interface PreferenceLearningProfileCardProps {
  userProfile: EcoPilotUserProfile;
  isFinnish: boolean;
  onOpenEditModal: () => void;
  onResetPreferences: () => void;
}

export const PreferenceLearningProfileCard: React.FC<PreferenceLearningProfileCardProps> = ({
  userProfile,
  isFinnish,
  onOpenEditModal,
  onResetPreferences,
}) => {
  // Infer flexibility levels from stats
  const stats: Record<string, { accepted: number; rejected: number }> = userProfile.categoryStats || {
    'EV charging': { accepted: 8, rejected: 1 },
    'Heating': { accepted: 0, rejected: 5 },
    'Dishwasher': { accepted: 5, rejected: 1 },
  };


  const getFlexibilityBadge = (accepted: number, rejected: number) => {
    const total = accepted + rejected;
    if (total === 0) return { label: isFinnish ? 'Ei dataa' : 'Untested', color: 'text-slate-500 bg-slate-100 border-slate-200' };
    const ratio = accepted / total;
    if (ratio >= 0.75) return { label: isFinnish ? 'Korkea jousto' : 'High flexibility', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (ratio <= 0.25) return { label: isFinnish ? 'Lukittu / Suojattu' : 'Low flexibility (Protected)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    return { label: isFinnish ? 'Kohtalainen jousto' : 'Medium flexibility', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isFinnish ? 'EcoPilot-Profiilisi & Oppimishistoria' : 'Your EcoPilot profile'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFinnish
                ? 'Järjestelmä oppii vähitellen arkesi joustavuudet hyväksyttyjen ja hylättyjen tekojen pohjalta.'
                : 'The system gradually learns your flexibility from accepted vs rejected choices.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetPreferences}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition flex items-center gap-1 shadow-xs"
            title="Reset learned preferences to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Palauta oletukset' : 'Reset'}</span>
          </button>
          <button
            onClick={onOpenEditModal}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Muokkaa' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {/* 3 Categories: Flexible, Protected, Preferred */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Flexible */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            {isFinnish ? 'Joustavat toiminnot (Flexible):' : 'Flexible:'}
          </span>
          <div className="space-y-1.5">
            {userProfile.canChange.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Protected */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            {isFinnish ? 'Suojatut toiminnot (Protected):' : 'Protected:'}
          </span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Heating (No temperature changes)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Morning routine</span>
            </div>
            {userProfile.cannotChange.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{c.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred */}
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            {isFinnish ? 'Suositut (Preferred):' : 'Preferred:'}
          </span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Low-effort actions</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Night spot price shifts</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>High carbon return / €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Acceptance History Table */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          {isFinnish ? 'Toimintojen Hyväksymishistoria (Acceptance History):' : 'Action acceptance history:'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(stats).map(([cat, data]) => {
            const flex = getFlexibilityBadge(data.accepted, data.rejected);
            return (
              <div
                key={cat}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{cat}:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${flex.color}`}>
                    {flex.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {data.accepted} accepted
                  </span>
                  <span className="text-rose-700 font-semibold flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    {data.rejected} rejected
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
