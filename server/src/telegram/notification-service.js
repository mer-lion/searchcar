import { supabase } from "../db/supabase.js";
import { formatListingMessage, formatStatusMessage } from "./commands.js";

export async function notifyBuyOpportunities(bot, buyOpportunities) {
  if (buyOpportunities.length === 0) return;

  const { data: users } = await supabase
    .from("users")
    .select("telegram_id")
    .not("telegram_id", "is", null);

  if (!users || users.length === 0) return;

  for (const { listing, analysis } of buyOpportunities) {
    const msg = formatListingMessage(listing, analysis);
    for (const user of users) {
      try {
        await bot.sendMessage(user.telegram_id, msg);
      } catch (err) {
        console.error(`Failed to notify ${user.telegram_id}:`, err.message);
      }
    }
  }
}

export async function notifyScrapeStatus(bot, results) {
  const { data: admins } = await supabase
    .from("users")
    .select("telegram_id")
    .eq("role", "admin")
    .not("telegram_id", "is", null);

  if (!admins || admins.length === 0) return;

  const msg = formatStatusMessage(results);
  for (const admin of admins) {
    try {
      await bot.sendMessage(admin.telegram_id, msg);
    } catch (err) {
      console.error(`Failed to notify admin ${admin.telegram_id}:`, err.message);
    }
  }
}
