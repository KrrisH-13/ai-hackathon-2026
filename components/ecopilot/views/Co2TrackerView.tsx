"use client";

import { useEffect, useState } from "react";
import { Gauge, Plus, Trash2, Flame, Zap, RotateCw, Compass, Utensils, MoreHorizontal, RotateCw as Spinner } from "lucide-react";
import type { Co2LogCategory, Co2LogEntry, Co2DailyTotal, UserProfile } from "@/lib/ecopilot/types";
import { fetchCo2LogsAPI, addCo2LogAPI, deleteCo2LogAPI } from "@/lib/ecopilot/profileClient";

interface Co2TrackerViewProps {
  userProfile: UserProfile;
  isFinnish: boolean;
}

const CATEGORY_META: Record<Co2LogCategory, { icon: typeof Flame; fi: string; en: string }> = {
  heating: { icon: Flame, fi: "Lämmitys", en: "Heating" },
  transport: { icon: Compass, fi: "Liikenne", en: "Transport" },
  waste: { icon: RotateCw, fi: "Jäte", en: "Waste" },
  energy: { icon: Zap, fi: "Sähkö", en: "Energy" },
  food: { icon: Utensils, fi: "Ruoka", en: "Food" },
  other: { icon: MoreHorizontal, fi: "Muu", en: "Other" },
};

const CHART_DAYS = 14;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function Co2TrackerView({ userProfile, isFinnish }: Co2TrackerViewProps) {
  const [entries, setEntries] = useState<Co2LogEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState<Co2DailyTotal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [category, setCategory] = useState<Co2LogCategory>("transport");
  const [description, setDescription] = useState("");
  const [co2Kg, setCo2Kg] = useState("");

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const { entries, dailyTotals } = await fetchCo2LogsAPI(CHART_DAYS);
      setEntries(entries);
      setDailyTotals(dailyTotals);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadLogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCo2Kg = Number(co2Kg);
    if (!description.trim() || Number.isNaN(parsedCo2Kg)) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await addCo2LogAPI({ category, description: description.trim(), co2Kg: parsedCo2Kg });
      setDescription("");
      setCo2Kg("");
      await loadLogs();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteCo2LogAPI(id);
      await loadLogs();
    } catch (err) {
      console.error(err);
      await loadLogs();
    }
  };

  const today = todayIso();
  const barsByDate = new Map(dailyTotals.map((d) => [d.date, d.netCo2Kg]));
  const last14Dates = Array.from({ length: CHART_DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (CHART_DAYS - 1 - i));
    return d.toISOString().slice(0, 10);
  });

  const todayTotal = barsByDate.get(today) ?? 0;
  const last7Total = last14Dates.slice(-7).reduce((sum, date) => sum + (barsByDate.get(date) ?? 0), 0);
  const maxAbs = Math.max(1, ...dailyTotals.map((d) => Math.abs(d.netCo2Kg)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-50/80 via-white to-emerald-50/60 border border-rose-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
              <Gauge className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              {isFinnish ? "Oma Päästöseuranta" : "My CO2 Tracker"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinnish ? "Päivittäinen Hiilijalanjälki- ja Säästöloki" : "Daily Carbon Activity Ledger"}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isFinnish
              ? "Kirjaa arjen päästöjä ja säästöjä. Positiivinen luku = päästetty CO2, negatiivinen = säästetty/vältetty CO2."
              : "Log day-to-day emissions and savings. Positive = CO2 emitted, negative = CO2 saved/avoided."}
          </p>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label={isFinnish ? "Tänään" : "Today"}
          valueKg={todayTotal}
          isFinnish={isFinnish}
        />
        <StatTile
          label={isFinnish ? "Viimeiset 7 päivää" : "Last 7 days"}
          valueKg={last7Total}
          isFinnish={isFinnish}
        />
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              {isFinnish ? "Säästetty yhteensä" : "Lifetime Saved"}
            </div>
            <div className="text-xl font-black text-slate-100">-{userProfile.savedCo2Kg.toFixed(1)} kg</div>
          </div>
        </div>
      </div>

      {/* Chart + Log form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">
              {isFinnish ? `${CHART_DAYS} päivän päästökäyrä` : `${CHART_DAYS}-Day Net CO2`}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {isFinnish ? "Päästetty" : "Emitted"}
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {isFinnish ? "Säästetty" : "Saved"}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-xs gap-2">
              <Spinner className="w-4 h-4 animate-spin" />
              {isFinnish ? "Ladataan..." : "Loading..."}
            </div>
          ) : (
            <div className="flex items-stretch gap-1 sm:gap-1.5 h-52">
              {last14Dates.map((date) => {
                const value = barsByDate.get(date) ?? 0;
                const isToday = date === today;
                const topPct = value > 0 ? Math.min(100, (Math.abs(value) / maxAbs) * 100) : 0;
                const bottomPct = value < 0 ? Math.min(100, (Math.abs(value) / maxAbs) * 100) : 0;
                const dayLabel = date.slice(8, 10);

                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1" title={`${date}: ${value.toFixed(2)} kg`}>
                    <div className="w-full flex flex-col justify-end h-24">
                      {topPct > 0 && <div style={{ height: `${topPct}%` }} className="w-full bg-rose-500 rounded-t-sm" />}
                    </div>
                    <div className="w-full h-px bg-slate-300" />
                    <div className="w-full flex flex-col justify-start h-24">
                      {bottomPct > 0 && <div style={{ height: `${bottomPct}%` }} className="w-full bg-emerald-500 rounded-b-sm" />}
                    </div>
                    <span className={`text-[9px] font-mono mt-1 ${isToday ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && dailyTotals.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              {isFinnish ? "Ei kirjauksia viime aikoina — lisää ensimmäinen alta." : "No activity logged yet — add your first entry below."}
            </p>
          )}
        </div>

        {/* Log form */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-600" />
            {isFinnish ? "Kirjaa tapahtuma" : "Log an Activity"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Kategoria:" : "Category:"}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Co2LogCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
              >
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {isFinnish ? meta.fi : meta.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{isFinnish ? "Kuvaus:" : "Description:"}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isFinnish ? "esim. Pyöräilin töihin auton sijaan" : "e.g. Cycled to work instead of driving"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                {isFinnish ? "CO2-vaikutus (kg) — negatiivinen = säästö:" : "CO2 Impact (kg) — negative = saved:"}
              </label>
              <input
                type="number"
                step="0.1"
                value={co2Kg}
                onChange={(e) => setCo2Kg(e.target.value)}
                placeholder="-1.5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {errorMessage && <p className="text-rose-600 font-medium">{errorMessage}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isFinnish ? "Tallenna" : "Save Entry"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Recent activity list */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900">{isFinnish ? "Viimeisimmät kirjaukset" : "Recent Activity"}</h3>

        {entries.length === 0 && !isLoading ? (
          <p className="text-xs text-slate-400">{isFinnish ? "Ei kirjauksia." : "No entries yet."}</p>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 15).map((entry) => {
              const Icon = CATEGORY_META[entry.category].icon;
              const isSaving = entry.co2Kg < 0;

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{entry.description}</div>
                      <div className="text-[10px] text-slate-500">{entry.occurredOn}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-black ${isSaving ? "text-emerald-600" : "text-rose-600"}`}>
                      {isSaving ? "" : "+"}
                      {entry.co2Kg.toFixed(1)} kg
                    </span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title={isFinnish ? "Poista" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, valueKg, isFinnish }: { label: string; valueKg: number; isFinnish: boolean }) {
  const isSaving = valueKg < 0;
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`text-xl font-black ${isSaving ? "text-emerald-600" : valueKg > 0 ? "text-rose-600" : "text-slate-900"}`}>
          {isSaving ? "" : valueKg > 0 ? "+" : ""}
          {valueKg.toFixed(1)} kg
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-400">{isFinnish ? "netto CO2" : "net CO2"}</span>
    </div>
  );
}
