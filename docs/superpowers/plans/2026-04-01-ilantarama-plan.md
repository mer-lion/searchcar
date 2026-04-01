# IlanTarama Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullstack car listing tracker that scrapes sahibinden.com and arabam.com, analyzes profitability, and notifies a small trade team via Telegram.

**Architecture:** Monolithic React + Express.js app backed by Supabase (hosted PostgreSQL). Puppeteer-based scrapers run on cron (3x/day), feed an analysis engine that scores each listing, and push alerts through a Telegram bot. The React dashboard gives the non-technical team filtering, trend charts, and watchlist management.

**Tech Stack:** React 18, Vite, Tailwind CSS, shadcn/ui, Express.js, Puppeteer, node-cron, node-telegram-bot-api, @supabase/supabase-js, Recharts, Vitest, Supertest

---

## File Structure

```
ilantarama/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.jsx                  # Router setup
│   │   ├── lib/
│   │   │   └── api.js               # Axios API client
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Overview + stats
│   │   │   ├── Listings.jsx         # Listing table with filters
│   │   │   ├── ListingDetail.jsx    # Single listing + analysis
│   │   │   ├── Trends.jsx           # Price trend charts
│   │   │   ├── Watchlist.jsx        # Watchlist management
│   │   │   └── Settings.jsx         # User & scraper settings
│   │   └── components/
│   │       ├── Layout.jsx           # Sidebar + header shell
│   │       ├── ScoreCard.jsx        # AL/DÜŞÜN/REDDET badge
│   │       ├── PriceChart.jsx       # Recharts price history
│   │       ├── FilterBar.jsx        # Filter controls
│   │       └── StatsWidget.jsx      # Stat number card
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/
│   ├── src/
│   │   ├── index.js                 # Express app entry
│   │   ├── db/
│   │   │   └── supabase.js          # Supabase client singleton
│   │   ├── routes/
│   │   │   ├── listings.js          # /api/listings CRUD + filters
│   │   │   ├── analysis.js          # /api/analysis endpoints
│   │   │   ├── watchlist.js         # /api/watchlist CRUD
│   │   │   ├── trends.js            # /api/trends data
│   │   │   ├── scraper.js           # /api/scraper status + trigger
│   │   │   └── users.js             # /api/users management
│   │   ├── scraper/
│   │   │   ├── sahibinden-scraper.js
│   │   │   ├── arabam-scraper.js
│   │   │   ├── proxy-manager.js
│   │   │   └── scheduler.js         # Cron setup
│   │   ├── analysis/
│   │   │   ├── price-analyzer.js
│   │   │   ├── profit-calculator.js
│   │   │   ├── risk-scorer.js
│   │   │   └── trend-tracker.js
│   │   └── telegram/
│   │       ├── bot.js               # Bot init + command router
│   │       ├── commands.js          # Command handlers
│   │       └── notification-service.js
│   ├── tests/
│   │   ├── analysis/
│   │   │   ├── price-analyzer.test.js
│   │   │   ├── profit-calculator.test.js
│   │   │   └── risk-scorer.test.js
│   │   ├── scraper/
│   │   │   ├── sahibinden-scraper.test.js
│   │   │   └── arabam-scraper.test.js
│   │   ├── routes/
│   │   │   ├── listings.test.js
│   │   │   └── watchlist.test.js
│   │   └── telegram/
│   │       └── commands.test.js
│   └── package.json
└── .env.example
```

---

## Task 1: Project Scaffolding & Supabase Setup

**Files:**
- Create: `server/package.json`
- Create: `server/src/index.js`
- Create: `server/src/db/supabase.js`
- Create: `client/package.json`
- Create: `client/index.html`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/vite.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize server project**

```bash
cd server
npm init -y
npm install express cors dotenv @supabase/supabase-js node-cron puppeteer node-telegram-bot-api
npm install -D vitest supertest
```

- [ ] **Step 2: Create server/package.json scripts**

Add to `server/package.json`:
```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Create .env.example**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
TELEGRAM_BOT_TOKEN=your-bot-token
PROXY_LIST=http://proxy1:port,http://proxy2:port
PORT=3001
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.env
dist/
```

- [ ] **Step 5: Create Supabase client**

`server/src/db/supabase.js`:
```javascript
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] **Step 6: Create Express entry point**

`server/src/index.js`:
```javascript
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 7: Initialize client project**

```bash
cd client
npm create vite@latest . -- --template react
npm install axios react-router-dom recharts
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 8: Configure Vite with Tailwind and API proxy**

`client/vite.config.js`:
```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
```

- [ ] **Step 9: Setup Tailwind CSS**

Replace `client/src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 10: Create minimal App.jsx with router**

`client/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function Placeholder({ title }) {
  return <div className="p-8 text-2xl font-bold">{title}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder title="Dashboard" />} />
        <Route path="/listings" element={<Placeholder title="İlanlar" />} />
        <Route path="/trends" element={<Placeholder title="Trendler" />} />
        <Route path="/watchlist" element={<Placeholder title="Takip Listesi" />} />
        <Route path="/settings" element={<Placeholder title="Ayarlar" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 11: Verify both servers start**

Terminal 1:
```bash
cd server && npm run dev
```
Expected: `Server running on port 3001`

Terminal 2:
```bash
cd client && npm run dev
```
Expected: Vite dev server at `http://localhost:5173`

Visit `http://localhost:5173` — should show "Dashboard".
Visit `http://localhost:3001/api/health` — should return JSON.

- [ ] **Step 12: Create Supabase tables**

Go to Supabase dashboard → SQL Editor → run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  telegram_id TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sahibinden', 'arabam')),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  fuel_type TEXT,
  transmission TEXT,
  mileage INT,
  color TEXT,
  price INT NOT NULL,
  location_city TEXT,
  location_district TEXT,
  seller_type TEXT,
  damage_record TEXT,
  description TEXT,
  listing_date TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, external_id)
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  price INT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('AL', 'DÜŞÜN', 'REDDET')),
  confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  market_value INT,
  estimated_profit INT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('DÜŞÜK', 'ORTA', 'YÜKSEK')),
  factors JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year_min INT,
  year_max INT,
  price_max INT,
  mileage_max INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scraper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  listings_found INT DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_listings_brand_model_year ON listings(brand, model, year);
CREATE INDEX idx_listings_active_price ON listings(is_active, price);
CREATE INDEX idx_price_history_listing ON price_history(listing_id, recorded_at);
CREATE INDEX idx_analysis_listing ON analysis_results(listing_id);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
```

- [ ] **Step 13: Verify Supabase connection**

Add temporary test to `server/src/index.js` after health route:
```javascript
import { supabase } from "./db/supabase.js";

app.get("/api/db-test", async (req, res) => {
  const { data, error } = await supabase.from("users").select("count");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ connected: true, data });
});
```

Visit `http://localhost:3001/api/db-test` — should return `{ "connected": true, ... }`.
Remove the `/api/db-test` route after verifying.

- [ ] **Step 14: Commit**

```bash
git init
git add .gitignore .env.example server/package.json server/src/ client/package.json client/index.html client/src/ client/vite.config.js client/postcss.config.js client/tailwind.config.js
git commit -m "chore: scaffold project with Express, React, Supabase, and Tailwind"
```

---

## Task 2: Analysis Engine — Price Analyzer

**Files:**
- Create: `server/src/analysis/price-analyzer.js`
- Create: `server/tests/analysis/price-analyzer.test.js`

- [ ] **Step 1: Write failing tests for price analyzer**

`server/tests/analysis/price-analyzer.test.js`:
```javascript
import { describe, it, expect } from "vitest";
import { calculateMarketValue, adjustForMileage, adjustForLocation } from "../src/analysis/price-analyzer.js";

describe("calculateMarketValue", () => {
  it("returns median price for matching listings", () => {
    const listings = [
      { price: 1_000_000, mileage: 80000, location_city: "Ankara" },
      { price: 1_200_000, mileage: 90000, location_city: "İstanbul" },
      { price: 1_100_000, mileage: 85000, location_city: "İzmir" },
      { price: 1_400_000, mileage: 70000, location_city: "İstanbul" },
      { price: 1_050_000, mileage: 95000, location_city: "Bursa" },
    ];
    const result = calculateMarketValue(listings);
    expect(result).toBe(1_100_000); // median of sorted prices
  });

  it("returns 0 when no listings provided", () => {
    expect(calculateMarketValue([])).toBe(0);
  });

  it("returns single price when one listing", () => {
    expect(calculateMarketValue([{ price: 500_000 }])).toBe(500_000);
  });
});

describe("adjustForMileage", () => {
  it("reduces value when mileage is above average", () => {
    // Average mileage 85000, listing has 102000 (20% above) → 10% reduction
    const adjusted = adjustForMileage(1_000_000, 102_000, 85_000);
    expect(adjusted).toBe(900_000);
  });

  it("increases value when mileage is below average", () => {
    // Average mileage 85000, listing has 68000 (20% below) → 10% increase
    const adjusted = adjustForMileage(1_000_000, 68_000, 85_000);
    expect(adjusted).toBe(1_100_000);
  });

  it("no change when mileage matches average", () => {
    const adjusted = adjustForMileage(1_000_000, 85_000, 85_000);
    expect(adjusted).toBe(1_000_000);
  });
});

describe("adjustForLocation", () => {
  it("adds premium for Istanbul", () => {
    const adjusted = adjustForLocation(1_000_000, "İstanbul");
    expect(adjusted).toBe(1_070_000); // +7%
  });

  it("adds premium for Ankara", () => {
    const adjusted = adjustForLocation(1_000_000, "Ankara");
    expect(adjusted).toBe(1_050_000); // +5%
  });

  it("no change for other cities", () => {
    const adjusted = adjustForLocation(1_000_000, "Bursa");
    expect(adjusted).toBe(1_000_000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npx vitest run tests/analysis/price-analyzer.test.js
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement price analyzer**

`server/src/analysis/price-analyzer.js`:
```javascript
/**
 * Calculates median price from a list of comparable listings.
 */
export function calculateMarketValue(listings) {
  if (listings.length === 0) return 0;
  const sorted = listings.map((l) => l.price).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Adjusts value based on mileage difference from average.
 * Every 20% deviation in mileage → 10% price adjustment (linear).
 */
export function adjustForMileage(baseValue, listingMileage, averageMileage) {
  if (averageMileage === 0) return baseValue;
  const mileageDiffPercent = (listingMileage - averageMileage) / averageMileage;
  const priceAdjustPercent = mileageDiffPercent * -0.5; // 20% more km → -10%
  return Math.round(baseValue * (1 + priceAdjustPercent));
}

const LOCATION_PREMIUMS = {
  İstanbul: 0.07,
  Ankara: 0.05,
  İzmir: 0.03,
};

/**
 * Adjusts value based on city-level location premium.
 */
export function adjustForLocation(baseValue, city) {
  const premium = LOCATION_PREMIUMS[city] || 0;
  return Math.round(baseValue * (1 + premium));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npx vitest run tests/analysis/price-analyzer.test.js
```
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/analysis/price-analyzer.js server/tests/analysis/price-analyzer.test.js
git commit -m "feat: add price analyzer with median, mileage, and location adjustments"
```

---

## Task 3: Analysis Engine — Profit Calculator

**Files:**
- Create: `server/src/analysis/profit-calculator.js`
- Create: `server/tests/analysis/profit-calculator.test.js`

- [ ] **Step 1: Write failing tests**

`server/tests/analysis/profit-calculator.test.js`:
```javascript
import { describe, it, expect } from "vitest";
import { calculateProfitScore, getDecision } from "../src/analysis/profit-calculator.js";

describe("calculateProfitScore", () => {
  it("returns high score for significantly underpriced listing", () => {
    const score = calculateProfitScore({
      priceDiffPercent: -20, // 20% below market
      liquidityScore: 80,
      mileageAgeConsistency: 90,
      damageRisk: 10,
      sellerReliability: 80,
    });
    // weighted: (-20*-2)*0.4=16, 80*0.25=20, 90*0.15=13.5, (100-10)*0.1=9, 80*0.1=8 = 66.5
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns low score for overpriced listing", () => {
    const score = calculateProfitScore({
      priceDiffPercent: 15,
      liquidityScore: 40,
      mileageAgeConsistency: 50,
      damageRisk: 60,
      sellerReliability: 30,
    });
    expect(score).toBeLessThan(40);
  });

  it("clamps score between 0 and 100", () => {
    const extremeHigh = calculateProfitScore({
      priceDiffPercent: -50,
      liquidityScore: 100,
      mileageAgeConsistency: 100,
      damageRisk: 0,
      sellerReliability: 100,
    });
    expect(extremeHigh).toBeLessThanOrEqual(100);

    const extremeLow = calculateProfitScore({
      priceDiffPercent: 50,
      liquidityScore: 0,
      mileageAgeConsistency: 0,
      damageRisk: 100,
      sellerReliability: 0,
    });
    expect(extremeLow).toBeGreaterThanOrEqual(0);
  });
});

describe("getDecision", () => {
  it("returns AL for score >= 65", () => {
    expect(getDecision(65)).toBe("AL");
    expect(getDecision(90)).toBe("AL");
  });

  it("returns DÜŞÜN for score 40-64", () => {
    expect(getDecision(40)).toBe("DÜŞÜN");
    expect(getDecision(64)).toBe("DÜŞÜN");
  });

  it("returns REDDET for score < 40", () => {
    expect(getDecision(39)).toBe("REDDET");
    expect(getDecision(0)).toBe("REDDET");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npx vitest run tests/analysis/profit-calculator.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement profit calculator**

`server/src/analysis/profit-calculator.js`:
```javascript
const WEIGHTS = {
  priceBelow: 0.4,
  liquidity: 0.25,
  mileageAge: 0.15,
  damage: 0.1,
  seller: 0.1,
};

/**
 * Calculates a 0-100 profitability score.
 * priceDiffPercent is negative when listing is below market (good).
 */
export function calculateProfitScore({
  priceDiffPercent,
  liquidityScore,
  mileageAgeConsistency,
  damageRisk,
  sellerReliability,
}) {
  const priceBelowScore = Math.min(100, Math.max(0, priceDiffPercent * -2));
  const damageScore = 100 - damageRisk;

  const raw =
    priceBelowScore * WEIGHTS.priceBelow +
    liquidityScore * WEIGHTS.liquidity +
    mileageAgeConsistency * WEIGHTS.mileageAge +
    damageScore * WEIGHTS.damage +
    sellerReliability * WEIGHTS.seller;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Maps score to decision.
 */
export function getDecision(score) {
  if (score >= 65) return "AL";
  if (score >= 40) return "DÜŞÜN";
  return "REDDET";
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npx vitest run tests/analysis/profit-calculator.test.js
```
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/analysis/profit-calculator.js server/tests/analysis/profit-calculator.test.js
git commit -m "feat: add profit calculator with weighted scoring and decision logic"
```

---

## Task 4: Analysis Engine — Risk Scorer

**Files:**
- Create: `server/src/analysis/risk-scorer.js`
- Create: `server/tests/analysis/risk-scorer.test.js`

- [ ] **Step 1: Write failing tests**

`server/tests/analysis/risk-scorer.test.js`:
```javascript
import { describe, it, expect } from "vitest";
import {
  calculateMileageAgeConsistency,
  calculateDamageRisk,
  calculateSellerReliability,
  calculateLiquidityScore,
  getRiskLevel,
} from "../src/analysis/risk-scorer.js";

describe("calculateMileageAgeConsistency", () => {
  it("returns high score for consistent mileage/age", () => {
    // 2020 car, 6 years old, 90000 km → 15000 km/year (normal)
    const score = calculateMileageAgeConsistency(90_000, 2020, 2026);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("returns low score for excessive mileage", () => {
    // 2023 car, 3 years old, 200000 km → 66000 km/year (suspicious)
    const score = calculateMileageAgeConsistency(200_000, 2023, 2026);
    expect(score).toBeLessThan(40);
  });
});

describe("calculateDamageRisk", () => {
  it("returns 0 risk for no damage", () => {
    expect(calculateDamageRisk("Belirtilmemiş")).toBe(0);
  });

  it("returns moderate risk for minor damage", () => {
    const risk = calculateDamageRisk("Boyalı");
    expect(risk).toBeGreaterThan(0);
    expect(risk).toBeLessThanOrEqual(40);
  });

  it("returns high risk for major damage", () => {
    const risk = calculateDamageRisk("Ağır Hasar Kayıtlı");
    expect(risk).toBeGreaterThanOrEqual(80);
  });
});

describe("calculateSellerReliability", () => {
  it("gives higher score to individual sellers", () => {
    const individual = calculateSellerReliability("sahibinden");
    const dealer = calculateSellerReliability("galeri");
    expect(individual).toBeGreaterThan(dealer);
  });
});

describe("calculateLiquidityScore", () => {
  it("returns high score for popular brands", () => {
    expect(calculateLiquidityScore("Volkswagen", "Golf")).toBeGreaterThanOrEqual(70);
  });

  it("returns lower score for niche brands", () => {
    expect(calculateLiquidityScore("Alfa Romeo", "Giulia")).toBeLessThan(50);
  });
});

describe("getRiskLevel", () => {
  it("returns DÜŞÜK for low risk scores", () => {
    expect(getRiskLevel(20)).toBe("DÜŞÜK");
  });

  it("returns ORTA for medium risk scores", () => {
    expect(getRiskLevel(50)).toBe("ORTA");
  });

  it("returns YÜKSEK for high risk scores", () => {
    expect(getRiskLevel(75)).toBe("YÜKSEK");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npx vitest run tests/analysis/risk-scorer.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement risk scorer**

`server/src/analysis/risk-scorer.js`:
```javascript
const EXPECTED_KM_PER_YEAR = 15_000;

export function calculateMileageAgeConsistency(mileage, modelYear, currentYear) {
  const age = Math.max(1, currentYear - modelYear);
  const expectedKm = age * EXPECTED_KM_PER_YEAR;
  const ratio = mileage / expectedKm;
  // ratio 1.0 = perfect, >1 means more km than expected
  if (ratio <= 1.2) return 90;
  if (ratio <= 1.5) return 70;
  if (ratio <= 2.0) return 50;
  if (ratio <= 3.0) return 30;
  return 10;
}

const DAMAGE_SCORES = {
  Belirtilmemiş: 0,
  "Tramer Kaydı Yok": 0,
  Boyalı: 30,
  "Lokal Boyalı": 20,
  Değişen: 50,
  "Ağır Hasar Kayıtlı": 90,
};

export function calculateDamageRisk(damageRecord) {
  if (!damageRecord) return 0;
  return DAMAGE_SCORES[damageRecord] ?? 40;
}

export function calculateSellerReliability(sellerType) {
  if (sellerType === "sahibinden") return 70;
  if (sellerType === "galeri") return 50;
  return 40;
}

const POPULAR_BRANDS = {
  Volkswagen: 80,
  Toyota: 85,
  Honda: 80,
  Hyundai: 75,
  Renault: 70,
  Fiat: 70,
  Ford: 70,
  BMW: 65,
  "Mercedes - Benz": 65,
  Audi: 60,
  Opel: 65,
  Skoda: 70,
  Dacia: 65,
  Peugeot: 60,
  Citroen: 55,
  Kia: 70,
  Nissan: 60,
};

export function calculateLiquidityScore(brand, model) {
  return POPULAR_BRANDS[brand] ?? 35;
}

export function getRiskLevel(damageRisk) {
  if (damageRisk <= 30) return "DÜŞÜK";
  if (damageRisk <= 60) return "ORTA";
  return "YÜKSEK";
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npx vitest run tests/analysis/risk-scorer.test.js
```
Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/analysis/risk-scorer.js server/tests/analysis/risk-scorer.test.js
git commit -m "feat: add risk scorer with mileage, damage, seller, and liquidity scoring"
```

---

## Task 5: Analysis Engine — Trend Tracker

**Files:**
- Create: `server/src/analysis/trend-tracker.js`

- [ ] **Step 1: Implement trend tracker**

`server/src/analysis/trend-tracker.js`:
```javascript
import { supabase } from "../db/supabase.js";

/**
 * Gets price history for a listing.
 */
export async function getListingPriceHistory(listingId) {
  const { data, error } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("listing_id", listingId)
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Gets average price trend for a brand/model over time.
 * Groups by week.
 */
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

  // Group by week and calculate average
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
```

- [ ] **Step 2: Commit**

```bash
git add server/src/analysis/trend-tracker.js
git commit -m "feat: add trend tracker for listing and model price history"
```

---

## Task 6: Scraper — Sahibinden

**Files:**
- Create: `server/src/scraper/proxy-manager.js`
- Create: `server/src/scraper/sahibinden-scraper.js`
- Create: `server/tests/scraper/sahibinden-scraper.test.js`

- [ ] **Step 1: Implement proxy manager**

`server/src/scraper/proxy-manager.js`:
```javascript
import "dotenv/config";

const proxies = (process.env.PROXY_LIST || "")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

let currentIndex = 0;

export function getNextProxy() {
  if (proxies.length === 0) return null;
  const proxy = proxies[currentIndex];
  currentIndex = (currentIndex + 1) % proxies.length;
  return proxy;
}

export function getProxyCount() {
  return proxies.length;
}
```

- [ ] **Step 2: Write failing test for sahibinden scraper parser**

`server/tests/scraper/sahibinden-scraper.test.js`:
```javascript
import { describe, it, expect } from "vitest";
import { parseListingPage, parseSearchResults } from "../src/scraper/sahibinden-scraper.js";

const sampleSearchHTML = `
<tr class="searchResultsItem" data-id="123456">
  <td class="searchResultsAttributeValue">2020</td>
  <td class="searchResultsAttributeValue">85.000</td>
  <td class="searchResultsAttributeValue">Beyaz</td>
  <td class="searchResultsPriceValue">
    <div>1.250.000 TL</div>
  </td>
  <td class="searchResultsLocationValue">
    <span>İstanbul</span><br/><span>Kadıköy</span>
  </td>
  <td class="searchResultsDateValue">
    <span>28 Mart 2026</span>
  </td>
</tr>
`;

describe("parseSearchResults", () => {
  it("extracts listing IDs and basic data from search HTML", () => {
    const results = parseSearchResults(sampleSearchHTML);
    expect(results).toHaveLength(1);
    expect(results[0].external_id).toBe("123456");
    expect(results[0].price).toBe(1250000);
  });
});

const sampleDetailHTML = `
<div id="classifiedDetail">
  <h1 class="classifiedDetailTitle">
    <span>Volkswagen Golf 1.5 TSI Comfortline</span>
  </h1>
  <ul class="classifiedInfoList">
    <li><strong>İlan No</strong><span>123456</span></li>
    <li><strong>Marka</strong><span>Volkswagen</span></li>
    <li><strong>Seri</strong><span>Golf</span></li>
    <li><strong>Yıl</strong><span>2020</span></li>
    <li><strong>Yakıt</strong><span>Benzin</span></li>
    <li><strong>Vites</strong><span>Otomatik</span></li>
    <li><strong>KM</strong><span>85.000</span></li>
    <li><strong>Renk</strong><span>Beyaz</span></li>
    <li><strong>Kimden</strong><span>Galeriden</span></li>
    <li><strong>Hasar Durumu</strong><span>Belirtilmemiş</span></li>
  </ul>
  <div class="classifiedPrice">1.250.000 TL</div>
  <div class="classifiedLocation">İstanbul / Kadıköy</div>
</div>
`;

describe("parseListingPage", () => {
  it("extracts full listing data from detail page HTML", () => {
    const listing = parseListingPage(sampleDetailHTML, "https://sahibinden.com/ilan/123456");
    expect(listing.brand).toBe("Volkswagen");
    expect(listing.model).toBe("Golf");
    expect(listing.year).toBe(2020);
    expect(listing.price).toBe(1250000);
    expect(listing.mileage).toBe(85000);
    expect(listing.fuel_type).toBe("Benzin");
    expect(listing.transmission).toBe("Otomatik");
    expect(listing.source).toBe("sahibinden");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd server && npx vitest run tests/scraper/sahibinden-scraper.test.js
```
Expected: FAIL

- [ ] **Step 4: Implement sahibinden scraper**

`server/src/scraper/sahibinden-scraper.js`:
```javascript
import puppeteer from "puppeteer";
import { getNextProxy } from "./proxy-manager.js";
import { supabase } from "../db/supabase.js";

/**
 * Parses price string "1.250.000 TL" → 1250000
 */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[.\sTL]/g, ""), 10) || 0;
}

/**
 * Parses km string "85.000" → 85000
 */
function parseKm(kmStr) {
  if (!kmStr) return 0;
  return parseInt(kmStr.replace(/\./g, ""), 10) || 0;
}

/**
 * Extracts basic listing data from search results HTML.
 */
export function parseSearchResults(html) {
  const results = [];
  const rowRegex = /data-id="(\d+)"/g;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const externalId = match[1];
    // Extract price from the same row context
    const priceMatch = html.match(
      new RegExp(`data-id="${externalId}"[\\s\\S]*?searchResultsPriceValue[\\s\\S]*?>([\\.\\d]+\\s*TL)<`)
    );
    results.push({
      external_id: externalId,
      price: priceMatch ? parsePrice(priceMatch[1]) : 0,
    });
  }
  return results;
}

/**
 * Extracts full listing data from a detail page HTML.
 */
export function parseListingPage(html, url) {
  const getField = (label) => {
    const regex = new RegExp(`<strong>${label}</strong>\\s*<span>([^<]+)</span>`);
    const match = html.match(regex);
    return match ? match[1].trim() : null;
  };

  const priceMatch = html.match(/classifiedPrice[^>]*>([\d.]+\s*TL)/);
  const locationMatch = html.match(/classifiedLocation[^>]*>([^<]+)/);
  const [city, district] = locationMatch
    ? locationMatch[1].split("/").map((s) => s.trim())
    : [null, null];

  return {
    external_id: getField("İlan No") || url.split("/").pop(),
    source: "sahibinden",
    url,
    title: (html.match(/classifiedDetailTitle[\s\S]*?<span>([^<]+)/) || [])[1]?.trim() || "",
    brand: getField("Marka"),
    model: getField("Seri"),
    year: parseInt(getField("Yıl"), 10) || 0,
    fuel_type: getField("Yakıt"),
    transmission: getField("Vites"),
    mileage: parseKm(getField("KM")),
    color: getField("Renk"),
    price: priceMatch ? parsePrice(priceMatch[1]) : 0,
    location_city: city,
    location_district: district,
    seller_type: getField("Kimden") === "Galeriden" ? "galeri" : "sahibinden",
    damage_record: getField("Hasar Durumu"),
  };
}

/**
 * Delays for a random time between min and max milliseconds.
 */
function randomDelay(min = 3000, max = 8000) {
  return new Promise((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min))
  );
}

/**
 * Scrapes search results and detail pages from sahibinden.com.
 * Returns array of parsed listings.
 */
export async function scrapeSahibinden(searchUrl, maxPages = 3) {
  const proxy = getNextProxy();
  const launchOptions = {
    headless: "new",
    args: proxy ? [`--proxy-server=${proxy}`] : [],
  };

  const browser = await puppeteer.launch(launchOptions);
  const listings = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    for (let p = 0; p < maxPages; p++) {
      const pageUrl = p === 0 ? searchUrl : `${searchUrl}&pagingOffset=${p * 20}`;
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await randomDelay();

      const html = await page.content();
      const searchResults = parseSearchResults(html);

      if (searchResults.length === 0) break;

      for (const result of searchResults) {
        try {
          const detailUrl = `https://www.sahibinden.com/ilan/${result.external_id}`;
          await page.goto(detailUrl, { waitUntil: "networkidle2", timeout: 30000 });
          await randomDelay();

          const detailHtml = await page.content();
          const listing = parseListingPage(detailHtml, detailUrl);
          listings.push(listing);
        } catch (err) {
          console.error(`Error scraping listing ${result.external_id}:`, err.message);
        }
      }
    }
  } finally {
    await browser.close();
  }

  return listings;
}

/**
 * Saves scraped listings to Supabase.
 * Upserts by (source, external_id) and records price history.
 */
export async function saveListings(listings) {
  let saved = 0;
  for (const listing of listings) {
    const { data: existing } = await supabase
      .from("listings")
      .select("id, price")
      .eq("source", listing.source)
      .eq("external_id", listing.external_id)
      .single();

    if (existing) {
      // Update price and record history if changed
      if (existing.price !== listing.price) {
        await supabase
          .from("listings")
          .update({ price: listing.price, scraped_at: new Date().toISOString() })
          .eq("id", existing.id);

        await supabase.from("price_history").insert({
          listing_id: existing.id,
          price: listing.price,
        });
      }
    } else {
      const { data: inserted } = await supabase
        .from("listings")
        .insert({ ...listing, scraped_at: new Date().toISOString() })
        .select("id")
        .single();

      if (inserted) {
        await supabase.from("price_history").insert({
          listing_id: inserted.id,
          price: listing.price,
        });
        saved++;
      }
    }
  }
  return saved;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd server && npx vitest run tests/scraper/sahibinden-scraper.test.js
```
Expected: 2 tests PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/scraper/proxy-manager.js server/src/scraper/sahibinden-scraper.js server/tests/scraper/sahibinden-scraper.test.js
git commit -m "feat: add sahibinden.com scraper with HTML parser and proxy rotation"
```

---

## Task 7: Scraper — Arabam.com

**Files:**
- Create: `server/src/scraper/arabam-scraper.js`
- Create: `server/tests/scraper/arabam-scraper.test.js`

- [ ] **Step 1: Write failing test for arabam parser**

`server/tests/scraper/arabam-scraper.test.js`:
```javascript
import { describe, it, expect } from "vitest";
import { parseArabamDetailPage } from "../src/scraper/arabam-scraper.js";

const sampleHTML = `
<div class="product-detail">
  <h1 class="listing-title">Volkswagen Golf 1.5 TSI</h1>
  <span class="listing-price">1.300.000 TL</span>
  <div class="listing-info">
    <span data-key="brand">Volkswagen</span>
    <span data-key="model">Golf</span>
    <span data-key="year">2020</span>
    <span data-key="fuel">Benzin</span>
    <span data-key="gear">Otomatik</span>
    <span data-key="km">90.000</span>
    <span data-key="color">Gri</span>
    <span data-key="seller">Sahibinden</span>
    <span data-key="damage">Boyalı</span>
    <span data-key="city">Ankara</span>
    <span data-key="town">Çankaya</span>
  </div>
</div>
`;

describe("parseArabamDetailPage", () => {
  it("extracts listing data from arabam detail page", () => {
    const listing = parseArabamDetailPage(sampleHTML, "https://www.arabam.com/ilan/12345");
    expect(listing.brand).toBe("Volkswagen");
    expect(listing.model).toBe("Golf");
    expect(listing.year).toBe(2020);
    expect(listing.price).toBe(1300000);
    expect(listing.mileage).toBe(90000);
    expect(listing.source).toBe("arabam");
    expect(listing.location_city).toBe("Ankara");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npx vitest run tests/scraper/arabam-scraper.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement arabam scraper**

`server/src/scraper/arabam-scraper.js`:
```javascript
import puppeteer from "puppeteer";
import { getNextProxy } from "./proxy-manager.js";
import { saveListings } from "./sahibinden-scraper.js";

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[.\sTL]/g, ""), 10) || 0;
}

function parseKm(kmStr) {
  if (!kmStr) return 0;
  return parseInt(kmStr.replace(/\./g, ""), 10) || 0;
}

export function parseArabamDetailPage(html, url) {
  const getDataKey = (key) => {
    const regex = new RegExp(`data-key="${key}">([^<]+)</span>`);
    const match = html.match(regex);
    return match ? match[1].trim() : null;
  };

  const priceMatch = html.match(/listing-price[^>]*>([\d.]+\s*TL)/);
  const titleMatch = html.match(/listing-title[^>]*>([^<]+)/);

  const sellerRaw = getDataKey("seller");

  return {
    external_id: url.split("/").pop() || "",
    source: "arabam",
    url,
    title: titleMatch ? titleMatch[1].trim() : "",
    brand: getDataKey("brand"),
    model: getDataKey("model"),
    year: parseInt(getDataKey("year"), 10) || 0,
    fuel_type: getDataKey("fuel"),
    transmission: getDataKey("gear"),
    mileage: parseKm(getDataKey("km")),
    color: getDataKey("color"),
    price: priceMatch ? parsePrice(priceMatch[1]) : 0,
    location_city: getDataKey("city"),
    location_district: getDataKey("town"),
    seller_type: sellerRaw === "Galeriden" ? "galeri" : "sahibinden",
    damage_record: getDataKey("damage"),
  };
}

function randomDelay(min = 3000, max = 8000) {
  return new Promise((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min))
  );
}

export async function scrapeArabam(searchUrl, maxPages = 3) {
  const proxy = getNextProxy();
  const launchOptions = {
    headless: "new",
    args: proxy ? [`--proxy-server=${proxy}`] : [],
  };

  const browser = await puppeteer.launch(launchOptions);
  const listings = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    for (let p = 0; p < maxPages; p++) {
      const pageUrl = p === 0 ? searchUrl : `${searchUrl}?page=${p + 1}`;
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await randomDelay();

      // Get all listing links from search page
      const links = await page.$$eval(
        'a[href*="/ilan/"]',
        (els) => els.map((el) => el.href).filter((h) => h.includes("/ilan/"))
      );

      const uniqueLinks = [...new Set(links)];
      if (uniqueLinks.length === 0) break;

      for (const link of uniqueLinks) {
        try {
          await page.goto(link, { waitUntil: "networkidle2", timeout: 30000 });
          await randomDelay();

          const html = await page.content();
          const listing = parseArabamDetailPage(html, link);
          if (listing.price > 0) listings.push(listing);
        } catch (err) {
          console.error(`Error scraping arabam listing:`, err.message);
        }
      }
    }
  } finally {
    await browser.close();
  }

  return listings;
}

export { saveListings };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npx vitest run tests/scraper/arabam-scraper.test.js
```
Expected: 1 test PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/scraper/arabam-scraper.js server/tests/scraper/arabam-scraper.test.js
git commit -m "feat: add arabam.com scraper with HTML parser"
```

---

## Task 8: Scraper Scheduler & Orchestration

**Files:**
- Create: `server/src/scraper/scheduler.js`

- [ ] **Step 1: Implement scheduler**

`server/src/scraper/scheduler.js`:
```javascript
import cron from "node-cron";
import { scrapeSahibinden, saveListings } from "./sahibinden-scraper.js";
import { scrapeArabam } from "./arabam-scraper.js";
import { supabase } from "../db/supabase.js";

const SEARCH_URLS = {
  sahibinden: "https://www.sahibinden.com/otomobil",
  arabam: "https://www.arabam.com/ikinci-el/otomobil",
};

async function logScrapeRun(source, status, listingsFound, errors, startedAt) {
  await supabase.from("scraper_logs").insert({
    source,
    status,
    listings_found: listingsFound,
    errors: errors.length > 0 ? errors : null,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
  });
}

export async function runScrapeJob() {
  console.log(`[Scraper] Starting scrape job at ${new Date().toISOString()}`);
  const results = { sahibinden: 0, arabam: 0, errors: [] };

  // Sahibinden
  const sahibindenStart = new Date().toISOString();
  try {
    const listings = await scrapeSahibinden(SEARCH_URLS.sahibinden);
    results.sahibinden = await saveListings(listings);
    await logScrapeRun("sahibinden", "success", results.sahibinden, [], sahibindenStart);
    console.log(`[Scraper] Sahibinden: ${results.sahibinden} new listings`);
  } catch (err) {
    results.errors.push({ source: "sahibinden", message: err.message });
    await logScrapeRun("sahibinden", "failed", 0, [err.message], sahibindenStart);
    console.error(`[Scraper] Sahibinden error:`, err.message);
  }

  // Arabam
  const arabamStart = new Date().toISOString();
  try {
    const listings = await scrapeArabam(SEARCH_URLS.arabam);
    results.arabam = await saveListings(listings);
    await logScrapeRun("arabam", "success", results.arabam, [], arabamStart);
    console.log(`[Scraper] Arabam: ${results.arabam} new listings`);
  } catch (err) {
    results.errors.push({ source: "arabam", message: err.message });
    await logScrapeRun("arabam", "failed", 0, [err.message], arabamStart);
    console.error(`[Scraper] Arabam error:`, err.message);
  }

  console.log(`[Scraper] Job completed. Total new: ${results.sahibinden + results.arabam}`);
  return results;
}

/**
 * Starts cron jobs: 09:00, 13:00, 19:00 Turkey time (UTC+3).
 * Cron uses server local time.
 */
export function startScheduler() {
  // 09:00 Turkey = 06:00 UTC
  cron.schedule("0 6 * * *", () => runScrapeJob());
  // 13:00 Turkey = 10:00 UTC
  cron.schedule("0 10 * * *", () => runScrapeJob());
  // 19:00 Turkey = 16:00 UTC
  cron.schedule("0 16 * * *", () => runScrapeJob());

  console.log("[Scheduler] Cron jobs scheduled: 09:00, 13:00, 19:00 (TR)");
}
```

- [ ] **Step 2: Wire scheduler into server entry**

Add to `server/src/index.js` after the health route:
```javascript
import { startScheduler } from "./scraper/scheduler.js";

// Start scraper cron jobs
startScheduler();
```

- [ ] **Step 3: Commit**

```bash
git add server/src/scraper/scheduler.js server/src/index.js
git commit -m "feat: add scraper scheduler with cron jobs at 09:00, 13:00, 19:00 TR time"
```

---

## Task 9: Full Analysis Pipeline

**Files:**
- Create: `server/src/analysis/analyze-listings.js`

This connects all analysis modules into a single pipeline that runs after each scrape.

- [ ] **Step 1: Implement analysis pipeline**

`server/src/analysis/analyze-listings.js`:
```javascript
import { supabase } from "../db/supabase.js";
import { calculateMarketValue, adjustForMileage, adjustForLocation } from "./price-analyzer.js";
import { calculateProfitScore, getDecision } from "./profit-calculator.js";
import {
  calculateMileageAgeConsistency,
  calculateDamageRisk,
  calculateSellerReliability,
  calculateLiquidityScore,
  getRiskLevel,
} from "./risk-scorer.js";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Fetches comparable listings for the same brand/model/year (±1 year).
 */
async function getComparables(brand, model, year) {
  const { data } = await supabase
    .from("listings")
    .select("price, mileage, location_city")
    .eq("brand", brand)
    .eq("model", model)
    .gte("year", year - 1)
    .lte("year", year + 1)
    .eq("is_active", true);

  return data || [];
}

/**
 * Analyzes a single listing and returns an analysis result.
 */
export async function analyzeListing(listing) {
  const comparables = await getComparables(listing.brand, listing.model, listing.year);

  // Market value
  let marketValue = calculateMarketValue(comparables);
  if (marketValue === 0) marketValue = listing.price; // no comparables

  const avgMileage =
    comparables.length > 0
      ? Math.round(comparables.reduce((sum, l) => sum + (l.mileage || 0), 0) / comparables.length)
      : listing.mileage;

  marketValue = adjustForMileage(marketValue, listing.mileage, avgMileage);
  marketValue = adjustForLocation(marketValue, listing.location_city);

  // Risk factors
  const mileageAgeConsistency = calculateMileageAgeConsistency(
    listing.mileage,
    listing.year,
    CURRENT_YEAR
  );
  const damageRisk = calculateDamageRisk(listing.damage_record);
  const sellerReliability = calculateSellerReliability(listing.seller_type);
  const liquidityScore = calculateLiquidityScore(listing.brand, listing.model);

  // Profit
  const priceDiffPercent =
    marketValue > 0 ? ((listing.price - marketValue) / marketValue) * 100 : 0;

  const confidenceScore = calculateProfitScore({
    priceDiffPercent,
    liquidityScore,
    mileageAgeConsistency,
    damageRisk,
    sellerReliability,
  });

  const estimatedProfit = marketValue - listing.price;
  const decision = getDecision(confidenceScore);
  const riskLevel = getRiskLevel(damageRisk);

  return {
    listing_id: listing.id,
    decision,
    confidence_score: confidenceScore,
    market_value: marketValue,
    estimated_profit: estimatedProfit,
    risk_level: riskLevel,
    factors: {
      priceDiffPercent: Math.round(priceDiffPercent),
      liquidityScore,
      mileageAgeConsistency,
      damageRisk,
      sellerReliability,
      comparableCount: comparables.length,
    },
  };
}

/**
 * Analyzes all active listings that haven't been analyzed in the last scrape cycle.
 * Returns the "AL" decisions for notifications.
 */
export async function analyzeAllNewListings() {
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .order("scraped_at", { ascending: false })
    .limit(500);

  if (!listings || listings.length === 0) return [];

  const buyOpportunities = [];

  for (const listing of listings) {
    const result = await analyzeListing(listing);

    // Upsert analysis
    await supabase.from("analysis_results").upsert(
      { ...result, analyzed_at: new Date().toISOString() },
      { onConflict: "listing_id" }
    );

    if (result.decision === "AL") {
      buyOpportunities.push({ listing, analysis: result });
    }
  }

  return buyOpportunities;
}
```

- [ ] **Step 2: Add unique constraint for analysis upsert**

Run in Supabase SQL Editor:
```sql
ALTER TABLE analysis_results ADD CONSTRAINT analysis_results_listing_id_key UNIQUE (listing_id);
```

- [ ] **Step 3: Wire analysis into scraper scheduler**

Update `server/src/scraper/scheduler.js` — add after imports:
```javascript
import { analyzeAllNewListings } from "../analysis/analyze-listings.js";
```

Add at the end of `runScrapeJob()`, before the final `console.log`:
```javascript
  // Run analysis on new listings
  try {
    const buyOpportunities = await analyzeAllNewListings();
    console.log(`[Analysis] Found ${buyOpportunities.length} buy opportunities`);
    results.buyOpportunities = buyOpportunities;
  } catch (err) {
    console.error(`[Analysis] Error:`, err.message);
  }
```

- [ ] **Step 4: Commit**

```bash
git add server/src/analysis/analyze-listings.js server/src/scraper/scheduler.js
git commit -m "feat: add full analysis pipeline connected to scraper scheduler"
```

---

## Task 10: Telegram Bot

**Files:**
- Create: `server/src/telegram/bot.js`
- Create: `server/src/telegram/commands.js`
- Create: `server/src/telegram/notification-service.js`
- Create: `server/tests/telegram/commands.test.js`

- [ ] **Step 1: Write failing test for command formatting**

`server/tests/telegram/commands.test.js`:
```javascript
import { describe, it, expect } from "vitest";
import { formatListingMessage, formatStatusMessage } from "../src/telegram/commands.js";

describe("formatListingMessage", () => {
  it("formats a buy opportunity into a Telegram message", () => {
    const listing = {
      title: "Volkswagen Golf 1.5 TSI",
      location_city: "İstanbul",
      location_district: "Kadıköy",
      price: 1_250_000,
      mileage: 85_000,
      color: "Beyaz",
      seller_type: "galeri",
      url: "https://sahibinden.com/ilan/123",
    };
    const analysis = {
      decision: "AL",
      confidence_score: 87,
      market_value: 1_380_000,
      estimated_profit: 130_000,
      risk_level: "DÜŞÜK",
    };

    const msg = formatListingMessage(listing, analysis);
    expect(msg).toContain("AL");
    expect(msg).toContain("87");
    expect(msg).toContain("1.250.000");
    expect(msg).toContain("1.380.000");
    expect(msg).toContain("130.000");
    expect(msg).toContain("İstanbul");
    expect(msg).toContain("sahibinden.com/ilan/123");
  });
});

describe("formatStatusMessage", () => {
  it("formats scraper status", () => {
    const msg = formatStatusMessage({
      sahibinden: 15,
      arabam: 10,
      errors: [],
    });
    expect(msg).toContain("15");
    expect(msg).toContain("10");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npx vitest run tests/telegram/commands.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement commands**

`server/src/telegram/commands.js`:
```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npx vitest run tests/telegram/commands.test.js
```
Expected: 2 tests PASS

- [ ] **Step 5: Implement notification service**

`server/src/telegram/notification-service.js`:
```javascript
import { supabase } from "../db/supabase.js";
import { formatListingMessage, formatStatusMessage } from "./commands.js";

/**
 * Sends buy opportunities to all users with a telegram_id.
 */
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

/**
 * Sends scrape job status to admin users.
 */
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
```

- [ ] **Step 6: Implement bot init and command router**

`server/src/telegram/bot.js`:
```javascript
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
```

- [ ] **Step 7: Wire bot and notifications into server**

Update `server/src/index.js` — add:
```javascript
import { initBot } from "./telegram/bot.js";

// Start Telegram bot
initBot();
```

Update `server/src/scraper/scheduler.js` — add after imports:
```javascript
import { getBot } from "../telegram/bot.js";
import { notifyBuyOpportunities, notifyScrapeStatus } from "../telegram/notification-service.js";
```

Add at the end of `runScrapeJob()`, before the final `console.log`:
```javascript
  // Send notifications
  const bot = getBot();
  if (bot) {
    await notifyScrapeStatus(bot, results);
    if (results.buyOpportunities) {
      await notifyBuyOpportunities(bot, results.buyOpportunities);
    }
  }
```

- [ ] **Step 8: Commit**

```bash
git add server/src/telegram/ server/tests/telegram/ server/src/index.js server/src/scraper/scheduler.js
git commit -m "feat: add Telegram bot with commands, notifications, and authorization"
```

---

## Task 11: API Routes — Listings & Analysis

**Files:**
- Create: `server/src/routes/listings.js`
- Create: `server/src/routes/analysis.js`
- Create: `server/tests/routes/listings.test.js`

- [ ] **Step 1: Write failing test for listings route**

`server/tests/routes/listings.test.js`:
```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildListingsQuery } from "../src/routes/listings.js";

describe("buildListingsQuery", () => {
  it("applies brand filter", () => {
    const filters = { brand: "Volkswagen" };
    const query = buildListingsQuery(filters);
    expect(query.filters).toContainEqual({ field: "brand", value: "Volkswagen" });
  });

  it("applies price range filter", () => {
    const filters = { priceMin: 500000, priceMax: 1500000 };
    const query = buildListingsQuery(filters);
    expect(query.filters).toContainEqual({ field: "price", op: "gte", value: 500000 });
    expect(query.filters).toContainEqual({ field: "price", op: "lte", value: 1500000 });
  });

  it("applies decision filter", () => {
    const filters = { decision: "AL" };
    const query = buildListingsQuery(filters);
    expect(query.joinAnalysis).toBe(true);
    expect(query.analysisFilter).toEqual({ decision: "AL" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npx vitest run tests/routes/listings.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement listings route**

`server/src/routes/listings.js`:
```javascript
import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

export function buildListingsQuery(filters) {
  const result = { filters: [], joinAnalysis: false, analysisFilter: null };

  if (filters.brand) {
    result.filters.push({ field: "brand", value: filters.brand });
  }
  if (filters.model) {
    result.filters.push({ field: "model", value: filters.model });
  }
  if (filters.yearMin) {
    result.filters.push({ field: "year", op: "gte", value: parseInt(filters.yearMin, 10) });
  }
  if (filters.yearMax) {
    result.filters.push({ field: "year", op: "lte", value: parseInt(filters.yearMax, 10) });
  }
  if (filters.priceMin) {
    result.filters.push({ field: "price", op: "gte", value: parseInt(filters.priceMin, 10) });
  }
  if (filters.priceMax) {
    result.filters.push({ field: "price", op: "lte", value: parseInt(filters.priceMax, 10) });
  }
  if (filters.mileageMax) {
    result.filters.push({ field: "mileage", op: "lte", value: parseInt(filters.mileageMax, 10) });
  }
  if (filters.source) {
    result.filters.push({ field: "source", value: filters.source });
  }
  if (filters.decision) {
    result.joinAnalysis = true;
    result.analysisFilter = { decision: filters.decision };
  }

  return result;
}

// GET /api/listings
router.get("/", async (req, res) => {
  const queryPlan = buildListingsQuery(req.query);
  const sortBy = req.query.sortBy || "scraped_at";
  const sortOrder = req.query.sortOrder === "asc" ? true : false;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select("*, analysis_results(*)", { count: "exact" })
    .eq("is_active", true);

  for (const f of queryPlan.filters) {
    if (f.op === "gte") query = query.gte(f.field, f.value);
    else if (f.op === "lte") query = query.lte(f.field, f.value);
    else query = query.eq(f.field, f.value);
  }

  query = query.order(sortBy, { ascending: sortOrder }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  // Filter by decision if needed (post-filter since it's in a joined table)
  let filtered = data;
  if (queryPlan.joinAnalysis && queryPlan.analysisFilter) {
    filtered = data.filter((row) =>
      row.analysis_results?.some((a) => a.decision === queryPlan.analysisFilter.decision)
    );
  }

  res.json({ data: filtered, total: count, page, limit });
});

// GET /api/listings/:id
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("listings")
    .select("*, analysis_results(*), price_history(*)")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Listing not found" });
  res.json(data);
});

export default router;
```

- [ ] **Step 4: Implement analysis route**

`server/src/routes/analysis.js`:
```javascript
import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { analyzeListing } from "../analysis/analyze-listings.js";

const router = Router();

// GET /api/analysis/stats
router.get("/stats", async (req, res) => {
  const { data: buyCount } = await supabase
    .from("analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("decision", "AL");

  const { data: totalActive } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: topOpportunities } = await supabase
    .from("analysis_results")
    .select("*, listings(*)")
    .eq("decision", "AL")
    .order("confidence_score", { ascending: false })
    .limit(5);

  res.json({
    buyCount: buyCount?.length || 0,
    totalActive: totalActive?.length || 0,
    topOpportunities: topOpportunities || [],
  });
});

// POST /api/analysis/run/:id — analyze a single listing
router.post("/run/:id", async (req, res) => {
  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Listing not found" });

  const result = await analyzeListing(listing);

  await supabase.from("analysis_results").upsert(
    { ...result, analyzed_at: new Date().toISOString() },
    { onConflict: "listing_id" }
  );

  res.json(result);
});

export default router;
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd server && npx vitest run tests/routes/listings.test.js
```
Expected: 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/listings.js server/src/routes/analysis.js server/tests/routes/listings.test.js
git commit -m "feat: add listings and analysis API routes with filtering"
```

---

## Task 12: API Routes — Watchlist, Trends, Scraper, Users

**Files:**
- Create: `server/src/routes/watchlist.js`
- Create: `server/src/routes/trends.js`
- Create: `server/src/routes/scraper.js`
- Create: `server/src/routes/users.js`

- [ ] **Step 1: Implement watchlist route**

`server/src/routes/watchlist.js`:
```javascript
import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

// GET /api/watchlist?userId=xxx
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

// POST /api/watchlist
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

// DELETE /api/watchlist/:id
router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("watchlist").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

export default router;
```

- [ ] **Step 2: Implement trends route**

`server/src/routes/trends.js`:
```javascript
import { Router } from "express";
import { getModelPriceTrend, getListingPriceHistory } from "../analysis/trend-tracker.js";

const router = Router();

// GET /api/trends/model?brand=Volkswagen&model=Golf&days=90
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

// GET /api/trends/listing/:id
router.get("/listing/:id", async (req, res) => {
  try {
    const data = await getListingPriceHistory(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

- [ ] **Step 3: Implement scraper status route**

`server/src/routes/scraper.js`:
```javascript
import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { runScrapeJob } from "../scraper/scheduler.js";

const router = Router();

// GET /api/scraper/status
router.get("/status", async (req, res) => {
  const { data, error } = await supabase
    .from("scraper_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/scraper/trigger — manual scrape trigger
router.post("/trigger", async (req, res) => {
  res.json({ message: "Scrape job started" });
  // Run in background
  runScrapeJob().catch((err) => console.error("Manual scrape failed:", err));
});

export default router;
```

- [ ] **Step 4: Implement users route**

`server/src/routes/users.js`:
```javascript
import { Router } from "express";
import { supabase } from "../db/supabase.js";

const router = Router();

// GET /api/users
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/users
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

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("users").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

export default router;
```

- [ ] **Step 5: Wire all routes into Express app**

Update `server/src/index.js` — add after existing imports:
```javascript
import listingsRouter from "./routes/listings.js";
import analysisRouter from "./routes/analysis.js";
import watchlistRouter from "./routes/watchlist.js";
import trendsRouter from "./routes/trends.js";
import scraperRouter from "./routes/scraper.js";
import usersRouter from "./routes/users.js";
```

Add after `app.use(express.json())`:
```javascript
app.use("/api/listings", listingsRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/watchlist", watchlistRouter);
app.use("/api/trends", trendsRouter);
app.use("/api/scraper", scraperRouter);
app.use("/api/users", usersRouter);
```

- [ ] **Step 6: Verify server starts with all routes**

```bash
cd server && npm run dev
```
Expected: `Server running on port 3001` with no errors.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/ server/src/index.js
git commit -m "feat: add watchlist, trends, scraper, and users API routes"
```

---

## Task 13: React Frontend — Layout & API Client

**Files:**
- Create: `client/src/lib/api.js`
- Create: `client/src/components/Layout.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create API client**

`client/src/lib/api.js`:
```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export const listingsApi = {
  getAll: (params) => api.get("/listings", { params }).then((r) => r.data),
  getById: (id) => api.get(`/listings/${id}`).then((r) => r.data),
};

export const analysisApi = {
  getStats: () => api.get("/analysis/stats").then((r) => r.data),
  runSingle: (id) => api.post(`/analysis/run/${id}`).then((r) => r.data),
};

export const watchlistApi = {
  getAll: (userId) => api.get("/watchlist", { params: { userId } }).then((r) => r.data),
  create: (data) => api.post("/watchlist", data).then((r) => r.data),
  remove: (id) => api.delete(`/watchlist/${id}`).then((r) => r.data),
};

export const trendsApi = {
  getModel: (brand, model, days) =>
    api.get("/trends/model", { params: { brand, model, days } }).then((r) => r.data),
  getListing: (id) => api.get(`/trends/listing/${id}`).then((r) => r.data),
};

export const scraperApi = {
  getStatus: () => api.get("/scraper/status").then((r) => r.data),
  trigger: () => api.post("/scraper/trigger").then((r) => r.data),
};

export const usersApi = {
  getAll: () => api.get("/users").then((r) => r.data),
  create: (data) => api.post("/users", data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};
```

- [ ] **Step 2: Create Layout component**

`client/src/components/Layout.jsx`:
```jsx
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/listings", label: "İlanlar", icon: "🚗" },
  { to: "/trends", label: "Trendler", icon: "📈" },
  { to: "/watchlist", label: "Takip Listesi", icon: "👁" },
  { to: "/settings", label: "Ayarlar", icon: "⚙" },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">IlanTarama</h1>
          <p className="text-sm text-gray-500">Araç Analiz Platformu</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Update App.jsx with Layout**

`client/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

function Placeholder({ title }) {
  return <div className="p-8 text-2xl font-bold text-gray-800">{title}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Placeholder title="Dashboard" />} />
          <Route path="/listings" element={<Placeholder title="İlanlar" />} />
          <Route path="/listings/:id" element={<Placeholder title="İlan Detayı" />} />
          <Route path="/trends" element={<Placeholder title="Trendler" />} />
          <Route path="/watchlist" element={<Placeholder title="Takip Listesi" />} />
          <Route path="/settings" element={<Placeholder title="Ayarlar" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Verify layout renders**

```bash
cd client && npm run dev
```
Visit `http://localhost:5173` — should show sidebar with nav items and "Dashboard" content.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/api.js client/src/components/Layout.jsx client/src/App.jsx
git commit -m "feat: add Layout with sidebar navigation and API client"
```

---

## Task 14: React Frontend — Dashboard Page

**Files:**
- Create: `client/src/components/StatsWidget.jsx`
- Create: `client/src/components/ScoreCard.jsx`
- Create: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create StatsWidget**

`client/src/components/StatsWidget.jsx`:
```jsx
export default function StatsWidget({ label, value, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorMap[color]?.split(" ")[1] || "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create ScoreCard**

`client/src/components/ScoreCard.jsx`:
```jsx
const decisionStyles = {
  AL: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  DÜŞÜN: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  REDDET: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
};

function formatNumber(n) {
  return n?.toLocaleString("tr-TR") ?? "-";
}

export default function ScoreCard({ listing, analysis }) {
  const style = decisionStyles[analysis.decision] || decisionStyles.REDDET;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-bold text-lg ${style.text}`}>{analysis.decision}</span>
        <span className="text-sm text-gray-600">Güven: {analysis.confidence_score}/100</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{listing.title}</h3>
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          {listing.location_city}
          {listing.location_district ? ` / ${listing.location_district}` : ""}
        </p>
        <p>Fiyat: {formatNumber(listing.price)} TL</p>
        <p>Piyasa: {formatNumber(analysis.market_value)} TL</p>
        <p className="font-medium text-green-700">
          Tahmini Kâr: {formatNumber(analysis.estimated_profit)} TL
        </p>
        <p>
          {formatNumber(listing.mileage)} km | {listing.year} | {listing.fuel_type}
        </p>
      </div>
      <a
        href={listing.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-sm text-blue-600 hover:underline"
      >
        İlanı Gör →
      </a>
    </div>
  );
}
```

- [ ] **Step 3: Create Dashboard page**

`client/src/pages/Dashboard.jsx`:
```jsx
import { useState, useEffect } from "react";
import { analysisApi, scraperApi } from "../lib/api";
import StatsWidget from "../components/StatsWidget";
import ScoreCard from "../components/ScoreCard";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [scraperStatus, setScraperStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, statusData] = await Promise.all([
          analysisApi.getStats(),
          scraperApi.getStatus(),
        ]);
        setStats(statsData);
        setScraperStatus(statusData);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Yükleniyor...</div>;
  }

  const lastScrape = scraperStatus[0];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Son çekim:{" "}
          {lastScrape
            ? new Date(lastScrape.started_at).toLocaleString("tr-TR")
            : "Henüz çekim yapılmadı"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsWidget label="Toplam Aktif İlan" value={stats?.totalActive || 0} color="blue" />
        <StatsWidget label="AL Kararı" value={stats?.buyCount || 0} color="green" />
        <StatsWidget
          label="Son Çekim"
          value={lastScrape?.listings_found ?? "-"}
          color="yellow"
        />
        <StatsWidget
          label="Durum"
          value={lastScrape?.status === "success" ? "Başarılı" : lastScrape?.status || "-"}
          color={lastScrape?.status === "success" ? "green" : "red"}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">En İyi 5 Fırsat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats?.topOpportunities || []).map((opp) => (
            <ScoreCard key={opp.id} listing={opp.listings} analysis={opp} />
          ))}
          {(!stats?.topOpportunities || stats.topOpportunities.length === 0) && (
            <p className="text-gray-500">Henüz analiz edilmiş ilan yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update App.jsx to use Dashboard**

Replace the Dashboard placeholder in `client/src/App.jsx`:
```jsx
import Dashboard from "./pages/Dashboard";
// ... in routes:
<Route path="/" element={<Dashboard />} />
```

- [ ] **Step 5: Verify Dashboard renders**

```bash
cd client && npm run dev
```
Visit `http://localhost:5173` — should show stats widgets (with zeros/empty) and "En İyi 5 Fırsat" section.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/StatsWidget.jsx client/src/components/ScoreCard.jsx client/src/pages/Dashboard.jsx client/src/App.jsx
git commit -m "feat: add Dashboard page with stats widgets and top opportunities"
```

---

## Task 15: React Frontend — Listings Page

**Files:**
- Create: `client/src/components/FilterBar.jsx`
- Create: `client/src/pages/Listings.jsx`

- [ ] **Step 1: Create FilterBar**

`client/src/components/FilterBar.jsx`:
```jsx
import { useState } from "react";

const BRANDS = [
  "Volkswagen", "Toyota", "Honda", "Hyundai", "Renault", "Fiat",
  "Ford", "BMW", "Mercedes - Benz", "Audi", "Opel", "Skoda",
  "Dacia", "Peugeot", "Kia", "Nissan",
];

const DECISIONS = ["AL", "DÜŞÜN", "REDDET"];
const SOURCES = ["sahibinden", "arabam"];

export default function FilterBar({ onFilter }) {
  const [filters, setFilters] = useState({
    brand: "",
    model: "",
    yearMin: "",
    yearMax: "",
    priceMin: "",
    priceMax: "",
    mileageMax: "",
    source: "",
    decision: "",
  });

  function handleChange(field, value) {
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    onFilter(updated);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Marka</label>
        <select
          value={filters.brand}
          onChange={(e) => handleChange("brand", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Tümü</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Model</label>
        <input
          type="text"
          value={filters.model}
          onChange={(e) => handleChange("model", e.target.value)}
          placeholder="Golf, Corolla..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Min Fiyat</label>
        <input
          type="number"
          value={filters.priceMin}
          onChange={(e) => handleChange("priceMin", e.target.value)}
          placeholder="500000"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Max Fiyat</label>
        <input
          type="number"
          value={filters.priceMax}
          onChange={(e) => handleChange("priceMax", e.target.value)}
          placeholder="2000000"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Max KM</label>
        <input
          type="number"
          value={filters.mileageMax}
          onChange={(e) => handleChange("mileageMax", e.target.value)}
          placeholder="150000"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Karar</label>
        <select
          value={filters.decision}
          onChange={(e) => handleChange("decision", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Tümü</option>
          {DECISIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Kaynak</label>
        <select
          value={filters.source}
          onChange={(e) => handleChange("source", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Tümü</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Listings page**

`client/src/pages/Listings.jsx`:
```jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listingsApi } from "../lib/api";
import FilterBar from "../components/FilterBar";

const decisionBadge = {
  AL: "bg-green-100 text-green-800",
  DÜŞÜN: "bg-yellow-100 text-yellow-800",
  REDDET: "bg-red-100 text-red-800",
};

function formatNumber(n) {
  return n?.toLocaleString("tr-TR") ?? "-";
}

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("scraped_at");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "")
      );
      const data = await listingsApi.getAll({ ...cleanFilters, page, sortBy, limit: 50 });
      setListings(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error("Listings load error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilter(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">İlanlar</h1>

      <FilterBar onFilter={handleFilter} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Başlık</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer"
                  onClick={() => setSortBy("price")}>Fiyat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer"
                  onClick={() => setSortBy("mileage")}>KM</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer"
                  onClick={() => setSortBy("year")}>Yıl</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Konum</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Karar</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Skor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kaynak</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
            ) : listings.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">İlan bulunamadı.</td></tr>
            ) : (
              listings.map((listing) => {
                const analysis = listing.analysis_results?.[0];
                return (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/listings/${listing.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {listing.title}
                    </td>
                    <td className="px-4 py-3">{formatNumber(listing.price)} TL</td>
                    <td className="px-4 py-3">{formatNumber(listing.mileage)}</td>
                    <td className="px-4 py-3">{listing.year}</td>
                    <td className="px-4 py-3">{listing.location_city}</td>
                    <td className="px-4 py-3">
                      {analysis ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${decisionBadge[analysis.decision] || ""}`}>
                          {analysis.decision}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3">{analysis?.confidence_score ?? "-"}</td>
                    <td className="px-4 py-3 capitalize">{listing.source}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="text-sm text-gray-600">
            Sayfa {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update App.jsx**

Replace the Listings placeholder:
```jsx
import Listings from "./pages/Listings";
// ... in routes:
<Route path="/listings" element={<Listings />} />
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/FilterBar.jsx client/src/pages/Listings.jsx client/src/App.jsx
git commit -m "feat: add Listings page with filter bar, table, and pagination"
```

---

## Task 16: React Frontend — Listing Detail Page

**Files:**
- Create: `client/src/components/PriceChart.jsx`
- Create: `client/src/pages/ListingDetail.jsx`

- [ ] **Step 1: Create PriceChart**

`client/src/components/PriceChart.jsx`:
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatPrice(value) {
  return `${(value / 1000).toFixed(0)}K`;
}

export default function PriceChart({ data, title = "Fiyat Geçmişi" }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">Fiyat geçmişi yok.</p>;
  }

  const chartData = data.map((d) => ({
    date: new Date(d.recorded_at || d.date).toLocaleDateString("tr-TR"),
    price: d.price || d.avgPrice,
  }));

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatPrice} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value.toLocaleString("tr-TR")} TL`, "Fiyat"]}
          />
          <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Create ListingDetail page**

`client/src/pages/ListingDetail.jsx`:
```jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { listingsApi } from "../lib/api";
import PriceChart from "../components/PriceChart";
import ScoreCard from "../components/ScoreCard";

function formatNumber(n) {
  return n?.toLocaleString("tr-TR") ?? "-";
}

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listingsApi.getById(id)
      .then(setListing)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Yükleniyor...</div>;
  if (!listing) return <div className="p-8 text-red-500">İlan bulunamadı.</div>;

  const analysis = listing.analysis_results?.[0];

  return (
    <div className="p-8 space-y-6">
      <Link to="/listings" className="text-sm text-blue-600 hover:underline">← İlanlara Dön</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Listing info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">{listing.title}</h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Marka:</span> {listing.brand}</div>
              <div><span className="text-gray-500">Model:</span> {listing.model}</div>
              <div><span className="text-gray-500">Yıl:</span> {listing.year}</div>
              <div><span className="text-gray-500">KM:</span> {formatNumber(listing.mileage)}</div>
              <div><span className="text-gray-500">Yakıt:</span> {listing.fuel_type}</div>
              <div><span className="text-gray-500">Vites:</span> {listing.transmission}</div>
              <div><span className="text-gray-500">Renk:</span> {listing.color}</div>
              <div><span className="text-gray-500">Satıcı:</span> {listing.seller_type}</div>
              <div><span className="text-gray-500">Hasar:</span> {listing.damage_record || "Belirtilmemiş"}</div>
              <div><span className="text-gray-500">Konum:</span> {listing.location_city} / {listing.location_district}</div>
              <div><span className="text-gray-500">Kaynak:</span> {listing.source}</div>
              <div>
                <span className="text-gray-500">Fiyat:</span>{" "}
                <span className="font-bold text-lg">{formatNumber(listing.price)} TL</span>
              </div>
            </div>
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Orijinal İlanı Gör
            </a>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <PriceChart data={listing.price_history} />
          </div>
        </div>

        {/* Right: Analysis */}
        <div className="space-y-4">
          {analysis ? (
            <>
              <ScoreCard listing={listing} analysis={analysis} />
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm space-y-2">
                <h3 className="font-medium text-gray-900">Analiz Detayları</h3>
                <div>Piyasa Değeri: {formatNumber(analysis.market_value)} TL</div>
                <div>Tahmini Kâr: {formatNumber(analysis.estimated_profit)} TL</div>
                <div>Risk: {analysis.risk_level}</div>
                {analysis.factors && (
                  <>
                    <div>Fiyat Farkı: %{analysis.factors.priceDiffPercent}</div>
                    <div>Likidite: {analysis.factors.liquidityScore}/100</div>
                    <div>KM/Yaş Uyumu: {analysis.factors.mileageAgeConsistency}/100</div>
                    <div>Hasar Riski: {analysis.factors.damageRisk}/100</div>
                    <div>Karşılaştırılan İlan: {analysis.factors.comparableCount}</div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
              Bu ilan henüz analiz edilmedi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update App.jsx**

Replace the ListingDetail placeholder:
```jsx
import ListingDetail from "./pages/ListingDetail";
// ... in routes:
<Route path="/listings/:id" element={<ListingDetail />} />
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/PriceChart.jsx client/src/pages/ListingDetail.jsx client/src/App.jsx
git commit -m "feat: add ListingDetail page with price chart and analysis panel"
```

---

## Task 17: React Frontend — Trends Page

**Files:**
- Create: `client/src/pages/Trends.jsx`

- [ ] **Step 1: Create Trends page**

`client/src/pages/Trends.jsx`:
```jsx
import { useState } from "react";
import { trendsApi } from "../lib/api";
import PriceChart from "../components/PriceChart";

const POPULAR_MODELS = [
  { brand: "Volkswagen", model: "Golf" },
  { brand: "Toyota", model: "Corolla" },
  { brand: "Honda", model: "Civic" },
  { brand: "Hyundai", model: "Tucson" },
  { brand: "Renault", model: "Clio" },
  { brand: "Fiat", model: "Egea" },
  { brand: "Ford", model: "Focus" },
  { brand: "BMW", model: "3 Serisi" },
  { brand: "Skoda", model: "Octavia" },
];

export default function Trends() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [days, setDays] = useState(90);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadTrend(b, m) {
    const targetBrand = b || brand;
    const targetModel = m || model;
    if (!targetBrand || !targetModel) return;

    setBrand(targetBrand);
    setModel(targetModel);
    setLoading(true);
    try {
      const data = await trendsApi.getModel(targetBrand, targetModel, days);
      setTrendData(data);
    } catch (err) {
      console.error("Trend load error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fiyat Trendleri</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Marka</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Volkswagen"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Golf"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Dönem</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
            <option value={180}>Son 6 ay</option>
          </select>
        </div>
        <button
          onClick={() => loadTrend()}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Ara
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {POPULAR_MODELS.map(({ brand: b, model: m }) => (
          <button
            key={`${b}-${m}`}
            onClick={() => loadTrend(b, m)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700"
          >
            {b} {m}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Yükleniyor...</p>}

      {trendData && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <PriceChart
            data={trendData.map((d) => ({ recorded_at: d.date, price: d.avgPrice }))}
            title={`${brand} ${model} — Ortalama Fiyat Trendi`}
          />
          <div className="mt-4 text-sm text-gray-500">
            {trendData.length > 0
              ? `${trendData.reduce((sum, d) => sum + d.count, 0)} ilan analiz edildi`
              : "Bu model için yeterli veri yok."}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update App.jsx**

Replace Trends placeholder:
```jsx
import Trends from "./pages/Trends";
// ... in routes:
<Route path="/trends" element={<Trends />} />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Trends.jsx client/src/App.jsx
git commit -m "feat: add Trends page with model price trend charts"
```

---

## Task 18: React Frontend — Watchlist & Settings Pages

**Files:**
- Create: `client/src/pages/Watchlist.jsx`
- Create: `client/src/pages/Settings.jsx`

- [ ] **Step 1: Create Watchlist page**

`client/src/pages/Watchlist.jsx`:
```jsx
import { useState, useEffect } from "react";
import { watchlistApi } from "../lib/api";

// Placeholder userId — in production this comes from auth
const CURRENT_USER_ID = null;

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [userId, setUserId] = useState(CURRENT_USER_ID);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await watchlistApi.getAll(userId);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function handleAdd() {
    if (!brand || !model || !userId) return;
    await watchlistApi.create({
      user_id: userId,
      brand,
      model,
      year_min: yearMin ? parseInt(yearMin, 10) : null,
      price_max: priceMax ? parseInt(priceMax, 10) : null,
    });
    setBrand("");
    setModel("");
    setYearMin("");
    setPriceMax("");
    load();
  }

  async function handleRemove(id) {
    await watchlistApi.remove(id);
    load();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Takip Listesi</h1>

      {!userId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Takip listesi kullanmak için Ayarlar sayfasından kullanıcı ID'nizi seçin.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Marka</label>
          <input
            type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <input
            type="text" value={model} onChange={(e) => setModel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Yıl</label>
          <input
            type="number" value={yearMin} onChange={(e) => setYearMin(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Fiyat</label>
          <input
            type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!brand || !model || !userId}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Ekle
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Marka</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Min Yıl</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Max Fiyat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Takip listeniz boş.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{item.brand}</td>
                  <td className="px-4 py-3">{item.model}</td>
                  <td className="px-4 py-3">{item.year_min || "-"}</td>
                  <td className="px-4 py-3">{item.price_max?.toLocaleString("tr-TR") || "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Settings page**

`client/src/pages/Settings.jsx`:
```jsx
import { useState, useEffect } from "react";
import { usersApi, scraperApi } from "../lib/api";

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [role, setRole] = useState("member");
  const [scraping, setScraping] = useState(false);

  async function loadUsers() {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleAddUser() {
    if (!name) return;
    await usersApi.create({ name, telegram_id: telegramId || null, role });
    setName("");
    setTelegramId("");
    setRole("member");
    loadUsers();
  }

  async function handleRemoveUser(id) {
    await usersApi.remove(id);
    loadUsers();
  }

  async function handleTriggerScrape() {
    setScraping(true);
    try {
      await scraperApi.trigger();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setScraping(false), 3000);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>

      {/* Users */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Kullanıcılar</h2>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">İsim</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Telegram ID</label>
            <input
              type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rol</label>
            <select
              value={role} onChange={(e) => setRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="member">Üye</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleAddUser}
            disabled={!name}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Ekle
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">İsim</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Telegram ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.telegram_id || "-"}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scraper Control */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Scraper Kontrolü</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Scraper otomatik olarak günde 3 kez çalışır (09:00, 13:00, 19:00).
            Manuel olarak da tetikleyebilirsiniz.
          </p>
          <button
            onClick={handleTriggerScrape}
            disabled={scraping}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {scraping ? "Çalışıyor..." : "Scraper'ı Şimdi Çalıştır"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update App.jsx with all pages**

`client/src/App.jsx` final version:
```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Trends from "./pages/Trends";
import Watchlist from "./pages/Watchlist";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Verify all pages render**

```bash
cd client && npm run dev
```
Navigate through all pages — Dashboard, İlanlar, Trendler, Takip Listesi, Ayarlar. Each should render without errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Watchlist.jsx client/src/pages/Settings.jsx client/src/App.jsx
git commit -m "feat: add Watchlist and Settings pages, complete all frontend routes"
```

---

## Task 19: Final Integration & Smoke Test

**Files:**
- Modify: `server/src/index.js` (final cleanup)

- [ ] **Step 1: Verify complete server/src/index.js**

`server/src/index.js` should now contain:
```javascript
import express from "express";
import cors from "cors";
import "dotenv/config";
import { startScheduler } from "./scraper/scheduler.js";
import { initBot } from "./telegram/bot.js";
import listingsRouter from "./routes/listings.js";
import analysisRouter from "./routes/analysis.js";
import watchlistRouter from "./routes/watchlist.js";
import trendsRouter from "./routes/trends.js";
import scraperRouter from "./routes/scraper.js";
import usersRouter from "./routes/users.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/listings", listingsRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/watchlist", watchlistRouter);
app.use("/api/trends", trendsRouter);
app.use("/api/scraper", scraperRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start background services
startScheduler();
initBot();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 2: Run all tests**

```bash
cd server && npx vitest run
```
Expected: All tests pass (price-analyzer, profit-calculator, risk-scorer, sahibinden-scraper, arabam-scraper, listings route, telegram commands).

- [ ] **Step 3: Start both servers and verify**

Terminal 1:
```bash
cd server && npm run dev
```

Terminal 2:
```bash
cd client && npm run dev
```

Verify:
- `http://localhost:3001/api/health` returns OK
- `http://localhost:5173` shows Dashboard with sidebar
- Navigate through all pages without console errors

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: finalize integration, verify all routes and pages connected"
```
