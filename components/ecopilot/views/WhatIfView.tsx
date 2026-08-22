"use client";

import { useState } from "react";
import { Lightbulb, Sparkles, ArrowRight, AlertTriangle, Plus, CheckCircle2, ListChecks } from "lucide-react";
import type { UserProfile, Season, WhatIfProjection } from "@/lib/ecopilot/types";
import { projectWhatIfScenarioAPI } from "@/lib/ecopilot/client";

interface WhatIfViewProps {
  userProfile: UserProfile;
  currentSeason: Season;
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

const CONFIDENCE_LABEL: Record<WhatIfProjection["confidence"], { en: string; fi: string; className: string }> = {
  high: { en: "High confidence", fi: "Korkea luotettavuus", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  medium: { en: "Medium confidence", fi: "Kohtalainen luotettavuus", className: "bg-amber-100 text-amber-800 border-amber-200" },
  low: { en: "Low confidence", fi: "Matala luotettavuus", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export function WhatIfView({ userProfile, currentSeason, isFinnish }: WhatIfViewProps) {
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projection, setProjection] = useState<WhatIfProjection | null>(null);
  const [planItems, setPlanItems] = useState<WhatIfProjection[]>([]);
  const prompts = isFinnish ? EXAMPLE_PROMPTS_FI : EXAMPLE_PROMPTS_EN;

  const isCurrentAdded = projection ? planItems.includes(projection) : false;
  const totalCo2SavedKgPerYear = planItems.reduce((sum, p) => sum + p.co2SavedKgPerYear, 0);
  const totalMoneySavedEurPerYear = planItems.reduce((sum, p) => sum + p.moneySavedEurPerYear, 0);

  const handleAsk = async () => {
    const question = draft.trim();
    if (!question || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await projectWhatIfScenarioAPI(question, userProfile, currentSeason);
      setProjection(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate a projection");
    } finally {
      setIsLoading(false);
    }
  };

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
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={prompts[0]}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-xs disabled:opacity-60"
          />
          <button
            onClick={handleAsk}
            disabled={!draft.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/20"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? (isFinnish ? "Lasketaan…" : "Thinking…") : isFinnish ? "Kysy" : "Ask"}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setDraft(p)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 text-xs font-medium border border-slate-200 transition disabled:opacity-60"
            >
              {p}
            </button>
          ))}
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>

      {projection && (
        <div key={projection.question + projection.narrative} className="space-y-8 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-cyan-600" />
                <span>{isFinnish ? "Projektio" : "Projection"}</span>
              </h3>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${CONFIDENCE_LABEL[projection.confidence].className}`}
              >
                {isFinnish ? CONFIDENCE_LABEL[projection.confidence].fi : CONFIDENCE_LABEL[projection.confidence].en}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
              <span>{projection.question}</span>
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{projection.narrative}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed italic">{projection.assumption}</p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">
                {isFinnish ? "Vuotuinen projisoitu säästö" : "Projected annual savings"}
              </span>
              <h4 className="text-lg font-black">{isFinnish ? "Jos toteutat tämän muutoksen" : "If you make this change"}</h4>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px] hover:scale-105 transition">
                <div className="text-2xl font-black text-emerald-200">-{projection.co2SavedKgPerYear} kg</div>
                <div className="text-[10px] text-cyan-100 font-bold">CO2e / {isFinnish ? "vuosi" : "year"}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px] hover:scale-105 transition">
                <div className="text-2xl font-black text-amber-200">+{projection.moneySavedEurPerYear} €</div>
                <div className="text-[10px] text-cyan-100 font-bold">{isFinnish ? "Säästö" : "Saved"}</div>
              </div>
            </div>
            <button
              onClick={() => !isCurrentAdded && setPlanItems((prev) => [...prev, projection])}
              disabled={isCurrentAdded}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-50 disabled:bg-white/20 disabled:text-white"
            >
              {isCurrentAdded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isFinnish ? "Lisätty suunnitelmaan" : "Added to plan"}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isFinnish ? "Lisää suunnitelmaan" : "Add to plan"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {planItems.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              <span>{isFinnish ? "Suunnitelmasi" : "Your plan"}</span>
            </h3>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-700">-{totalCo2SavedKgPerYear} kg CO2e</span>
              <span className="text-amber-700">+{totalMoneySavedEurPerYear} €</span>
            </div>
          </div>
          <ul className="space-y-2">
            {planItems.map((item, idx) => (
              <li
                key={item.question + idx}
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-700 flex-1">{item.question}</span>
                <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                  -{item.co2SavedKgPerYear} kg · +{item.moneySavedEurPerYear} €
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
