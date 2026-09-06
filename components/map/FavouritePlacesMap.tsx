"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export type { FavouritePlaceMarker } from "./FavouritePlacesMapImpl";

/**
 * Read-only overview map for the Favourite Locations page: a pin per saved
 * place plus a marker for home. Leaflet touches `window` at import time, so
 * this must stay client-only (dynamic + ssr:false) — see FavouritePlacesMapImpl.tsx
 * for the actual map.
 */
export const FavouritePlacesMap = dynamic(() => import("./FavouritePlacesMapImpl"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});
