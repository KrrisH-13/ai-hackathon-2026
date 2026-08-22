import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowLeft,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Sun,
  Wind,
  Info,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { Season } from '../types/climate';
import { fetchFingridGridStatus } from '../data/providers/fingrid';
import { fetchElectricityPrices } from '../data/providers/electricityPrice';
import { FingridGridStatus } from '../data/schemas/fingridSchema';
import { ElectricityPriceDay } from '../data/schemas/electricityPriceSchema';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';
import { DataFreshnessBadge } from './DataFreshnessBadge';
import { ECO_TOOLS_REGISTRY } from '../tools/toolsRegistry';

interface GreenWindowToolViewProps {
  userProfile: EcoPilotUserProfile;
  currentSeason: Season;
  isFinnish: boolean;
  onBackToTools: () => void;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

export const GreenWindowToolView: React.FC<GreenWindowToolViewProps> = ({
  userProfile,
  currentSeason,
  isFinnish,
  onBackToTools,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [grid, setGrid] = useState<FingridGridStatus | null>(null);
  const [prices, setPrices] = useState<ElectricityPriceDay | null>(null);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);

  const toolMeta = ECO_TOOLS_REGISTRY.find((t) => t.id === 'green-window')!;
  const observation = getCurrentObservationSnapshot(currentSeason || 'winter', 21);

  useEffect(() => {
    fetchFingridGridStatus().then(setGrid);
    fetchElectricityPrices().then(setPrices);
  }, []);

  const cleanPercent = grid ? grid.cleanEnergySharePercent : 88;
  const emissionFactor = grid ? grid.emissionFactorGCO2PerKWh : 48;

  // Find optimal price/clean window hours
  const hourlyData = prices?.hours || [
    { hour: 0, priceCentsKwh: 4.2, gridCo2IntensityGramsKwh: 38, status: 'optimal' as const },
    { hour: 2, priceCentsKwh: 3.8, gridCo2IntensityGramsKwh: 36, status: 'optimal' as const },
    { hour: 8, priceCentsKwh: 12.4, gridCo2IntensityGramsKwh: 68, status: 'peak' as const },
    { hour: 13, priceCentsKwh: 7.1, gridCo2IntensityGramsKwh: 46, status: 'moderate' as const },
    { hour: 18, priceCentsKwh: 14.8, gridCo2IntensityGramsKwh: 74, status: 'peak' as const },
    { hour: 22, priceCentsKwh: 4.9, gridCo2IntensityGramsKwh: 40, status: 'optimal' as const },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn text-slate-800">
      {/* Top Bar: Back navigation + Tool Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBackToTools}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isFinnish ? '← Takaisin Työkaluihin' : '← Back to Tools'}</span>
        </button>

        {/* Official Status Label */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>{toolMeta.dataSource.type}</span>
          </span>
          <span className="text-slate-400 text-[11px]">
            {toolMeta.dataSource.providerName}
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-lg">
            ⚡
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

      {/* Main Grid: Clean Window Status Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white shadow-xl space-y-6 border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {isFinnish ? 'PUHTAIN AIKAIKKUNA TÄNÄÄN' : 'CLEANEST WINDOW TODAY'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              22:00 – 06:00
            </h2>
            <p className="text-xs text-emerald-200/90 max-w-lg">
              {isFinnish
                ? 'Yöllä sähköntuotanto on Suomessa 94 % päästötöntä (ydinvoima + tuulivoima). Säästät rahaa ja vältät fossiilista säätövoimaa.'
                : 'Overnight Finnish grid generation is ~94% fossil-free (nuclear + wind). Shifting EV charging and laundry here cuts peak load.'}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-200">
              {isFinnish ? 'Puhdas osuus nyt' : 'Clean share now'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {cleanPercent}%
            </span>
            <span className="text-[10px] text-slate-300">
              ~{emissionFactor} g CO₂/kWh
            </span>
          </div>
        </div>

        {/* Practical Recommendations Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <span>🚗</span>
              <span>{isFinnish ? 'Sähköauton lataus' : 'EV Charging'}</span>
            </span>
            <p className="text-xs text-slate-200">
              {isFinnish ? 'Ajasta lataus klo 23:00 jälkeen' : 'Schedule charging after 23:00'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <span>🧺</span>
              <span>{isFinnish ? 'Astian- & pyykinpesu' : 'Laundry & Dishes'}</span>
            </span>
            <p className="text-xs text-slate-200">
              {isFinnish ? 'Käytä ajastinta (klo 21–06)' : 'Use delay timer (21:00–06:00)'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <span>🧖</span>
              <span>{isFinnish ? 'Saunavuoro' : 'Sauna Session'}</span>
            </span>
            <p className="text-xs text-slate-200">
              {isFinnish ? 'Vältä iltahuippua (17–19)' : 'Avoid 17:00–19:00 evening peak'}
            </p>
          </div>
        </div>
      </div>

      {/* Hourly Timeline Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900">
              {isFinnish ? 'Sähkön puhtaus & hinta tunneittain' : 'Hourly Cleanliness & Spot Price Preview'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFinnish ? 'Fingridin kantaverkkotilanne ja Nord Poolin spot-hinnat' : 'Fingrid grid telemetry combined with Nord Pool spot rates'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAskAssistant?.('What is the best time to charge my EV today?', 'Green Window')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFinnish ? 'Kysy tekoälyltä' : 'Ask AI'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          {hourlyData.slice(0, 6).map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border space-y-1 ${
                item.status === 'optimal'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-semibold'
                  : item.status === 'peak'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[11px] font-mono text-slate-500 block">
                {String(item.hour).padStart(2, '0')}:00
              </span>
              <span className="text-sm font-bold block">
                {item.priceCentsKwh.toFixed(1)} c/kWh
              </span>
              <span className="text-[10px] text-slate-500 block">
                {item.status === 'optimal' ? '🌿 Clean' : item.status === 'peak' ? '⚠️ Peak' : '⚖️ Normal'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contextual What-If Callout */}
      <div className="p-5 rounded-2xl bg-purple-50/80 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {isFinnish ? 'Mitä jos siirrän latauksen tai saunan vihreään ikkunaan?' : 'What if I shift charging to the green window?'}
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            {isFinnish
              ? 'Laske säästöt kuukaudessa ja tallenna se omaksi arkitavoitteeksesi.'
              : 'Calculate € savings and CO₂ avoided per month and save as a personal routine.'}
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

      {/* Neutral Transparency Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>{isFinnish ? 'Tietolähteen kuvaus:' : 'Public Data Notice:'}</span>
        </div>
        <p className="leading-relaxed">
          {toolMeta.dataSource.disclaimer} {toolMeta.dataSource.partnershipDisclaimer}
        </p>
      </div>

      {/* Embedded What-If Modal */}
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
