import puppeteer from "puppeteer";
import { getNextProxy } from "./proxy-manager.js";

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[.\sTL]/g, ""), 10) || 0;
}

function parseKm(kmStr) {
  if (!kmStr) return 0;
  return parseInt(kmStr.replace(/\./g, ""), 10) || 0;
}

export function parseArabamDetailPage(html, url) {
  const getDataKey = (key) => {
    const regex = new RegExp(`data-key="${key}">([^<]+)</span>`);
    const match = html.match(regex);
    return match ? match[1].trim() : null;
  };

  const priceMatch = html.match(/listing-price[^>]*>([\d.]+\s*TL)/);
  const titleMatch = html.match(/listing-title[^>]*>([^<]+)/);

  const sellerRaw = getDataKey("seller");

  return {
    external_id: url.split("/").pop() || "",
    source: "arabam",
    url,
    title: titleMatch ? titleMatch[1].trim() : "",
    brand: getDataKey("brand"),
    model: getDataKey("model"),
    year: parseInt(getDataKey("year"), 10) || 0,
    fuel_type: getDataKey("fuel"),
    transmission: getDataKey("gear"),
    mileage: parseKm(getDataKey("km")),
    color: getDataKey("color"),
    price: priceMatch ? parsePrice(priceMatch[1]) : 0,
    location_city: getDataKey("city"),
    location_district: getDataKey("town"),
    seller_type: sellerRaw === "Galeriden" ? "galeri" : "sahibinden",
    damage_record: getDataKey("damage"),
  };
}

function randomDelay(min = 3000, max = 8000) {
  return new Promise((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min))
  );
}

export async function scrapeArabam(searchUrl, maxPages = 3) {
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
      const pageUrl = p === 0 ? searchUrl : `${searchUrl}?page=${p + 1}`;
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await randomDelay();

      const links = await page.$$eval(
        'a[href*="/ilan/"]',
        (els) => els.map((el) => el.href).filter((h) => h.includes("/ilan/"))
      );

      const uniqueLinks = [...new Set(links)];
      if (uniqueLinks.length === 0) break;

      for (const link of uniqueLinks) {
        try {
          await page.goto(link, { waitUntil: "networkidle2", timeout: 30000 });
          await randomDelay();

          const html = await page.content();
          const listing = parseArabamDetailPage(html, link);
          if (listing.price > 0) listings.push(listing);
        } catch (err) {
          console.error(`Error scraping arabam listing:`, err.message);
        }
      }
    }
  } finally {
    await browser.close();
  }

  return listings;
}

export async function saveListings(listings) {
  // Placeholder — will be replaced when sahibinden-scraper.js is available
  return listings;
}
