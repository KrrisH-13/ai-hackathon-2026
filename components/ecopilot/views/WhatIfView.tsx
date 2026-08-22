"use client";

import { useState } from "react";
import { Lightbulb, Car, Flame, ThermometerSun, Bike, Plus, RotateCw } from "lucide-react";
import type { UserProfile, Season, SpotPricePoint } from "@/lib/ecopilot/types";
import {
  calculateTransportImpact,
  calculateDeterministicSaunaImpact,
  calculateDeterministicHeatingAdjustment,
  calculateDeterministicCommuteImpact,
  TRANSPORT_MODES,
  type TransportMode,
} from "@/lib/ecopilot/calculations";
import { addCo2LogAPI } from "@/lib/ecopilot/profileClient";

interface WhatIfViewProps {
  userProfile: UserProfile;
  currentSeason: Season;
  spotPrices: SpotPricePoint[];
  isFinnish: boolean;
}

type ScenarioType = "transport" | "sauna" | "heating" | "commute";

const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  car_petrol: "Petrol car",
  car_diesel: "Diesel car",
  car_ev: "Electric car (EV)",
  car_phev: "Plug-in hybrid (PHEV)",
  hsl_metro_train_tram: "HSL Metro/Train/Tram",
  hsl_bus_electric: "HSL Electric Bus",
  hsl_bus_diesel: "HSL Diesel Bus",
  bike_walk: "Bike / Walk",
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Real calculator, not canned copy — every number here comes from
 * lib/ecopilot/calculations.ts (deterministic, ported from the expanded
 * prototype's climate/calculations.ts). No Gemini call computes a number;
 * an AI could explain a result, but never invents one.
 */
export function WhatIfView({ userProfile, currentSeason, spotPrices, isFinnish }: WhatIfViewProps) {
  const [scenario, setScenario] = useState<ScenarioType>("transport");

  const [distanceKm, setDistanceKm] = useState(10);
  const [baselineMode, setBaselineMode] = useState<TransportMode>("car_petrol");
  const [alternativeMode, setAlternativeMode] = useState<TransportMode>("hsl_metro_train_tram");
  const [tripsPerWeek, setTripsPerWeek] = useState(5);

  const [saunaTempTarget, setSaunaTempTarget] = useState(75);
  const [saunaHour, setSaunaHour] = useState(21);

  const [degreesReduced, setDegreesReduced] = useState(1);

  const [commuteDistanceKm, setCommuteDistanceKm] = useState(userProfile.livingAreaSqM > 0 ? 10 : 10);

  const [isLogging, setIsLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const transportResult = calculateTransportImpact({ distanceKm, baselineMode, alternativeMode, tripsPerWeek });
  const saunaHourPoint = spotPrices[saunaHour] ?? spotPrices[21];
  const saunaResult = calculateDeterministicSaunaImpact(6.8, saunaTempTarget, saunaHourPoint.priceCentsKwh, saunaHourPoint.gridCo2IntensityGramsKwh);
  const heatingResult = calculateDeterministicHeatingAdjustment(userProfile.livingAreaSqM, degreesReduced, currentSeason);
  const commuteResult = calculateDeterministicCommuteImpact(commuteDistanceKm);

  const handleLog = async (description: string, co2Kg: number) => {
    setIsLogging(true);
    try {
      await addCo2LogAPI({ category: "other", description, co2Kg });
      setLogged(true);
      setTimeout(() => setLogged(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };

  const SCENARIOS: { id: ScenarioType; icon: typeof Car; label: string }[] = [
    { id: "transport", icon: Car, label: isFinnish ? "Kulkutavan vaihto" : "Switch Transport Mode" },
    { id: "sauna", icon: Flame, label: isFinnish ? "Saunan ajoitus" : "Sauna Timing" },
    { id: "heating", icon: ThermometerSun, label: isFinnish ? "Lämmityksen laskeminen" : "Lower the Thermostat" },
    { id: "commute", icon: Bike, label: isFinnish ? "Työmatkan vaihto" : "Switch the Commute" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/60 border border-cyan-200/80 p-6 sm:p-8 space-y-2 shadow-xs">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
          💡 {isFinnish ? "Entä jos -laskuri" : "What-If Calculator"}
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isFinnish ? "Vertaa vaihtoehtoja — täysin laskettuna" : "Compare options — fully calculated"}
        </h2>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          {isFinnish
            ? "Ei arvauksia: jokainen luku tulee samasta deterministisestä laskukaavastosta kuin muu sovellus."
            : "No guessing — every number comes from the same deterministic formulas as the rest of the app, not from AI."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setScenario(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              scenario === id ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">{isFinnish ? "Muuttujat" : "Inputs"}</h3>

          {scenario === "transport" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isFinnish ? "Matka (km):" : "Distance (km):"}</label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  min={0.5}
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isFinnish ? "Nykyinen tapa:" : "Current mode:"}</label>
                <select
                  value={baselineMode}
                  onChange={(e) => setBaselineMode(e.target.value as TransportMode)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {TRANSPORT_MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isFinnish ? "Vaihtoehto:" : "Alternative mode:"}</label>
                <select
                  value={alternativeMode}
                  onChange={(e) => setAlternativeMode(e.target.value as TransportMode)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {TRANSPORT_MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isFinnish ? "Matkoja / viikko:" : "Trips / week:"}</label>
                <input
                  type="number"
                  value={tripsPerWeek}
                  onChange={(e) => setTripsPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  min={1}
                />
              </div>
            </div>
          )}

          {scenario === "sauna" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isFinnish ? "Tavoitelämpötila:" : "Target temperature:"}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[70, 80, 90].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSaunaTempTarget(t)}
                      className={`py-2 rounded-xl font-bold border ${
                        saunaTempTarget === t ? "bg-amber-500 text-white border-amber-600" : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {t}°C
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isFinnish ? "Lämmitystunti:" : "Heating hour:"}</label>
                <select
                  value={saunaHour}
                  onChange={(e) => setSaunaHour(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {spotPrices.map((p) => (
                    <option key={p.hour} value={p.hour}>
                      {p.timeLabel} — {p.priceCentsKwh} c/kWh
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {scenario === "heating" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isFinnish ? "Lämpötilan lasku (°C):" : "Degrees to lower thermostat:"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDegreesReduced(d)}
                      className={`py-2 rounded-xl font-bold border ${
                        degreesReduced === d ? "bg-amber-500 text-white border-amber-600" : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      -{d}°C
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                {isFinnish
                  ? `Perustuu profiilisi pinta-alaan (${userProfile.livingAreaSqM} m²) ja nykyiseen kauteen.`
                  : `Based on your profile's living area (${userProfile.livingAreaSqM} m²) and the current season.`}
              </p>
            </div>
          )}

          {scenario === "commute" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isFinnish ? "Työmatka (km, yhteen suuntaan):" : "Commute distance (km, one-way):"}
                </label>
                <input
                  type="number"
                  value={commuteDistanceKm}
                  onChange={(e) => setCommuteDistanceKm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  min={0.5}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {isFinnish
                  ? "Vertaa bensa-auton työmatkaa HSL-joukkoliikenteeseen, 220 työpäivää/vuosi."
                  : "Compares a petrol-car commute against HSL transit, 220 workdays/year."}
              </p>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-600" />
            {isFinnish ? "Tulos" : "Result"}
          </h3>

          {scenario === "transport" && (
            <ResultCard
              co2Label={isFinnish ? "CO2-säästö / matka" : "CO2 saved / trip"}
              co2Value={transportResult.co2SavedKgPerTrip}
              costLabel={isFinnish ? "Säästö / matka" : "Saved / trip"}
              costValue={transportResult.costSavedEurPerTrip}
              footnote={
                isFinnish
                  ? `Vuositasolla: -${transportResult.annualCo2SavedKg} kg CO2, +${transportResult.annualCostSavedEur} €, ${transportResult.treesEquivalent} puuta vastaava.`
                  : `Annualized: -${transportResult.annualCo2SavedKg} kg CO2, +€${transportResult.annualCostSavedEur}, equivalent to ${transportResult.treesEquivalent} trees.`
              }
              onLog={() => handleLog(`What-if: switched ${transportResult.baselineMode} → ${transportResult.alternativeMode}`, -transportResult.co2SavedKgPerTrip)}
              isLogging={isLogging}
              logged={logged}
              isFinnish={isFinnish}
            />
          )}

          {scenario === "sauna" && (
            <ResultCard
              co2Label={isFinnish ? "CO2-säästö" : "CO2 saved"}
              co2Value={round1(saunaResult.shiftComparison.co2DifferenceKg)}
              costLabel={isFinnish ? "Säästö" : "Saved"}
              costValue={round1(saunaResult.shiftComparison.costDifferenceEur)}
              footnote={
                isFinnish
                  ? `${saunaResult.kwhUsed} kWh kulutus, siirretty klo ${spotPrices[saunaHour]?.timeLabel} illan huipun (17:30) sijaan.`
                  : `${saunaResult.kwhUsed} kWh used, shifted to ${spotPrices[saunaHour]?.timeLabel} instead of the evening peak (17:30).`
              }
              onLog={() => handleLog(`What-if: sauna shifted to ${spotPrices[saunaHour]?.timeLabel}`, -saunaResult.shiftComparison.co2DifferenceKg)}
              isLogging={isLogging}
              logged={logged}
              isFinnish={isFinnish}
            />
          )}

          {scenario === "heating" && (
            <ResultCard
              co2Label={isFinnish ? "CO2-säästö / päivä" : "CO2 saved / day"}
              co2Value={heatingResult.co2SavedKgPerDay}
              costLabel={isFinnish ? "Säästö / päivä" : "Saved / day"}
              costValue={heatingResult.costSavedEurPerDay}
              footnote={
                isFinnish
                  ? `Lämmityskaudella (210 pv): -${heatingResult.annualCo2SavedKg} kg CO2, +${heatingResult.annualCostSavedEur} €.`
                  : `Over the heating season (210 days): -${heatingResult.annualCo2SavedKg} kg CO2, +€${heatingResult.annualCostSavedEur}.`
              }
              onLog={() => handleLog(`What-if: lowered thermostat ${degreesReduced}°C`, -heatingResult.co2SavedKgPerDay)}
              isLogging={isLogging}
              logged={logged}
              isFinnish={isFinnish}
            />
          )}

          {scenario === "commute" && (
            <ResultCard
              co2Label={isFinnish ? "CO2-säästö / matka" : "CO2 saved / trip"}
              co2Value={commuteResult.co2SavedKgPerTrip}
              costLabel={isFinnish ? "Säästö / matka" : "Saved / trip"}
              costValue={commuteResult.costSavedEurPerTrip}
              footnote={
                isFinnish
                  ? `Vuositasolla: -${commuteResult.annualCo2SavedKg} kg CO2, +${commuteResult.annualCostSavedEur} €, ${commuteResult.treesEquivalent} puuta vastaava.`
                  : `Annualized: -${commuteResult.annualCo2SavedKg} kg CO2, +€${commuteResult.annualCostSavedEur}, equivalent to ${commuteResult.treesEquivalent} trees.`
              }
              onLog={() => handleLog("What-if: switched commute to HSL transit", -commuteResult.co2SavedKgPerTrip)}
              isLogging={isLogging}
              logged={logged}
              isFinnish={isFinnish}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  co2Label,
  co2Value,
  costLabel,
  costValue,
  footnote,
  onLog,
  isLogging,
  logged,
  isFinnish,
}: {
  co2Label: string;
  co2Value: number;
  costLabel: string;
  costValue: number;
  footnote: string;
  onLog: () => void;
  isLogging: boolean;
  logged: boolean;
  isFinnish: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <div className="text-2xl font-black text-emerald-700">-{Math.max(0, co2Value).toFixed(2)} kg</div>
          <div className="text-[10px] text-emerald-950 font-bold">{co2Label}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <div className="text-2xl font-black text-amber-700">+{Math.max(0, costValue).toFixed(2)} €</div>
          <div className="text-[10px] text-amber-950 font-bold">{costLabel}</div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 italic leading-relaxed">{footnote}</p>

      <button
        onClick={onLog}
        disabled={isLogging || co2Value <= 0}
        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
      >
        {isLogging ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        <span>{logged ? (isFinnish ? "Kirjattu!" : "Logged!") : isFinnish ? "Kirjaa Päästöseurantaan" : "Log to CO2 Tracker"}</span>
      </button>
    </div>
  );
}
