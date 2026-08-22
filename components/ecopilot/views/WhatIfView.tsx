"use client";

import { useState } from "react";
import { Lightbulb, Sparkles, ArrowRight } from "lucide-react";

interface WhatIfViewProps {
  isFinnish: boolean;
}

const EXAMPLE_PROMPTS_EN = [
  "What if I biked instead of driving 3x/week?",
  "What if I switched to district heating?",
  "What if I took the train to Turku instead of driving?",
];

const EXAMPLE_PROMPTS_FI = [
  "Entä jos pyöräilisin autoilun sijaan 3x/viikossa?",
  "Entä jos vaihtaisin kaukolämpöön?",
  "Entä jos ottaisin junan Turkuun auton sijaan?",
];

/** Layout only — SAMPLE_PROJECTION stands in for reasoning over the user's real logged Supabase data. */
const SAMPLE_PROJECTION = {
  prompt: "What if I biked instead of driving 3x/week?",
  co2SavedKgPerYear: 187,
  moneySavedEurPerYear: 312,
  narrative:
    "Based on your logged commute distance (8.4 km, 3x/week), switching to biking would cut roughly 187 kg CO2e and €312 in fuel/parking per year — with almost no time penalty on Espoo's Baana network.",
};

export function WhatIfView({ isFinnish }: WhatIfViewProps) {
  const [draft, setDraft] = useState("");
  const prompts = isFinnish ? EXAMPLE_PROMPTS_FI : EXAMPLE_PROMPTS_EN;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/60 border border-cyan-200/80 p-6 sm:p-8 space-y-2 shadow-xs">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
          💡 {isFinnish ? "Entä jos -projektiot" : "What-if Projections"}
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isFinnish ? "Kysy, ja saat arvion omien tietojesi pohjalta" : "Ask, and get a projection grounded in your own data"}
        </h2>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          {isFinnish
            ? "Kysy esimerkiksi mitä tapahtuisi, jos vaihtaisit kulkutapaa — arvio perustuu päiväkirjaan kirjattuihin matkoihisi."
            : "Ask something like what would happen if you changed a habit — the projection reasons over your logged activity."}
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={prompts[0]}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-xs"
          />
          <button
            disabled={!draft.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFinnish ? "Kysy" : "Ask"}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setDraft(p)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 text-xs font-medium border border-slate-200 transition"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-cyan-600" />
          <span>{isFinnish ? "Esimerkkiprojektio" : "Sample projection"}</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
          <span>{isFinnish ? SAMPLE_PROJECTION.prompt : SAMPLE_PROJECTION.prompt}</span>
        </p>
        <p className="text-xs text-slate-700 leading-relaxed">{SAMPLE_PROJECTION.narrative}</p>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">
            {isFinnish ? "Vuotuinen projisoitu säästö" : "Projected annual savings"}
          </span>
          <h4 className="text-lg font-black">{isFinnish ? "Jos toteutat tämän muutoksen" : "If you make this change"}</h4>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px]">
            <div className="text-2xl font-black text-emerald-200">-{SAMPLE_PROJECTION.co2SavedKgPerYear} kg</div>
            <div className="text-[10px] text-cyan-100 font-bold">CO2e / {isFinnish ? "vuosi" : "year"}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px]">
            <div className="text-2xl font-black text-amber-200">+{SAMPLE_PROJECTION.moneySavedEurPerYear} €</div>
            <div className="text-[10px] text-cyan-100 font-bold">{isFinnish ? "Säästö" : "Saved"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
