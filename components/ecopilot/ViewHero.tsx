"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * The pastel banner every ecopilot view opens with, but collapsed by default:
 * the badge and headline stay visible while the explanatory paragraph hides
 * behind a "How it works" toggle, so the first real control on a page sits
 * above the fold instead of ~250px down. The choice is remembered per view in
 * localStorage — someone who wants the blurb keeps it.
 */

export type HeroAccent = "fuchsia" | "blue" | "teal" | "amber" | "rose" | "cyan" | "indigo";

/** Full class strings (never interpolated) so Tailwind keeps them in the build. */
const ACCENT_CLASSES: Record<HeroAccent, { card: string; badge: string; toggle: string }> = {
  fuchsia: {
    card: "from-fuchsia-50/80 via-white to-emerald-50/60 border-fuchsia-200/80",
    badge: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
    toggle: "hover:text-fuchsia-700 hover:border-fuchsia-300",
  },
  blue: {
    card: "from-blue-50/80 via-white to-emerald-50/60 border-blue-200/80",
    badge: "bg-blue-100 text-blue-900 border-blue-200",
    toggle: "hover:text-blue-700 hover:border-blue-300",
  },
  teal: {
    card: "from-teal-50/80 via-white to-emerald-50/60 border-teal-200/80",
    badge: "bg-teal-100 text-teal-900 border-teal-200",
    toggle: "hover:text-teal-700 hover:border-teal-300",
  },
  amber: {
    card: "from-amber-50/80 via-white to-emerald-50/60 border-amber-200/80",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    toggle: "hover:text-amber-700 hover:border-amber-300",
  },
  rose: {
    card: "from-rose-50/80 via-white to-amber-50/60 border-rose-200/80",
    badge: "bg-rose-100 text-rose-900 border-rose-200",
    toggle: "hover:text-rose-700 hover:border-rose-300",
  },
  cyan: {
    card: "from-cyan-50/80 via-white to-emerald-50/60 border-cyan-200/80",
    badge: "bg-cyan-100 text-cyan-900 border-cyan-200",
    toggle: "hover:text-cyan-700 hover:border-cyan-300",
  },
  indigo: {
    card: "from-indigo-50/80 via-white to-emerald-50/60 border-indigo-200/80",
    badge: "bg-indigo-100 text-indigo-900 border-indigo-200",
    toggle: "hover:text-indigo-700 hover:border-indigo-300",
  },
};

const STORAGE_PREFIX = "ecopilot:hero:";

interface ViewHeroProps {
  accent: HeroAccent;
  /** Short pill above/beside the headline, e.g. "📝 Natural-language Activity Log". */
  badge: ReactNode;
  title: string;
  /** Hidden until the reader expands the hero. */
  description: ReactNode;
  /** Distinguishes this view in localStorage — pass a stable slug, not a translated string. */
  storageKey: string;
  isFinnish: boolean;
  /** Optional controls pulled up into the header row (the Activity Log puts its input-mode tabs here). */
  actions?: ReactNode;
}

export function ViewHero({ accent, badge, title, description, storageKey, isFinnish, actions }: ViewHeroProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = ACCENT_CLASSES[accent];
  const panelId = `hero-${storageKey}`;

  // Read after mount rather than during render: localStorage does not exist on
  // the server, and touching it in the initial render would break hydration.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only preference on mount
      if (window.localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`) === "expanded") setIsExpanded(true);
    } catch {
      // Private-mode / blocked storage — the collapsed default is fine.
    }
  }, [storageKey]);

  const toggle = () => {
    setIsExpanded((prev) => {
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, prev ? "collapsed" : "expanded");
      } catch {
        // Preference just won't persist; the toggle still works this session.
      }
      return !prev;
    });
  };

  return (
    <section
      className={`rounded-3xl bg-gradient-to-r border px-5 py-4 sm:px-6 sm:py-5 shadow-xs ${styles.card}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${styles.badge}`}>{badge}</span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/70 border border-slate-200 text-slate-500 text-[12px] font-bold transition ${styles.toggle}`}
          >
            <span>{isFinnish ? "Miten tämä toimii" : "How it works"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <p id={panelId} className="mt-3 text-xs text-slate-600 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </section>
  );
}
