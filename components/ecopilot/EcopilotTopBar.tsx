"use client";

import { Share2 } from "lucide-react";

interface EcopilotTopBarProps {
  /** Switches to the Espoo 2030 Watch tab — the "Carbon-Neutral Espoo 2030" badge is its only entry point now that it's off the sidebar nav. */
  onOpenRoadmap: () => void;
  isFinnish: boolean;
  onToggleLanguage: () => void;
  onOpenShareModal: () => void;
}

/**
 * Municipal status banner + the two always-on context controls: language and
 * "share your commitment" (an encouraged action, so it stays one click here
 * rather than behind a menu). Account/profile lives at the foot of
 * EcopilotSidebar; tabs live in its body.
 */
export function EcopilotTopBar({ onOpenRoadmap, isFinnish, onToggleLanguage, onOpenShareModal }: EcopilotTopBarProps) {
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

          <button
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 border border-slate-700 transition"
            title={isFinnish ? "Jaa sitoumus" : "Share commitment"}
          >
            <Share2 className="w-3 h-3" />
            <span className="hidden sm:inline">{isFinnish ? "Jaa sitoumus" : "Share commitment"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
