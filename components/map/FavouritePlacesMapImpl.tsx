"use client";

import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Home } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "@/components/map/leaflet-icon-fix";
import { MINIMAL_TILE_LAYER_URL, MINIMAL_TILE_LAYER_ATTRIBUTION } from "./tile-config";
import { cn } from "@/lib/utils";
import { FREQUENT_PLACE_ICONS } from "@/components/ecopilot/frequentPlaceIcons";
import type { FrequentPlaceIconKey } from "@/lib/ecopilot/types";

/** Espoo city centre — fallback view when neither home nor any place has coordinates yet. */
const ESPOO_FALLBACK_CENTER: [number, number] = [60.2055, 24.6559];
const ESPOO_FALLBACK_ZOOM = 11;
/** Don't zoom in absurdly tight when there's only one pin to fit. */
const SINGLE_PIN_ZOOM = 14;

export interface FavouritePlaceMarker {
  id: string;
  lat: number;
  lon: number;
  label: string;
  address: string | null;
  /** Same quick-select icon shown when the place was added (see frequentPlaceIcons.tsx) — reused as the pin glyph. */
  icon: FrequentPlaceIconKey;
}

/** A round badge marker showing one glyph on a colored background — used for both place-category pins and the home pin. */
function buildBadgeDivIcon(glyphSvg: string, backgroundColor: string): L.DivIcon {
  return L.divIcon({
    html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${backgroundColor};border:2px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.35);">${glyphSvg}</span>`,
    className: "", // suppress Leaflet's default marker box/shadow classes
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/** Indigo badge per place category — matches the icon chosen when the place was saved. Built once per key, reused across renders. */
const placeDivIconCache = new Map<FrequentPlaceIconKey, L.DivIcon>();

function getPlaceDivIcon(key: FrequentPlaceIconKey): L.DivIcon {
  const cached = placeDivIconCache.get(key);
  if (cached) return cached;

  const Icon = FREQUENT_PLACE_ICONS[key];
  const glyph = renderToStaticMarkup(<Icon size={15} color="#ffffff" strokeWidth={2.5} />);
  const icon = buildBadgeDivIcon(glyph, "#4f46e5");
  placeDivIconCache.set(key, icon);
  return icon;
}

/** Green "home" badge — visually distinct from the indigo place pins. Built lazily once, on first use. */
let homeDivIcon: L.DivIcon | null = null;

function getHomeDivIcon(): L.DivIcon {
  homeDivIcon ??= buildBadgeDivIcon(renderToStaticMarkup(<Home size={15} color="#ffffff" strokeWidth={2.5} />), "#059669");
  return homeDivIcon;
}

interface FavouritePlacesMapImplProps {
  /** The profile's home address pin, or null when it hasn't been set/looked-up yet. */
  home: { lat: number; lon: number } | null;
  /** Every saved place that has coordinates — ones still missing an address are left out by the caller. */
  places: FavouritePlaceMarker[];
  isFinnish: boolean;
  className?: string;
}

/** Re-fits the view to every pin whenever the marker set changes (a place added, an address looked up…). */
function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(ESPOO_FALLBACK_CENTER, ESPOO_FALLBACK_ZOOM);
    } else if (points.length === 1) {
      map.setView(points[0], SINGLE_PIN_ZOOM);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    }
    // Re-run whenever the actual coordinates change, not just the array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(points)]);

  return null;
}

export default function FavouritePlacesMapImpl({ home, places, isFinnish, className }: FavouritePlacesMapImplProps) {
  const points: [number, number][] = [
    ...(home ? [[home.lat, home.lon] as [number, number]] : []),
    ...places.map((p): [number, number] => [p.lat, p.lon]),
  ];

  return (
    <MapContainer
      center={points[0] ?? ESPOO_FALLBACK_CENTER}
      zoom={ESPOO_FALLBACK_ZOOM}
      scrollWheelZoom
      className={cn("h-full w-full", className)}
    >
      <TileLayer url={MINIMAL_TILE_LAYER_URL} attribution={MINIMAL_TILE_LAYER_ATTRIBUTION} />
      <FitToMarkers points={points} />

      {home && (
        <Marker position={[home.lat, home.lon]} icon={getHomeDivIcon()}>
          <Popup>{isFinnish ? "Koti" : "Home"}</Popup>
        </Marker>
      )}

      {places.map((place) => (
        <Marker key={place.id} position={[place.lat, place.lon]} icon={getPlaceDivIcon(place.icon)}>
          <Popup>
            <span className="font-semibold">{place.label}</span>
            {place.address && (
              <>
                <br />
                <span className="text-slate-500">{place.address}</span>
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
