import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analysisApi, scraperApi, aiApi } from "../lib/api";
import StatsWidget from "../components/StatsWidget";
import ScoreCard from "../components/ScoreCard";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [scraperStatus, setScraperStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

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

  async function handleAiSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const data = await aiApi.search(searchQuery);
      setSearchResults(data);
    } catch (err) {
      console.error("AI search error:", err);
    } finally {
      setSearchLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Yükleniyor...</div>;

  const lastScrape = scraperStatus[0];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Son çekim: {lastScrape ? new Date(lastScrape.started_at).toLocaleString("tr-TR") : "Henüz çekim yapılmadı"}
        </p>
      </div>
      {/* AI Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
            placeholder="AI ile ara... Örn: '500bin altı otomatik Golf' veya '2020+ dizel SUV'"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAiSearch}
            disabled={searchLoading || !searchQuery.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {searchLoading ? "Araniyor..." : "AI Ara"}
          </button>
        </div>
        {searchResults && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">
              Filtreler: {JSON.stringify(searchResults.filters)} — {searchResults.count} sonuc
            </p>
            <div className="space-y-2">
              {searchResults.results.slice(0, 5).map((l) => (
                <div key={l.id} onClick={() => navigate(`/listings/${l.id}`)}
                  className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                  <span className="font-medium">{l.brand} {l.model} {l.year}</span>
                  <span>{l.price?.toLocaleString("tr-TR")} TL</span>
                </div>
              ))}
              {searchResults.count === 0 && <p className="text-sm text-gray-500">Sonuc bulunamadi.</p>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsWidget label="Toplam Aktif İlan" value={stats?.totalActive || 0} color="blue" />
        <StatsWidget label="AL Kararı" value={stats?.buyCount || 0} color="green" />
        <StatsWidget label="Son Çekim" value={lastScrape?.listings_found ?? "-"} color="yellow" />
        <StatsWidget label="Durum" value={lastScrape?.status === "success" ? "Başarılı" : lastScrape?.status || "-"}
          color={lastScrape?.status === "success" ? "green" : "red"} />
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
