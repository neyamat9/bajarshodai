"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeoError = "unsupported" | "insecure" | "denied" | "unavailable" | "timeout";

export interface GeoFix {
  lat: number;
  lng: number;
  /** metres: how close the phone thinks it is */
  accuracyM: number;
}

// A good fix is under this many metres: the watch stops as soon as it gets one.
const GOOD_ENOUGH_M = 50;
// The longest we wait for a good fix; the best one seen so far is used after that.
const MAX_WAIT_MS = 12000;

/**
 * The phone's location, on request (never in the background). It watches for a few seconds so the first rough
 * fix (a mast, maybe 2 km off) is replaced by a GPS one, then stops. Errors say what to do about them.
 */
export function useGeolocation() {
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeoError | null>(null);
  const watch = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    if (timer.current) clearTimeout(timer.current);
    watch.current = null;
    timer.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  /** Resolves with the best fix found, or null (and `error` says why). */
  const locate = useCallback((): Promise<GeoFix | null> => {
    stop();
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("unsupported");
      return Promise.resolve(null);
    }
    // phones only give a location to a secure page (https), except on localhost
    if (!window.isSecureContext) {
      setError("insecure");
      return Promise.resolve(null);
    }
    setLoading(true);
    return new Promise((resolve) => {
      let best: GeoFix | null = null;
      const done = (result: GeoFix | null, err?: GeoError) => {
        stop();
        setLoading(false);
        if (result) setFix(result);
        else if (err) setError(err);
        resolve(result);
      };
      timer.current = setTimeout(() => done(best, best ? undefined : "timeout"), MAX_WAIT_MS);
      watch.current = navigator.geolocation.watchPosition(
        (pos) => {
          const f = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) };
          if (!best || f.accuracyM < best.accuracyM) best = f;
          setFix(best);
          if (f.accuracyM <= GOOD_ENOUGH_M) done(best);
        },
        (err) => {
          // a first error while we have nothing: tell the customer; with a rough fix in hand, just use that
          if (best) return done(best);
          done(null, err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: MAX_WAIT_MS },
      );
    });
  }, [stop]);

  return { fix, loading, error, locate, cancel: stop };
}
