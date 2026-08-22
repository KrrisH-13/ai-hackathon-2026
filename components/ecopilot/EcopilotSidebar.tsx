"use client";

import {
  Sparkles,
  Zap,
  RotateCw,
  Compass,
  Building2,
  NotebookPen,
  Receipt,
  Lightbulb,
  Activity,
} from "lucide-react";
import type { EcopilotTab } from "@/lib/ecopilot/types";

interface EcopilotSidebarProps {
  currentTab: EcopilotTab;
  onSelectTab: (tab: EcopilotTab) => void;
  isFinnish: boolean;
}

/**
 * Every ecopilot tab, in display order — including the placeholder tabs
 * (activityLog/receiptScanner/whatIf), whose views currently
 * just render layout with sample data; the AI/data wiring for those lands
 * separately. A vertical list scales to far more tabs than a horizontal
 * row ever could, without needing a scroll strip.
 */
const TABS: { id: EcopilotTab; icon: typeof Sparkles; iconClass: string; fi: string; en: string }[] = [
  { id: "chat", icon: Sparkles, iconClass: "text-emerald-600", fi: "eCopilot-chatti", en: "eCopilot Chat" },
  { id: "energy", icon: Zap, iconClass: "text-amber-500", fi: "Pörssisähkö & Sauna", en: "Nord Pool & Energy" },
  { id: "recycling", icon: RotateCw, iconClass: "text-teal-600", fi: "HSY-Lajittelu", en: "HSY Recycling" },
  { id: "transit", icon: Compass, iconClass: "text-blue-600", fi: "HSL & Matkat", en: "HSL Transit" },
  { id: "roadmap", icon: Building2, iconClass: "text-indigo-600", fi: "Ilmastovahti 2030", en: "Espoo 2030 Watch" },
  { id: "activityLog", icon: NotebookPen, iconClass: "text-fuchsia-600", fi: "Päiväkirja", en: "Activity Log" },
  { id: "receiptScanner", icon: Receipt, iconClass: "text-orange-600", fi: "Kuitti-skanneri", en: "Receipt Scanner" },
  { id: "whatIf", icon: Lightbulb, iconClass: "text-cyan-600", fi: "Entä jos...?", en: "What If?" },
  { id: "trackerRewards", icon: Activity, iconClass: "text-rose-600", fi: "Seuranta & Palkinnot", en: "Tracker & Rewards" },
];

/** Vertical left nav — icon rail on mobile, icon+label from `sm:` up. */
export function EcopilotSidebar({ currentTab, onSelectTab, isFinnish }: EcopilotSidebarProps) {
  return (
    <aside className="sticky top-0 h-screen shrink-0 w-16 sm:w-64 bg-white border-r border-slate-200 flex flex-col">
      <button
        type="button"
        onClick={() => onSelectTab("chat")}
        title={isFinnish ? "Etusivulle" : "Go to home"}
        className="flex items-center gap-3 px-2.5 sm:px-5 h-16 border-b border-slate-200 shrink-0 hover:bg-slate-50 transition text-left"
      >
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div className="hidden sm:block min-w-0">
          <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none truncate">
            e<span className="text-emerald-600">Copilot</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-medium truncate">
            {isFinnish ? "Arjen ilmastoapuri" : "Finnish Living eCopilot"}
          </p>
        </div>
      </button>

      <nav className="flex-1 overflow-y-auto py-3 px-2 sm:px-3 space-y-1">
        {TABS.map(({ id, icon: Icon, iconClass, fi, en }) => (
          <button
            key={id}
            onClick={() => onSelectTab(id)}
            title={isFinnish ? fi : en}
            className={`w-full flex items-center gap-3 justify-center sm:justify-start px-2.5 sm:px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              currentTab === id ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
            <span className="hidden sm:inline truncate">{isFinnish ? fi : en}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
