import { Router } from "express";
import { getModelPriceTrend, getListingPriceHistory } from "../analysis/trend-tracker.js";

const router = Router();

router.get("/model", async (req, res) => {
  const { brand, model, days } = req.query;
  if (!brand || !model) return res.status(400).json({ error: "brand and model required" });

  try {
    const data = await getModelPriceTrend(brand, model, parseInt(days, 10) || 90);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/listing/:id", async (req, res) => {
  try {
    const data = await getListingPriceHistory(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
