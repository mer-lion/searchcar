import { describe, it, expect } from "vitest";
import { calculateProfitScore, getDecision } from "../../src/analysis/profit-calculator.js";

describe("calculateProfitScore", () => {
  it("returns high score for significantly underpriced listing", () => {
    const score = calculateProfitScore({
      priceDiffPercent: -20,
      liquidityScore: 80,
      mileageAgeConsistency: 90,
      damageRisk: 10,
      sellerReliability: 80,
    });
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns low score for overpriced listing", () => {
    const score = calculateProfitScore({
      priceDiffPercent: 15,
      liquidityScore: 40,
      mileageAgeConsistency: 50,
      damageRisk: 60,
      sellerReliability: 30,
    });
    expect(score).toBeLessThan(40);
  });

  it("clamps score between 0 and 100", () => {
    const extremeHigh = calculateProfitScore({
      priceDiffPercent: -50,
      liquidityScore: 100,
      mileageAgeConsistency: 100,
      damageRisk: 0,
      sellerReliability: 100,
    });
    expect(extremeHigh).toBeLessThanOrEqual(100);

    const extremeLow = calculateProfitScore({
      priceDiffPercent: 50,
      liquidityScore: 0,
      mileageAgeConsistency: 0,
      damageRisk: 100,
      sellerReliability: 0,
    });
    expect(extremeLow).toBeGreaterThanOrEqual(0);
  });
});

describe("getDecision", () => {
  it("returns AL for score >= 65", () => {
    expect(getDecision(65)).toBe("AL");
    expect(getDecision(90)).toBe("AL");
  });

  it("returns DÜŞÜN for score 40-64", () => {
    expect(getDecision(40)).toBe("DÜŞÜN");
    expect(getDecision(64)).toBe("DÜŞÜN");
  });

  it("returns REDDET for score < 40", () => {
    expect(getDecision(39)).toBe("REDDET");
    expect(getDecision(0)).toBe("REDDET");
  });
});
