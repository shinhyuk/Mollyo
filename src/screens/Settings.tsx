import { useState } from "react";
import { SCHOOLS } from "../lib/mock";
import {
  CROWD_MIN_COUNT,
  SHARE_GRID_M,
  TRAIL_KEEP_DAYS,
  wipeAll,
  type Profile,
  type Settings,
} from "../lib/store";

const ZONE_RADIUS_M = 300;

type Props = {
  profile: Profile;
  settings: Settings;
  onChange: (s: Settings) => void;
  onWipe: () => void;
};

export function SettingsScreen({ profile, settings, onChange, onWipe }: Props) {
  const [zoneLabel, setZoneLabel] = useState("집");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const school = SCHOOLS.find((s) => s.id === profile.schoolId)?.name ?? "";

  const addZoneHere = () => {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("이 기기에서는 위치를 쓸 수 없어요.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onChange({
          ...settings,
          hiddenZones: [
            ...settings.hiddenZones,
            {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              radiusM: ZONE_RADIUS_M,
              label: zoneLabel.trim() || "숨김 구역",
            },
          ],
        });
      },
      () => {
        setBusy(false);
        setError("위치를 가져오지 못했어요. 위치 권한을 확인해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  };

  const removeZone = (i: number) =>
    onChange({ ...settings, hiddenZones: settings.hiddenZones.filter((_, idx) => idx !== i) });

  return (
    <main className="screen">
      <div className="topbar">
        <h2>설정</h2>
        <span className="tag">
          {school} {profile.grade}-{profile.classNo} {profile.nickname}
        </span>
      </div>

      <div className="card">
        <div className="row">
          <div className="grow">
            <strong>어제 동선을 친구에게 공유</strong>
            <p className="muted">
              서로 친구인 사람에게만, 하루 지난 동선을 약 {SHARE_GRID_M}m 단위로 뭉개서 보여줘요. 지금 위치는
              아무에게도 안 보여요.
            </p>
          </div>
          <input
            type="checkbox"
            className="switch"
            aria-label="어제 동선을 친구에게 공유"
            checked={settings.shareTrail === "friends"}
            onChange={(e) => onChange({ ...settings, shareTrail: e.target.checked ? "friends" : "off" })}
          />
        </div>
      </div>

      <div className="card">
        <div className="row">
          <div className="grow">
            <strong>몰린 곳 지도에 나도 포함</strong>
            <p className="muted">이름 없이 인원수로만 세요. {CROWD_MIN_COUNT}명보다 적은 곳은 표시되지 않아요.</p>
          </div>
          <input
            type="checkbox"
            className="switch"
            aria-label="몰린 곳 지도에 나도 포함"
            checked={settings.joinCrowd}
            onChange={(e) => onChange({ ...settings, joinCrowd: e.target.checked })}
          />
        </div>
      </div>

      <div className="card yellow">
        <h2>숨김 구역</h2>
        <p className="muted">집처럼 알리고 싶지 않은 곳이에요. 반경 {ZONE_RADIUS_M}m 안은 공유에서 빠져요.</p>
        {settings.hiddenZones.length > 0 && (
          <ul className="list">
            {settings.hiddenZones.map((z, i) => (
              <li key={`${z.lat}-${z.lng}-${i}`}>
                <span className="grow">{z.label}</span>
                <button className="btn small" onClick={() => removeZone(i)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="field">
          이름
          <input value={zoneLabel} maxLength={10} onChange={(e) => setZoneLabel(e.target.value)} />
        </label>
        <button className="btn block" disabled={busy} onClick={addZoneHere}>
          {busy ? "위치 확인 중" : "지금 있는 곳을 숨김 구역으로"}
        </button>
        {error && (
          <p className="tag" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="card">
        <h2>내 데이터</h2>
        <p className="muted">동선은 이 기기에만 저장되고 {TRAIL_KEEP_DAYS}일이 지나면 자동으로 지워져요.</p>
        {confirmWipe ? (
          <div className="row">
            <button
              className="btn pink grow"
              onClick={() => {
                wipeAll();
                onWipe();
              }}
            >
              전부 지우기
            </button>
            <button className="btn grow" onClick={() => setConfirmWipe(false)}>
              취소
            </button>
          </div>
        ) : (
          <button className="btn block" onClick={() => setConfirmWipe(true)}>
            기록 지우고 처음부터
          </button>
        )}
      </div>
    </main>
  );
}
