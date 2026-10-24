import { lazy, Suspense, useState } from "react";
import type { MapViewProps } from "./types";

const AdminOsmMap = lazy(() => import("./AdminOsmMap"));
const AdminGoogleMap = lazy(() => import("./AdminGoogleMap"));

/**
 * Unified Admin Map.
 * Renders Google Maps when googleBrowserKey is available and Google Maps is active,
 * falling back seamlessly to OpenStreetMap (Leaflet) if unconfigured or on auth error.
 */
export default function AdminMap(props: MapViewProps) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const wantsGoogle = (props.provider === "google" || !props.provider) && !!props.googleBrowserKey;
  const useGoogle = wantsGoogle && !googleFailed;

  return (
    <Suspense fallback={<div className="h-full w-full min-h-[200px] animate-pulse bg-muted" />}>
      {useGoogle ? (
        <AdminGoogleMap
          {...props}
          onAuthError={() => {
            setGoogleFailed(true);
            props.onAuthError?.();
          }}
        />
      ) : (
        <AdminOsmMap {...props} />
      )}
    </Suspense>
  );
}
