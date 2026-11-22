// 서버가 붙기 전까지 쓰는 가짜 데이터입니다. 학교·사람 이름은 전부 지어낸 것입니다.
import type { LatLng, TrailPoint } from "./geo";

export const CENTER: LatLng = { lat: 37.5563, lng: 126.9236 };

export const SCHOOLS = [
  { id: "demo-1", name: "몰려고등학교" },
  { id: "demo-2", name: "한빛고등학교" },
  { id: "demo-3", name: "새봄고등학교" },
];

export const CLASSMATES = ["도윤", "서아", "하준", "지우", "예린", "시우", "유나", "건우"];

export const SPOTS: (LatLng & { name: string; people: number })[] = [
  { name: "역 앞 광장", lat: 37.5572, lng: 126.9245, people: 14 },
  { name: "코인노래방 골목", lat: 37.5541, lng: 126.9218, people: 9 },
  { name: "학원가", lat: 37.5601, lng: 126.9282, people: 6 },
  { name: "편의점 앞", lat: 37.5529, lng: 126.9267, people: 2 },
  { name: "공원 농구장", lat: 37.5588, lng: 126.9196, people: 4 },
];

// 시드가 같으면 항상 같은 값이 나오는 난수. 새로고침해도 데모 화면이 흔들리지 않게 합니다.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function mockCrowdPositions(): { userId: string; pos: LatLng }[] {
  const rnd = seeded(7);
  const out: { userId: string; pos: LatLng }[] = [];
  SPOTS.forEach((spot, si) => {
    for (let i = 0; i < spot.people; i++) {
      out.push({
        userId: `u${si}-${i}`,
        pos: { lat: spot.lat + (rnd() - 0.5) * 0.0008, lng: spot.lng + (rnd() - 0.5) * 0.0008 },
      });
    }
  });
  return out;
}

export function mockTrail(seed: number, dayStart: number): TrailPoint[] {
  const rnd = seeded(seed);
  const stops = [...SPOTS].sort(() => rnd() - 0.5).slice(0, 3);
  const pts: TrailPoint[] = [];
  let cur: LatLng = { lat: CENTER.lat + (rnd() - 0.5) * 0.01, lng: CENTER.lng + (rnd() - 0.5) * 0.01 };
  let t = dayStart + 15 * 3600_000;
  for (const stop of stops) {
    for (let i = 1; i <= 12; i++) {
      pts.push({
        lat: cur.lat + ((stop.lat - cur.lat) * i) / 12 + (rnd() - 0.5) * 0.0002,
        lng: cur.lng + ((stop.lng - cur.lng) * i) / 12 + (rnd() - 0.5) * 0.0002,
        t: (t += 90_000),
      });
    }
    cur = stop;
    t += 40 * 60_000;
  }
  return pts;
}

export const FRIENDS = [
  { id: "f1", name: "서아", color: "#FF5C8A", seed: 11 },
  { id: "f2", name: "하준", color: "#3B82F6", seed: 23 },
  { id: "f3", name: "지우", color: "#00B85C", seed: 37 },
];

// 칭찬 질문만 둡니다. 부정적이거나 외모를 평가하는 질문은 넣지 않습니다.
export const QUESTIONS = [
  "같이 있으면 제일 웃긴 사람은?",
  "발표를 제일 잘할 것 같은 사람은?",
  "힘들 때 제일 먼저 연락하고 싶은 사람은?",
  "10년 뒤에 제일 멋있게 살 것 같은 사람은?",
  "조별과제 같이 하고 싶은 사람은?",
  "노래방에서 분위기 살리는 사람은?",
  "비밀을 제일 잘 지켜줄 것 같은 사람은?",
  "오늘 제일 고마웠던 사람은?",
];
