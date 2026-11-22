import { useEffect, useRef } from "react";
import L from "leaflet";
import type { LatLng } from "../lib/geo";

export type MapLine = { points: LatLng[]; color: string; dashed?: boolean };
export type MapCircle = LatLng & { radiusM: number; color: string; label?: string };

type Props = {
  center: LatLng;
  lines?: MapLine[];
  circles?: MapCircle[];
  /** 내용이 바뀔 때 지도 범위를 다시 맞출지 여부 */
  fit?: boolean;
};

export function MapView({ center, lines = [], circles = [], fit = true }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(
      [center.lat, center.lng],
      15
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap",
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      layer.current = null;
    };
    // 지도는 한 번만 만듭니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    for (const line of lines) {
      if (line.points.length === 0) continue;
      const latlngs = line.points.map((p) => [p.lat, p.lng] as L.LatLngExpression);
      bounds.push(...latlngs);
      // 검은 외곽선 위에 색 선을 겹쳐 네오 브루탈리즘 느낌의 굵은 선을 만듭니다.
      L.polyline(latlngs, { color: "#000", weight: 9, opacity: 1 }).addTo(g);
      L.polyline(latlngs, {
        color: line.color,
        weight: 5,
        opacity: 1,
        dashArray: line.dashed ? "2 10" : undefined,
      }).addTo(g);
      const last = latlngs[latlngs.length - 1];
      L.circleMarker(last, { radius: 8, color: "#000", weight: 3, fillColor: line.color, fillOpacity: 1 }).addTo(g);
    }

    for (const c of circles) {
      bounds.push([c.lat, c.lng]);
      const circle = L.circle([c.lat, c.lng], {
        radius: c.radiusM,
        color: "#000",
        weight: 3,
        fillColor: c.color,
        fillOpacity: 0.75,
      }).addTo(g);
      if (c.label) {
        circle.bindTooltip(c.label, { permanent: true, direction: "center", className: "map-label" });
      }
    }

    if (fit && bounds.length > 0) {
      m.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 16 });
    }
  }, [lines, circles, fit]);

  return <div ref={el} className="map" role="img" aria-label="지도" />;
}
