"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./types";

const Loading = ({ className }: { className?: string }) => <div className={`animate-pulse rounded bg-secondary ${className ?? ""}`} aria-busy="true" />;

// The map code (and its stylesheet) is only downloaded when a map is actually shown, so browsing the shop never loads it.
const OsmMap = dynamic(() => import("./OsmMap"), { ssr: false, loading: () => <Loading className="h-full min-h-64 w-full" /> });
const GoogleMapView = dynamic(() => import("./GoogleMapView"), { ssr: false, loading: () => <Loading className="h-full min-h-64 w-full" /> });

/**
 * One map for the whole site. It draws with Google when the admin chose Google and added the browser key,
 * and with OpenStreetMap otherwise, so a missing key never leaves an empty box.
 */
export default function MapView(props: MapViewProps) {
  const google = props.config.provider === "google" && !!props.config.googleBrowserKey;
  return google ? <GoogleMapView {...props} /> : <OsmMap {...props} />;
}
