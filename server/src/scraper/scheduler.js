import cron from "node-cron";
import { scrapeSahibinden, saveListings } from "./sahibinden-scraper.js";
import { scrapeArabam } from "./arabam-scraper.js";
import { supabase } from "../db/supabase.js";

const SEARCH_URLS = {
  sahibinden: "https://www.sahibinden.com/otomobil",
  arabam: "https://www.arabam.com/ikinci-el/otomobil",
};

async function logScrapeRun(source, status, listingsFound, errors, startedAt) {
  await supabase.from("scraper_logs").insert({
    source,
    status,
    listings_found: listingsFound,
    errors: errors.length > 0 ? errors : null,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
  });
}

export async function runScrapeJob() {
  console.log(`[Scraper] Starting scrape job at ${new Date().toISOString()}`);
  const results = { sahibinden: 0, arabam: 0, errors: [] };

  const sahibindenStart = new Date().toISOString();
  try {
    const listings = await scrapeSahibinden(SEARCH_URLS.sahibinden);
    results.sahibinden = await saveListings(listings);
    await logScrapeRun("sahibinden", "success", results.sahibinden, [], sahibindenStart);
    console.log(`[Scraper] Sahibinden: ${results.sahibinden} new listings`);
  } catch (err) {
    results.errors.push({ source: "sahibinden", message: err.message });
    await logScrapeRun("sahibinden", "failed", 0, [err.message], sahibindenStart);
    console.error(`[Scraper] Sahibinden error:`, err.message);
  }

  const arabamStart = new Date().toISOString();
  try {
    const listings = await scrapeArabam(SEARCH_URLS.arabam);
    results.arabam = await saveListings(listings);
    await logScrapeRun("arabam", "success", results.arabam, [], arabamStart);
    console.log(`[Scraper] Arabam: ${results.arabam} new listings`);
  } catch (err) {
    results.errors.push({ source: "arabam", message: err.message });
    await logScrapeRun("arabam", "failed", 0, [err.message], arabamStart);
    console.error(`[Scraper] Arabam error:`, err.message);
  }

  console.log(`[Scraper] Job completed. Total new: ${results.sahibinden + results.arabam}`);
  return results;
}

export function startScheduler() {
  // 09:00, 13:00, 19:00 Turkey time (UTC+3)
  cron.schedule("0 6 * * *", () => runWithRetry());
  cron.schedule("0 10 * * *", () => runWithRetry());
  cron.schedule("0 16 * * *", () => runWithRetry());
  console.log("[Scheduler] Cron jobs scheduled: 09:00, 13:00, 19:00 (TR)");
}

async function runWithRetry(maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const results = await runScrapeJob();
      if (results.sahibinden + results.arabam > 0 || results.errors.length === 0) return;
      console.log(`[Scheduler] Attempt ${attempt} got 0 results, retrying in 5 min...`);
      await new Promise((r) => setTimeout(r, 5 * 60 * 1000));
    } catch (err) {
      console.error(`[Scheduler] Attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 5 * 60 * 1000));
      }
    }
  }
}
