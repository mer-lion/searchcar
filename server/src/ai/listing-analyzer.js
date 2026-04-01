import openai from "./openai-client.js";

const SYSTEM_PROMPT = `Sen Türkiye'deki ikinci el araç piyasasında uzman bir araç değerleme analistisin.
Görevin: Verilen ilan bilgilerini ve analiz verilerini değerlendirip, alım-satım yapan bir ekibe Türkçe detaylı rapor sunmak.

Raporunda şunları içer:
1. İlanın genel değerlendirmesi (2-3 cümle)
2. Fiyat analizi — piyasa değerine göre ucuz mu, pahalı mı?
3. Risk faktörleri — hasar, km/yaş uyumu, satıcı güvenilirliği
4. Şüpheli durumlar — fiyat çok düşükse neden, açıklamada dikkat çekici ifadeler
5. Alım tavsiyesi — AL / DÜŞÜN / REDDET ve kısa gerekçe
6. Tahmini kâr potansiyeli

Kısa, öz ve aksiyon odaklı yaz. Gereksiz uzatma yapma.`;

/**
 * Generates AI analysis report for a single listing.
 */
export async function generateListingReport(listing, analysisResult) {
  const prompt = `İlan bilgileri:
- Başlık: ${listing.title}
- Marka/Model: ${listing.brand} ${listing.model}
- Yıl: ${listing.year}
- KM: ${listing.mileage?.toLocaleString("tr-TR")} km
- Yakıt: ${listing.fuel_type}
- Vites: ${listing.transmission}
- Renk: ${listing.color}
- Fiyat: ${listing.price?.toLocaleString("tr-TR")} TL
- Konum: ${listing.location_city}
- Satıcı: ${listing.seller_type === "galeri" ? "Galeriden" : "Sahibinden"}
- Hasar: ${listing.damage_record || "Belirtilmemiş"}
- Kaynak: ${listing.source}

Analiz verileri:
- Tahmini piyasa değeri: ${analysisResult.market_value?.toLocaleString("tr-TR")} TL
- Fiyat farkı: %${analysisResult.factors?.priceDiffPercent}
- Güven skoru: ${analysisResult.confidence_score}/100
- Mevcut karar: ${analysisResult.decision}
- Risk seviyesi: ${analysisResult.risk_level}
- Likidite skoru: ${analysisResult.factors?.liquidityScore}/100
- KM/Yaş uyumu: ${analysisResult.factors?.mileageAgeConsistency}/100
- Hasar riski: ${analysisResult.factors?.damageRisk}/100
- Karşılaştırılan ilan sayısı: ${analysisResult.factors?.comparableCount}

Bu ilanı analiz et ve detaylı rapor ver.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 800,
  });

  return response.choices[0].message.content;
}

/**
 * Detects suspicious listings using AI.
 */
export async function detectSuspicious(listing) {
  const prompt = `Bu araç ilanını dolandırıcılık/şüpheli durum açısından değerlendir:

- ${listing.brand} ${listing.model} ${listing.year}
- Fiyat: ${listing.price?.toLocaleString("tr-TR")} TL
- KM: ${listing.mileage?.toLocaleString("tr-TR")}
- Hasar: ${listing.damage_record || "Belirtilmemiş"}
- Satıcı: ${listing.seller_type}

Sadece JSON formatında cevap ver:
{"suspicious": true/false, "reason": "kısa açıklama", "risk_score": 0-100}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 200,
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return { suspicious: false, reason: "Analiz yapılamadı", risk_score: 0 };
  }
}

/**
 * Natural language query to filter listings.
 */
export async function parseNaturalQuery(query) {
  const prompt = `Kullanıcı araç aramak istiyor. Sorgusunu JSON filtreye çevir.

Sorgu: "${query}"

Sadece JSON formatında cevap ver (boş olanları dahil etme):
{"brand": "", "model": "", "yearMin": 0, "yearMax": 0, "priceMin": 0, "priceMax": 0, "mileageMax": 0, "fuel_type": "", "transmission": ""}

Örnekler:
- "500bin altı otomatik Golf" → {"brand":"Volkswagen","model":"Golf","priceMax":500000,"transmission":"Otomatik"}
- "2020 üstü dizel SUV 1 milyon altı" → {"yearMin":2020,"fuel_type":"Dizel","priceMax":1000000}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 200,
  });

  try {
    const filters = JSON.parse(response.choices[0].message.content);
    // Remove empty/zero values
    return Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v !== 0)
    );
  } catch {
    return {};
  }
}
