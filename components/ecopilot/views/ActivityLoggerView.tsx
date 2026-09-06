"use client";

import { useEffect, useMemo, useState } from "react";
import { NotebookPen, Receipt, Globe2, Sparkles, Trash2, X, RotateCw as Spinner } from "lucide-react";
import type { ActivityLogEstimate, Co2LogEntry, UserProfile } from "@/lib/ecopilot/types";
import { extractActivityAPI } from "@/lib/ecopilot/client";
import { fetchCo2LogsAPI, addCo2LogAPI, deleteCo2LogAPI } from "@/lib/ecopilot/profileClient";
import { ACTIVITY_MODE_ICONS, CO2_CATEGORY_ICONS } from "@/components/ecopilot/activityIcons";
import { InfoHint } from "@/components/ecopilot/InfoHint";
import { ViewHero } from "@/components/ecopilot/ViewHero";
import { ReceiptScannerPanel } from "@/components/ecopilot/views/ReceiptScannerPanel";
import { QuickTripPanel } from "@/components/ecopilot/views/QuickTripPanel";

/** Which input mode the page is showing — a free-text trip, or a scanned grocery receipt. */
type InputMode = "trip" | "receipt";

interface ActivityLoggerViewProps {
  isFinnish: boolean;
  /** Drives the one-click quick-trip buttons (home coordinates + saved frequent places). */
  userProfile: UserProfile;
  /** Link to the profile editor, used by the quick-trip panel when there's no home address yet. */
  profileHref: string;
  /** Link to the frequently-visited-places editor, used by the quick-trip panel when there's nothing to offer yet. */
  placesHref: string;
}

/** Source tag this feature writes to the shared CO2 ledger — the reward system (WIP elsewhere) can filter on this later. */
const ACTIVITY_LOGGER_SOURCE = "activity-logger";

/** How many of the most recent entries to show before grouping by day. */
const RECENT_ENTRIES_LIMIT = 15;

interface EntryDayGroup {
  occurredOn: string;
  label: string;
  entries: Co2LogEntry[];
}

/** "Today" / "Yesterday" in occurredOn's own YYYY-MM-DD calendar (matches how the API defaults occurredOn — see co2-logs/route.ts). */
function dayLabel(occurredOn: string, isFinnish: boolean): string {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (occurredOn === todayStr) return isFinnish ? "Tänään" : "Today";
  if (occurredOn === yesterdayStr) return isFinnish ? "Eilen" : "Yesterday";
  return new Intl.DateTimeFormat(isFinnish ? "fi-FI" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${occurredOn}T00:00:00`));
}

/** Buckets already-sorted (newest first) entries into same-day groups, keeping their order. */
function groupEntriesByDay(entries: Co2LogEntry[], isFinnish: boolean): EntryDayGroup[] {
  const groups: EntryDayGroup[] = [];
  for (const entry of entries) {
    const currentGroup = groups.at(-1);
    if (currentGroup?.occurredOn === entry.occurredOn) {
      currentGroup.entries.push(entry);
    } else {
      groups.push({ occurredOn: entry.occurredOn, label: dayLabel(entry.occurredOn, isFinnish), entries: [entry] });
    }
  }
  return groups;
}

/** Flattens the extraction context into the ledger's single description string so it survives the round trip through Supabase. */
function buildLogDescription(estimate: ActivityLogEstimate): string {
  const { extraction } = estimate;
  if (extraction.kind === "general") {
    return (extraction.rawText.trim() || extraction.description).slice(0, 200);
  }
  const place = extraction.destination ?? extraction.origin;
  const suffix = `(${extraction.distanceKm} km, ${extraction.country})`;
  const base = extraction.rawText.trim() || `${extraction.mode} trip${place ? ` to ${place}` : ""}`;
  return `${base} ${suffix}`.slice(0, 200);
}

export function ActivityLoggerView({ isFinnish, userProfile, profileHref, placesHref }: ActivityLoggerViewProps) {
  const [inputMode, setInputMode] = useState<InputMode>("trip");
  const [draft, setDraft] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [estimate, setEstimate] = useState<ActivityLogEstimate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<Co2LogEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        category: estimate.extraction.kind === "trip" ? "transport" : estimate.extraction.category,
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

  const handleDeleteEntry = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    // Optimistic removal — this list is a small personal log, not a source of
    // truth anything else on screen depends on, so we don't wait on the round trip.
    const previousEntries = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteCo2LogAPI(id);
    } catch (err) {
      setEntries(previousEntries);
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete that entry");
    } finally {
      setDeletingId(null);
    }
  };

  const dayGroups = useMemo(
    () => groupEntriesByDay(entries.slice(0, RECENT_ENTRIES_LIMIT), isFinnish),
    [entries, isFinnish]
  );

  const EstimateIcon = estimate
    ? estimate.extraction.kind === "trip"
      ? ACTIVITY_MODE_ICONS[estimate.extraction.mode]
      : CO2_CATEGORY_ICONS[estimate.extraction.category]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-5 animate-fadeIn">
      <ViewHero
        accent="fuchsia"
        isFinnish={isFinnish}
        storageKey="activity-log"
        badge={
          inputMode === "trip"
            ? `📝 ${isFinnish ? "Luonnollisen kielen päiväkirja" : "Natural-language Activity Log"}`
            : `🧾 ${isFinnish ? "Kuitin hiilijalanjälkiarvio" : "Receipt Carbon Estimator"}`
        }
        title={
          inputMode === "trip"
            ? isFinnish
              ? "Kirjoita mitä teit — me hoidamme laskennan"
              : "Just type what you did — we'll do the math"
            : isFinnish
              ? "Kuvaa kuitti, saat karkean päästöarvion"
              : "Snap a receipt, get a rough footprint estimate"
        }
        description={
          inputMode === "trip"
            ? isFinnish
              ? '"Ajoin Turkuun tänään", "söin naudanlihapihvin" tai "lämmitin saunan tunniksi" — matkoille lasketaan maakohtainen päästökerroin (sähköauto Norjassa ≈ lähes päästötön, sama Puolassa ei), muut saavat elinkaariarvion.'
              : `"Drove to Turku today", "beef burger for lunch" or "ran the sauna for an hour" — trips get a country-aware emission factor (an EV in Norway ≈ near-zero; in Poland it isn't), everything else gets a lifecycle estimate.`
            : isFinnish
              ? "Gemini Vision lukee ostoskuitin rivit ja arvioi hiilijalanjäljen tuotteittain. Lisää haluamasi rivit samaan päiväkirjaan."
              : "Gemini Vision reads the grocery receipt's line items and estimates a rough footprint per item. Add the ones you want to the same activity log."
        }
        // The two input modes ride along in the hero row rather than costing
        // their own band of vertical space above the first real control.
        actions={
          <div className="flex gap-1 p-1 rounded-xl bg-white/70 border border-slate-200">
            <button
              onClick={() => setInputMode("trip")}
              aria-pressed={inputMode === "trip"}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition ${
                inputMode === "trip" ? "bg-white text-fuchsia-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <NotebookPen className="w-3.5 h-3.5" />
              <span>{isFinnish ? "Kirjaa matka" : "Log a trip"}</span>
            </button>
            <button
              onClick={() => setInputMode("receipt")}
              aria-pressed={inputMode === "receipt"}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition ${
                inputMode === "receipt" ? "bg-white text-orange-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{isFinnish ? "Skannaa kuitti" : "Scan a receipt"}</span>
            </button>
          </div>
        }
      />

      {inputMode === "receipt" && (
        <ReceiptScannerPanel isFinnish={isFinnish} source={ACTIVITY_LOGGER_SOURCE} onLogged={loadEntries} />
      )}

      {inputMode === "trip" && (
        <QuickTripPanel
          isFinnish={isFinnish}
          userProfile={userProfile}
          profileHref={profileHref}
          placesHref={placesHref}
          source={ACTIVITY_LOGGER_SOURCE}
          onLogged={loadEntries}
        />
      )}

      {inputMode === "trip" && (
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-fuchsia-600" />
          {isFinnish ? "Kirjaa tämänpäiväinen matka tai toiminto:" : "Log today's trip or activity:"}
          <InfoHint
            isFinnish={isFinnish}
            label={isFinnish ? "Toiminto" : "Activity"}
            instruction={
              isFinnish
                ? "Kirjoita yksi toiminto tavallisena lauseena. Matkoista kerro kulkutapa ja suunnilleen matka tai paikannimet (ja maa jos et ollut Suomessa); muista, kuten aterioista, lämmityksestä tai pyykinpesusta, riittää lyhyt kuvaus. Tekoäly arvioi CO2:n."
                : "Write one activity as a normal sentence. For trips, say how you travelled plus a rough distance or place names (and the country if it wasn't Finland); for anything else — a meal, heating, laundry — a short description is enough. AI estimates the CO2."
            }
            example={
              isFinnish
                ? "Otin junan Helsingistä Tampereelle · Naudanlihapata illalliseksi"
                : "Took the train from Helsinki to Tampere · Beef stew for dinner"
            }
          />
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExtract()}
            placeholder={
              isFinnish ? "esim. Ajoin Turkuun · Naudanlihapihvi lounaaksi" : "e.g. Drove to Turku · Beef burger for lunch"
            }
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
                  {estimate.extraction.kind === "trip" ? (
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                      <Globe2 className="w-3 h-3" />
                      <span>
                        {estimate.extraction.distanceKm} km · {estimate.extraction.country}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-md text-[12px] font-bold bg-white border border-fuchsia-200 text-fuchsia-800 capitalize">
                      {estimate.extraction.category}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-black bg-fuchsia-200 text-fuchsia-900">
                {estimate.co2Kg} kg CO2e
              </span>
            </div>
            <p className="text-xs text-slate-600">{estimate.factorNote}</p>
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
      )}

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">{isFinnish ? "Viimeisimmät merkinnät" : "Recent entries"}</h3>

        {isLoadingEntries ? (
          <div className="h-20 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Spinner className="w-4 h-4 animate-spin" />
            {isFinnish ? "Ladataan..." : "Loading..."}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-slate-400">
            {isFinnish
              ? "Ei kirjauksia vielä — kirjaa ensimmäinen matka tai skannaa kuitti yllä."
              : "No entries yet — log your first trip or scan a receipt above."}
          </p>
        ) : (
          <div className="space-y-5">
            {dayGroups.map((group) => (
              <div key={group.occurredOn} className="space-y-2">
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide px-1">{group.label}</p>
                <div className="space-y-2">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{entry.description}</p>
                        <p className="text-[12px] text-slate-500">{entry.occurredOn}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            entry.co2Kg === 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {entry.co2Kg === 0
                            ? isFinnish
                              ? "0 kg — päästötön"
                              : "0 kg — zero-emission"
                            : `${entry.co2Kg} kg CO2e`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={deletingId === entry.id}
                          title={isFinnish ? "Poista" : "Delete"}
                          aria-label={isFinnish ? "Poista merkintä" : "Delete entry"}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition"
                        >
                          {deletingId === entry.id ? (
                            <Spinner className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

