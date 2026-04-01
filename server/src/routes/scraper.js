import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { runScrapeJob } from "../scraper/scheduler.js";

const router = Router();

router.get("/status", async (req, res) => {
  const { data, error } = await supabase
    .from("scraper_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/trigger", async (req, res) => {
  res.json({ message: "Scrape job started" });
  runScrapeJob().catch((err) => console.error("Manual scrape failed:", err));
});

export default router;
