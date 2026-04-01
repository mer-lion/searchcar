import { supabase } from "../db/supabase.js";

function formatNumber(n) {
  return n.toLocaleString("tr-TR");
}

export function formatListingMessage(listing, analysis) {
  return `🚗 YENİ FIRSAT — ${analysis.decision} (Güven: ${analysis.confidence_score}/100)

${listing.title}
📍 ${listing.location_city}${listing.location_district ? ` / ${listing.location_district}` : ""}
💰 Fiyat: ${formatNumber(listing.price)} TL
📊 Piyasa değeri: ${formatNumber(analysis.market_value)} TL
📈 Tahmini kâr: ~${formatNumber(analysis.estimated_profit)} TL
🔢 ${formatNumber(listing.mileage)} km | ${listing.color || "-"} | ${listing.seller_type === "galeri" ? "Galeriden" : "Sahibinden"}
⚠️ Risk: ${analysis.risk_level}

🔗 ${listing.url}`;
}

export function formatStatusMessage(results) {
  const total = results.sahibinden + results.arabam;
  const errText =
    results.errors.length > 0
      ? `\n❌ Hatalar: ${results.errors.map((e) => e.message).join(", ")}`
      : "";

  return `📊 Scraper Durumu

✅ Sahibinden: ${results.sahibinden} yeni ilan
✅ Arabam: ${results.arabam} yeni ilan
📦 Toplam: ${total} yeni ilan${errText}
⏰ ${new Date().toLocaleString("tr-TR")}`;
}

export async function handleFiresatlar(chatId, bot) {
  const { data } = await supabase
    .from("analysis_results")
    .select("*, listings(*)")
    .eq("decision", "AL")
    .order("confidence_score", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) {
    return bot.sendMessage(chatId, "Şu an AL kararı verilen ilan yok.");
  }

  for (const row of data) {
    const msg = formatListingMessage(row.listings, row);
    await bot.sendMessage(chatId, msg);
  }
}

export async function handleTakipEkle(chatId, bot, args, userId) {
  const parts = args.split(" ");
  if (parts.length < 2) {
    return bot.sendMessage(chatId, "Kullanım: /takip <marka> <model> [yıl]");
  }

  const [brand, model, year] = parts;
  const { error } = await supabase.from("watchlist").insert({
    user_id: userId,
    brand,
    model,
    year_min: year ? parseInt(year, 10) : null,
  });

  if (error) return bot.sendMessage(chatId, `Hata: ${error.message}`);
  return bot.sendMessage(chatId, `✅ Takip eklendi: ${brand} ${model}${year ? ` ${year}` : ""}`);
}

export async function handleTakipler(chatId, bot, userId) {
  const { data } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId);

  if (!data || data.length === 0) {
    return bot.sendMessage(chatId, "Aktif takibiniz yok.");
  }

  const list = data
    .map((w, i) => `${i + 1}. ${w.brand} ${w.model}${w.year_min ? ` (${w.year_min}+)` : ""}`)
    .join("\n");

  return bot.sendMessage(chatId, `📋 Takip Listeniz:\n\n${list}`);
}

export async function handleDurum(chatId, bot) {
  const { data } = await supabase
    .from("scraper_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(2);

  if (!data || data.length === 0) {
    return bot.sendMessage(chatId, "Henüz scraper çalışmadı.");
  }

  const lines = data.map(
    (log) =>
      `${log.source}: ${log.status} — ${log.listings_found} ilan (${new Date(log.started_at).toLocaleString("tr-TR")})`
  );

  return bot.sendMessage(chatId, `🔧 Son Scraper Durumu:\n\n${lines.join("\n")}`);
}
