"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NotebookPen, Receipt, Globe2, Plus, Sparkles, Trash2, X, RotateCw as Spinner } from "lucide-react";
import type { ActivityLogEstimate, Co2LogEntry, GroceryReceiptItem, UserProfile } from "@/lib/ecopilot/types";
import { extractActivityAPI, scanReceiptAPI } from "@/lib/ecopilot/client";
import { fetchCo2LogsAPI, addCo2LogAPI, deleteCo2LogAPI } from "@/lib/ecopilot/profileClient";
import { ACTIVITY_MODE_ICONS, CO2_CATEGORY_ICONS } from "@/components/ecopilot/activityIcons";
import { InfoHint } from "@/components/ecopilot/InfoHint";
import { ViewHero } from "@/components/ecopilot/ViewHero";
import { QuickTripPanel } from "@/components/ecopilot/views/QuickTripPanel";

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const [draft, setDraft] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [estimate, setEstimate] = useState<ActivityLogEstimate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<Co2LogEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Receipt scanning — a second way to add to the same log, triggered by the
  // "Scan a receipt" button next to the text input rather than a separate tab.
  const receiptFileInputRef = useRef<HTMLInputElement>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState<GroceryReceiptItem[]>([]);
  const [receiptSwapSuggestions, setReceiptSwapSuggestions] = useState<string[]>([]);
  const [loggedReceiptItemNames, setLoggedReceiptItemNames] = useState<Set<string>>(new Set());
  const [receiptErrorMessage, setReceiptErrorMessage] = useState<string | null>(null);

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

  const handleReceiptFileSelect = async (file: File) => {
    setReceiptErrorMessage(null);
    setIsScanningReceipt(true);
    setReceiptItems([]);
    setReceiptSwapSuggestions([]);
    setLoggedReceiptItemNames(new Set());
    try {
      const base64 = await fileToBase64(file);
      setReceiptPreviewUrl(base64);
      const result = await scanReceiptAPI(base64);
      if (result.items.length === 0) {
        setReceiptErrorMessage(
          isFinnish
            ? "Kuittia ei tunnistettu — kokeile selkeämpää valokuvaa."
            : "Couldn't read that receipt — try a clearer photo."
        );
      }
      setReceiptItems(result.items);
      setReceiptSwapSuggestions(result.swapSuggestions);
    } catch (err) {
      setReceiptErrorMessage(err instanceof Error ? err.message : "Failed to scan receipt");
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const handleLogReceiptItem = async (item: GroceryReceiptItem) => {
    try {
      await addCo2LogAPI({ category: "food", description: item.name, co2Kg: item.estimatedCo2Kg, source: ACTIVITY_LOGGER_SOURCE });
      setLoggedReceiptItemNames((prev) => new Set(prev).add(item.name));
      await loadEntries();
    } catch (err) {
      setReceiptErrorMessage(err instanceof Error ? err.message : "Failed to save that item");
    }
  };

  const handleDiscardReceipt = () => {
    setReceiptPreviewUrl(null);
    setReceiptItems([]);
    setReceiptSwapSuggestions([]);
    setLoggedReceiptItemNames(new Set());
    setReceiptErrorMessage(null);
    if (receiptFileInputRef.current) receiptFileInputRef.current.value = "";
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

  const receiptTotalCo2Kg = useMemo(
    () => receiptItems.reduce((sum, item) => sum + item.estimatedCo2Kg, 0),
    [receiptItems]
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
        badge={`📝 ${isFinnish ? "Luonnollisen kielen päiväkirja" : "Natural-language Activity Log"}`}
        title={isFinnish ? "Kirjoita mitä teit — tai skannaa kuitti" : "Type what you did — or scan a receipt"}
        description={
          isFinnish
            ? '"Ajoin Turkuun tänään", "söin naudanlihapihvin" tai "lämmitin saunan tunniksi" — matkoille lasketaan maakohtainen päästökerroin (sähköauto Norjassa ≈ lähes päästötön, sama Puolassa ei), muut saavat elinkaariarvion. Kuitin kohdalla Gemini Vision lukee rivit ja arvioi jalanjäljen tuotteittain, sekä ehdottaa vähäpäästöisempiä vaihtoja.'
            : "\"Drove to Turku today\", \"beef burger for lunch\" or \"ran the sauna for an hour\" — trips get a country-aware emission factor (an EV in Norway ≈ near-zero; in Poland it isn't), everything else gets a lifecycle estimate. For a receipt, Gemini Vision reads each line, estimates a per-item footprint, and suggests lower-carbon swaps."
        }
      />

      <QuickTripPanel
        isFinnish={isFinnish}
        userProfile={userProfile}
        profileHref={profileHref}
        placesHref={placesHref}
        source={ACTIVITY_LOGGER_SOURCE}
        onLogged={loadEntries}
      />

      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-fuchsia-600" />
          {isFinnish ? "Kirjaa tämänpäiväinen matka tai toiminto:" : "Log today's trip or activity:"}
          <InfoHint
            isFinnish={isFinnish}
            label={isFinnish ? "Toiminto" : "Activity"}
            instruction={
              isFinnish
                ? "Kirjoita yksi toiminto tavallisena lauseena. Matkoista kerro kulkutapa ja suunnilleen matka tai paikannimet (ja maa jos et ollut Suomessa); muista, kuten aterioista, lämmityksestä tai pyykinpesusta, riittää lyhyt kuvaus. Tekoäly arvioi CO2:n. Voit myös skannata ruokakuitin alla olevasta painikkeesta — se lukee rivit ja arvioi jalanjäljen tuotteittain."
                : "Write one activity as a normal sentence. For trips, say how you travelled plus a rough distance or place names (and the country if it wasn't Finland); for anything else — a meal, heating, laundry — a short description is enough. AI estimates the CO2. Or scan a grocery receipt with the button below — it reads each line and estimates a per-item footprint."
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
            className="visible-text-cursor flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-fuchsia-500 shadow-xs"
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

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-400 font-semibold">{isFinnish ? "tai" : "or"}</span>
          <input
            ref={receiptFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleReceiptFileSelect(file);
            }}
          />
          <button
            type="button"
            onClick={() => receiptFileInputRef.current?.click()}
            disabled={isScanningReceipt}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 disabled:opacity-50 transition"
          >
            {isScanningReceipt ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Receipt className="w-3.5 h-3.5" />}
            <span>{isFinnish ? "Skannaa kuitti" : "Scan a receipt"}</span>
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

        {(receiptPreviewUrl || isScanningReceipt || receiptItems.length > 0) && (
          <div className="rounded-2xl bg-orange-50/60 border border-orange-200 p-4 space-y-3">
            <div className="flex items-center gap-3">
              {receiptPreviewUrl && (
                /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data: URI preview, not an optimizable static asset */
                <img
                  src={receiptPreviewUrl}
                  alt={isFinnish ? "Kuittikuva" : "Receipt preview"}
                  className="w-12 h-12 object-cover rounded-lg border border-orange-200 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="truncate">
                    {isScanningReceipt
                      ? isFinnish
                        ? "Luetaan kuittia..."
                        : "Reading receipt..."
                      : isFinnish
                        ? "Tunnistetut tuotteet"
                        : "Extracted items"}
                  </span>
                </p>
                {!isScanningReceipt && receiptItems.length > 0 && (
                  <p className="text-[12px] text-slate-500">
                    {receiptItems.length} {isFinnish ? "tuotetta" : "items"} · {receiptTotalCo2Kg.toFixed(1)} kg CO2e{" "}
                    {isFinnish ? "yhteensä" : "total"}
                  </p>
                )}
              </div>
              {isScanningReceipt ? (
                <Spinner className="w-4 h-4 text-orange-600 animate-spin shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={handleDiscardReceipt}
                  title={isFinnish ? "Hylkää" : "Discard"}
                  aria-label={isFinnish ? "Hylkää kuitti" : "Discard receipt"}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {receiptErrorMessage && <p className="text-xs text-rose-600 font-medium">{receiptErrorMessage}</p>}

            {receiptItems.length > 0 && (
              <div className="space-y-2">
                {receiptItems.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-orange-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[11px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-700">{item.estimatedCo2Kg.toFixed(1)} kg</span>
                      <button
                        type="button"
                        onClick={() => handleLogReceiptItem(item)}
                        disabled={loggedReceiptItemNames.has(item.name)}
                        title={isFinnish ? "Kirjaa" : "Log it"}
                        className="p-1.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-700 hover:bg-orange-200 disabled:opacity-40 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {receiptSwapSuggestions.length > 0 && (
              <ul className="space-y-1">
                {receiptSwapSuggestions.map((s, i) => (
                  <li key={i} className="text-[12px] text-emerald-800 leading-relaxed">
                    🌱 {s}
                  </li>
                ))}
              </ul>
            )}
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

