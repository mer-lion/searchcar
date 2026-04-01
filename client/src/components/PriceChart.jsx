import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatPrice(value) {
  return `${(value / 1000).toFixed(0)}K`;
}

export default function PriceChart({ data, title = "Fiyat Geçmişi" }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-500">Fiyat geçmişi yok.</p>;

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
          <Tooltip formatter={(value) => [`${value.toLocaleString("tr-TR")} TL`, "Fiyat"]} />
          <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
