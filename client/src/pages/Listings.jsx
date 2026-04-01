import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listingsApi } from "../lib/api";
import FilterBar from "../components/FilterBar";

const decisionBadge = {
  AL: "bg-green-100 text-green-800",
  DÜŞÜN: "bg-yellow-100 text-yellow-800",
  REDDET: "bg-red-100 text-red-800",
};

function formatNumber(n) { return n?.toLocaleString("tr-TR") ?? "-"; }

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
      const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      const data = await listingsApi.getAll({ ...cleanFilters, page, sortBy, limit: 50 });
      setListings(data.data);
      setTotal(data.total);
    } catch (err) { console.error("Listings load error:", err); }
    finally { setLoading(false); }
  }, [filters, page, sortBy]);

  useEffect(() => { load(); }, [load]);

  function handleFilter(newFilters) { setFilters(newFilters); setPage(1); }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-4 md:p-8 space-y-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">İlanlar</h1>
      <FilterBar onFilter={handleFilter} />

      {/* Table — horizontally scrollable on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Başlık</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer whitespace-nowrap" onClick={() => setSortBy("price")}>Fiyat ↕</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={() => setSortBy("mileage")}>KM ↕</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={() => setSortBy("year")}>Yıl ↕</th>
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
                    <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/listings/${listing.id}`)}>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{listing.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatNumber(listing.price)} TL</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatNumber(listing.mileage)}</td>
                      <td className="px-4 py-3">{listing.year}</td>
                      <td className="px-4 py-3">{listing.location_city}</td>
                      <td className="px-4 py-3">{analysis ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${decisionBadge[analysis.decision] || ""}`}>{analysis.decision}</span>
                      ) : "-"}</td>
                      <td className="px-4 py-3">{analysis?.confidence_score ?? "-"}</td>
                      <td className="px-4 py-3 capitalize">{listing.source}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-50">Önceki</button>
          <span className="text-sm text-gray-600">Sayfa {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}
    </div>
  );
}
