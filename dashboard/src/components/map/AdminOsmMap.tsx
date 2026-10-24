import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { SATELLITE_TILES, type MapViewProps } from "./types";

// Pins are drawn with HTML so no marker image files are needed.
const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:34px;height:42px;transform:translate(-17px,-40px)"><svg viewBox="0 0 34 42" width="34" height="42"><path d="M17 1C8.7 1 2 7.5 2 15.6 2 26.5 17 41 17 41s15-14.500 15-25.400C32 7.500 25.300 1 17 1z" fill="#e0261b" stroke="#fff" stroke-width="2"/><circle cx="17" cy="15.500" r="5.500" fill="#fff"/></svg></div>',
  iconSize: [0, 0],
});
const shopIcon = L.divIcon({
  className: "",
  html: '<div style="transform:translate(-16px,-16px);width:32px;height:32px;border-radius:8px;background:#0b6234;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5M4 9v11h16V9M9 20v-6h6v6"/></svg></div>',
  iconSize: [0, 0],
});

/** The admin Leaflet map (OpenStreetMap tiles or Esri satellite imagery). */
export default function AdminOsmMap(p: MapViewProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<{ tiles?: L.TileLayer; pin?: L.Marker; shop?: L.Marker; accuracy?: L.Circle; radius?: L.Circle; route?: L.Polyline }>({});
  const cb = useRef(p.onMarkerChange);
  const draggable = useRef(!!p.draggable);
  useEffect(() => {
    cb.current = p.onMarkerChange;
    draggable.current = !!p.draggable;
  });

  // create the map once
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [p.center.lat, p.center.lng], zoom: p.zoom ?? 15, zoomControl: true, attributionControl: true });
    map.current = m;
    m.on("click", (e: L.LeafletMouseEvent) => {
      if (draggable.current) cb.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      layers.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tiles: street map or satellite
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layers.current.tiles?.remove();
    const url = p.satellite ? SATELLITE_TILES : p.tileUrl;
    layers.current.tiles = L.tileLayer(url, {
      maxZoom: 19,
      attribution: p.satellite ? "Imagery &copy; Esri" : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
  }, [p.satellite, p.tileUrl]);

  // the delivery pin (and the grey accuracy circle around it)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const L1 = layers.current;
    if (!p.marker) {
      L1.pin?.remove();
      L1.accuracy?.remove();
      L1.pin = undefined;
      L1.accuracy = undefined;
      return;
    }
    const at: L.LatLngExpression = [p.marker.lat, p.marker.lng];
    if (!L1.pin) {
      L1.pin = L.marker(at, { icon: pinIcon, draggable: !!p.draggable, keyboard: true }).addTo(m);
      L1.pin.on("dragend", () => {
        const ll = L1.pin!.getLatLng();
        cb.current?.({ lat: ll.lat, lng: ll.lng });
      });
    } else {
      L1.pin.setLatLng(at);
      if (L1.pin.dragging) {
        if (p.draggable) L1.pin.dragging.enable();
        else L1.pin.dragging.disable();
      }
    }
    if (p.accuracyM && p.accuracyM > 0) {
      if (!L1.accuracy) L1.accuracy = L.circle(at, { radius: p.accuracyM, color: "#1e88b5", weight: 1, fillColor: "#1e88b5", fillOpacity: 0.12, interactive: false }).addTo(m);
      else L1.accuracy.setLatLng(at).setRadius(p.accuracyM);
    } else {
      L1.accuracy?.remove();
      L1.accuracy = undefined;
    }
  }, [p.marker, p.draggable, p.accuracyM]);

  // the shop and the service area
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const L1 = layers.current;
    if (p.origin) {
      const at: L.LatLngExpression = [p.origin.lat, p.origin.lng];
      if (!L1.shop) L1.shop = L.marker(at, { icon: shopIcon, interactive: !!p.originLabel, keyboard: false }).addTo(m);
      else L1.shop.setLatLng(at);
      if (p.originLabel) L1.shop.bindTooltip(p.originLabel, { direction: "top", offset: [0, -14] });
    } else {
      L1.shop?.remove();
      L1.shop = undefined;
    }
    const centre = p.radiusCenter ?? p.origin;
    if (p.radiusKm && centre) {
      const at: L.LatLngExpression = [centre.lat, centre.lng];
      if (!L1.radius) L1.radius = L.circle(at, { radius: p.radiusKm * 1000, color: "#45a22c", weight: 2, dashArray: "6 6", fillColor: "#45a22c", fillOpacity: 0.05, interactive: false }).addTo(m);
      else L1.radius.setLatLng(at).setRadius(p.radiusKm * 1000);
    } else {
      L1.radius?.remove();
      L1.radius = undefined;
    }
  }, [p.origin, p.originLabel, p.radiusKm, p.radiusCenter]);

  // the road
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layers.current.route?.remove();
    layers.current.route = undefined;
    if (p.route && p.route.length > 1) {
      layers.current.route = L.polyline(
        p.route.map((q) => [q.lat, q.lng] as L.LatLngTuple),
        { color: "#0b6234", weight: 5, opacity: 0.85 },
      ).addTo(m);
    }
  }, [p.route]);

  // show everything that matters: the pin and the shop (or the centre when there is no pin)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const pts: L.LatLngTuple[] = [];
    if (p.marker) pts.push([p.marker.lat, p.marker.lng]);
    if (p.origin && (p.marker || p.route?.length)) pts.push([p.origin.lat, p.origin.lng]);
    if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16, animate: true });
    else if (pts.length === 1) m.setView(pts[0], Math.max(m.getZoom(), p.zoom ?? 15), { animate: true });
    else m.setView([p.center.lat, p.center.lng], p.zoom ?? 15);
    // only when the key changes: dragging the pin must not make the map jump around
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fitKey]);

  return <div ref={el} className={p.className} role="application" aria-label={p.ariaLabel} />;
}
