import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { listingsApi, aiApi } from "../lib/api";
import PriceChart from "../components/PriceChart";
import ScoreCard from "../components/ScoreCard";

function formatNumber(n) { return n?.toLocaleString("tr-TR") ?? "-"; }

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [suspicious, setSuspicious] = useState(null);
  const [suspLoading, setSuspLoading] = useState(false);

  useEffect(() => {
    listingsApi.getById(id).then(setListing).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function handleAiAnalyze() {
    setAiLoading(true);
    try {
      const data = await aiApi.analyze(id);
      setAiReport(data.report);
    } catch (err) {
      setAiReport("AI analizi yapılamadı: " + (err.response?.data?.error || err.message));
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSuspiciousCheck() {
    setSuspLoading(true);
    try {
      const data = await aiApi.suspicious(id);
      setSuspicious(data);
    } catch (err) {
      setSuspicious({ suspicious: false, reason: "Kontrol yapılamadı", risk_score: 0 });
    } finally {
      setSuspLoading(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Yükleniyor...</div>;
  if (!listing) return <div className="p-4 text-red-500">İlan bulunamadı.</div>;

  const analysis = Array.isArray(listing.analysis_results)
    ? listing.analysis_results[0]
    : listing.analysis_results;

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <Link to="/listings" className="inline-block text-sm text-blue-600 hover:underline">← İlanlara Dön</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left / main column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-4">{listing.title}</h1>
            <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
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
              <div><span className="text-gray-500">Fiyat:</span> <span className="font-bold text-base md:text-lg">{formatNumber(listing.price)} TL</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <a href={listing.url} target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Orijinal İlanı Gör
              </a>
              <button onClick={handleAiAnalyze} disabled={aiLoading}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                {aiLoading ? "AI Analiz Ediliyor..." : "AI Analiz"}
              </button>
              <button onClick={handleSuspiciousCheck} disabled={suspLoading}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
                {suspLoading ? "Kontrol Ediliyor..." : "Dolandırıcılık Kontrolü"}
              </button>
            </div>
          </div>

          {/* AI Report */}
          {aiReport && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 md:p-6">
              <h3 className="font-semibold text-purple-900 mb-3">AI Analiz Raporu</h3>
              <div className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed">{aiReport}</div>
            </div>
          )}

          {/* Suspicious Check */}
          {suspicious && (
            <div className={`border rounded-xl p-4 ${suspicious.suspicious ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-lg">{suspicious.suspicious ? "⚠️" : "✅"}</span>
                <h3 className={`font-semibold ${suspicious.suspicious ? "text-red-900" : "text-green-900"}`}>
                  {suspicious.suspicious ? "Şüpheli İlan!" : "Güvenilir Görünüyor"}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white">Risk: {suspicious.risk_score}/100</span>
              </div>
              <p className={`text-sm ${suspicious.suspicious ? "text-red-800" : "text-green-800"}`}>{suspicious.reason}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <PriceChart data={listing.price_history} />
          </div>
        </div>

        {/* Right / sidebar column */}
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
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500">Bu ilan henüz analiz edilmedi.</div>
          )}
        </div>
      </div>
    </div>
  );
}
