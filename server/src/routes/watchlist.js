import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { user_id, brand, model, year_min, year_max, price_max, mileage_max } = req.body;
  if (!user_id || !brand || !model) {
    return res.status(400).json({ error: "user_id, brand, and model required" });
  }

  const { data, error } = await supabase
    .from("watchlist")
    .insert({ user_id, brand, model, year_min, year_max, price_max, mileage_max })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("watchlist").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

export default router;
