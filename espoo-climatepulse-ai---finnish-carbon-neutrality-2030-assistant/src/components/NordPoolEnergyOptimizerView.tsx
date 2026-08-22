import React, { useState, useEffect } from 'react';
import { Zap, Flame, Clock, TrendingDown, Sun, ShieldCheck, CheckCircle2, BarChart2, Sparkles } from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { Season } from '../types/climate';
import { fetchElectricityPrices } from '../data/providers/electricityPrice';
import { fetchFingridGridStatus } from '../data/providers/fingrid';
import { ElectricityPriceDay } from '../data/schemas/electricityPriceSchema';
import { FingridGridStatus } from '../data/schemas/fingridSchema';
import { calculateDeterministicSaunaImpact } from '../climate/calculations';
import { DataFreshnessBadge } from './DataFreshnessBadge';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';

interface NordPoolEnergyOptimizerViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

export const NordPoolEnergyOptimizerView: React.FC<NordPoolEnergyOptimizerViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [prices, setPrices] = useState<ElectricityPriceDay | null>(null);
  const [grid, setGrid] = useState<FingridGridStatus | null>(null);
  const [selectedSaunaHour, setSelectedSaunaHour] = useState<number>(22);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchElectricityPrices().then(setPrices);
    fetchFingridGridStatus().then(setGrid);
  }, []);

  const observation = getCurrentObservationSnapshot(currentSeason || 'winter', 21);

  const saunaImpact = calculateDeterministicSaunaImpact(
    6.8,
    75,
    prices?.hourlyPrices[selectedSaunaHour]?.priceCentsPerKWh || 2.4,
    grid?.emissionFactorGCO2PerKWh || 18
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              NORD POOL SPOT & SAUNA
            </span>
            {prices && <DataFreshnessBadge freshness={prices.freshness} lastUpdated={prices.lastUpdated} />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isFinnish ? 'Pörssisähkön & Saunan Optimointi' : 'Nordic Electricity & Sauna Smart-Shift'}
          </h2>
          <p className="text-xs text-slate-300">
            {isFinnish
              ? 'Hyödynnä Suomen kantaverkon puhtaimmat ja halvimmat tuulitunnit'
              : 'Shift high-energy loads to night wind hours and avoid fossil peak grid generation'}
          </p>
        </div>
      </div>

      {/* Grid Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Current Spot Rate</span>
          <div className="text-2xl font-black text-amber-400">
            {prices ? `${prices.currentHourPriceCents} c/kWh` : '...'}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Day Average</span>
          <div className="text-2xl font-black text-slate-200">
            {prices ? `${prices.averagePriceCents} c/kWh` : '...'}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Clean Energy Share</span>
          <div className="text-2xl font-black text-emerald-400">
            {grid ? `${grid.cleanEnergySharePercent}%` : '85%'}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Grid CO₂ Factor</span>
          <div className="text-2xl font-black text-teal-300">
            {grid ? `${grid.emissionFactorGCO2PerKWh} g/kWh` : '45 g'}
          </div>
        </div>
      </div>

      {/* 24-Hour Spot Price Chart Visualizer */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            {isFinnish ? '24h Pörssisähkön Hintakäyrä (FI)' : '24h Day-Ahead Spot Price Curve (c/kWh)'}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">
            Best Sauna Window: {prices?.bestSaunaWindow || '21:30 - 23:30'}
          </span>
        </div>

        {/* Bar chart */}
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-36 pt-4 px-2 border-b border-slate-800">
          {prices?.hourlyPrices.map((p) => {
            const heightPercent = Math.max(12, Math.min(100, (p.priceCentsPerKWh / 20) * 100));
            const isClean = p.isCleanPeak;
            const isSelected = selectedSaunaHour === p.hour;

            return (
              <div
                key={p.hour}
                onClick={() => setSelectedSaunaHour(p.hour)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
                title={`${String(p.hour).padStart(2, '0')}:00 — ${p.priceCentsPerKWh} c/kWh`}
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-all ${
                    isSelected
                      ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                      : isClean
                      ? 'bg-emerald-500/60 group-hover:bg-emerald-400'
                      : 'bg-slate-700 group-hover:bg-slate-500'
                  }`}
                />
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-white">
                  {p.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sauna Smart-Shift Calculator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">
              {isFinnish ? 'Sähkösaunan Älykäs Ajastus' : 'Finnish Electric Sauna Optimizer'}
            </h3>
            <p className="text-xs text-slate-400">
              6.8 kW kiuas heated at selected hour: {String(selectedSaunaHour).padStart(2, '0')}:00
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Energy Used</div>
            <div className="text-xl font-black text-white">{saunaImpact.kwhUsed} kWh</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Cost vs Peak</div>
            <div className="text-xl font-black text-emerald-400">
              -€{saunaImpact.costSavedEurVsPeak.toFixed(2)}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold">CO₂ Saved</div>
            <div className="text-xl font-black text-teal-300">
              {saunaImpact.co2SavedKgVsPeak.toFixed(2)} kg
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Grid Flex Bonus</div>
            <div className="text-xl font-black text-amber-400">
              +{saunaImpact.gridFlexibilityBonus} pts
            </div>
          </div>
        </div>

        {/* Contextual What-If Callout for Energy & Heating */}
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs sm:text-sm font-bold text-white">
                {isFinnish ? 'Mitä jos alennan lämpötilaa 1°C tai siirrän saunan?' : 'What if I lower heating 1°C or reschedule sauna?'}
              </span>
            </div>
            <p className="text-xs text-purple-200/80">
              {isFinnish
                ? 'Laske säästöt ilmalämpöpumpulle, suoralle sähkölle ja EV-lataukselle pörssisähköllä.'
                : 'Calculate savings for heat pumps, sauna timing, and EV smart charging using Nord Pool spot prices.'}
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
        context="energy"
        userProfile={userProfile}
        observation={observation}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </div>
  );
};
