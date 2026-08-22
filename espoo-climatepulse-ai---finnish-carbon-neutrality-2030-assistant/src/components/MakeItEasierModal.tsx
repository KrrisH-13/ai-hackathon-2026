import React, { useState } from 'react';
import { X, Sparkles, Brain, Sliders, ArrowRight, CheckCircle2, Clock, ShieldCheck, Zap } from 'lucide-react';
import { EcoPilotUserProfile } from '../types/user';
import { ObservationSnapshot } from '../types/recommendation';

interface MakeItEasierModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string;
  actionTitle: string;
  originalTime: string;
  originalEur: number;
  originalCo2Kg: number;
  userProfile: EcoPilotUserProfile;
  observation: ObservationSnapshot;
  onSelectEasierOption: (option: {
    title: string;
    suggestedTime: string;
    savingEur: number;
    co2BenefitKg: number;
    effort: 'Low' | 'Medium';
    compromiseNote: string;
  }) => void;
  isFinnish?: boolean;
}

export const MakeItEasierModal: React.FC<MakeItEasierModalProps> = ({
  isOpen,
  onClose,
  actionId,
  actionTitle,
  originalTime,
  originalEur,
  originalCo2Kg,
  userProfile,
  observation,
  onSelectEasierOption,
  isFinnish = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('earlier_evening');
  const [customTiming, setCustomTiming] = useState<string>('20:00');

  if (!isOpen) return null;

  // Compute deterministic compromise options
  const isEV = actionId.includes('ev') || actionId.includes('charge');
  const isDishwasher = actionId.includes('dishwasher');
  const isSauna = actionId.includes('sauna');

  const easierOptions = [
    {
      id: 'earlier_evening',
      title: isEV ? 'Charge at 20:00 (Instead of 22:00+)' : isDishwasher ? 'Run Dishwasher at 20:00' : 'Sauna at 20:00',
      suggestedTime: '20:00 - 21:30',
      savingEur: Number((originalEur * 0.55).toFixed(2)),
      co2BenefitKg: Number((originalCo2Kg * 0.55).toFixed(2)),
      effort: 'Low' as const,
      explanation: isFinnish
        ? 'Klo 20:00 on huomattavasti mukavampi arki-iltaisin. Säästät silti ~55% iltahuippuihin verrattuna.'
        : '20:00 is more convenient for your evening routine, with a balanced moderate benefit.',
      ecoCredits: 8,
    },
    {
      id: 'quick_eco_mode',
      title: isEV ? 'Charge 50% battery overnight only' : isDishwasher ? 'Eco 50°C quick cycle' : 'Sauna 45-minute eco session',
      suggestedTime: 'Normal routine + Eco mode',
      savingEur: Number((originalEur * 0.4).toFixed(2)),
      co2BenefitKg: Number((originalCo2Kg * 0.45).toFixed(2)),
      effort: 'Low' as const,
      explanation: isFinnish
        ? 'Ei aikataulumuutoksia. Laitteen Eco-ohjelma säästää energiaa arjesta tinkimättä.'
        : 'No timing change needed. Lowers power draw with zero disruption to your evening.',
      ecoCredits: 6,
    },
    {
      id: 'weekend_shift',
      title: isFinnish ? 'Siirrä viikonlopun edullisiin tunteihin' : 'Shift to weekend daytime window',
      suggestedTime: 'Saturday / Sunday',
      savingEur: Number((originalEur * 0.85).toFixed(2)),
      co2BenefitKg: Number((originalCo2Kg * 0.85).toFixed(2)),
      effort: 'Low' as const,
      explanation: isFinnish
        ? 'Tee tämä viikonloppuna kun sähkö on edullista koko päivän eikä arki häiriinny.'
        : 'Do this on the weekend when spot electricity is affordable all afternoon.',
      ecoCredits: 10,
    },
  ];

  const activeOption = easierOptions.find((o) => o.id === selectedPreset) || easierOptions[0];

  const handleApply = () => {
    onSelectEasierOption({
      title: activeOption.title,
      suggestedTime: activeOption.suggestedTime,
      savingEur: activeOption.savingEur,
      co2BenefitKg: activeOption.co2BenefitKg,
      effort: activeOption.effort,
      compromiseNote: activeOption.explanation,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-800 relative space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isFinnish ? 'Tee toimenpiteestä helpompi' : 'Make it easier — Personalized negotiation'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFinnish
                  ? 'EcoPilot sovittaa toimenpiteen arkesi aikatauluihin pienemmällä vaivalla.'
                  : 'EcoPilot adapts the action to your comfort level with verified compromise math.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current vs Compromise context */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
              {isFinnish ? 'Alkuperäinen ehdotus' : 'Original suggestion'}
            </span>
            <div className="font-bold text-slate-800 mt-0.5">
              {actionTitle} ({originalTime})
            </div>
          </div>
          <div className="text-right font-mono text-[11px]">
            <div className="text-emerald-700 font-semibold">€{originalEur.toFixed(2)} / {originalCo2Kg.toFixed(1)} kg</div>
            <div className="text-slate-400">100% impact</div>
          </div>
        </div>

        {/* AI Negotiation Speech */}
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold">
            <Brain className="w-3.5 h-3.5 text-blue-700" />
            <span>{isFinnish ? 'EcoPilot Assistantin vastaus:' : 'EcoPilot Assistant:'}</span>
          </div>
          <p className="text-blue-800 leading-relaxed">
            &ldquo;{activeOption.explanation}&rdquo;
          </p>
        </div>

        {/* Options Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            {isFinnish ? 'Valitse sinulle sopiva kevyempi vaihtoehto:' : 'Choose a lower-friction alternative:'}
          </label>
          <div className="space-y-2">
            {easierOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedPreset(opt.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  selectedPreset === opt.id
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>{opt.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {opt.suggestedTime}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {opt.explanation}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="text-xs font-black text-emerald-700">
                    €{opt.savingEur.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {opt.co2BenefitKg.toFixed(1)} kg CO₂
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formula note */}
        <div className="text-[10px] text-slate-400 font-mono">
          ✓ CO₂ and € savings calculated deterministically using Nord Pool spot curve interpolation.
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
          >
            {isFinnish ? 'Peruuta' : 'Cancel'}
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isFinnish ? `Valitse ${activeOption.suggestedTime}` : `Choose ${activeOption.suggestedTime}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
