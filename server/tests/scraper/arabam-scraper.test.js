import { describe, it, expect } from "vitest";
import { parseArabamDetailPage } from "../../src/scraper/arabam-scraper.js";

const sampleHTML = `
<div class="product-detail">
  <h1 class="listing-title">Volkswagen Golf 1.5 TSI</h1>
  <span class="listing-price">1.300.000 TL</span>
  <div class="listing-info">
    <span data-key="brand">Volkswagen</span>
    <span data-key="model">Golf</span>
    <span data-key="year">2020</span>
    <span data-key="fuel">Benzin</span>
    <span data-key="gear">Otomatik</span>
    <span data-key="km">90.000</span>
    <span data-key="color">Gri</span>
    <span data-key="seller">Sahibinden</span>
    <span data-key="damage">Boyalı</span>
    <span data-key="city">Ankara</span>
    <span data-key="town">Çankaya</span>
  </div>
</div>
`;

describe("parseArabamDetailPage", () => {
  it("extracts listing data from arabam detail page", () => {
    const listing = parseArabamDetailPage(sampleHTML, "https://www.arabam.com/ilan/12345");
    expect(listing.brand).toBe("Volkswagen");
    expect(listing.model).toBe("Golf");
    expect(listing.year).toBe(2020);
    expect(listing.price).toBe(1300000);
    expect(listing.mileage).toBe(90000);
    expect(listing.source).toBe("arabam");
    expect(listing.location_city).toBe("Ankara");
  });
});
