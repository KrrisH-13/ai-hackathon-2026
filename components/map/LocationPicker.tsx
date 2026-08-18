"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export type { LocationPickerValue } from "./LocationPickerImpl";

/**
 * Interactive map: click to drop a pin, or search for an address.
 * Leaflet touches `window` at import time, so this must stay client-only
 * (dynamic + ssr:false) — see LocationPickerImpl.tsx for the actual map.
 */
export const LocationPicker = dynamic(() => import("./LocationPickerImpl"), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-lg" />,
});
