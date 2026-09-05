"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Share2, LogOut, ChevronDown, Settings } from "lucide-react";
import type { UserProfile } from "@/lib/ecopilot/types";
import { signOut } from "@/app/(auth)/logout/action";

interface EcopilotTopBarProps {
  userProfile: UserProfile;
  /** Link to the full-page profile editor (app/(dashboard)/[roleSlug]/profile) — see EcopilotApp. */
  profileHref: string;
  /** Switches to the Espoo 2030 Watch tab — the "Carbon-Neutral Espoo 2030" badge is its only entry point now that it's off the sidebar nav. */
  onOpenRoadmap: () => void;
  isFinnish: boolean;
  onToggleLanguage: () => void;
  onOpenShareModal: () => void;
  /** Signed-in account's email; renders the log out control when present. */
  accountEmail?: string;
}

/** Municipal status banner + profile/language/account controls. Tabs live in EcopilotSidebar. */
export function EcopilotTopBar({
  userProfile,
  profileHref,
  onOpenRoadmap,
  isFinnish,
  onToggleLanguage,
  onOpenShareModal,
  accountEmail,
}: EcopilotTopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

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
          <button
            onClick={onToggleLanguage}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 border border-slate-700 transition"
          >
            {isFinnish ? "FI / EN" : "EN / FI"}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 hover:bg-slate-700 transition"
              title={isFinnish ? "Tili" : "Account"}
            >
              <span className="hidden sm:inline text-[10px] font-bold text-slate-200">
                {userProfile.name} ({userProfile.district.split(" ")[0]})
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1 text-slate-800 z-50">
                <Link
                  href={profileHref}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isFinnish ? "Muokkaa profiilia" : "Edit profile"}</span>
                </Link>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenShareModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isFinnish ? "Jaa sitoumus" : "Share commitment"}</span>
                </button>

                {accountEmail && (
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition text-left border-t border-slate-100"
                      title={accountEmail}
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isFinnish ? "Kirjaudu ulos" : "Logout"}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
