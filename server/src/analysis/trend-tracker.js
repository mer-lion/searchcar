import { supabase } from "../db/supabase.js";

export async function getListingPriceHistory(listingId) {
  const { data, error } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("listing_id", listingId)
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getModelPriceTrend(brand, model, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("listings")
    .select("price, scraped_at")
    .eq("brand", brand)
    .eq("model", model)
    .gte("scraped_at", since.toISOString())
    .order("scraped_at", { ascending: true });

  if (error) throw error;

  const weeks = {};
  for (const row of data) {
    const weekStart = getWeekStart(new Date(row.scraped_at));
    const key = weekStart.toISOString().split("T")[0];
    if (!weeks[key]) weeks[key] = { prices: [], date: key };
    weeks[key].prices.push(row.price);
  }

  return Object.values(weeks).map((w) => ({
    date: w.date,
    avgPrice: Math.round(w.prices.reduce((a, b) => a + b, 0) / w.prices.length),
    count: w.prices.length,
  }));
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
