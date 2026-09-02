import { describe, expect, it } from "vitest";
import { crossfadeRainLoop } from "../rain-audio-loop";

describe("rain recording loop seam", () => {
  it("turns an 18-second excerpt into a 16-second loop without mutating it", () => {
    const input = Float32Array.from(
      { length: 1800 },
      (_, i) => Math.sin(i) * 0.1,
    );
    const before = input.slice();
    const [output] = crossfadeRainLoop([input], 100);
    expect(output.length).toBe(1600);
    expect(input).toEqual(before);
    expect(output.subarray(0, 1400)).toEqual(input.subarray(200, 1600));
  });
  it("makes the wrap seam exactly one existing adjacent sample step", () => {
    const input = Float32Array.from({ length: 1800 }, (_, i) =>
      Math.cos(i * 0.05),
    );
    const [output] = crossfadeRainLoop([input], 100);
    expect(output[0]).toBe(input[200]);
    expect(output.at(-1)).toBe(input[199]);
    expect(output[1400]).toBe(input[1600]);
  });
  it("uses equal-power overlap to avoid a volume hole in uncorrelated rain", () => {
    // Two independent, orthogonal channels make total power measurable.
    const left = new Float32Array(1800);
    const right = new Float32Array(1800);
    left.fill(0.2, 1600);
    right.fill(0.2, 0, 200);
    const output = crossfadeRainLoop([left, right], 100);
    for (let i = 1400; i < 1600; i += 1) {
      expect(output[0][i] ** 2 + output[1][i] ** 2).toBeCloseTo(0.04, 6);
    }
  });
  it("clamps the overlap for short clips and rejects malformed data", () => {
    expect(crossfadeRainLoop([new Float32Array(100)], 100)[0].length).toBe(50);
    expect(() => crossfadeRainLoop([], 100)).toThrow();
    expect(() => crossfadeRainLoop([new Float32Array(100)], 0)).toThrow();
    expect(() =>
      crossfadeRainLoop([new Float32Array(100)], 100, NaN),
    ).toThrow();
    expect(() =>
      crossfadeRainLoop([new Float32Array(100), new Float32Array(99)], 100),
    ).toThrow();
  });
});
