"use client";

import { useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LeafletEventHandlerFn } from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "@/components/map/leaflet-icon-fix";
import { TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION, DEFAULT_ZOOM, DEFAULT_MAP_CENTER } from "./tile-config";
import { cn } from "@/lib/utils";

export interface LocationPickerValue {
  latitude: number;
  longitude: number;
}

interface LocationPickerImplProps {
  value: LocationPickerValue | null;
  onChange: (value: LocationPickerValue) => void;
  zoom?: number;
  className?: string;
}

function ClickToPlace({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Adds leaflet-geosearch's address search bar (Nominatim, no API key) to the map. */
function AddressSearch({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const control = GeoSearchControl({
      provider: new OpenStreetMapProvider(),
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      keepResult: true,
      searchLabel: "Search for an address…",
    });

    map.addControl(control);
    const handleShowLocation = ((event) => {
      const { location } = event as unknown as { location: { y: number; x: number } };
      onSelect(location.y, location.x);
    }) satisfies LeafletEventHandlerFn;
    map.on("geosearch/showlocation", handleShowLocation);

    return () => {
      map.off("geosearch/showlocation", handleShowLocation);
      map.removeControl(control);
    };
  }, [map, onSelect]);

  return null;
}

export default function LocationPickerImpl({
  value,
  onChange,
  zoom = DEFAULT_ZOOM,
  className,
}: LocationPickerImplProps) {
  const handleSelect = useCallback(
    (lat: number, lng: number) => onChange({ latitude: lat, longitude: lng }),
    [onChange]
  );

  return (
    <MapContainer
      center={value ? [value.latitude, value.longitude] : DEFAULT_MAP_CENTER}
      zoom={zoom}
      className={cn("h-80 w-full rounded-lg border", className)}
    >
      <TileLayer url={TILE_LAYER_URL} attribution={TILE_LAYER_ATTRIBUTION} />
      <ClickToPlace onSelect={handleSelect} />
      <AddressSearch onSelect={handleSelect} />
      {value && <Marker position={[value.latitude, value.longitude]} />}
    </MapContainer>
  );
}
