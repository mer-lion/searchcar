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
    brand: "", model: "", yearMin: "", yearMax: "",
    priceMin: "", priceMax: "", mileageMax: "", source: "", decision: "",
  });

  function handleChange(field, value) {
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    onFilter(updated);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Marka</label>
          <select value={filters.brand} onChange={(e) => handleChange("brand", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm">
            <option value="">Tümü</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <input type="text" value={filters.model} onChange={(e) => handleChange("model", e.target.value)}
            placeholder="Golf, Corolla..."
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Fiyat</label>
          <input type="number" value={filters.priceMin} onChange={(e) => handleChange("priceMin", e.target.value)}
            placeholder="500000"
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Fiyat</label>
          <input type="number" value={filters.priceMax} onChange={(e) => handleChange("priceMax", e.target.value)}
            placeholder="2000000"
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max KM</label>
          <input type="number" value={filters.mileageMax} onChange={(e) => handleChange("mileageMax", e.target.value)}
            placeholder="150000"
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Karar</label>
          <select value={filters.decision} onChange={(e) => handleChange("decision", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm">
            <option value="">Tümü</option>
            {DECISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Kaynak</label>
          <select value={filters.source} onChange={(e) => handleChange("source", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm">
            <option value="">Tümü</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
