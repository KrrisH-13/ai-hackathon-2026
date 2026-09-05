"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";

interface InfoHintProps {
  /** What the user should enter — already localized by the caller. */
  instruction: string;
  /** Optional concrete example value to show under the instruction. */
  example?: string;
  /** Which edge of the icon the tooltip should anchor to. Defaults to left. */
  align?: "left" | "right";
  /** Field name, used only for the icon's accessible label. */
  label?: string;
  isFinnish?: boolean;
}

/**
 * Small "i" affordance next to an input label. Shows a short instruction
 * (and an optional example) on hover, focus, or tap. No external tooltip
 * lib — the app doesn't ship one — so this is a self-contained popover.
 */
export function InfoHint({ instruction, example, align = "left", label, isFinnish = false }: InfoHintProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  const moreInfo = isFinnish ? "lisätietoja" : "more info";
  const egLabel = isFinnish ? "esim." : "e.g.";

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label ? `${label} — ${moreInfo}` : moreInfo}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full transition"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 top-full mt-1.5 w-60 rounded-xl bg-slate-900 text-white text-xs font-normal leading-relaxed p-3 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <span className="block">{instruction}</span>
          {example && (
            <span className="mt-1.5 block text-slate-300">
              <span className="font-bold text-emerald-300">{egLabel}</span>{" "}
              <span className="italic">{example}</span>
            </span>
          )}
        </span>
      )}
    </span>
  );
}
