import puppeteer from "puppeteer";
import { getNextProxy } from "./proxy-manager.js";
import { supabase } from "../db/supabase.js";

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[.\sTL]/g, ""), 10) || 0;
}

function parseKm(kmStr) {
  if (!kmStr) return 0;
  return parseInt(kmStr.replace(/\./g, ""), 10) || 0;
}

export function parseSearchResults(html) {
  const results = [];
  const rowRegex = /data-id="(\d+)"/g;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const externalId = match[1];
    const priceMatch = html.match(
      new RegExp(`data-id="${externalId}"[\\s\\S]*?searchResultsPriceValue[\\s\\S]*?>([\\.\\d]+\\s*TL)<`)
    );
    results.push({
      external_id: externalId,
      price: priceMatch ? parsePrice(priceMatch[1]) : 0,
    });
  }
  return results;
}

export function parseListingPage(html, url) {
  const getField = (label) => {
    const regex = new RegExp(`<strong>${label}</strong>\\s*<span>([^<]+)</span>`);
    const match = html.match(regex);
    return match ? match[1].trim() : null;
  };

  const priceMatch = html.match(/classifiedPrice[^>]*>([\d.]+\s*TL)/);
  const locationMatch = html.match(/classifiedLocation[^>]*>([^<]+)/);
  const [city, district] = locationMatch
    ? locationMatch[1].split("/").map((s) => s.trim())
    : [null, null];

  return {
    external_id: getField("İlan No") || url.split("/").pop(),
    source: "sahibinden",
    url,
    title: (html.match(/classifiedDetailTitle[\s\S]*?<span>([^<]+)/) || [])[1]?.trim() || "",
    brand: getField("Marka"),
    model: getField("Seri"),
    year: parseInt(getField("Yıl"), 10) || 0,
    fuel_type: getField("Yakıt"),
    transmission: getField("Vites"),
    mileage: parseKm(getField("KM")),
    color: getField("Renk"),
    price: priceMatch ? parsePrice(priceMatch[1]) : 0,
    location_city: city,
    location_district: district,
    seller_type: getField("Kimden") === "Galeriden" ? "galeri" : "sahibinden",
    damage_record: getField("Hasar Durumu"),
  };
}

function randomDelay(min = 3000, max = 8000) {
  return new Promise((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min))
  );
}

export async function scrapeSahibinden(searchUrl, maxPages = 3) {
  const proxy = getNextProxy();
  const launchOptions = {
    headless: "new",
    args: proxy ? [`--proxy-server=${proxy}`] : [],
  };

  const browser = await puppeteer.launch(launchOptions);
  const listings = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    for (let p = 0; p < maxPages; p++) {
      const pageUrl = p === 0 ? searchUrl : `${searchUrl}&pagingOffset=${p * 20}`;
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await randomDelay();

      const html = await page.content();
      const searchResults = parseSearchResults(html);

      if (searchResults.length === 0) break;

      for (const result of searchResults) {
        try {
          const detailUrl = `https://www.sahibinden.com/ilan/${result.external_id}`;
          await page.goto(detailUrl, { waitUntil: "networkidle2", timeout: 30000 });
          await randomDelay();

          const detailHtml = await page.content();
          const listing = parseListingPage(detailHtml, detailUrl);
          listings.push(listing);
        } catch (err) {
          console.error(`Error scraping listing ${result.external_id}:`, err.message);
        }
      }
    }
  } finally {
    await browser.close();
  }

  return listings;
}

export async function saveListings(listings) {
  let saved = 0;
  for (const listing of listings) {
    const { data: existing } = await supabase
      .from("listings")
      .select("id, price")
      .eq("source", listing.source)
      .eq("external_id", listing.external_id)
      .single();

    if (existing) {
      if (existing.price !== listing.price) {
        await supabase
          .from("listings")
          .update({ price: listing.price, scraped_at: new Date().toISOString() })
          .eq("id", existing.id);

        await supabase.from("price_history").insert({
          listing_id: existing.id,
          price: listing.price,
        });
      }
    } else {
      const { data: inserted } = await supabase
        .from("listings")
        .insert({ ...listing, scraped_at: new Date().toISOString() })
        .select("id")
        .single();

      if (inserted) {
        await supabase.from("price_history").insert({
          listing_id: inserted.id,
          price: listing.price,
        });
        saved++;
      }
    }
  }
  return saved;
}
