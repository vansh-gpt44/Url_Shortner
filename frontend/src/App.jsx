import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import {
  Link2,
  BarChart3,
  LogOut,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  QrCode,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { api } from "./api";
function Auth({ mode = "login", onDone }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/auth/${mode}`, form);
      onDone();
      nav("/");
    } catch (e) {
      setError(e.response?.data?.error?.message || "Request failed");
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <form onSubmit={submit} className="panel w-full max-w-md p-8 space-y-4">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Link2 className="text-indigo-400" />
          Linkly
        </div>
        <h1 className="text-xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <input
          className="field"
          type="email"
          required
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="field"
          type="password"
          minLength="8"
          required
          placeholder="Password (8+ characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button className="btn w-full">
          {mode === "login" ? "Log in" : "Register"}
        </button>
        <p className="text-sm muted">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link className="text-indigo-300" to="/register">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link className="text-indigo-300" to="/login">
                Log in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
function Dashboard({ onLogout }) {
  const [urls, setUrls] = useState([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:4000";
  async function load() {
    try {
      const r = await api.get("/urls");
      setUrls(r.data.urls);
    } catch (e) {
      setError(e.response?.data?.error?.message || "Unable to load links");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function create(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/urls", {
        originalUrl,
        alias: alias || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        password: password || undefined,
      });
      setOriginalUrl("");
      setAlias("");
      setExpiresAt("");
      setPassword("");
      await load();
    } catch (e) {
      setError(e.response?.data?.error?.message || "Could not create link");
    } finally {
      setLoading(false);
    }
  }
  async function remove(id) {
    if (!confirm("Delete this short link?")) return;
    await api.delete(`/urls/${id}`);
    setUrls((v) => v.filter((x) => x.id !== id));
    if (analytics?.url?.id === id) setAnalytics(null);
  }
  async function showAnalytics(u) {
    try {
      const r = await api.get(`/urls/${u.id}/analytics`);
      setAnalytics(r.data);
    } catch (e) {
      setError(e.response?.data?.error?.message || "Analytics unavailable");
    }
  }
  async function showQr(u) {
    try {
      const r = await api.get(`/urls/${u.id}/qr`);
      setQr(r.data.dataUrl);
    } catch (e) {
      setError("Could not generate QR code");
    }
  }
  async function logout() {
    await api.post("/auth/logout");
    onLogout();
  }
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 md:px-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500 p-2">
            <Link2 />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Linkly</h1>
            <p className="muted text-sm">Your links, measured.</p>
          </div>
        </div>
        <button onClick={logout} className="btn">
          <LogOut size={16} /> Sign out
        </button>
      </header>
      <section className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="panel p-5">
          <p className="muted text-sm">Total links</p>
          <p className="text-3xl font-bold mt-2">{urls.length}</p>
        </div>
        <div className="panel p-5">
          <p className="muted text-sm">Tracked clicks</p>
          <p className="text-3xl font-bold mt-2">
            {urls.reduce((s, u) => s + Number(u.total_clicks || 0), 0)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="muted text-sm">Active links</p>
          <p className="text-3xl font-bold mt-2">
            {
              urls.filter(
                (u) => !u.expires_at || new Date(u.expires_at) > new Date(),
              ).length
            }
          </p>
        </div>
      </section>
      <section className="panel p-5 md:p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Plus size={19} /> Create a short link
        </h2>
        <form onSubmit={create} className="grid md:grid-cols-2 gap-3">
          <input
            className="field md:col-span-2"
            type="url"
            required
            placeholder="https://example.com/your-long-url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
          />
          <input
            className="field"
            placeholder="Custom alias (optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
          <input
            className="field"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <input
            className="field"
            type="password"
            minLength="4"
            placeholder="Link password (optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center">
            <button className="btn" disabled={loading}>
              {loading ? "Creating…" : "Create link"}
            </button>
          </div>
        </form>
        {error && <p className="text-red-300 text-sm mt-3">{error}</p>}
      </section>
      <section className="panel overflow-hidden">
        <div className="p-5 border-b border-slate-700/70 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Your links</h2>
          <span className="muted text-sm">{urls.length} total</span>
        </div>
        {urls.length === 0 ? (
          <p className="p-8 muted text-center">
            No links yet. Create your first short link above.
          </p>
        ) : (
          <div className="divide-y divide-slate-700/60">
            {urls.map((u) => (
              <div
                key={u.id}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 justify-between"
              >
                <div className="min-w-0">
                  <a
                    className="text-indigo-300 font-semibold break-all"
                    href={`${base}/${u.code}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {base}/{u.code}{" "}
                    <ExternalLink className="inline" size={13} />
                  </a>
                  <p className="muted text-sm truncate mt-1">
                    {u.original_url}
                  </p>
                  <p className="muted text-xs mt-2">
                    {Number(u.total_clicks || 0)} clicks · created{" "}
                    {new Date(u.created_at).toLocaleDateString()}
                    {u.expires_at
                      ? ` · expires ${new Date(u.expires_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    title="Copy"
                    className="btn"
                    onClick={() =>
                      navigator.clipboard.writeText(`${base}/${u.code}`)
                    }
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    title="Analytics"
                    className="btn"
                    onClick={() => showAnalytics(u)}
                  >
                    <BarChart3 size={15} />
                  </button>
                  <button
                    title="QR code"
                    className="btn"
                    onClick={() => showQr(u)}
                  >
                    <QrCode size={15} />
                  </button>
                  <button
                    title="Delete"
                    className="btn bg-rose-600"
                    onClick={() => remove(u.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {analytics && (
        <section className="panel p-5 mt-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-semibold text-lg">
                Analytics: /{analytics.url.code}
              </h2>
              <p className="muted text-sm">
                {analytics.totalClicks} recorded clicks
              </p>
            </div>
            <button className="btn" onClick={() => setAnalytics(null)}>
              Close
            </button>
          </div>
          <h3 className="font-medium mb-3">Clicks over time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.clicksOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #334155",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#818cf8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            {[
              ["Top countries", analytics.countries],
              ["Devices", analytics.devices],
              ["Browsers", analytics.browsers],
              ["Referrers", analytics.referrers],
            ].map(([title, data]) => (
              <div key={title}>
                <h3 className="font-medium mb-2">{title}</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slice(0, 6)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={95}
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#818cf8"
                        radius={[0, 5, 5, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {qr && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setQr("")}
        >
          <div
            className="panel p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3">QR code</h3>
            <img
              src={qr}
              alt="Short link QR code"
              className="w-64 h-64 bg-white p-2 rounded-xl"
            />
            <button className="btn mt-4" onClick={() => setQr("")}>
              Close
            </button>
          </div>
        </div>
      )}
      <footer className="text-center muted text-xs py-8">
        Linkly · MERN-style API with Supabase PostgreSQL and Redis
      </footer>
    </main>
  );
}
export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    api
      .get("/urls")
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);
  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center muted">
        Loading Linkly…
      </div>
    );
  return (
    <Routes>
      <Route
        path="/login"
        element={
          authenticated ? (
            <Navigate to="/" />
          ) : (
            <Auth onDone={() => setAuthenticated(true)} />
          )
        }
      />
      <Route
        path="/register"
        element={
          authenticated ? (
            <Navigate to="/" />
          ) : (
            <Auth mode="register" onDone={() => setAuthenticated(true)} />
          )
        }
      />
      <Route
        path="/"
        element={
          authenticated ? (
            <Dashboard onLogout={() => setAuthenticated(false)} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
