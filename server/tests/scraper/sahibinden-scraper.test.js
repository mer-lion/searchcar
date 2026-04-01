import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/db/supabase.js", () => ({
  supabase: {},
}));

import { parseListingPage, parseSearchResults } from "../../src/scraper/sahibinden-scraper.js";

const sampleSearchHTML = `
<tr class="searchResultsItem" data-id="123456">
  <td class="searchResultsAttributeValue">2020</td>
  <td class="searchResultsAttributeValue">85.000</td>
  <td class="searchResultsAttributeValue">Beyaz</td>
  <td class="searchResultsPriceValue">
    <div>1.250.000 TL</div>
  </td>
  <td class="searchResultsLocationValue">
    <span>İstanbul</span><br/><span>Kadıköy</span>
  </td>
  <td class="searchResultsDateValue">
    <span>28 Mart 2026</span>
  </td>
</tr>
`;

describe("parseSearchResults", () => {
  it("extracts listing IDs and basic data from search HTML", () => {
    const results = parseSearchResults(sampleSearchHTML);
    expect(results).toHaveLength(1);
    expect(results[0].external_id).toBe("123456");
    expect(results[0].price).toBe(1250000);
  });
});

const sampleDetailHTML = `
<div id="classifiedDetail">
  <h1 class="classifiedDetailTitle">
    <span>Volkswagen Golf 1.5 TSI Comfortline</span>
  </h1>
  <ul class="classifiedInfoList">
    <li><strong>İlan No</strong><span>123456</span></li>
    <li><strong>Marka</strong><span>Volkswagen</span></li>
    <li><strong>Seri</strong><span>Golf</span></li>
    <li><strong>Yıl</strong><span>2020</span></li>
    <li><strong>Yakıt</strong><span>Benzin</span></li>
    <li><strong>Vites</strong><span>Otomatik</span></li>
    <li><strong>KM</strong><span>85.000</span></li>
    <li><strong>Renk</strong><span>Beyaz</span></li>
    <li><strong>Kimden</strong><span>Galeriden</span></li>
    <li><strong>Hasar Durumu</strong><span>Belirtilmemiş</span></li>
  </ul>
  <div class="classifiedPrice">1.250.000 TL</div>
  <div class="classifiedLocation">İstanbul / Kadıköy</div>
</div>
`;

describe("parseListingPage", () => {
  it("extracts full listing data from detail page HTML", () => {
    const listing = parseListingPage(sampleDetailHTML, "https://sahibinden.com/ilan/123456");
    expect(listing.brand).toBe("Volkswagen");
    expect(listing.model).toBe("Golf");
    expect(listing.year).toBe(2020);
    expect(listing.price).toBe(1250000);
    expect(listing.mileage).toBe(85000);
    expect(listing.fuel_type).toBe("Benzin");
    expect(listing.transmission).toBe("Otomatik");
    expect(listing.source).toBe("sahibinden");
  });
});
