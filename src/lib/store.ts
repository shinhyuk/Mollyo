// 데이터 계층. 지금은 기기 안(localStorage)에만 저장합니다.
// 서버를 붙일 때는 이 파일의 함수 시그니처를 유지하고 내부만 바꾸면 됩니다.
import type { TrailPoint, Zone } from "./geo";

export type Profile = {
  nickname: string;
  schoolId: string;
  grade: number;
  classNo: number;
  /** 만 14세 이상 확인 여부만 저장합니다. 생년은 저장하지 않습니다. */
  ageConfirmed: true;
};

export type ShareScope = "off" | "friends";

export type Settings = {
  /** 동선 공유 범위. 기본값은 꺼짐입니다. */
  shareTrail: ShareScope;
  /** 익명 인원 지도에 내 위치를 보탤지 여부. 기본값은 꺼짐입니다. */
  joinCrowd: boolean;
  hiddenZones: Zone[];
};

export const DEFAULT_SETTINGS: Settings = { shareTrail: "off", joinCrowd: false, hiddenZones: [] };

/** 친구에게 보이는 동선의 격자 크기(미터). */
export const SHARE_GRID_M = 250;
/** 인원 지도 격자 크기와 최소 표시 인원. */
export const CROWD_GRID_M = 300;
export const CROWD_MIN_COUNT = 3;
/** 동선 보관 기간(일). 지나면 기기에서 지웁니다. */
export const TRAIL_KEEP_DAYS = 7;

const KEY = {
  profile: "mollyo.profile",
  settings: "mollyo.settings",
  trail: (day: string) => `mollyo.trail.${day}`,
  votes: "mollyo.votes",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 없거나 사생활 보호 모드면 조용히 넘어갑니다.
  }
}

export function dayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export const loadProfile = () => read<Profile | null>(KEY.profile, null);
export const saveProfile = (p: Profile) => write(KEY.profile, p);

export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEY.settings, {}) });
export const saveSettings = (s: Settings) => write(KEY.settings, s);

export const loadTrail = (day: string) => read<TrailPoint[]>(KEY.trail(day), []);
export const saveTrail = (day: string, pts: TrailPoint[]) => write(KEY.trail(day), pts);

export function appendTrailPoint(p: TrailPoint) {
  const day = dayKey(new Date(p.t));
  const pts = loadTrail(day);
  pts.push(p);
  saveTrail(day, pts);
}

/** 보관 기간이 지난 동선을 지웁니다. 앱을 열 때마다 호출합니다. */
export function pruneOldTrails() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRAIL_KEEP_DAYS);
  const cutoffKey = dayKey(cutoff);
  const prefix = "mollyo.trail.";
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix) && k.slice(prefix.length) < cutoffKey) localStorage.removeItem(k);
    }
  } catch {
    // 무시
  }
}

export type VoteState = { answered: number; received: number };
export const loadVotes = () => read<VoteState>(KEY.votes, { answered: 0, received: 0 });
export const saveVotes = (v: VoteState) => write(KEY.votes, v);

export function wipeAll() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("mollyo.")) localStorage.removeItem(k);
    }
  } catch {
    // 무시
  }
}
