"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  RotateCw,
  Compass,
  NotebookPen,
  Lightbulb,
  Activity,
  BookOpen,
  MapPin,
  Settings,
  LogOut,
  ChevronUp,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import type { EcopilotTab, UserProfile } from "@/lib/ecopilot/types";
import { signOut } from "@/app/(auth)/logout/action";

interface EcopilotSidebarProps {
  /**
   * Which nav row is highlighted — an EcopilotTab on the main dashboard,
   * "places" on the standalone Favourite Locations page, or null when the
   * sidebar is rendered from a page with no matching row (e.g. Profile).
   */
  currentTab: EcopilotTab | "places" | null;
  onSelectTab: (tab: EcopilotTab) => void;
  isFinnish: boolean;
  /** Logged-in user's climate profile — powers the account block pinned at the sidebar's foot. */
  userProfile: UserProfile;
  /** Link to the full-page profile editor (app/(dashboard)/[roleSlug]/profile) — see EcopilotApp. */
  profileHref: string;
  /** Link to the frequently-visited-places editor (app/(dashboard)/[roleSlug]/places) — see EcopilotApp. */
  placesHref: string;
  /** Signed-in account's email; renders the log out control when present. */
  accountEmail?: string;
}

interface SidebarTabItem {
  kind: "tab";
  id: EcopilotTab;
  icon: typeof Sparkles;
  iconClass: string;
  fi: string;
  en: string;
}

/**
 * A nav row that navigates to its own page/URL instead of switching the
 * EcopilotApp tab — e.g. the Places editor. `href` is left out here (rather
 * than hardcoded) because it depends on the current pathname/language, which
 * only EcopilotApp knows — the component below fills it in from its
 * `placesHref` prop at render time.
 */
interface SidebarLinkItem {
  kind: "link";
  /** Matched against `currentTab` to highlight this row from a standalone page — see EcopilotSidebarProps.currentTab. */
  id: "places";
  icon: typeof Sparkles;
  iconClass: string;
  fi: string;
  en: string;
}

type SidebarItem = SidebarTabItem | SidebarLinkItem;

interface SidebarSection {
  /** Optional heading shown above the group (hidden on the mobile / collapsed icon rail). */
  titleFi?: string;
  titleEn?: string;
  items: SidebarItem[];
}

/**
 * Every ecopilot nav row, grouped into sidebar sections in display order —
 * most switch the current EcopilotApp tab, a few (Places) navigate to their
 * own page instead. The Activity Log tab covers both natural-language trip
 * logging and grocery-receipt scanning (see ActivityLoggerView). The "Useful
 * links" section holds the guide plus the HSY / HSL reference tools. A
 * vertical list scales to far more rows than a horizontal row ever could,
 * without needing a scroll strip.
 */
const SECTIONS: SidebarSection[] = [
  {
    items: [
      { kind: "tab", id: "chat", icon: Sparkles, iconClass: "text-emerald-600", fi: "eCopilot-chatti", en: "eCopilot Chat" },
      { kind: "tab", id: "energy", icon: Zap, iconClass: "text-amber-500", fi: "Pörssisähkö & Sauna", en: "Nord Pool & Energy" },
      {
        kind: "tab",
        id: "activityLog",
        icon: NotebookPen,
        iconClass: "text-fuchsia-600",
        fi: "Päiväkirja & Kuitit",
        en: "Activity Log & Receipts",
      },
      {
        kind: "link",
        id: "places",
        icon: MapPin,
        iconClass: "text-indigo-600",
        fi: "Suosikkipaikat",
        en: "Favourite Locations",
      },
      { kind: "tab", id: "whatIf", icon: Lightbulb, iconClass: "text-cyan-600", fi: "Entä jos...?", en: "What If?" },
      { kind: "tab", id: "trackerRewards", icon: Activity, iconClass: "text-rose-600", fi: "Seuranta & Palkinnot", en: "Tracker & Rewards" },
    ],
  },
  {
    titleFi: "Hyödyllisiä linkkejä",
    titleEn: "Useful links",
    items: [
      { kind: "tab", id: "guide", icon: BookOpen, iconClass: "text-slate-500", fi: "Ohjeet & Aloitus", en: "Guide & Getting Started" },
      { kind: "tab", id: "recycling", icon: RotateCw, iconClass: "text-teal-600", fi: "HSY-Lajittelu", en: "HSY Recycling" },
      { kind: "tab", id: "transit", icon: Compass, iconClass: "text-blue-600", fi: "HSL & Matkat", en: "HSL Transit" },
    ],
  },
];

const COLLAPSE_STORAGE_KEY = "ecopilot:sidebarCollapsed";

/**
 * Vertical left nav — a fixed icon rail below `sm:`. From `sm:` up it defaults
 * to the full icon+label width but can be collapsed back to the rail via the
 * toggle in the header; the choice is remembered in localStorage. `expanded`
 * is that desktop state — every `sm:` utility that reveals text is gated on it
 * so a collapsed sidebar renders exactly like the mobile rail.
 */
export function EcopilotSidebar({
  currentTab,
  onSelectTab,
  isFinnish,
  userProfile,
  profileHref,
  placesHref,
  accountEmail,
}: EcopilotSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Read the remembered state after mount (avoids an SSR/first-paint mismatch).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of a persisted UI preference
      setIsCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    } catch {
      /* private mode / storage blocked — just start expanded */
    }
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handlePointer = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setIsAccountMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isAccountMenuOpen]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
    setIsAccountMenuOpen(false);
  };

  /** Whether the desktop sidebar shows labels. Below `sm:` it's always a rail regardless. */
  const expanded = !isCollapsed;
  const initial = userProfile.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 w-16 ${
        expanded ? "sm:w-64" : ""
      } bg-white border-r border-slate-200 flex flex-col transition-[width] duration-200`}
    >
      <div className={`flex items-center gap-2 h-16 border-b border-slate-200 shrink-0 px-2.5 ${expanded ? "sm:px-3" : ""}`}>
        <button
          type="button"
          onClick={() => onSelectTab("chat")}
          title={isFinnish ? "Etusivulle" : "Go to home"}
          className={`${
            expanded ? "sm:flex" : "sm:hidden"
          } flex items-center gap-3 flex-1 min-w-0 rounded-lg px-1.5 py-2 hover:bg-slate-50 transition text-left`}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className={`hidden ${expanded ? "sm:block" : ""} min-w-0`}>
            <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none truncate">
              e<span className="text-emerald-600">Copilot</span>
            </h1>
            <p className="text-[12px] text-slate-500 font-medium truncate">
              {isFinnish ? "Arjen ilmastoapuri" : "Finnish Living eCopilot"}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={toggleCollapsed}
          title={isFinnish ? (isCollapsed ? "Laajenna valikko" : "Pienennä valikko") : isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden sm:flex ${
            expanded ? "" : "mx-auto"
          } w-8 h-8 rounded-lg items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0`}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto py-3 px-2 ${expanded ? "sm:px-3" : ""} space-y-1`}>
        {SECTIONS.map((section, sectionIdx) => (
          <div
            key={section.titleEn ?? sectionIdx}
            className={sectionIdx > 0 ? "mt-3 pt-3 border-t border-slate-100 space-y-1" : "space-y-1"}
          >
            {section.titleEn && (
              <p className={`hidden ${expanded ? "sm:block" : ""} px-3 pb-1 text-[12px] font-bold uppercase tracking-wider text-slate-400`}>
                {isFinnish ? section.titleFi : section.titleEn}
              </p>
            )}
            {section.items.map((item) => {
              const { icon: Icon, iconClass, fi, en } = item;
              const isActive = currentTab === item.id;
              const rowClassName = `w-full flex items-center gap-3 justify-center ${
                expanded ? "sm:justify-start px-2.5 sm:px-3" : "px-2.5"
              } py-2.5 rounded-xl text-xs font-bold transition ${
                isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`;
              const content = (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
                  <span className={`hidden ${expanded ? "sm:inline" : ""} truncate`}>{isFinnish ? fi : en}</span>
                </>
              );

              if (item.kind === "link") {
                return (
                  <Link key={item.id} href={placesHref} title={isFinnish ? fi : en} className={rowClassName}>
                    {content}
                  </Link>
                );
              }

              return (
                <button key={item.id} onClick={() => onSelectTab(item.id)} title={isFinnish ? fi : en} className={rowClassName}>
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Account — pinned foot. Name/avatar links straight to the profile editor; the caret opens logout. */}
      <div ref={accountRef} className={`relative shrink-0 border-t border-slate-200 p-2 ${expanded ? "sm:p-3" : ""}`}>
        {isAccountMenuOpen && (
          <div
            className={`absolute bottom-full left-2 ${
              expanded ? "sm:left-3 sm:right-3 sm:w-auto" : ""
            } mb-1.5 w-52 rounded-xl bg-white border border-slate-200 shadow-lg py-1 text-slate-800 z-50`}
          >
            <Link
              href={profileHref}
              onClick={() => setIsAccountMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>{isFinnish ? "Muokkaa profiilia" : "Edit profile"}</span>
            </Link>

            {accountEmail && (
              <form action={signOut}>
                <button
                  type="submit"
                  title={accountEmail}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition text-left border-t border-slate-100"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isFinnish ? "Kirjaudu ulos" : "Logout"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* expanded desktop : big click target straight to the profile */}
          <Link
            href={profileHref}
            title={isFinnish ? "Muokkaa profiilia" : "Edit profile"}
            className={`hidden ${expanded ? "sm:flex" : ""} items-center gap-2.5 flex-1 min-w-0 rounded-xl px-2 py-2 hover:bg-slate-50 transition`}
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-black flex items-center justify-center shrink-0">
              {initial}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight">{userProfile.name}</span>
              <span className="block text-[12px] text-slate-500 truncate leading-tight">{userProfile.district}</span>
            </span>
          </Link>

          {/* rail (mobile or collapsed) : avatar opens the menu (holds Edit profile + Logout) */}
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            title={isFinnish ? "Tili" : "Account"}
            className={`${
              expanded ? "sm:hidden" : ""
            } mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-black flex items-center justify-center`}
          >
            {initial}
          </button>

          {/* expanded desktop : caret for logout / secondary actions */}
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            title={isFinnish ? "Tili" : "Account"}
            className={`hidden ${
              expanded ? "sm:flex" : ""
            } w-8 h-8 rounded-lg items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0`}
          >
            <ChevronUp className={`w-4 h-4 transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </aside>
  );
}
