import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/db/supabase.js", () => ({ supabase: {} }));

import { formatListingMessage, formatStatusMessage } from "../../src/telegram/commands.js";

describe("formatListingMessage", () => {
  it("formats a buy opportunity into a Telegram message", () => {
    const listing = {
      title: "Volkswagen Golf 1.5 TSI",
      location_city: "İstanbul",
      location_district: "Kadıköy",
      price: 1_250_000,
      mileage: 85_000,
      color: "Beyaz",
      seller_type: "galeri",
      url: "https://sahibinden.com/ilan/123",
    };
    const analysis = {
      decision: "AL",
      confidence_score: 87,
      market_value: 1_380_000,
      estimated_profit: 130_000,
      risk_level: "DÜŞÜK",
    };

    const msg = formatListingMessage(listing, analysis);
    expect(msg).toContain("AL");
    expect(msg).toContain("87");
    expect(msg).toContain("1.250.000");
    expect(msg).toContain("1.380.000");
    expect(msg).toContain("130.000");
    expect(msg).toContain("İstanbul");
    expect(msg).toContain("sahibinden.com/ilan/123");
  });
});

describe("formatStatusMessage", () => {
  it("formats scraper status", () => {
    const msg = formatStatusMessage({
      sahibinden: 15,
      arabam: 10,
      errors: [],
    });
    expect(msg).toContain("15");
    expect(msg).toContain("10");
  });
});
