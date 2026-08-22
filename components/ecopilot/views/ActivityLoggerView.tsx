"use client";

import { useState } from "react";
import { NotebookPen, Car, Train, Bike, Globe2, Sparkles } from "lucide-react";

interface ActivityLoggerViewProps {
  isFinnish: boolean;
}

interface LoggedActivity {
  id: string;
  text: string;
  mode: "car" | "train" | "bike";
  distanceKm: number;
  country: string;
  co2Kg: number;
}

/**
 * Layout only — SAMPLE_LOG stands in for real entries. The real version
 * wires the input to Gemini function calling (extract mode + distance),
 * maps to country-aware emission factors, and persists to Supabase; that
 * logic isn't here yet, just the UI it will render into.
 */
const SAMPLE_LOG: LoggedActivity[] = [
  { id: "1", text: "Drove to Turku today", mode: "car", distanceKm: 165, country: "Finland", co2Kg: 27.7 },
  { id: "2", text: "Took the train from Espoo to Helsinki", mode: "train", distanceKm: 18, country: "Finland", co2Kg: 0.1 },
  { id: "3", text: "Biked to Otaniemi for a meeting", mode: "bike", distanceKm: 6, country: "Finland", co2Kg: 0 },
];

const MODE_ICON = { car: Car, train: Train, bike: Bike };

export function ActivityLoggerView({ isFinnish }: ActivityLoggerViewProps) {
  const [draft, setDraft] = useState("");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-r from-fuchsia-50/80 via-white to-emerald-50/60 border border-fuchsia-200/80 p-6 sm:p-8 space-y-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200">
            📝 {isFinnish ? "Luonnollisen kielen päiväkirja" : "Natural-language Activity Log"}
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isFinnish ? "Kirjoita mitä teit — me hoidamme laskennan" : "Just type what you did — we'll do the math"}
        </h2>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          {isFinnish
            ? '"Ajoin Turkuun tänään" tai "otin junan Espoosta Helsinkiin" — päästökertoimet ovat maakohtaisia (esim. sähköauto Norjassa ≈ lähes päästötön vesivoiman ansiosta, sama auto Puolassa on hyvin erilainen).'
            : '"Drove to Turku today" or "took the train from Espoo to Helsinki" — emission factors are country-aware (an EV in Norway ≈ near-zero thanks to hydro; the same EV in Poland is very different).'}
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-fuchsia-600" />
          {isFinnish ? "Kirjaa tämänpäiväinen matka tai toiminto:" : "Log today's trip or activity:"}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isFinnish ? "esim. Ajoin Turkuun tänään" : "e.g. Drove to Turku today"}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-fuchsia-500 shadow-xs"
          />
          <button
            disabled={!draft.trim()}
            className="px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-fuchsia-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFinnish ? "Kirjaa" : "Log it"}</span>
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">{isFinnish ? "Viimeisimmät merkinnät" : "Recent entries"}</h3>
        <div className="space-y-3">
          {SAMPLE_LOG.map((entry) => {
            const Icon = MODE_ICON[entry.mode];
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{entry.text}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Globe2 className="w-3 h-3" />
                      <span>
                        {entry.distanceKm} km · {entry.country}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black ${
                    entry.co2Kg === 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {entry.co2Kg === 0 ? (isFinnish ? "0 kg — päästötön" : "0 kg — zero-emission") : `${entry.co2Kg} kg CO2e`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
