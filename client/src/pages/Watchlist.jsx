import { useState, useEffect } from "react";
import { watchlistApi } from "../lib/api";

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
    try { const data = await watchlistApi.getAll(userId); setItems(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [userId]);

  async function handleAdd() {
    if (!brand || !model || !userId) return;
    await watchlistApi.create({ user_id: userId, brand, model, year_min: yearMin ? parseInt(yearMin, 10) : null, price_max: priceMax ? parseInt(priceMax, 10) : null });
    setBrand(""); setModel(""); setYearMin(""); setPriceMax(""); load();
  }

  async function handleRemove(id) { await watchlistApi.remove(id); load(); }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Takip Listesi</h1>
      {!userId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Takip listesi kullanmak için Ayarlar sayfasından kullanıcı ID'nizi seçin.
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs text-gray-500 mb-1">Marka</label>
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Model</label>
          <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Min Yıl</label>
          <input type="number" value={yearMin} onChange={(e) => setYearMin(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Max Fiyat</label>
          <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28" /></div>
        <button onClick={handleAdd} disabled={!brand || !model || !userId}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Ekle</button>
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
            ) : items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-4 py-3">{item.brand}</td>
                <td className="px-4 py-3">{item.model}</td>
                <td className="px-4 py-3">{item.year_min || "-"}</td>
                <td className="px-4 py-3">{item.price_max?.toLocaleString("tr-TR") || "-"}</td>
                <td className="px-4 py-3"><button onClick={() => handleRemove(item.id)} className="text-red-600 hover:underline text-xs">Sil</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
