import type { MapsConfig } from "@/lib/services/site.service";
import type { GeoPoint } from "@/lib/types";

export interface MapViewProps {
  /** which map service to draw with (the admin switches it in Settings → Maps) */
  config: MapsConfig;
  center: GeoPoint;
  zoom?: number;
  /** the delivery pin */
  marker?: GeoPoint | null;
  /** can the pin be dragged, and a tap on the map move it? */
  draggable?: boolean;
  onMarkerChange?: (p: GeoPoint) => void;
  /** a grey circle around the pin: how exact the phone's fix was (metres) */
  accuracyM?: number | null;
  /** the shop (Kalibari Bazar) */
  origin?: GeoPoint | null;
  originLabel?: string;
  /** the service area: a circle of this radius around radiusCenter (or the origin) */
  radiusKm?: number | null;
  radiusCenter?: GeoPoint | null;
  /** the road from the shop to the pin */
  route?: GeoPoint[] | null;
  /** satellite imagery (the admin uses it to find the school field) */
  satellite?: boolean;
  className?: string;
  /** change this to make the map re-fit what it shows (pin and shop) */
  fitKey?: string;
  /** screen-reader name of the map */
  ariaLabel?: string;
}

/** Kalibari Bazar, Shahrasti: used to open the map when nothing else is known. */
export const DEFAULT_CENTER: GeoPoint = { lat: 23.2452, lng: 90.9422 };

export const SATELLITE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
