import { Wifi, BookOpen } from "lucide-react";

interface DataFreshnessBadgeProps {
  /** 'live' for a real external fetch that succeeded this load; 'reference' for curated static data. */
  freshness: "live" | "reference";
  sourceName: string;
  isFinnish?: boolean;
  className?: string;
}

/**
 * Honest data-provenance label. Unlike the prototype this was ported from —
 * which labelled every data point "Live"/"Demo Baseline" regardless of
 * whether anything was actually fetched — this only ever says "Live" when
 * an external fetch genuinely succeeded this page load; everything else is
 * "Reference data" (a real, dated, cited source, just not fetched live).
 */
export function DataFreshnessBadge({ freshness, sourceName, isFinnish, className = "" }: DataFreshnessBadgeProps) {
  const isLive = freshness === "live";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        isLive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
      } ${className}`}
      title={`Source: ${sourceName}`}
    >
      {isLive ? (
        <>
          <Wifi className="w-3 h-3" />
          {isFinnish ? "Elävä data" : "Live"}
        </>
      ) : (
        <>
          <BookOpen className="w-3 h-3" />
          {isFinnish ? "Viitetieto" : "Reference data"}
        </>
      )}
    </span>
  );
}
