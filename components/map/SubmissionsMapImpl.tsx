"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "@/components/map/leaflet-icon-fix";
import { TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION, DEFAULT_MAP_CENTER } from "./tile-config";
import { cn } from "@/lib/utils";
import type { Submission } from "@/lib/db/types";

interface SubmissionsMapImplProps {
  submissions: Submission[];
  className?: string;
}

export default function SubmissionsMapImpl({ submissions, className }: SubmissionsMapImplProps) {
  const center: [number, number] = submissions[0]
    ? [submissions[0].latitude, submissions[0].longitude]
    : DEFAULT_MAP_CENTER;

  return (
    <MapContainer center={center} zoom={12} className={cn("h-80 w-full rounded-lg border", className)}>
      <TileLayer url={TILE_LAYER_URL} attribution={TILE_LAYER_ATTRIBUTION} />
      {submissions.map((submission) => (
        <Marker key={submission.id} position={[submission.latitude, submission.longitude]}>
          <Popup>
            <p className="font-medium">{submission.title}</p>
            <p className="text-xs text-muted-foreground">{submission.status}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
