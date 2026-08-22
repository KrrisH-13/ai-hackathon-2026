"use client";

import { Gauge, Zap, Info } from "lucide-react";

interface GreenWindowViewProps {
  isFinnish: boolean;
}

/**
 * Layout only — sample data below stands in for the real Fingrid /
 * electricityMaps feed. Swap FORECAST/CURRENT for a live fetch (a
 * lib/ecopilot/client.ts + app/api/ai or app/api/grid route, same pattern
 * as the other views) without touching this file's structure.
 */
const CURRENT = { gCo2PerKwh: 42, status: "optimal" as const, updatedLabel: "2 min ago" };

const FORECAST: { hour: string; gCo2PerKwh: number; status: "optimal" | "moderate" | "peak" }[] = [
  { hour: "14:00", gCo2PerKwh: 58, status: "moderate" },
  { hour: "16:00", gCo2PerKwh: 96, status: "peak" },
  { hour: "18:00", gCo2PerKwh: 112, status: "peak" },
  { hour: "20:00", gCo2PerKwh: 74, status: "moderate" },
  { hour: "22:00", gCo2PerKwh: 31, status: "optimal" },
  { hour: "00:00", gCo2PerKwh: 22, status: "optimal" },
];

const STATUS_STYLES = {
  optimal: { bar: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  moderate: { bar: "bg-amber-400", text: "text-amber-700", chip: "bg-amber-100 text-amber-800 border-amber-200" },
  peak: { bar: "bg-rose-500", text: "text-rose-700", chip: "bg-rose-100 text-rose-800 border-rose-200" },
};

export function GreenWindowView({ isFinnish }: GreenWindowViewProps) {
  const maxIntensity = Math.max(...FORECAST.map((f) => f.gCo2PerKwh));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-r from-lime-50/80 via-white to-emerald-50/60 border border-lime-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-lime-100 text-lime-900 border border-lime-200">
              🔌 {isFinnish ? "Reaaliaikainen Sähköverkko" : "Live Grid Carbon Intensity"}
            </span>
            <span className="text-xs text-slate-500 font-medium">Fingrid · electricityMaps</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? "Milloin verkkosähkö on juuri nyt puhtainta?" : "Vihreä Ikkuna — when is the grid actually clean right now?"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? "Suomen sähköverkon hiili-intensiteetti reaaliajassa ja seuraavien tuntien ennuste, muutettuna arkisiksi suosituksiksi."
              : "Finland's grid carbon intensity in real time, plus the next few hours' forecast, turned into a plain-language nudge."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white text-center shadow-xs shrink-0 min-w-[140px]">
          <div className="flex items-center justify-center gap-1.5">
            <Gauge className="w-4 h-4 text-lime-400" />
            <span className="text-2xl font-black text-lime-400">{CURRENT.gCo2PerKwh}</span>
          </div>
          <div className="text-[10px] font-bold text-slate-300">gCO2/kWh · {isFinnish ? "nyt" : "now"}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">{isFinnish ? "päivitetty" : "updated"} {CURRENT.updatedLabel}</div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-lime-600" />
          <span>{isFinnish ? "Seuraavat tunnit" : "Next few hours"}</span>
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {FORECAST.map((f) => (
            <div key={f.hour} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500">{f.hour}</span>
              <div className="w-full h-16 flex items-end rounded-lg bg-slate-100 overflow-hidden">
                <div
                  className={`w-full rounded-lg ${STATUS_STYLES[f.status].bar}`}
                  style={{ height: `${Math.max(12, (f.gCo2PerKwh / maxIntensity) * 100)}%` }}
                />
              </div>
              <span className={`text-[11px] font-black ${STATUS_STYLES[f.status].text}`}>{f.gCo2PerKwh}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white shadow-md flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="p-2.5 rounded-xl bg-white/15 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-lime-100">
            {isFinnish ? "Tämän hetken suositus" : "Right now"}
          </span>
          <p className="text-sm sm:text-base font-bold leading-snug">
            {isFinnish
              ? "Lataa sähköauto tai käynnistä astianpesukone klo 22:00 jälkeen — verkon päästöt putoavat yön yli noin 60%."
              : "Charge your EV or run the dishwasher after 22:00 — grid emissions drop ~60% overnight."}
          </p>
        </div>
      </div>
    </div>
  );
}
