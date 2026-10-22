"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MapViewProps } from "./types";

const Loading = ({ className }: { className?: string }) => <div className={`animate-pulse rounded bg-secondary ${className ?? ""}`} aria-busy="true" />;

// The map code (and its stylesheet) is only downloaded when a map is actually shown, so browsing the shop never loads it.
const OsmMap = dynamic(() => import("./OsmMap"), { ssr: false, loading: () => <Loading className="h-full min-h-64 w-full" /> });
const GoogleMapView = dynamic(() => import("./GoogleMapView"), { ssr: false, loading: () => <Loading className="h-full min-h-64 w-full" /> });

/**
 * One map for the whole site. It draws with Google when the admin chose Google and added the browser key,
 * and with OpenStreetMap otherwise, so a missing key or auth error never leaves an empty box or broken modal.
 */
export default function MapView(props: MapViewProps) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const isDirectMode = (props.config.distanceCalculation ?? "direct") === "direct";
  // Direct distance attempts Google Map if key is configured, but smoothly falls back to OsmMap if billing/auth fails
  // Road distance uses the active provider selected by admin (default OSM, or Google)
  const wantsGoogle = (isDirectMode || props.config.provider === "google") && !!props.config.googleBrowserKey;
  const useGoogle = wantsGoogle && !googleFailed;

  return useGoogle ? (
    <GoogleMapView
      {...props}
      onAuthError={() => {
        setGoogleFailed(true);
        props.onAuthError?.();
      }}
    />
  ) : (
    <OsmMap {...props} />
  );
}
