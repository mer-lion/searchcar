import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { analyzeListing } from "../analysis/analyze-listings.js";

const router = Router();

router.get("/stats", async (req, res) => {
  const { data: buyCount } = await supabase
    .from("analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("decision", "AL");

  const { data: totalActive } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: topOpportunities } = await supabase
    .from("analysis_results")
    .select("*, listings(*)")
    .eq("decision", "AL")
    .order("confidence_score", { ascending: false })
    .limit(5);

  res.json({
    buyCount: buyCount?.length || 0,
    totalActive: totalActive?.length || 0,
    topOpportunities: topOpportunities || [],
  });
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
