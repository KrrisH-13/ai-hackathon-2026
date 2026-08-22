"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Car, Train, Bike, Bus, Plane, Ship, Footprints, Zap, Globe2, Sparkles, X, RotateCw as Spinner } from "lucide-react";
import type { ActivityMode, ActivityLogEstimate, Co2LogEntry } from "@/lib/ecopilot/types";
import { extractActivityAPI } from "@/lib/ecopilot/client";
import { fetchCo2LogsAPI, addCo2LogAPI } from "@/lib/ecopilot/profileClient";

interface ActivityLoggerViewProps {
  isFinnish: boolean;
}

const MODE_ICON: Record<ActivityMode, typeof Car> = {
  car: Car,
  ev: Zap,
  train: Train,
  bus: Bus,
  bike: Bike,
  walk: Footprints,
  plane: Plane,
  ferry: Ship,
};

/** Source tag this feature writes to the shared CO2 ledger — the reward system (WIP elsewhere) can filter on this later. */
const ACTIVITY_LOGGER_SOURCE = "activity-logger";

/** Bundles the trip context into the ledger's single description string so it survives the round trip through Supabase. */
function buildLogDescription(estimate: ActivityLogEstimate): string {
  const { extraction } = estimate;
  const place = extraction.destination ?? extraction.origin;
  const suffix = `(${extraction.distanceKm} km, ${extraction.country})`;
  const base = extraction.rawText.trim() || `${extraction.mode} trip${place ? ` to ${place}` : ""}`;
  return `${base} ${suffix}`.slice(0, 200);
}

export function ActivityLoggerView({ isFinnish }: ActivityLoggerViewProps) {
  const [draft, setDraft] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [estimate, setEstimate] = useState<ActivityLogEstimate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<Co2LogEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  const loadEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const { entries } = await fetchCo2LogsAPI(30);
      setEntries(entries.filter((entry) => entry.source === ACTIVITY_LOGGER_SOURCE));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadEntries();
  }, []);

  const handleExtract = async () => {
    if (!draft.trim() || isExtracting) return;
    setIsExtracting(true);
    setErrorMessage(null);
    setEstimate(null);
    try {
      const result = await extractActivityAPI(draft.trim());
      setEstimate(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to parse that activity");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = async () => {
    if (!estimate || isSaving) return;
    setIsSaving(true);
    try {
      await addCo2LogAPI({
        category: "transport",
        description: buildLogDescription(estimate),
        co2Kg: estimate.co2Kg,
        source: ACTIVITY_LOGGER_SOURCE,
      });
      setDraft("");
      setEstimate(null);
      await loadEntries();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save that entry");
    } finally {
      setIsSaving(false);
    }
  };

  const EstimateIcon = estimate ? MODE_ICON[estimate.extraction.mode] : null;

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
            onKeyDown={(e) => e.key === "Enter" && handleExtract()}
            placeholder={isFinnish ? "esim. Ajoin Turkuun tänään" : "e.g. Drove to Turku today"}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-fuchsia-500 shadow-xs"
          />
          <button
            onClick={handleExtract}
            disabled={!draft.trim() || isExtracting}
            className="px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-fuchsia-600/20"
          >
            {isExtracting ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isFinnish ? "Kirjaa" : "Log it"}</span>
          </button>
        </div>

        {errorMessage && <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>}

        {estimate && EstimateIcon && (
          <div className="rounded-2xl bg-fuchsia-50/60 border border-fuchsia-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-fuchsia-200 flex items-center justify-center shrink-0">
                  <EstimateIcon className="w-4 h-4 text-fuchsia-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{estimate.extraction.rawText}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Globe2 className="w-3 h-3" />
                    <span>
                      {estimate.extraction.distanceKm} km · {estimate.extraction.country}
                    </span>
                  </div>
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black bg-fuchsia-200 text-fuchsia-900">
                {estimate.co2Kg} kg CO2e
              </span>
            </div>
            <p className="text-[11px] text-slate-600">{estimate.factorNote}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                {isSaving ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isFinnish ? "Vahvista ja tallenna" : "Confirm & log it"}</span>
              </button>
              <button
                onClick={() => setEstimate(null)}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 font-bold text-xs transition flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isFinnish ? "Hylkää" : "Discard"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">{isFinnish ? "Viimeisimmät merkinnät" : "Recent entries"}</h3>

        {isLoadingEntries ? (
          <div className="h-20 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Spinner className="w-4 h-4 animate-spin" />
            {isFinnish ? "Ladataan..." : "Loading..."}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-slate-400">
            {isFinnish ? "Ei kirjauksia vielä — kirjoita ensimmäinen matka yllä." : "No entries yet — log your first trip above."}
          </p>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 15).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{entry.description}</p>
                  <p className="text-[10px] text-slate-500">{entry.occurredOn}</p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black ${
                    entry.co2Kg === 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {entry.co2Kg === 0 ? (isFinnish ? "0 kg — päästötön" : "0 kg — zero-emission") : `${entry.co2Kg} kg CO2e`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

