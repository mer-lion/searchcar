import { BrowserRouter, Routes, Route } from "react-router-dom";

function Placeholder({ title }) {
  return <div className="p-8 text-2xl font-bold">{title}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder title="Dashboard" />} />
        <Route path="/listings" element={<Placeholder title="İlanlar" />} />
        <Route path="/trends" element={<Placeholder title="Trendler" />} />
        <Route path="/watchlist" element={<Placeholder title="Takip Listesi" />} />
        <Route path="/settings" element={<Placeholder title="Ayarlar" />} />
      </Routes>
    </BrowserRouter>
  );
}
