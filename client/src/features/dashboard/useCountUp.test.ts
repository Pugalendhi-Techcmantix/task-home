import { describe, expect, it } from "vitest";
import { countUpValue, easeOutQuart, prefersReducedMotion } from "./useCountUp";

describe("easeOutQuart", () => {
  it("starts at 0, ends at 1 and clamps outside 0..1", () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
    expect(easeOutQuart(-0.5)).toBe(0);
    expect(easeOutQuart(2)).toBe(1);
  });

  it("is an ease-out: past the halfway value at half time", () => {
    expect(easeOutQuart(0.5)).toBeCloseTo(0.9375);
  });
});

describe("countUpValue", () => {
  it("holds the start value before the tween begins", () => {
    expect(countUpValue(0, 12, -40, 500)).toBe(0);
    expect(countUpValue(0, 12, 0, 500)).toBe(0);
  });

  it("lands exactly on the target at and after the duration", () => {
    expect(countUpValue(0, 12, 500, 500)).toBe(12);
    expect(countUpValue(0, 12, 900, 500)).toBe(12);
  });

  it("returns whole numbers in between", () => {
    const mid = countUpValue(0, 7, 120, 500);
    expect(Number.isInteger(mid)).toBe(true);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(7);
  });

  it("tweens downwards from an old value to a new one", () => {
    const mid = countUpValue(20, 10, 200, 420);
    expect(mid).toBeLessThan(20);
    expect(mid).toBeGreaterThanOrEqual(10);
  });

  it("jumps straight to the target when the duration is zero", () => {
    expect(countUpValue(0, 9, 0, 0)).toBe(9);
  });
});

describe("prefersReducedMotion", () => {
  it("is false where there is no window (node tests, SSR)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
