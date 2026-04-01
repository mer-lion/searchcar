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
        <span className={`font-bold text-base md:text-lg ${style.text}`}>{analysis.decision}</span>
        <span className="text-xs md:text-sm text-gray-600">Güven: {analysis.confidence_score}/100</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base line-clamp-2">{listing.title}</h3>
      <div className="text-xs md:text-sm text-gray-600 space-y-1">
        <p>{listing.location_city}{listing.location_district ? ` / ${listing.location_district}` : ""}</p>
        <p>Fiyat: {formatNumber(listing.price)} TL</p>
        <p>Piyasa: {formatNumber(analysis.market_value)} TL</p>
        <p className="font-medium text-green-700">Tahmini Kâr: {formatNumber(analysis.estimated_profit)} TL</p>
        <p>{formatNumber(listing.mileage)} km | {listing.year} | {listing.fuel_type}</p>
      </div>
      <a href={listing.url} target="_blank" rel="noopener noreferrer"
        className="inline-block mt-2 text-sm text-blue-600 hover:underline">İlanı Gör →</a>
    </div>
  );
}
