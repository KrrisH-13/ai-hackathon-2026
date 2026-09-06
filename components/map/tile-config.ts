/** Shared OpenStreetMap tile source — free, no API key required. */
export const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Lighter basemap (CARTO Positron) for views that plot a handful of custom
 * pins — the default OSM style's dense road/path/POI overlays (dashed transit
 * and footpath lines especially) compete with markers instead of framing them.
 * Free, no API key required.
 */
export const MINIMAL_TILE_LAYER_URL = "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const MINIMAL_TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const DEFAULT_ZOOM = 15;
export const DEFAULT_MAP_CENTER: [number, number] = [51.505, -0.09];
