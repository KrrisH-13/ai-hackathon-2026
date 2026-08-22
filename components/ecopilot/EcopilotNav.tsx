"use client";

import { Sparkles, Zap, RotateCw, Compass, Building2, ThermometerSnowflake, Sun, Flame, CloudRain, Share2 } from "lucide-react";
import type { UserProfile, Season, EcopilotTab } from "@/lib/ecopilot/types";
import { SEASONAL_PRESETS } from "@/lib/ecopilot/data";

interface EcopilotNavProps {
  currentTab: EcopilotTab;
  onSelectTab: (tab: EcopilotTab) => void;
  userProfile: UserProfile;
  allProfiles: UserProfile[];
  onSelectProfile: (id: string) => void;
  onOpenProfileModal: () => void;
  currentSeason: Season;
  onSelectSeason: (s: Season) => void;
  isFinnish: boolean;
  onToggleLanguage: () => void;
  onOpenShareModal: () => void;
}

const TABS: { id: EcopilotTab; icon: typeof Sparkles; iconClass: string; fi: string; en: string }[] = [
  { id: "chat", icon: Sparkles, iconClass: "text-emerald-600", fi: "AI-Ilmastoapuri", en: "AI Copilot" },
  { id: "energy", icon: Zap, iconClass: "text-amber-500", fi: "Pörssisähkö & Sauna", en: "Nord Pool & Energy" },
  { id: "recycling", icon: RotateCw, iconClass: "text-teal-600", fi: "HSY-Lajittelu", en: "HSY Recycling" },
  { id: "transit", icon: Compass, iconClass: "text-blue-600", fi: "HSL & Matkat", en: "HSL Transit" },
  { id: "roadmap", icon: Building2, iconClass: "text-indigo-600", fi: "Ilmastovahti 2030", en: "Espoo 2030 Watch" },
];

export function EcopilotNav({
  currentTab,
  onSelectTab,
  userProfile,
  allProfiles,
  onSelectProfile,
  onOpenProfileModal,
  currentSeason,
  onSelectSeason,
  isFinnish,
  onToggleLanguage,
  onOpenShareModal,
}: EcopilotNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 rounded-t-2xl">
      {/* Top Banner / Municipal Roadmap Context */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isFinnish ? "Hiilineutraali Espoo 2030" : "Carbon-Neutral Espoo 2030"}
          </span>
          <span className="text-slate-300 hidden md:inline">
            {isFinnish
              ? "Ilmastovahti: Kaukolämmön ja arjen päästövähennykset etenevät tavoiteaikataulussa (-68% 1990 tasosta)"
              : "Climate Watch: District heating & resident daily decarbonization on track (-68% vs 1990 baseline)"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {(["winter", "spring", "summer", "autumn"] as Season[]).map((s) => (
              <button
                key={s}
                onClick={() => onSelectSeason(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition ${
                  currentSeason === s ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title={isFinnish ? SEASONAL_PRESETS[s].nameFi : SEASONAL_PRESETS[s].nameEn}
              >
                {isFinnish
                  ? s === "winter"
                    ? "Talvi"
                    : s === "spring"
                      ? "Kevät"
                      : s === "summer"
                        ? "Kesä"
                        : "Syys"
                  : s === "winter"
                    ? "Winter"
                    : s === "spring"
                      ? "Spring"
                      : s === "summer"
                        ? "Summer"
                        : "Autumn"}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleLanguage}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 border border-slate-700 transition"
          >
            {isFinnish ? "FI / EN" : "EN / FI"}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-none">
                Kipinä <span className="text-emerald-600">Espoo AI</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isFinnish ? "Arjen energia-, HSL- ja HSY-ilmastoapuri" : "Finnish Living & 2030 Climate Copilot"}
            </p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
          {TABS.map(({ id, icon: Icon, iconClass, fi, en }) => (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentTab === id
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
              <span>{isFinnish ? fi : en}</span>
            </button>
          ))}

          <button
            onClick={() => onSelectTab("personal")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === "personal"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{isFinnish ? "Oma Ilmastopolku" : "My 2030 Plan"}</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
            <select
              value={userProfile.id}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.district.split(" ")[0]})
                </option>
              ))}
            </select>

            <button
              onClick={onOpenProfileModal}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-200 transition"
              title="Edit Finnish home profile"
            >
              ⚙️
            </button>
          </div>

          <button
            onClick={onOpenShareModal}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Export / Share Climate Commitment"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="lg:hidden flex items-center justify-start overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200 gap-1">
        {TABS.map(({ id, fi, en }) => (
          <button
            key={id}
            onClick={() => onSelectTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
              currentTab === id ? "bg-emerald-600 text-white" : "text-slate-600"
            }`}
          >
            {isFinnish ? fi : en}
          </button>
        ))}
        <button
          onClick={() => onSelectTab("personal")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
            currentTab === "personal" ? "bg-emerald-600 text-white" : "text-slate-600"
          }`}
        >
          {isFinnish ? "Oma Polku" : "My 2030 Plan"}
        </button>
      </div>
    </header>
  );
}
