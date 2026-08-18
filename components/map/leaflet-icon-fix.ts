import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * Leaflet's default marker icon resolves its image URLs relative to its
 * own CSS file, which breaks once bundled by webpack (icons 404 silently).
 * Point it at the bundler-resolved asset URLs instead. Side-effecting
 * module — import once, before any <Marker> mounts.
 */
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});
