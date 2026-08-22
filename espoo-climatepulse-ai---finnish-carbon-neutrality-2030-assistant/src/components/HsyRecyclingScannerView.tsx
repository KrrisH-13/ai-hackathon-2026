import React, { useState } from 'react';
import { Recycle, Search, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { HSY_KNOWLEDGE_BASE } from '../data/providers/hsyRecycling';
import { HsyWasteClassification } from '../data/schemas/hsySchema';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';

interface HsyRecyclingScannerViewProps {
  isFinnish: boolean;
  userProfile?: EcoPilotUserProfile;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

export const HsyRecyclingScannerView: React.FC<HsyRecyclingScannerViewProps> = ({
  isFinnish,
  userProfile,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>('milk_carton');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);

  const activeWaste = HSY_KNOWLEDGE_BASE[selectedKey] || HSY_KNOWLEDGE_BASE['milk_carton'];

  const defaultProfile: EcoPilotUserProfile = userProfile || {
    id: 'user-demo',
    displayName: 'Alex Demo',
    heatingType: 'heat-pump',
    hasElectricVehicle: true,
    hasDishwasher: true,
    hasWashingMachine: true,
    hasHomeBattery: false,
    hasSolarPanels: false,
    hasSauna: true,
    saunaHeatingType: 'electric',
    monthlyDrivingKm: 320,
    publicTransitPass: 'hsl-ab',
    dietPreference: 'omnivore',
    savedCo2Kg: 28.4,
    savedEurTotal: 34.8,
    streakDays: 4,
    ecoCredits: 146,
    acceptedActionsHistory: [],
    rejectedActionsHistory: [],
    learnedPreferences: {
      avoidMorningDisruption: true,
      maxSaunaPostponeMinutes: 45,
      preferredChargingWindow: 'overnight',
      neverTouchHeatingInWinter: true,
      preferWeekendChores: true,
    },
    privacySettings: {
      allowGeminiReasoning: true,
      allowTelemetry: false,
      allowPersonalizedPledges: true,
      dataRetentionDays: 30,
    },
    negotiatedCompromises: [],
  };

  const observation = getCurrentObservationSnapshot('winter', 21);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-100">
      <div className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-500/20 text-lime-300 border border-lime-500/30">
            HSY JÄTEOPAS 2026
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isFinnish ? 'HSY Kiertotalous & Lajittelu' : 'HSY Circular Economy & Waste Scanner'}
        </h2>
        <p className="text-xs text-slate-300">
          {isFinnish
            ? 'Tarkat ohjeet ja Sortti-asemat Espoossa (Ämmässuo, Ruukinmestarintie)'
            : 'Official waste classification guidelines and circular economy impact in Espoo'}
        </p>
      </div>

      {/* Item Quick Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(HSY_KNOWLEDGE_BASE).map(([key, item]) => {
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`p-3 rounded-2xl border text-left transition ${
                isSelected
                  ? 'bg-lime-500/20 border-lime-500/60 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="font-extrabold text-xs text-white truncate">{item.itemName.split('/')[0]}</div>
              <div className="text-[10px] text-lime-400 truncate mt-0.5">{item.binCategory.split('(')[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Main Result Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 bg-lime-500/10 px-2.5 py-0.5 rounded-full border border-lime-500/20">
              {activeWaste.binCategory}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">{activeWaste.itemName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/30">
              +{activeWaste.co2SavedVsMixedWasteGrams} g CO₂ saved
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <span className="font-extrabold text-slate-300 text-xs uppercase tracking-wider block">
            {isFinnish ? 'Lajitteluohjeet (HSY):' : 'Official HSY Instructions:'}
          </span>
          <p className="text-sm font-medium text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {activeWaste.instructions}
          </p>
        </div>

        {/* Circular Economy Tip */}
        <div className="p-4 rounded-2xl bg-lime-500/10 border border-lime-500/20 space-y-1.5 text-xs">
          <span className="font-extrabold text-lime-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-lime-400" />
            {isFinnish ? 'Kiertotalousvaikutus Espoossa:' : 'Circular Economy Journey:'}
          </span>
          <p className="text-slate-200 leading-relaxed text-xs">{activeWaste.circularEconomyTip}</p>
        </div>

        {activeWaste.nearestSorttiStation && (
          <div className="flex items-center gap-2 text-xs text-amber-300 font-mono bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Nearest Station: {activeWaste.nearestSorttiStation}</span>
          </div>
        )}

        {/* Contextual What-If Callout for Recycling */}
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs sm:text-sm font-bold text-white">
                {isFinnish ? 'Mitä jos lajittelen 100% biojätteestä?' : 'What if I recycle 100% of organic waste?'}
              </span>
            </div>
            <p className="text-xs text-purple-200/80">
              {isFinnish
                ? 'Selvitä miten biojäte, kartonki ja muovi muuttuvat biokaasuksi ja kierrätysmateriaaleiksi HSY-alueella.'
                : 'See how sorting bio-waste, plastics, and metals reduces Ämmässuo landfill footprint.'}
            </p>
          </div>

          <ContextualWhatIfButton
            onClick={() => setIsWhatIfOpen(true)}
            label={isFinnish ? '[🔮 Mitä jos?]' : '[🔮 What if?]'}
            variant="primary"
            size="md"
            isFinnish={isFinnish}
          />
        </div>
      </div>

      <ContextualWhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        context="recycling"
        userProfile={defaultProfile}
        observation={observation}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </div>
  );
};
