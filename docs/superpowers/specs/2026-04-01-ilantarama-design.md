# IlanTarama - Araç İlan Takip ve Analiz Platformu

## Tasarım Dokümanı
**Tarih:** 2026-04-01
**Durum:** Onaylandı

---

## 1. Proje Özeti

Sahibinden.com ve Arabam.com üzerindeki araç ilanlarını otomatik çeken, piyasa analizi yapan, kârlılık skoru hesaplayan ve Telegram üzerinden ekibe bildirim gönderen bir araç alım-satım asistan platformu.

**Hedef kullanıcılar:** Küçük galeri/ticaret ekibi (3-5 kişi). Sadece admin teknik, diğerleri kolay arayüz kullanacak.

---

## 2. Genel Mimari

Monolitik fullstack yaklaşım: React frontend + Express.js backend + Supabase (hosted PostgreSQL).

```
┌─────────────────────────────────────────────┐
│                 React Frontend               │
│  (Dashboard, İlan Listesi, Analiz, Ayarlar) │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│              Express.js Backend              │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ API      │ │ Scraper  │ │ Telegram    │ │
│  │ Routes   │ │ Service  │ │ Bot Service │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
│  ┌──────────┐ ┌──────────┐                  │
│  │ Analiz   │ │ Cron     │                  │
│  │ Engine   │ │ Scheduler│                  │
│  └──────────┘ └──────────┘                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Supabase (PostgreSQL)              │
│  (İlanlar, Fiyat Geçmişi, Kullanıcılar)    │
└─────────────────────────────────────────────┘
```

**Teknoloji stack:**
- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express.js
- **Veritabanı:** Supabase (hosted PostgreSQL)
- **Scraper:** Puppeteer (headless Chrome)
- **Bildirim:** Telegram Bot API (node-telegram-bot-api)
- **Cron:** node-cron

---

## 3. Scraper Servisi

### Yapı
```
scraper/
├── sahibinden-scraper.js   — Sahibinden.com scraper
├── arabam-scraper.js       — Arabam.com scraper
├── proxy-manager.js        — IP rotasyonu
└── scheduler.js            — Cron: 09:00 / 13:00 / 19:00
```

### Veri çekme stratejisi
- **Puppeteer (headless Chrome)** ile JavaScript-rendered sayfalardan veri çekme
- **Proxy rotasyonu** ile IP ban koruması
- **Rate limiting:** istekler arası rastgele 3-8 sn bekleme
- **Retry:** Captcha veya hata durumunda 3 deneme, sonra loglama
- **Captcha durumu:** Sayfayı atla, logla, Telegram'dan ekibe bildir, sonraki çekimde tekrar dene

### Toplanan veriler
| Alan | Örnek |
|------|-------|
| Başlık | "2020 Volkswagen Golf 1.5 TSI" |
| Fiyat | 1.250.000 TL |
| Km | 85.000 |
| Yıl | 2020 |
| Yakıt/Vites | Benzin / Otomatik |
| Renk | Beyaz |
| Hasar kaydı | Belirtilmemiş |
| Satıcı tipi | Galeriden |
| İlan tarihi | 2026-03-28 |
| Konum | İstanbul / Kadıköy |
| İlan URL | sahibinden.com/ilan/... |
| Kaynak | sahibinden / arabam |

### Çekim zamanlaması
Günde 3 kez: 09:00, 13:00, 19:00 (Türkiye saati)

---

## 4. Analiz Motoru

### Yapı
```
analysis/
├── price-analyzer.js       — Piyasa değeri hesaplama
├── profit-calculator.js    — Kârlılık analizi
├── risk-scorer.js          — Risk puanlama
└── trend-tracker.js        — Fiyat trend takibi
```

### Piyasa değeri hesaplama
- Aynı marka/model/yıl/yakıt/vites ilanlarının ortalaması ve medyanı
- Km düzeltme faktörü: ortalamadan %20 fazla km → değer %10 düşer
- Konum faktörü: İstanbul/Ankara ilanları genelde %5-10 daha pahalı

### Kârlılık skoru (0-100)
| Faktör | Ağırlık |
|--------|---------|
| Piyasa değerinin ne kadar altında | %40 |
| Model likidite skoru (satış hızı) | %25 |
| Km/yaş tutarlılığı | %15 |
| Hasar kaydı riski | %10 |
| Satıcı güvenilirliği | %10 |

### Karar çıktısı (her ilan için)
| Alan | Değer |
|------|-------|
| Karar | AL / DÜŞÜN / REDDET |
| Güven skoru | 0-100 |
| Tahmini piyasa değeri | 1.350.000 TL |
| Tahmini satış fiyatı | 1.300.000 TL |
| Tahmini kâr | 50.000 TL |
| Risk seviyesi | DÜŞÜK / ORTA / YÜKSEK |

### Fiyat trend takibi
- Her ilanın fiyat geçmişi kaydedilir (fiyat düşürme = motivasyonlu satıcı sinyali)
- Model bazında haftalık/aylık fiyat trendi grafiği

---

## 5. Telegram Bot

### Yapı
```
telegram/
├── bot.js                  — Bot ana modülü
├── commands.js             — Komut handler'ları
└── notification-service.js — Otomatik bildirim gönderici
```

### Otomatik bildirimler
- "AL" kararı verilen ilanlar anında Telegram'a düşer
- Takip edilen ilanın fiyatı düştüğünde bildirim
- Scraper hatası / captcha engeli uyarısı

### Bildirim formatı
```
🚗 YENİ FIRSAT — AL (Güven: 87/100)

2020 VW Golf 1.5 TSI Otomatik
📍 İstanbul / Kadıköy
💰 Fiyat: 1.250.000 TL
📊 Piyasa değeri: 1.380.000 TL
📈 Tahmini kâr: ~80.000 TL
🔢 85.000 km | Beyaz | Galeriden
⚠️ Risk: DÜŞÜK

🔗 sahibinden.com/ilan/...
```

### Bot komutları
| Komut | İşlev |
|-------|--------|
| `/firsatlar` | Son çekimdeki "AL" ilanlarını listele |
| `/takip golf 2020` | Belirli model için takip başlat |
| `/takipler` | Aktif takipleri göster |
| `/analiz [url]` | Tek bir ilanı analiz et |
| `/trend golf` | Model fiyat trendini göster |
| `/durum` | Scraper durumu ve son çekim zamanı |

### Erişim kontrolü
- Sadece tanımlı Telegram kullanıcı ID'leri botu kullanabilir
- Yeni üye ekleme sadece admin yapabilir

---

## 6. React Frontend (Dashboard)

### Sayfa yapısı
```
pages/
├── Dashboard.jsx        — Genel özet ve istatistikler
├── Listings.jsx         — İlan listesi (filtre + sıralama)
├── ListingDetail.jsx    — Tek ilan detay + analiz
├── Trends.jsx           — Fiyat trendleri grafikleri
├── Watchlist.jsx        — Takip listesi yönetimi
└── Settings.jsx         — Ayarlar (kullanıcılar, bildirim, scraper)

components/
├── ScoreCard.jsx        — AL/DÜŞÜN/REDDET kartı
├── PriceChart.jsx       — Fiyat geçmişi grafiği
├── FilterBar.jsx        — Marka/model/fiyat/km filtreleri
└── StatsWidget.jsx      — Özet istatistik kutuları
```

### Dashboard (ana sayfa)
- Son çekim zamanı ve durumu
- Bugünkü "AL" ilanı sayısı
- En kârlı 5 fırsat kartı
- Model bazında ortalama fiyat değişim özeti

### İlan listesi
- Tablo görünümü: fiyat, km, yıl, skor, karar
- Filtreler: marka, model, yıl aralığı, fiyat aralığı, km aralığı, karar, kaynak
- Sıralama: kâr potansiyeli, fiyat, tarih, skor
- Tek tıkla orijinal ilana git

### İlan detay
- Tüm ilan bilgileri
- Analiz sonucu (skor, kâr tahmini, risk)
- Aynı model diğer ilanlarla karşılaştırma
- Fiyat geçmişi grafiği (fiyat düşüşleri işaretli)

### Trend sayfası
- Model seçerek haftalık/aylık fiyat grafiği
- İlan sayısı trendi (arz artıyor mu azalıyor mu)

### UI kütüphanesi
Tailwind CSS + shadcn/ui

---

## 7. Veritabanı Şeması (Supabase)

### Tablolar

**listings** — Ana ilan tablosu
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID (PK) | |
| external_id | TEXT | Sahibinden/arabam ilan no |
| source | TEXT | sahibinden / arabam |
| url | TEXT | İlan linki |
| title | TEXT | İlan başlığı |
| brand | TEXT | Marka |
| model | TEXT | Model |
| year | INT | Model yılı |
| fuel_type | TEXT | Yakıt tipi |
| transmission | TEXT | Vites tipi |
| mileage | INT | Kilometre |
| color | TEXT | Renk |
| price | INT | Fiyat (TL) |
| location_city | TEXT | İl |
| location_district | TEXT | İlçe |
| seller_type | TEXT | sahibinden / galeri |
| damage_record | TEXT | Hasar kaydı |
| description | TEXT | İlan açıklaması |
| listing_date | TIMESTAMP | İlan tarihi |
| scraped_at | TIMESTAMP | Çekim zamanı |
| is_active | BOOLEAN | Aktif mi |
| created_at | TIMESTAMP | Kayıt zamanı |

**price_history** — Fiyat geçmişi
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID (PK) | |
| listing_id | UUID (FK) | listings.id |
| price | INT | Fiyat |
| recorded_at | TIMESTAMP | Kayıt zamanı |

**analysis_results** — Analiz sonuçları
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID (PK) | |
| listing_id | UUID (FK) | listings.id |
| decision | TEXT | AL / DÜŞÜN / REDDET |
| confidence_score | INT | 0-100 |
| market_value | INT | Piyasa değeri |
| estimated_profit | INT | Tahmini kâr |
| risk_level | TEXT | DÜŞÜK / ORTA / YÜKSEK |
| factors | JSONB | Detaylı skor kırılımı |
| analyzed_at | TIMESTAMP | Analiz zamanı |

**watchlist** — Takip listesi
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID (PK) | |
| user_id | UUID (FK) | users.id |
| brand | TEXT | Marka |
| model | TEXT | Model |
| year_min | INT | Min yıl |
| year_max | INT | Max yıl |
| price_max | INT | Max fiyat |
| mileage_max | INT | Max km |
| created_at | TIMESTAMP | Oluşturma zamanı |

**users** — Kullanıcılar
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID (PK) | |
| name | TEXT | İsim |
| telegram_id | TEXT | Telegram ID |
| role | TEXT | admin / member |
| created_at | TIMESTAMP | Kayıt zamanı |

**scraper_logs** — Scraper logları
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID (PK) | |
| source | TEXT | Kaynak site |
| status | TEXT | success / partial / failed |
| listings_found | INT | Bulunan ilan sayısı |
| errors | JSONB | Hata detayları |
| started_at | TIMESTAMP | Başlangıç |
| finished_at | TIMESTAMP | Bitiş |

### İndeksler
- `listings(brand, model, year)` — Hızlı filtreleme
- `listings(source, external_id)` UNIQUE — Tekrar eklemeyi önle
- `price_history(listing_id, recorded_at)` — Trend sorguları
- `listings(is_active, price)` — Aktif ilan fiyat sorguları

### Supabase RLS
- Her kullanıcı sadece kendi takip listesini görebilir
- Analiz ve ilan verileri tüm ekibe açık
- Admin kullanıcı her şeyi yönetebilir

---

## 8. Proje Klasör Yapısı

```
ilantarama/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
├── server/                     # Express.js Backend
│   ├── src/
│   │   ├── routes/             # API endpoint'leri
│   │   ├── scraper/            # Scraper modülleri
│   │   ├── analysis/           # Analiz motoru
│   │   ├── telegram/           # Telegram bot
│   │   ├── db/                 # Supabase client + queries
│   │   └── index.js            # Express app entry
│   └── package.json
├── docs/
│   └── superpowers/specs/
└── README.md
```

---

## 9. Kısıtlamalar ve Riskler

| Risk | Etki | Azaltma |
|------|------|---------|
| Sahibinden IP ban | Veri çekilemez | Proxy rotasyonu + rate limiting |
| Captcha engeli | Bazı ilanlar kaçırılır | Log + sonraki çekimde retry |
| Site HTML değişikliği | Scraper bozulur | Modüler scraper, kolay güncelleme |
| Supabase ücretsiz limit | DB yavaşlar | İlk aşamada yeterli, büyürse Pro plan |
| Fiyat tahmini yanılması | Yanlış "AL" kararı | Güven skoru + risk seviyesi ile uyarı |
