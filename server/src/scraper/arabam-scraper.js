import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { getNextProxy } from "./proxy-manager.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[.\sTL]/g, ""), 10) || 0;
}

function parseKm(kmStr) {
  if (!kmStr) return 0;
  return parseInt(kmStr.replace(/\./g, ""), 10) || 0;
}

/**
 * Parses arabam.com detail page using page.evaluate() result.
 * Can also parse from raw HTML for tests.
 */
export function parseArabamDetailPage(htmlOrData, url) {
  // If called with structured data from page.evaluate
  if (typeof htmlOrData === "object" && htmlOrData.properties) {
    return buildListingFromProperties(htmlOrData, url);
  }

  // Fallback: parse from raw HTML (for tests)
  const html = htmlOrData;
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

/**
 * Builds listing from structured property data extracted via page.evaluate().
 * This matches arabam.com's real DOM structure with .property-key / .property-value pairs.
 */
function buildListingFromProperties(data, url) {
  const props = data.properties || {};
  const externalId = url.match(/\/(\d+)(?:\?|$)/)?.[1] || url.split("/").pop() || "";

  // Parse title for location: "Galeriden Kia Rio ... 2020 Model Isparta 145.000 km Gri"
  const titleParts = (data.title || "").match(/Model\s+([^\d]+)\s+[\d.]+/);
  const locationCity = titleParts ? titleParts[1].trim() : null;

  return {
    external_id: externalId,
    source: "arabam",
    url,
    title: data.title || "",
    brand: props["Marka"] || null,
    model: props["Seri"] || null,
    year: parseInt(props["Yıl"], 10) || 0,
    fuel_type: props["Yakıt Tipi"] || null,
    transmission: props["Vites Tipi"] || null,
    mileage: parseKm(props["Kilometre"]),
    color: props["Renk"] || null,
    price: parsePrice(data.price || ""),
    location_city: locationCity,
    location_district: null,
    seller_type: props["Kimden"] === "Galeriden" ? "galeri" : "sahibinden",
    damage_record: props["Boya-değişen"] || "Belirtilmemiş",
  };
}

function randomDelay(min = 3000, max = 8000) {
  return new Promise((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min))
  );
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function simulateHuman(page) {
  await page.mouse.move(100 + Math.random() * 500, 100 + Math.random() * 300);
  await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 400));
  await randomDelay(1000, 2500);
}

export async function scrapeArabam(searchUrl, maxPages = 3) {
  const proxy = getNextProxy();
  const launchOptions = {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
      ...(proxy ? [`--proxy-server=${proxy}`] : []),
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    }),
  };

  const browser = await puppeteer.launch(launchOptions);
  const listings = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "languages", { get: () => ["tr-TR", "tr", "en-US", "en"] });
      window.chrome = { runtime: {} };
    });

    for (let p = 0; p < maxPages; p++) {
      const pageUrl = p === 0 ? searchUrl : `${searchUrl}?page=${p + 1}`;
      console.log(`[Arabam] Fetching page ${p + 1}: ${pageUrl}`);
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await simulateHuman(page);
      await randomDelay(4000, 10000);

      const links = await page.$$eval(
        'a[href*="/ilan/"]',
        (els) => els.map((el) => el.href).filter((h) => /\/ilan\/.*\/\d+$/.test(h))
      );

      const uniqueLinks = [...new Set(links)].slice(0, 20); // Max 20 per page
      console.log(`[Arabam] Found ${uniqueLinks.length} listing links on page ${p + 1}`);
      if (uniqueLinks.length === 0) break;

      for (const link of uniqueLinks) {
        try {
          console.log(`[Arabam] Fetching detail: ${link}`);
          await page.goto(link, { waitUntil: "networkidle2", timeout: 60000 });
          await simulateHuman(page);
          await randomDelay(5000, 12000);

          // Extract structured data via page.evaluate (more reliable than HTML parsing)
          const pageData = await page.evaluate(() => {
            const title = document.querySelector("h1")?.textContent?.trim() || "";
            const price = document.querySelector(".product-price")?.textContent?.trim() || "";

            // Build property map from first occurrence of each key
            const keys = Array.from(document.querySelectorAll(".property-key")).map((e) => e.textContent.trim());
            const vals = Array.from(document.querySelectorAll(".property-value")).map((e) => e.textContent.trim());

            const properties = {};
            const seen = new Set();
            // Keys have 1 offset because "Fiyat" key has no matching value in the value list
            for (let i = 0; i < keys.length && i < vals.length; i++) {
              const key = keys[i + 1]; // skip "Fiyat" key
              const val = vals[i];
              if (key && !seen.has(key)) {
                properties[key] = val;
                seen.add(key);
              }
            }

            return { title, price, properties };
          });

          const listing = parseArabamDetailPage(pageData, link);
          if (listing.price > 0) {
            listings.push(listing);
            console.log(`[Arabam] Parsed: ${listing.brand} ${listing.model} - ${listing.price} TL`);
          }
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

export { saveListings } from "./sahibinden-scraper.js";
