"use client";

import { useEffect, useState } from "react";
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Plus,
  CheckCircle2,
  ListChecks,
  Activity,
  Bike,
  Flame,
  Shuffle,
  RotateCw as Spinner,
} from "lucide-react";
import type { CommuteComparison, FrequentPlace, UserProfile, WhatIfProjection } from "@/lib/ecopilot/types";
import { compareCommuteAPI, projectWhatIfScenarioAPI, suggestHeatingOptimizationsAPI } from "@/lib/ecopilot/client";
import { addCo2LogAPI } from "@/lib/ecopilot/profileClient";
import { InfoHint } from "@/components/ecopilot/InfoHint";

/** A personalized card, one click away from the same full projection panel a manually-typed question produces. */
type Suggestion = WhatIfProjection & { kind: "transport" | "heating" };

/** Gemini's `icon` field is unreliable (e.g. both EV and petrol car often come back "car" — see HslTransitCommuteView's own comment on this), so bike is the only mode matched by keyword; the car figure is just the highest-emission mode returned, which is always the fossil car per the prompt in compareCommuteEmissions. */
function findBikeCo2Grams(modes: CommuteComparison["modes"]): number | null {
  const mode = modes.find((m) => /bike|bicycle|cycl|pyör/.test(`${m.icon} ${m.name}`.toLowerCase()));
  return mode ? mode.co2Grams : null;
}

/** Turns one HSL comparator result for a saved frequent place into a suggestion card — the concrete "bike/HSL beats car" callout. */
function buildTransportSuggestion(place: FrequentPlace, comparison: CommuteComparison, isFinnish: boolean): Suggestion {
  const bikeCo2 = findBikeCo2Grams(comparison.modes);
  const carCo2 = comparison.modes.length > 0 ? Math.max(...comparison.modes.map((m) => m.co2Grams)) : null;
  const advantage =
    bikeCo2 != null && carCo2 != null && carCo2 > 0
      ? isFinnish
        ? ` Pyöräily päästäisi ${bikeCo2} g CO2/matka autoilun ${carCo2} g sijaan — ${Math.round((1 - bikeCo2 / carCo2) * 100)}% vähemmän.`
        : ` Biking would emit ${bikeCo2} g CO2/trip vs ${carCo2} g by car — ${Math.round((1 - bikeCo2 / carCo2) * 100)}% less.`
      : "";

  return {
    kind: "transport",
    question: isFinnish
      ? `Entä jos vaihtaisit kulkutavan reitillä Koti → ${place.label} HSL:ään tai pyörään?`
      : `What if you switched Home → ${place.label} trips to HSL transit or biking?`,
    narrative:
      (isFinnish
        ? `HSL-vertailu reitille ${comparison.origin} → ${comparison.destination} (${comparison.distanceKm} km).`
        : `HSL comparison for ${comparison.origin} → ${comparison.destination} (${comparison.distanceKm} km).`) + advantage,
    co2SavedKgPerYear: comparison.yearlySavingIfSwitchingToTransit.co2Kg,
    moneySavedEurPerYear: comparison.yearlySavingIfSwitchingToTransit.moneyEur,
    assumption: isFinnish
      ? "Perustuu HSL-vertailuun juuri tälle reitille, olettaen 220 työpäivää vuodessa joukkoliikenteellä."
      : "Based on the HSL comparator for this exact route, assuming 220 workdays/year switched to transit.",
    confidence: "high",
  };
}

interface WhatIfViewProps {
  userProfile: UserProfile;
  isFinnish: boolean;
}

const EXAMPLE_PROMPTS_EN = [
  "What if I biked instead of driving 3x/week?",
  "What if I switched to district heating?",
  "What if I took the train to Turku instead of driving?",
  "What if I sorted all my waste per HSY guidelines instead of mixed waste?",
  "What if I ran my sauna during off-peak electricity hours?",
];

const EXAMPLE_PROMPTS_FI = [
  "Entä jos pyöräilisin autoilun sijaan 3x/viikossa?",
  "Entä jos vaihtaisin kaukolämpöön?",
  "Entä jos ottaisin junan Turkuun auton sijaan?",
  "Entä jos lajittelisin kaiken jätteeni HSY:n ohjeiden mukaan sekajätteen sijaan?",
  "Entä jos lämmittäisin saunan halvimman sähkön aikaan?",
];

const CONFIDENCE_LABEL: Record<WhatIfProjection["confidence"], { en: string; fi: string; className: string }> = {
  high: { en: "High confidence", fi: "Korkea luotettavuus", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  medium: { en: "Medium confidence", fi: "Kohtalainen luotettavuus", className: "bg-amber-100 text-amber-800 border-amber-200" },
  low: { en: "Low confidence", fi: "Matala luotettavuus", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

/**
 * Suggestions survive here (module scope, not component state) because
 * EcopilotApp mounts/unmounts each tab's view on every switch — without this,
 * revisiting the What-If tab would re-run every HSL/Gemini call from scratch
 * each time. Cleared on a full page reload; can go stale if the profile
 * changes mid-session without one (acceptable — a rare case for a per-session cache).
 */
const suggestionsCache = new Map<string, Suggestion[]>();

export function WhatIfView({ userProfile, isFinnish }: WhatIfViewProps) {
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projection, setProjection] = useState<WhatIfProjection | null>(null);
  const [planItems, setPlanItems] = useState<WhatIfProjection[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [loggedKeys, setLoggedKeys] = useState<Set<string>>(new Set());
  const [logError, setLogError] = useState<string | null>(null);
  const cached = suggestionsCache.get(userProfile.id);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(cached ?? []);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(!cached);
  const prompts = isFinnish ? EXAMPLE_PROMPTS_FI : EXAMPLE_PROMPTS_EN;

  useEffect(() => {
    if (suggestionsCache.has(userProfile.id)) return;

    let cancelled = false;

    async function loadSuggestions() {
      // Only places with an already-driven/transit mode are worth an HSL alternative — bike/walk places are already optimal.
      const eligiblePlaces = userProfile.homeAddress
        ? userProfile.frequentPlaces
            .filter((p) => p.address && p.transportMode !== "bike" && p.transportMode !== "walk")
            .slice(0, 3)
        : [];

      const [transportSuggestions, heatingSuggestions] = await Promise.all([
        Promise.all(
          eligiblePlaces.map(async (place) => {
            const comparison = await compareCommuteAPI(userProfile.homeAddress as string, place.address as string);
            return buildTransportSuggestion(place, comparison, isFinnish);
          })
        ),
        suggestHeatingOptimizationsAPI(userProfile).then((list) =>
          list.map((s): Suggestion => ({ ...s, kind: "heating" }))
        ),
      ]);

      const merged = [...transportSuggestions, ...heatingSuggestions];
      suggestionsCache.set(userProfile.id, merged);
      if (!cancelled) {
        setSuggestions(merged);
        setIsLoadingSuggestions(false);
      }
    }

    loadSuggestions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one personalized batch per profile id (see suggestionsCache above)
  }, [userProfile.id]);

  const isCurrentAdded = projection ? planItems.includes(projection) : false;
  const projectionKey = projection ? projection.question + projection.narrative : null;
  const isCurrentLogged = projectionKey ? loggedKeys.has(projectionKey) : false;
  const totalCo2SavedKgPerYear = planItems.reduce((sum, p) => sum + p.co2SavedKgPerYear, 0);
  const totalMoneySavedEurPerYear = planItems.reduce((sum, p) => sum + p.moneySavedEurPerYear, 0);

  const handleLogToTracker = async () => {
    if (!projection || !projectionKey || isCurrentLogged || isLogging) return;
    setIsLogging(true);
    setLogError(null);
    try {
      await addCo2LogAPI({
        category: "other",
        description: `${projection.question} (projected annual change)`,
        co2Kg: -Math.abs(projection.co2SavedKgPerYear),
        source: "what-if",
      });
      setLoggedKeys((prev) => new Set(prev).add(projectionKey));
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Failed to log this projection");
    } finally {
      setIsLogging(false);
    }
  };

  const handleAsk = async (questionOverride?: string) => {
    const question = (questionOverride ?? draft).trim();
    if (!question || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await projectWhatIfScenarioAPI(question, userProfile);
      setDraft(question);
      setProjection(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate a projection");
    } finally {
      setIsLoading(false);
    }
  };

  /** Picks a random CO2-saving topic and asks it immediately — a one-click alternative to typing or picking a personalized suggestion. */
  const handleRandomAsk = () => {
    const pool = isFinnish ? EXAMPLE_PROMPTS_FI : EXAMPLE_PROMPTS_EN;
    handleAsk(pool[Math.floor(Math.random() * pool.length)]);
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

      {projection && (
        <div key={projection.question + projection.narrative} className="space-y-8 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-cyan-600" />
                <span>{isFinnish ? "Projektio" : "Projection"}</span>
              </h3>
              <span
                className={`px-2.5 py-1 rounded-full text-[12px] font-bold border ${CONFIDENCE_LABEL[projection.confidence].className}`}
              >
                {isFinnish ? CONFIDENCE_LABEL[projection.confidence].fi : CONFIDENCE_LABEL[projection.confidence].en}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
              <span>{projection.question}</span>
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{projection.narrative}</p>
            <p className="text-xs text-slate-500 leading-relaxed italic">{projection.assumption}</p>
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
                <div className="text-[12px] text-cyan-100 font-bold">CO2e / {isFinnish ? "vuosi" : "year"}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px] hover:scale-105 transition">
                <div className="text-2xl font-black text-amber-200">+{projection.moneySavedEurPerYear} €</div>
                <div className="text-[12px] text-cyan-100 font-bold">{isFinnish ? "Säästö" : "Saved"}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
              <button
                onClick={() => !isCurrentAdded && setPlanItems((prev) => [...prev, projection])}
                disabled={isCurrentAdded}
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-50 disabled:bg-white/20 disabled:text-white"
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

              <button
                onClick={handleLogToTracker}
                disabled={isCurrentLogged || isLogging}
                title={
                  isFinnish
                    ? "Kirjaa tämä toteutuneena tekona Seuranta & Palkinnot -osioon"
                    : "Log this as a real, completed action in Tracker & Rewards"
                }
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-800 disabled:bg-white/20 disabled:text-white"
              >
                {isCurrentLogged ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isFinnish ? "Kirjattu seurantaan" : "Logged to tracker"}</span>
                  </>
                ) : (
                  <>
                    <Activity className={`w-3.5 h-3.5 ${isLogging ? "animate-pulse" : ""}`} />
                    <span>{isFinnish ? "Kirjaa toteutuneeksi" : "Log it as done"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {logError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{logError}</span>
            </p>
          )}

          <p className="text-[12px] text-slate-400 italic">
            {isFinnish
              ? "\"Kirjaa toteutuneeksi\" merkitsee koko vuotuisen projisoidun säästön yhtenä merkintänä Päästö- ja Palkintohistoriaan — käytä vain, kun olet oikeasti tekemässä tämän muutoksen."
              : "\"Log it as done\" records the full projected annual saving as one entry in the CO2 & Rewards history — only use this once you're actually committing to the change."}
          </p>
        </div>
      )}

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          {isFinnish ? "Kuvaile muutos, jonka haluat arvioida:" : "Describe the change you want to project:"}
          <InfoHint
            isFinnish={isFinnish}
            label={isFinnish ? "Skenaario" : "Scenario"}
            instruction={
              isFinnish
                ? "Kysy ”entä jos” yhden tavan muuttamisesta. Kerro kuinka usein ja mistä mihin vaihtaisit."
                : "Ask a 'what if' about changing one habit. Include how often, and what you'd switch from and to."
            }
            example={
              isFinnish
                ? "Entä jos pyöräilisin töihin 3 päivänä viikossa autoilun sijaan?"
                : "What if I biked to work 3 days a week instead of driving?"
            }
          />
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={prompts[0]}
            disabled={isLoading}
            className="visible-text-cursor flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-xs disabled:opacity-60"
          />
          <button
            onClick={() => handleAsk()}
            disabled={!draft.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/20"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? (isFinnish ? "Lasketaan…" : "Thinking…") : isFinnish ? "Kysy" : "Ask"}</span>
          </button>
        </div>

        {(isLoadingSuggestions || suggestions.length > 0) && (
          <div className="space-y-1.5">
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              {isFinnish ? "Sinulle räätälöityä" : "Personalized for you"}
            </span>
            {isLoadingSuggestions ? (
              <div className="h-10 flex items-center gap-2 text-slate-400 text-xs">
                <Spinner className="w-4 h-4 animate-spin" />
                {isFinnish ? "Ladataan..." : "Loading..."}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, idx) => {
                  const isActive = projection?.question === s.question;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProjection(s)}
                      aria-pressed={isActive}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isActive
                          ? "bg-cyan-600 border-cyan-600 text-white"
                          : "bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 border-slate-200"
                      }`}
                    >
                      {s.kind === "transport" ? (
                        <Bike className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{s.question}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
            {isFinnish ? "Esimerkkejä" : "Examples"}
          </span>
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
            <button
              type="button"
              onClick={handleRandomAsk}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold border border-dashed border-cyan-300 transition disabled:opacity-60"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isFinnish ? "Satunnainen aihe" : "Random topic"}</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>

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
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
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
