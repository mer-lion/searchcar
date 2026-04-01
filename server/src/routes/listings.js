import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

export function buildListingsQuery(filters) {
  const result = { filters: [], joinAnalysis: false, analysisFilter: null };

  if (filters.brand) result.filters.push({ field: "brand", value: filters.brand });
  if (filters.model) result.filters.push({ field: "model", value: filters.model });
  if (filters.yearMin) result.filters.push({ field: "year", op: "gte", value: parseInt(filters.yearMin, 10) });
  if (filters.yearMax) result.filters.push({ field: "year", op: "lte", value: parseInt(filters.yearMax, 10) });
  if (filters.priceMin) result.filters.push({ field: "price", op: "gte", value: parseInt(filters.priceMin, 10) });
  if (filters.priceMax) result.filters.push({ field: "price", op: "lte", value: parseInt(filters.priceMax, 10) });
  if (filters.mileageMax) result.filters.push({ field: "mileage", op: "lte", value: parseInt(filters.mileageMax, 10) });
  if (filters.source) result.filters.push({ field: "source", value: filters.source });
  if (filters.decision) {
    result.joinAnalysis = true;
    result.analysisFilter = { decision: filters.decision };
  }

  return result;
}

router.get("/", async (req, res) => {
  const queryPlan = buildListingsQuery(req.query);
  const sortBy = req.query.sortBy || "scraped_at";
  const sortOrder = req.query.sortOrder === "asc" ? true : false;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select("*, analysis_results(*)", { count: "exact" })
    .eq("is_active", true);

  for (const f of queryPlan.filters) {
    if (f.op === "gte") query = query.gte(f.field, f.value);
    else if (f.op === "lte") query = query.lte(f.field, f.value);
    else query = query.eq(f.field, f.value);
  }

  query = query.order(sortBy, { ascending: sortOrder }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  // Normalize analysis_results: Supabase may return object or array depending on constraint
  const normalized = (data || []).map((row) => {
    const ar = row.analysis_results;
    row.analysis_results = Array.isArray(ar) ? ar : ar ? [ar] : [];
    return row;
  });

  let filtered = normalized;
  if (queryPlan.joinAnalysis && queryPlan.analysisFilter) {
    filtered = normalized.filter((row) =>
      row.analysis_results.some((a) => a.decision === queryPlan.analysisFilter.decision)
    );
  }

  res.json({ data: filtered, total: count, page, limit });
});

router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("listings")
    .select("*, analysis_results(*), price_history(*)")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Listing not found" });
  res.json(data);
});

export default router;
