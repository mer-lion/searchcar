import { useState } from "react";
import { trendsApi } from "../lib/api";
import PriceChart from "../components/PriceChart";

const POPULAR_MODELS = [
  { brand: "Volkswagen", model: "Golf" }, { brand: "Toyota", model: "Corolla" },
  { brand: "Honda", model: "Civic" }, { brand: "Hyundai", model: "Tucson" },
  { brand: "Renault", model: "Clio" }, { brand: "Fiat", model: "Egea" },
  { brand: "Ford", model: "Focus" }, { brand: "BMW", model: "3 Serisi" },
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
    } catch (err) { console.error("Trend load error:", err); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Fiyat Trendleri</h1>

      {/* Search form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Marka</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
              placeholder="Volkswagen"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Model</label>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
              placeholder="Golf"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Dönem</label>
            <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value={30}>Son 30 gün</option>
              <option value={90}>Son 90 gün</option>
              <option value={180}>Son 6 ay</option>
            </select>
          </div>
        </div>
        <button onClick={() => loadTrend()}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          Ara
        </button>
      </div>

      {/* Popular models */}
      <div className="flex flex-wrap gap-2">
        {POPULAR_MODELS.map(({ brand: b, model: m }) => (
          <button key={`${b}-${m}`} onClick={() => loadTrend(b, m)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700">
            {b} {m}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-sm">Yükleniyor...</p>}

      {trendData && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <PriceChart
            data={trendData.map((d) => ({ recorded_at: d.date, price: d.avgPrice }))}
            title={`${brand} ${model} — Ortalama Fiyat Trendi`}
          />
          <div className="mt-4 text-sm text-gray-500">
            {trendData.length > 0 ? `${trendData.reduce((sum, d) => sum + d.count, 0)} ilan analiz edildi` : "Bu model için yeterli veri yok."}
          </div>
        </div>
      )}
    </div>
  );
}
