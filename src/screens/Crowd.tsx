import { useMemo } from "react";
import { MapView, type MapCircle } from "../components/MapView";
import { aggregateCrowd, distanceM } from "../lib/geo";
import { CENTER, SPOTS, mockCrowdPositions } from "../lib/mock";
import { CROWD_GRID_M, CROWD_MIN_COUNT, type Settings } from "../lib/store";

const COLORS = ["#FF5C8A", "#FFE600", "#3B82F6", "#00D26A"];

function nearestSpotName(p: { lat: number; lng: number }): string {
  let best = SPOTS[0];
  for (const s of SPOTS) if (distanceM(p, s) < distanceM(p, best)) best = s;
  return best.name;
}

export function Crowd({ settings, onOpenSettings }: { settings: Settings; onOpenSettings: () => void }) {
  const cells = useMemo(() => aggregateCrowd(mockCrowdPositions(), CROWD_GRID_M, CROWD_MIN_COUNT), []);
  const named = useMemo(() => {
    // 한 장소가 격자 두 칸에 걸치면 이름이 겹치므로 두 번째부터는 "근처"를 붙입니다.
    const seen = new Set<string>();
    return cells.map((c) => {
      const base = nearestSpotName(c);
      const name = seen.has(base) ? `${base} 근처` : base;
      seen.add(base);
      return { ...c, name };
    });
  }, [cells]);
  const circles = useMemo<MapCircle[]>(
    () =>
      named.map((c, i) => ({
        lat: c.lat,
        lng: c.lng,
        radiusM: 60 + Math.min(c.count, 20) * 8,
        color: COLORS[i % COLORS.length],
        label: String(c.count),
      })),
    [named]
  );
  const total = named.reduce((n, c) => n + c.count, 0);

  return (
    <main className="screen">
      <div className="topbar">
        <h2>지금 몰린 곳</h2>
        <button className="btn small" onClick={onOpenSettings}>
          <span className={`tag ${settings.joinCrowd ? "on" : "off"}`}>
            {settings.joinCrowd ? "나도 포함" : "나는 빠짐"}
          </span>
        </button>
      </div>

      <MapView center={CENTER} circles={circles} />

      <div className="card yellow">
        <div className="row">
          <span className="big">{total}</span>
          <span>명이 {named.length}곳에 몰려 있어요</span>
        </div>
        <p className="muted">
          누가 있는지는 안 보여요. {CROWD_MIN_COUNT}명보다 적은 곳은 지도에 나오지 않아요.
        </p>
      </div>

      <ul className="list">
        {named.map((c, i) => (
          <li key={c.cellId}>
            <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="grow">{c.name}</span>
            <strong>{c.count}명</strong>
          </li>
        ))}
      </ul>
      <p className="muted">데모 숫자예요. 실제 집계는 서버가 붙은 뒤에 열려요.</p>
    </main>
  );
}
