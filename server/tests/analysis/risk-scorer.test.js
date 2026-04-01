import { describe, it, expect } from "vitest";
import {
  calculateMileageAgeConsistency,
  calculateDamageRisk,
  calculateSellerReliability,
  calculateLiquidityScore,
  getRiskLevel,
} from "../../src/analysis/risk-scorer.js";

describe("calculateMileageAgeConsistency", () => {
  it("returns high score for consistent mileage/age", () => {
    const score = calculateMileageAgeConsistency(90_000, 2020, 2026);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("returns low score for excessive mileage", () => {
    const score = calculateMileageAgeConsistency(200_000, 2023, 2026);
    expect(score).toBeLessThan(40);
  });
});

describe("calculateDamageRisk", () => {
  it("returns 0 risk for no damage", () => {
    expect(calculateDamageRisk("Belirtilmemiş")).toBe(0);
  });

  it("returns moderate risk for minor damage", () => {
    const risk = calculateDamageRisk("Boyalı");
    expect(risk).toBeGreaterThan(0);
    expect(risk).toBeLessThanOrEqual(40);
  });

  it("returns high risk for major damage", () => {
    const risk = calculateDamageRisk("Ağır Hasar Kayıtlı");
    expect(risk).toBeGreaterThanOrEqual(80);
  });
});

describe("calculateSellerReliability", () => {
  it("gives higher score to individual sellers", () => {
    const individual = calculateSellerReliability("sahibinden");
    const dealer = calculateSellerReliability("galeri");
    expect(individual).toBeGreaterThan(dealer);
  });
});

describe("calculateLiquidityScore", () => {
  it("returns high score for popular brands", () => {
    expect(calculateLiquidityScore("Volkswagen", "Golf")).toBeGreaterThanOrEqual(70);
  });

  it("returns lower score for niche brands", () => {
    expect(calculateLiquidityScore("Alfa Romeo", "Giulia")).toBeLessThan(50);
  });
});

describe("getRiskLevel", () => {
  it("returns DÜŞÜK for low risk scores", () => {
    expect(getRiskLevel(20)).toBe("DÜŞÜK");
  });

  it("returns ORTA for medium risk scores", () => {
    expect(getRiskLevel(50)).toBe("ORTA");
  });

  it("returns YÜKSEK for high risk scores", () => {
    expect(getRiskLevel(75)).toBe("YÜKSEK");
  });
});
