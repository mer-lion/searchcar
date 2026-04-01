import { useState, useEffect } from "react";
import { usersApi, scraperApi } from "../lib/api";

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [role, setRole] = useState("member");
  const [scraping, setScraping] = useState(false);

  async function loadUsers() { try { const data = await usersApi.getAll(); setUsers(data); } catch (err) { console.error(err); } }
  useEffect(() => { loadUsers(); }, []);

  async function handleAddUser() {
    if (!name) return;
    await usersApi.create({ name, telegram_id: telegramId || null, role });
    setName(""); setTelegramId(""); setRole("member"); loadUsers();
  }

  async function handleRemoveUser(id) { await usersApi.remove(id); loadUsers(); }

  async function handleTriggerScrape() {
    setScraping(true);
    try { await scraperApi.trigger(); } catch (err) { console.error(err); }
    finally { setTimeout(() => setScraping(false), 3000); }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ayarlar</h1>

      {/* Users section */}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-900">Kullanıcılar</h2>

        {/* Add user form */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">İsim</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telegram ID</label>
              <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rol</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="member">Üye</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button onClick={handleAddUser} disabled={!name}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            Ekle
          </button>
        </div>

        {/* Users table — horizontally scrollable on mobile */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">İsim</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telegram ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Henüz kullanıcı yok.</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.telegram_id || "-"}</td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRemoveUser(user.id)}
                        className="text-red-600 hover:underline text-xs">Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Scraper section */}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-900">Scraper Kontrolü</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">
            Scraper otomatik olarak günde 3 kez çalışır (09:00, 13:00, 19:00). Manuel olarak da tetikleyebilirsiniz.
          </p>
          <button onClick={handleTriggerScrape} disabled={scraping}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
            {scraping ? "Çalışıyor..." : "Scraper'ı Şimdi Çalıştır"}
          </button>
        </div>
      </div>
    </div>
  );
}
