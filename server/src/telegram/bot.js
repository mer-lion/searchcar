import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";
import { supabase } from "../db/supabase.js";
import {
  handleFiresatlar,
  handleTakipEkle,
  handleTakipler,
  handleDurum,
} from "./commands.js";

let bot = null;

export function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[Telegram] No bot token configured, skipping bot init");
    return null;
  }

  bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/firsatlar/, async (msg) => {
    if (!(await isAuthorized(msg.from.id))) return;
    await handleFiresatlar(msg.chat.id, bot);
  });

  bot.onText(/\/takip (.+)/, async (msg, match) => {
    const userId = await getAuthorizedUserId(msg.from.id);
    if (!userId) return;
    await handleTakipEkle(msg.chat.id, bot, match[1], userId);
  });

  bot.onText(/\/takipler/, async (msg) => {
    const userId = await getAuthorizedUserId(msg.from.id);
    if (!userId) return;
    await handleTakipler(msg.chat.id, bot, userId);
  });

  bot.onText(/\/durum/, async (msg) => {
    if (!(await isAuthorized(msg.from.id))) return;
    await handleDurum(msg.chat.id, bot);
  });

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      "🚗 IlanTarama Bot\n\nKomutlar:\n/firsatlar - AL ilanlarını listele\n/takip <marka> <model> - Takip başlat\n/takipler - Takip listesi\n/durum - Scraper durumu"
    );
  });

  console.log("[Telegram] Bot started");
  return bot;
}

async function isAuthorized(telegramId) {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", String(telegramId))
    .single();
  return !!data;
}

async function getAuthorizedUserId(telegramId) {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", String(telegramId))
    .single();
  return data?.id || null;
}

export function getBot() {
  return bot;
}
