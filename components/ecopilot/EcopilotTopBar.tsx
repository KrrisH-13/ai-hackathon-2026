"use client";

import Link from "next/link";
import { Share2, LogOut } from "lucide-react";
import type { UserProfile, Season } from "@/lib/ecopilot/types";
import { SEASONAL_PRESETS } from "@/lib/ecopilot/data";
import { signOut } from "@/app/(auth)/logout/action";

interface EcopilotTopBarProps {
  userProfile: UserProfile;
  /** Link to the full-page profile editor (app/(dashboard)/[roleSlug]/profile) — see EcopilotApp. */
  profileHref: string;
  /** Switches to the Espoo 2030 Watch tab — the "Carbon-Neutral Espoo 2030" badge is its only entry point now that it's off the sidebar nav. */
  onOpenRoadmap: () => void;
  currentSeason: Season;
  onSelectSeason: (s: Season) => void;
  isFinnish: boolean;
  onToggleLanguage: () => void;
  onOpenShareModal: () => void;
  /** Signed-in account's email; renders the log out control when present. */
  accountEmail?: string;
  /** Real current outdoor temperature (or a seasonal mock fallback) — see EcopilotApp. */
  outdoorTempCelsius: number;
  /** Whether outdoorTempCelsius reflects live weather right now (vs. a mock for an explored season). */
  isLiveWeather: boolean;
}

/** Municipal status banner + profile/language/account controls. Tabs live in EcopilotSidebar. */
export function EcopilotTopBar({
  userProfile,
  profileHref,
  onOpenRoadmap,
  currentSeason,
  onSelectSeason,
  isFinnish,
  onToggleLanguage,
  onOpenShareModal,
  accountEmail,
  outdoorTempCelsius,
  isLiveWeather,
}: EcopilotTopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner / Municipal Roadmap Context */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRoadmap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition"
            title={isFinnish ? "Avaa Ilmastovahti 2030" : "Open Espoo 2030 Watch"}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isFinnish ? "Hiilineutraali Espoo 2030" : "Carbon-Neutral Espoo 2030"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-bold"
            title={isLiveWeather ? (isFinnish ? "Elävä sää Espoossa" : "Live weather in Espoo") : (isFinnish ? "Kausikohtainen arvio" : "Seasonal estimate")}
          >
            {isLiveWeather && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            🌡️ {outdoorTempCelsius > 0 ? `+${outdoorTempCelsius}` : outdoorTempCelsius}°C
            {isLiveWeather ? (isFinnish ? " Espoossa nyt" : " in Espoo now") : ""}
          </span>

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

          <Link
            href={profileHref}
            className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 hover:bg-slate-700 transition"
            title={isFinnish ? "Muokkaa profiilia" : "Edit profile"}
          >
            <span className="text-[10px] font-bold text-slate-200">
              {userProfile.name} ({userProfile.district.split(" ")[0]})
            </span>
            <span className="text-slate-400">⚙️</span>
          </Link>

          <button
            onClick={onOpenShareModal}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Export / Share Climate Commitment"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {accountEmail && (
            <form action={signOut}>
              <button
                type="submit"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title={`Log out (${accountEmail})`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
