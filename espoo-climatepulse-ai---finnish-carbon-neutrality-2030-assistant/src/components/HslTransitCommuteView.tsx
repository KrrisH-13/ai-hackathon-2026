import React, { useState } from 'react';
import {
  Train,
  Car,
  Bike,
  Footprints,
  Bus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calculator,
  Sliders,
  Sparkles,
  CheckCircle2,
  Info,
  Layers,
} from 'lucide-react';
import {
  HSL_TRANSPORT_FACTORS,
  calculateTransportTripImpact,
  CommuteImpactResult,
} from '../services/transportImpactEngine';
import { EcoPilotUserProfile, SavedGoal } from '../types/user';
import { getCurrentObservationSnapshot } from '../services/ecoPilotService';
import { ContextualWhatIfButton } from './ContextualWhatIfButton';
import { ContextualWhatIfModal } from './ContextualWhatIfModal';

interface HslTransitCommuteViewProps {
  isFinnish: boolean;
  userProfile: EcoPilotUserProfile;
  onSaveGoal?: (goal: SavedGoal) => void;
  onOpenAskAssistant?: (query?: string, title?: string) => void;
}

const PRESET_COMMUTES = [
  {
    id: 'tapiola-otaniemi',
    name: 'Tapiola → Otaniemi / Keilaniemi',
    nameFi: 'Tapiola → Otaniemi / Keilaniemi',
    line: 'Pikaratikka 15 & Metro',
    distanceKm: 12,
    recommendedMode: 'hsl_electric_rail',
    transitTimeMin: 18,
    carTimeMin: 15,
  },
  {
    id: 'leppavaara-keilaniemi',
    name: 'Leppävaara → Keilaniemi',
    nameFi: 'Leppävaara → Keilaniemi',
    line: 'Pikaratikka 15 (Orbital Rail)',
    distanceKm: 14,
    recommendedMode: 'hsl_electric_rail',
    transitTimeMin: 26,
    carTimeMin: 22,
  },
  {
    id: 'matinkyla-kamppi',
    name: 'Matinkylä (Iso Omena) → Kamppi (Helsinki)',
    nameFi: 'Matinkylä (Iso Omena) → Kamppi (Helsinki)',
    line: 'Länsimetro (M1 / M2)',
    distanceKm: 16,
    recommendedMode: 'hsl_electric_rail',
    transitTimeMin: 20,
    carTimeMin: 25,
  },
  {
    id: 'espoonkeskus-helsinki',
    name: 'Espoon keskus → Helsinki Central',
    nameFi: 'Espoon keskus → Helsingin päärautatieasema',
    line: 'HSL Commuter Train E / U',
    distanceKm: 20,
    recommendedMode: 'hsl_electric_rail',
    transitTimeMin: 24,
    carTimeMin: 32,
  },
];

export const HslTransitCommuteView: React.FC<HslTransitCommuteViewProps> = ({
  isFinnish,
  userProfile,
  onSaveGoal,
  onOpenAskAssistant,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tapiola-otaniemi');
  const [customDistance, setCustomDistance] = useState<number>(
    userProfile.commuteDistanceKm || 12
  );
  const [daysPerWeek, setDaysPerWeek] = useState<number>(
    userProfile.commuteDaysPerWeek || 4
  );
  const [chosenMode, setChosenMode] = useState<string>('hsl_electric_rail');
  const [baselineCarMode, setBaselineCarMode] = useState<string>('car_single');
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(true);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [showFormulas, setShowFormulas] = useState<boolean>(false);

  const activePreset = PRESET_COMMUTES.find((p) => p.id === selectedPresetId);

  const handleSelectPreset = (preset: (typeof PRESET_COMMUTES)[0]) => {
    setSelectedPresetId(preset.id);
    setCustomDistance(preset.distanceKm);
    setChosenMode(preset.recommendedMode);
  };

  const impactResult: CommuteImpactResult = calculateTransportTripImpact({
    distanceKm: customDistance,
    commuteDaysPerWeek: daysPerWeek,
    weeksPerYear: 44,
    baselineMode: baselineCarMode,
    chosenMode,
    isRoundTrip,
  });

  const observation = getCurrentObservationSnapshot('winter', 21);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
              HSL IMPACT & EMISSIONS ENGINE
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              170 g/km Car Baseline
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isFinnish ? 'HSL Liikenteen Ilmastovaikutus & Reittilaskuri' : 'HSL Transit Impact & Commute Engine'}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            {isFinnish
              ? 'Laske työmatkasi todellinen CO₂e- ja eurosäästö HSL:n virallisen 170 g CO₂e/km -päästömallin mukaisesti. Pikaratikka 15 ja metro kulkevat 100% uusiutuvalla sähköllä.'
              : 'Calculate deterministic commute CO₂e and cost savings using HSL’s official 170 g CO₂e/km baseline. HSL Pikaratikka 15 and Metro run on 100% certified Nordic renewable electricity.'}
          </p>
        </div>

        <a
          href="https://reittiopas.hsl.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <span>{isFinnish ? 'Avaa HSL Reittiopas' : 'Plan route in HSL'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Preset Route Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          {isFinnish ? 'Valitse Espoon reittiesimerkki tai syötä oma etäisyys:' : 'Select an Espoo commute route or customize distance:'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_COMMUTES.map((p) => {
            const isSelected = selectedPresetId === p.id && customDistance === p.distanceKm;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`p-3.5 rounded-xl border text-left transition space-y-1 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[10px] font-bold text-blue-700">{p.line}</div>
                <div className="font-bold text-xs truncate text-slate-900">{isFinnish ? p.nameFi : p.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{p.distanceKm} km one-way</span>
                  <span className="font-mono text-emerald-800 font-semibold">~{p.transitTimeMin} min HSL</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Sliders & Mode Pickers */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Distance Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700">
                {isFinnish ? 'Yhdensuuntainen matka:' : 'One-way distance:'}
              </label>
              <span className="font-mono font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {customDistance} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={customDistance}
              onChange={(e) => {
                setCustomDistance(Number(e.target.value));
                setSelectedPresetId('custom');
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 km (Local)</span>
              <span>12 km (Alex demo)</span>
              <span>50 km (Regional)</span>
            </div>
          </div>

          {/* Days Per Week Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700">
                {isFinnish ? 'Työmatkapäiviä viikossa:' : 'Commute frequency:'}
              </label>
              <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {daysPerWeek} {isFinnish ? 'pv / vko' : 'days / wk'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 day</span>
              <span>4 days (Alex)</span>
              <span>7 days</span>
            </div>
          </div>

          {/* Round-trip Toggle */}
          <div className="space-y-2 flex flex-col justify-between">
            <label className="font-bold text-xs text-slate-700">
              {isFinnish ? 'Matkatyyppi:' : 'Trip calculation:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsRoundTrip(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  isRoundTrip
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isFinnish ? 'Edestakainen (Meno-Paluu)' : 'Round Trip (2×)'}
              </button>
              <button
                type="button"
                onClick={() => setIsRoundTrip(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  !isRoundTrip
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isFinnish ? 'Yhdensuuntainen' : 'One-Way (1×)'}
              </button>
            </div>
          </div>
        </div>

        {/* Mode Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          {/* Chosen Green Alternative */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Train className="w-4 h-4 text-emerald-700" />
              <span>{isFinnish ? 'Kestävä vaihtoehto:' : 'Green Alternative Mode:'}</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChosenMode('hsl_electric_rail')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  chosenMode === 'hsl_electric_rail'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Train className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>HSL Rail (0 g/km)</span>
              </button>

              <button
                type="button"
                onClick={() => setChosenMode('hsl_bus_average')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  chosenMode === 'hsl_bus_average'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bus className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>HSL Bus (45 g/km)</span>
              </button>

              <button
                type="button"
                onClick={() => setChosenMode('bicycle')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  chosenMode === 'bicycle'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bike className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Bicycle / City Bike (0 g)</span>
              </button>

              <button
                type="button"
                onClick={() => setChosenMode('walking')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  chosenMode === 'walking'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Footprints className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Walking (0 g)</span>
              </button>
            </div>
          </div>

          {/* Baseline Comparison Mode */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-rose-700" />
              <span>{isFinnish ? 'Vertailukohde (Auton tyyppi):' : 'Baseline Car Comparison:'}</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBaselineCarMode('car_single')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  baselineCarMode === 'car_single'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span>1 Occupant (170 g/km)</span>
              </button>

              <button
                type="button"
                onClick={() => setBaselineCarMode('car_carpool_2')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  baselineCarMode === 'car_carpool_2'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>2 Person Carpool (85 g)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Results Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-mono text-blue-700 font-bold uppercase">
              {impactResult.totalDistanceKm} km {isRoundTrip ? 'Round Trip' : 'One Way'} • {impactResult.tripsPerWeek} trips/week
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {isFinnish
                ? `Vältät ${impactResult.avoidedCo2Kg} kg CO₂e ja säästät ~€${impactResult.savedCostEur} per matkapäivä`
                : `Avoid ${impactResult.avoidedCo2Kg} kg CO₂e & save ~€${impactResult.savedCostEur} per day`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-xs">
              ↓ {(impactResult.avoidedCo2Kg * 10).toFixed(0)} EcoCredits equiv.
            </span>
          </div>
        </div>

        {/* 4-stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {isFinnish ? 'Päiväkohtainen CO₂' : 'Day Trip Avoided'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              ↓ {impactResult.avoidedCo2Kg} kg
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              vs {impactResult.baselineCo2Kg} kg car
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {isFinnish ? 'Kuukausisäästö' : 'Monthly Avoided'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              ↓ {impactResult.monthlyAvoidedCo2Kg} kg
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              ~€{impactResult.monthlySavedEur.toFixed(0)}/mo saved
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {isFinnish ? 'Vuosittainen CO₂' : 'Annual CO₂e Avoided'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              ↓ {impactResult.annualAvoidedCo2Kg} kg
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              {Math.round(impactResult.annualAvoidedCo2Kg / 22)} trees equiv.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {isFinnish ? 'Vuosisäästö (€)' : 'Annual € Savings'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              ~€{impactResult.annualSavedEur}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Fuel, wear & parking
            </span>
          </div>
        </div>

        {/* Math & Transparency Breakdown Dropdown */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowFormulas(!showFormulas)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 underline underline-offset-2"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>
              {showFormulas
                ? (isFinnish ? 'Piilota laskentakaavat ja tietolähteet' : 'Hide mathematical calculation & sources')
                : (isFinnish ? 'Näytä laskentakaavat ja HSL-lähteet' : 'Show mathematical calculation & HSL sources')}
            </span>
          </button>

          {showFormulas && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 font-mono">
              <div>
                <span className="font-bold text-slate-800 block">Calculation Step:</span>
                <p className="text-slate-600 mt-0.5">{impactResult.formulaDescription}</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 block">HSL Methodological Assumptions:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 mt-0.5">
                  {impactResult.assumptions.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-1 text-[11px] text-slate-500">
                <span>Methodology: {impactResult.methodology}</span>
              </div>
            </div>
          )}
        </div>

        {/* Integrated Contextual What-If Callout */}
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span className="font-bold text-xs text-purple-950">
                {isFinnish ? 'Mitä jos korvaan 2 automatkaa viikossa?' : 'What if I replace 2 car commutes per week?'}
              </span>
            </div>
            <p className="text-xs text-purple-800">
              {isFinnish
                ? 'Kokeile eri matkustiheyksiä, vertaa polkupyörää ja tallenna oma tavoite profiiliisi.'
                : 'Explore alternative scenarios, compare cycling and save realistic personal goals.'}
            </p>
          </div>

          <ContextualWhatIfButton
            onClick={() => setIsWhatIfOpen(true)}
            isFinnish={isFinnish}
            variant="primary"
            size="sm"
          />
        </div>
      </div>

      {/* Modal for What-If Scenarios */}
      <ContextualWhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        context="transport"
        userProfile={userProfile}
        observation={observation}
        contextData={{ distanceKm: customDistance }}
        onSaveGoal={onSaveGoal}
        onOpenAskAssistant={onOpenAskAssistant}
        isFinnish={isFinnish}
      />
    </div>
  );
};
