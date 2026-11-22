import { describe, expect, it } from "vitest";
import { aggregateCrowd, distanceM, removeHidden, shareableTrail, snapToGrid } from "./geo";

const hongdae = { lat: 37.5563, lng: 126.9236 };

describe("snapToGrid", () => {
  it("격자 중심은 원래 위치에서 칸 대각선 절반 이내", () => {
    const s = snapToGrid(hongdae, 200);
    expect(distanceM(hongdae, s)).toBeLessThan(200 * Math.SQRT1_2 + 1);
  });

  it("가까운 두 점은 같은 칸, 먼 점은 다른 칸", () => {
    const a = snapToGrid(hongdae, 200);
    const b = snapToGrid({ lat: a.lat + 0.0001, lng: a.lng + 0.0001 }, 200);
    const c = snapToGrid({ lat: hongdae.lat + 0.01, lng: hongdae.lng }, 200);
    expect(b.cellId).toBe(a.cellId);
    expect(c.cellId).not.toBe(a.cellId);
  });
});

describe("removeHidden / shareableTrail", () => {
  const home = { ...hongdae, radiusM: 300, label: "집" };
  const far = { lat: hongdae.lat + 0.02, lng: hongdae.lng };

  it("숨김 구역 안의 점은 공유 동선에서 빠진다", () => {
    const pts = [
      { ...hongdae, t: 1 },
      { ...far, t: 2 },
    ];
    expect(removeHidden(pts, [home])).toHaveLength(1);
    const shared = shareableTrail(pts, [home], 200);
    expect(shared).toHaveLength(1);
    expect(distanceM(shared[0], home)).toBeGreaterThan(300);
  });

  it("공유 동선에는 원본 좌표가 그대로 남지 않는다", () => {
    const pts = [{ lat: 37.55631234, lng: 126.92361234, t: 1 }];
    const shared = shareableTrail(pts, [], 200);
    expect(shared[0].lat).not.toBe(pts[0].lat);
    expect(shared[0].lng).not.toBe(pts[0].lng);
  });

  it("같은 칸에 머문 점은 하나로 합친다", () => {
    const pts = [1, 2, 3].map((t) => ({ lat: hongdae.lat + t * 0.00001, lng: hongdae.lng, t }));
    expect(shareableTrail(pts, [], 200)).toHaveLength(1);
  });
});

describe("aggregateCrowd", () => {
  const at = (userId: string, dLat = 0) => ({ userId, pos: { lat: hongdae.lat + dLat, lng: hongdae.lng } });

  it("3명 미만인 칸은 표시하지 않는다", () => {
    expect(aggregateCrowd([at("a"), at("b")], 300, 3)).toHaveLength(0);
    expect(aggregateCrowd([at("a"), at("b"), at("c")], 300, 3)[0].count).toBe(3);
  });

  it("같은 사람은 한 번만 센다", () => {
    expect(aggregateCrowd([at("a"), at("a"), at("a")], 300, 3)).toHaveLength(0);
  });

  it("minCount를 3보다 낮게 줘도 3이 하한이다", () => {
    expect(aggregateCrowd([at("a"), at("b")], 300, 1)).toHaveLength(0);
  });

  it("혼자 떨어진 사람은 드러나지 않는다", () => {
    const cells = aggregateCrowd([at("a"), at("b"), at("c"), at("d", 0.05)], 300, 3);
    expect(cells).toHaveLength(1);
  });
});
