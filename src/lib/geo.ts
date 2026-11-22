// 위치 처리 규칙을 한곳에 모았습니다.
// 원칙: 원본 좌표는 본인 기기 밖으로 나가지 않고, 남에게 보이는 것은 전부 여기 함수를 거칩니다.

export type LatLng = { lat: number; lng: number };
export type TrailPoint = LatLng & { t: number };
export type Zone = LatLng & { radiusM: number; label: string };

const M_PER_DEG_LAT = 111_320;

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 좌표를 gridM 미터 격자의 칸 중심으로 옮깁니다. 정확한 위치를 가리는 기본 수단입니다. */
export function snapToGrid(p: LatLng, gridM: number): LatLng & { cellId: string } {
  const dLat = gridM / M_PER_DEG_LAT;
  const row = Math.floor(p.lat / dLat);
  const lat = (row + 0.5) * dLat;
  // 경도 칸 너비는 칸 중심 위도 기준으로 계산해 같은 줄의 칸 크기를 맞춥니다.
  const dLng = gridM / (M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  const col = Math.floor(p.lng / dLng);
  const lng = (col + 0.5) * dLng;
  return { lat, lng, cellId: `${row}:${col}` };
}

/** 숨김 구역(집 등) 안의 점을 제거합니다. */
export function removeHidden<T extends LatLng>(points: T[], zones: Zone[]): T[] {
  if (zones.length === 0) return points;
  return points.filter((p) => zones.every((z) => distanceM(p, z) > z.radiusM));
}

/** 친구에게 보여줄 동선: 숨김 구역 제거 → 격자로 뭉개기 → 연속 중복 제거. */
export function shareableTrail(points: TrailPoint[], zones: Zone[], gridM: number): TrailPoint[] {
  const out: (TrailPoint & { cellId: string })[] = [];
  for (const p of removeHidden(points, zones)) {
    const s = snapToGrid(p, gridM);
    if (out.length && out[out.length - 1].cellId === s.cellId) continue;
    out.push({ lat: s.lat, lng: s.lng, t: p.t, cellId: s.cellId });
  }
  return out.map(({ lat, lng, t }) => ({ lat, lng, t }));
}

export type CrowdCell = LatLng & { cellId: string; count: number };

/**
 * 익명 인원 지도. 칸마다 서로 다른 사람 수를 세고, minCount 미만인 칸은 버립니다.
 * 혼자 있는 사람이 지도에 드러나지 않게 하는 장치라 minCount는 3 미만으로 내리면 안 됩니다.
 */
export function aggregateCrowd(
  positions: { userId: string; pos: LatLng }[],
  gridM: number,
  minCount: number
): CrowdCell[] {
  const cells = new Map<string, { lat: number; lng: number; users: Set<string> }>();
  for (const { userId, pos } of positions) {
    const s = snapToGrid(pos, gridM);
    const cell = cells.get(s.cellId) ?? { lat: s.lat, lng: s.lng, users: new Set<string>() };
    cell.users.add(userId);
    cells.set(s.cellId, cell);
  }
  return [...cells.entries()]
    .map(([cellId, c]) => ({ cellId, lat: c.lat, lng: c.lng, count: c.users.size }))
    .filter((c) => c.count >= Math.max(3, minCount))
    .sort((a, b) => b.count - a.count);
}

export function trailLengthM(points: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += distanceM(points[i - 1], points[i]);
  return sum;
}
