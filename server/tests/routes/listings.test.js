import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/db/supabase.js", () => ({ supabase: {} }));

import { buildListingsQuery } from "../../src/routes/listings.js";

describe("buildListingsQuery", () => {
  it("applies brand filter", () => {
    const filters = { brand: "Volkswagen" };
    const query = buildListingsQuery(filters);
    expect(query.filters).toContainEqual({ field: "brand", value: "Volkswagen" });
  });

  it("applies price range filter", () => {
    const filters = { priceMin: 500000, priceMax: 1500000 };
    const query = buildListingsQuery(filters);
    expect(query.filters).toContainEqual({ field: "price", op: "gte", value: 500000 });
    expect(query.filters).toContainEqual({ field: "price", op: "lte", value: 1500000 });
  });

  it("applies decision filter", () => {
    const filters = { decision: "AL" };
    const query = buildListingsQuery(filters);
    expect(query.joinAnalysis).toBe(true);
    expect(query.analysisFilter).toEqual({ decision: "AL" });
  });
});
