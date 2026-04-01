import { supabase } from "../db/supabase.js";
import cron from "node-cron";

/**
 * Deactivates listings not seen in the last 30 days.
 * Runs daily at 03:00 TR (00:00 UTC).
 */
export function startCleanup() {
  cron.schedule("0 0 * * *", async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("listings")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("scraped_at", thirtyDaysAgo.toISOString())
      .select("id");

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`[Cleanup] Deactivated ${count} stale listings`);
    }
    if (error) {
      console.error("[Cleanup] Error:", error.message);
    }
  });

  console.log("[Cleanup] Stale listing cleanup scheduled: daily 03:00 TR");
}
