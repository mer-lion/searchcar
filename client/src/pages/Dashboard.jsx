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
