import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { listingsApi } from "../lib/api";
import PriceChart from "../components/PriceChart";
import ScoreCard from "../components/ScoreCard";

function formatNumber(n) { return n?.toLocaleString("tr-TR") ?? "-"; }

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listingsApi.getById(id).then(setListing).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Yükleniyor...</div>;
  if (!listing) return <div className="p-8 text-red-500">İlan bulunamadı.</div>;

  const analysis = listing.analysis_results?.[0];

  return (
    <div className="p-8 space-y-6">
      <Link to="/listings" className="text-sm text-blue-600 hover:underline">← İlanlara Dön</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div><span className="text-gray-500">Fiyat:</span> <span className="font-bold text-lg">{formatNumber(listing.price)} TL</span></div>
            </div>
            <a href={listing.url} target="_blank" rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Orijinal İlanı Gör</a>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <PriceChart data={listing.price_history} />
          </div>
        </div>
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
