import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { analyzeListing } from "../analysis/analyze-listings.js";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const r1 = await supabase.from("analysis_results").select("id").eq("decision", "AL");
    const r2 = await supabase.from("listings").select("id").eq("is_active", true);
    const r3 = await supabase.from("analysis_results").select("*, listings(*)").in("decision", ["AL", "DÜŞÜN"]).order("confidence_score", { ascending: false }).limit(5);

    const result = {
      buyCount: r1.data ? r1.data.length : 0,
      totalActive: r2.data ? r2.data.length : 0,
      topOpportunities: r3.data || [],
    };
    console.log("[Stats]", result.buyCount, "AL,", result.totalActive, "active,", result.topOpportunities.length, "top");
    res.json(result);
  } catch (err) {
    console.error("[Stats Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/run/:id", async (req, res) => {
  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Listing not found" });

  const result = await analyzeListing(listing);

  await supabase.from("analysis_results").upsert(
    { ...result, analyzed_at: new Date().toISOString() },
    { onConflict: "listing_id" }
  );

  res.json(result);
});

export default router;
