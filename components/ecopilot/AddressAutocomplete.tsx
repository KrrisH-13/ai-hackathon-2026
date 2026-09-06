"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, RotateCw } from "lucide-react";
// Type-only — the runtime module is loaded lazily (see getProvider) so the
// leaflet-touching barrel never enters the server render graph.
import type { OpenStreetMapProvider } from "leaflet-geosearch";

interface AddressAutocompleteProps {
  /** Controlled value — the current address text. */
  value: string;
  /** Fires on every keystroke (coords null) and on picking a suggestion (coords set). */
  onChange: (address: string, coords: { lat: number; lon: number } | null) => void;
  isFinnish: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Lightweight address field with type-ahead suggestions, backed by
 * leaflet-geosearch's OpenStreetMap (Nominatim) provider — the same keyless
 * geocoder the map picker uses (components/map/LocationPickerImpl.tsx), but
 * without a map. Results are restricted to Finland for now via `countrycodes`.
 */
let providerPromise: Promise<OpenStreetMapProvider> | null = null;
function getProvider(): Promise<OpenStreetMapProvider> {
  providerPromise ??= import("leaflet-geosearch").then(
    ({ OpenStreetMapProvider: Provider }) =>
      new Provider({
        params: {
          countrycodes: "fi",
          "accept-language": "fi",
          addressdetails: 1,
          limit: 6,
        },
      })
  );
  return providerPromise;
}

interface Suggestion {
  address: string;
  lat: number;
  lon: number;
}

export function AddressAutocomplete({ value, onChange, isFinnish, placeholder, className }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  // Set right before a pick overwrites `value` so the debounced lookup below
  // doesn't immediately re-search the address we just chose.
  const skipNextSearch = useRef(false);
  const listId = useId();

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = value.trim();
    // All state updates happen inside the timer callback (never synchronously
    // in the effect body) so a keystroke doesn't cascade an extra render.
    const timer = setTimeout(
      async () => {
        if (q.length < 3) {
          setSuggestions([]);
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const provider = await getProvider();
          const raw = await provider.search({ query: q });
          setSuggestions(raw.slice(0, 6).map((r) => ({ address: r.label, lat: Number(r.y), lon: Number(r.x) })));
          setActiveIdx(-1);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      },
      q.length < 3 ? 0 : 350
    );
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen]);

  const pick = (s: Suggestion) => {
    skipNextSearch.current = true;
    setSuggestions([]);
    setIsOpen(false);
    setActiveIdx(-1);
    onChange(s.address, { lat: s.lat, lon: s.lon });
  };

  return (
    <div ref={boxRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setIsOpen(true);
            onChange(e.target.value, null);
          }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={(e) => {
            if (!isOpen || suggestions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && activeIdx >= 0) {
              e.preventDefault();
              pick(suggestions[activeIdx]);
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder ?? (isFinnish ? "Hae osoitetta (Suomi)…" : "Search for an address (Finland)…")}
          className="visible-text-cursor w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {isLoading && (
          <RotateCw className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat},${s.lon},${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-3 py-2 text-xs cursor-pointer flex items-start gap-2 ${
                i === activeIdx ? "bg-emerald-50 text-emerald-900" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span className="leading-snug">{s.address}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
