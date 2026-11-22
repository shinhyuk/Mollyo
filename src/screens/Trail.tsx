import { useEffect, useMemo, useRef, useState } from "react";
import { MapView, type MapLine } from "../components/MapView";
import { distanceM, shareableTrail, trailLengthM, type TrailPoint } from "../lib/geo";
import { CENTER, FRIENDS, mockTrail } from "../lib/mock";
import {
  SHARE_GRID_M,
  appendTrailPoint,
  dayKey,
  loadTrail,
  saveTrail,
  yesterdayKey,
  type Settings,
} from "../lib/store";

type Day = "yesterday" | "today";
type View = "mine" | "shared";

const MIN_MOVE_M = 20;
const MIN_GAP_MS = 60_000;

function startOfYesterday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return d.getTime();
}

export function Trail({ settings, onOpenSettings }: { settings: Settings; onOpenSettings: () => void }) {
  const [day, setDay] = useState<Day>("yesterday");
  const [view, setView] = useState<View>("mine");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const watchId = useRef<number | null>(null);
  const last = useRef<TrailPoint | null>(null);

  const key = day === "yesterday" ? yesterdayKey() : dayKey();
  // version이 바뀌면 저장소에서 다시 읽습니다.
  const mine = useMemo(() => loadTrail(key), [key, version]);
  const shared = useMemo(
    () => shareableTrail(mine, settings.hiddenZones, SHARE_GRID_M),
    [mine, settings.hiddenZones]
  );
  const sharing = settings.shareTrail === "friends";

  // 친구 동선은 어제 것만, 내가 공유를 켰을 때만 보입니다(서로 공유).
  const friendTrails = useMemo(() => {
    if (!sharing || day !== "yesterday") return [];
    const start = startOfYesterday();
    return FRIENDS.map((f) => ({ ...f, points: shareableTrail(mockTrail(f.seed, start), [], SHARE_GRID_M) }));
  }, [sharing, day]);

  const lines = useMemo<MapLine[]>(() => {
    const out: MapLine[] = friendTrails.map((f) => ({ points: f.points, color: f.color, dashed: true }));
    out.push({ points: view === "mine" ? mine : shared, color: "#FFE600" });
    return out;
  }, [friendTrails, mine, shared, view]);

  const stop = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setRecording(false);
  };

  const start = () => {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("이 기기에서는 위치를 쓸 수 없어요.");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: TrailPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, t: pos.timestamp };
        const prev = last.current;
        if (prev && distanceM(prev, p) < MIN_MOVE_M && p.t - prev.t < MIN_GAP_MS) return;
        last.current = p;
        appendTrailPoint(p);
        setVersion((v) => v + 1);
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? "위치 권한이 꺼져 있어요." : "위치를 가져오지 못했어요.");
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );
    setRecording(true);
    setDay("today");
  };

  useEffect(() => stop, []);

  const addDemo = () => {
    saveTrail(yesterdayKey(), mockTrail(5, startOfYesterday()));
    setDay("yesterday");
    setVersion((v) => v + 1);
  };

  const km = (trailLengthM(mine) / 1000).toFixed(1);

  return (
    <main className="screen">
      <div className="topbar">
        <h2>내 동선</h2>
        <button className="btn small" onClick={onOpenSettings}>
          <span className={`tag ${sharing ? "on" : "off"}`}>{sharing ? "친구 공유 켜짐" : "공유 꺼짐"}</span>
        </button>
      </div>

      <div className="seg" role="group" aria-label="날짜">
        <button aria-pressed={day === "yesterday"} onClick={() => setDay("yesterday")}>
          어제
        </button>
        <button aria-pressed={day === "today"} onClick={() => setDay("today")}>
          오늘
        </button>
      </div>

      <MapView center={CENTER} lines={lines} />

      <div className="seg" role="group" aria-label="보기">
        <button aria-pressed={view === "mine"} onClick={() => setView("mine")}>
          나만 보는 동선
        </button>
        <button aria-pressed={view === "shared"} onClick={() => setView("shared")}>
          친구에게 보이는 모습
        </button>
      </div>

      {mine.length === 0 ? (
        <div className="card yellow">
          <h2>{day === "yesterday" ? "어제 기록이 없어요" : "오늘 기록이 없어요"}</h2>
          <p className="muted">기록을 켜고 돌아다니면 여기에 선이 그려져요.</p>
          <button className="btn block" onClick={addDemo}>
            데모 동선 넣어 보기
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="row">
            <span className="big">{km}</span>
            <span>km 이동</span>
          </div>
          <p className="muted">
            {view === "mine"
              ? "이 선은 내 기기에만 있어요."
              : `친구에게는 약 ${SHARE_GRID_M}m 단위로 뭉개서 보이고, 숨김 구역은 빠져요.`}
          </p>
        </div>
      )}

      <button className={`btn block ${recording ? "pink" : "green"}`} onClick={recording ? stop : start}>
        {recording ? "기록 멈추기" : "오늘 동선 기록 시작"}
      </button>
      {recording && <p className="muted">화면을 켜 둔 동안만 기록돼요.</p>}
      {error && (
        <p className="tag" role="alert">
          {error}
        </p>
      )}

      <div className="card">
        <h2>친구들의 어제</h2>
        {!sharing ? (
          <>
            <p className="muted">내 동선을 친구에게 공유해야 친구 동선도 볼 수 있어요.</p>
            <button className="btn small" onClick={onOpenSettings}>
              공유 설정 열기
            </button>
          </>
        ) : day !== "yesterday" ? (
          <p className="muted">친구 동선은 하루 지난 뒤에만 보여요.</p>
        ) : (
          <ul className="list">
            {friendTrails.map((f) => (
              <li key={f.id}>
                <span className="dot" style={{ background: f.color }} />
                <span className="grow">{f.name}</span>
                <span className="muted">{(trailLengthM(f.points) / 1000).toFixed(1)}km</span>
              </li>
            ))}
          </ul>
        )}
        <p className="muted">데모 친구예요. 실제 친구 연결은 서버가 붙은 뒤에 열려요.</p>
      </div>
    </main>
  );
}
