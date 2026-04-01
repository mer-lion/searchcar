import { describe, it, expect } from "vitest";
import { calculateMarketValue, adjustForMileage, adjustForLocation } from "../../src/analysis/price-analyzer.js";

describe("calculateMarketValue", () => {
  it("returns median price for matching listings", () => {
    const listings = [
      { price: 1_000_000, mileage: 80000, location_city: "Ankara" },
      { price: 1_200_000, mileage: 90000, location_city: "İstanbul" },
      { price: 1_100_000, mileage: 85000, location_city: "İzmir" },
      { price: 1_400_000, mileage: 70000, location_city: "İstanbul" },
      { price: 1_050_000, mileage: 95000, location_city: "Bursa" },
    ];
    const result = calculateMarketValue(listings);
    expect(result).toBe(1_100_000);
  });

  it("returns 0 when no listings provided", () => {
    expect(calculateMarketValue([])).toBe(0);
  });

  it("returns single price when one listing", () => {
    expect(calculateMarketValue([{ price: 500_000 }])).toBe(500_000);
  });
});

describe("adjustForMileage", () => {
  it("reduces value when mileage is above average", () => {
    const adjusted = adjustForMileage(1_000_000, 102_000, 85_000);
    expect(adjusted).toBe(900_000);
  });

  it("increases value when mileage is below average", () => {
    const adjusted = adjustForMileage(1_000_000, 68_000, 85_000);
    expect(adjusted).toBe(1_100_000);
  });

  it("no change when mileage matches average", () => {
    const adjusted = adjustForMileage(1_000_000, 85_000, 85_000);
    expect(adjusted).toBe(1_000_000);
  });
});

describe("adjustForLocation", () => {
  it("adds premium for Istanbul", () => {
    const adjusted = adjustForLocation(1_000_000, "İstanbul");
    expect(adjusted).toBe(1_070_000);
  });

  it("adds premium for Ankara", () => {
    const adjusted = adjustForLocation(1_000_000, "Ankara");
    expect(adjusted).toBe(1_050_000);
  });

  it("no change for other cities", () => {
    const adjusted = adjustForLocation(1_000_000, "Bursa");
    expect(adjusted).toBe(1_000_000);
  });
});
