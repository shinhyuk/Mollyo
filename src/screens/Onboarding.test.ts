import { describe, expect, it } from "vitest";
import { MIN_AGE, fullAge } from "./Onboarding";

describe("fullAge", () => {
  const now = new Date(2026, 10, 22);

  it("생일이 지났으면 연도 차이 그대로", () => {
    expect(fullAge(new Date(2012, 0, 5), now)).toBe(14);
  });

  it("생일이 안 지났으면 한 살 적다", () => {
    expect(fullAge(new Date(2012, 11, 1), now)).toBe(13);
    expect(fullAge(new Date(2012, 11, 1), now)).toBeLessThan(MIN_AGE);
  });

  it("생일 당일은 지난 것으로 본다", () => {
    expect(fullAge(new Date(2012, 10, 22), now)).toBe(14);
  });
});
