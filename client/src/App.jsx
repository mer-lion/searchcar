import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";

function Placeholder({ title }) {
  return <div className="p-8 text-2xl font-bold text-gray-800">{title}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/listings" element={<Placeholder title="İlanlar" />} />
          <Route path="/listings/:id" element={<Placeholder title="İlan Detayı" />} />
          <Route path="/trends" element={<Placeholder title="Trendler" />} />
          <Route path="/watchlist" element={<Placeholder title="Takip Listesi" />} />
          <Route path="/settings" element={<Placeholder title="Ayarlar" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
