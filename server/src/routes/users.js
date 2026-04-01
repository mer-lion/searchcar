import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { name, telegram_id, role } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });

  const { data, error } = await supabase
    .from("users")
    .insert({ name, telegram_id, role: role || "member" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("users").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

export default router;
