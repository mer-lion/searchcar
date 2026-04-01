import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { generateListingReport, detectSuspicious, parseNaturalQuery } from "../ai/listing-analyzer.js";

const router = Router();

// POST /api/ai/analyze/:id — AI detaylı analiz raporu
router.post("/analyze/:id", async (req, res) => {
  try {
    const { data: listing } = await supabase
      .from("listings")
      .select("*, analysis_results(*)")
      .eq("id", req.params.id)
      .single();

    if (!listing) return res.status(404).json({ error: "İlan bulunamadı" });

    const analysis = Array.isArray(listing.analysis_results)
      ? listing.analysis_results[0]
      : listing.analysis_results;

    if (!analysis) return res.status(400).json({ error: "Önce analiz çalıştırılmalı" });

    const report = await generateListingReport(listing, analysis);
    res.json({ report, listing_id: req.params.id });
  } catch (err) {
    console.error("[AI Analyze Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/suspicious/:id — Şüpheli ilan tespiti
router.post("/suspicious/:id", async (req, res) => {
  try {
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (!listing) return res.status(404).json({ error: "İlan bulunamadı" });

    const result = await detectSuspicious(listing);
    res.json(result);
  } catch (err) {
    console.error("[AI Suspicious Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/search — Doğal dil ile arama
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query gerekli" });

    const filters = await parseNaturalQuery(query);

    // Apply filters to listings
    let dbQuery = supabase
      .from("listings")
      .select("*, analysis_results(*)")
      .eq("is_active", true);

    if (filters.brand) dbQuery = dbQuery.eq("brand", filters.brand);
    if (filters.model) dbQuery = dbQuery.eq("model", filters.model);
    if (filters.yearMin) dbQuery = dbQuery.gte("year", filters.yearMin);
    if (filters.yearMax) dbQuery = dbQuery.lte("year", filters.yearMax);
    if (filters.priceMin) dbQuery = dbQuery.gte("price", filters.priceMin);
    if (filters.priceMax) dbQuery = dbQuery.lte("price", filters.priceMax);
    if (filters.mileageMax) dbQuery = dbQuery.lte("mileage", filters.mileageMax);
    if (filters.fuel_type) dbQuery = dbQuery.eq("fuel_type", filters.fuel_type);
    if (filters.transmission) dbQuery = dbQuery.eq("transmission", filters.transmission);

    const { data } = await dbQuery.order("price", { ascending: true }).limit(20);

    // Normalize analysis_results
    const normalized = (data || []).map((row) => {
      const ar = row.analysis_results;
      row.analysis_results = Array.isArray(ar) ? ar : ar ? [ar] : [];
      return row;
    });

    res.json({ filters, results: normalized, count: normalized.length });
  } catch (err) {
    console.error("[AI Search Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
