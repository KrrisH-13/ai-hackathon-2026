/** Shared OpenStreetMap tile source — free, no API key required. */
export const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * CARTO's Positron basemap (basemaps.cartocdn.com) used to be a genuinely
 * anonymous, keyless tile source and made a nice lighter alternative for
 * views that plot a handful of custom pins — the default OSM style's dense
 * road/path/POI overlays (dashed transit and footpath lines especially)
 * compete with markers instead of framing them. CARTO has since started
 * gating that endpoint behind an API key (it now serves an "API key
 * required" watermark instead of tiles for unauthenticated requests), so
 * don't point a TileLayer at it without one. Views that want a lighter look
 * without a key/paid account should use TILE_LAYER_URL above plus the
 * `.muted-basemap-tiles` CSS filter class (see FavouritePlacesMapImpl.tsx)
 * instead of a different tile source.
 */

export const DEFAULT_ZOOM = 15;
export const DEFAULT_MAP_CENTER: [number, number] = [51.505, -0.09];
