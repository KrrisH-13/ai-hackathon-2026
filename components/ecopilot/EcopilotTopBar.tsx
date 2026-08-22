"use client";

import Link from "next/link";
import { Share2, ClipboardList, LogOut } from "lucide-react";
import type { UserProfile, Season } from "@/lib/ecopilot/types";
import { SEASONAL_PRESETS } from "@/lib/ecopilot/data";
import { ROUTES } from "@/lib/constants";
import { signOut } from "@/app/(auth)/logout/action";

interface EcopilotTopBarProps {
  userProfile: UserProfile;
  allProfiles: UserProfile[];
  onSelectProfile: (id: string) => void;
  onOpenProfileModal: () => void;
  currentSeason: Season;
  onSelectSeason: (s: Season) => void;
  isFinnish: boolean;
  onToggleLanguage: () => void;
  onOpenShareModal: () => void;
  /** Signed-in account's email; renders a submissions link + log out control when present. */
  accountEmail?: string;
}

/** Municipal status banner + season/profile/language/account controls. Tabs live in EcopilotSidebar. */
export function EcopilotTopBar({
  userProfile,
  allProfiles,
  onSelectProfile,
  onOpenProfileModal,
  currentSeason,
  onSelectSeason,
  isFinnish,
  onToggleLanguage,
  onOpenShareModal,
  accountEmail,
}: EcopilotTopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner / Municipal Roadmap Context */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2">
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

      {/* Profile selector + account controls */}
      <div className="px-4 sm:px-8 py-3 flex items-center justify-end gap-2">
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

        {accountEmail && (
          <>
            <Link
              href={ROUTES.submissions}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="My submissions"
            >
              <ClipboardList className="w-4 h-4" />
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title={`Log out (${accountEmail})`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
