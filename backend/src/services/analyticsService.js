import { supabase } from "../config/db.js";
import { redis } from "../config/redis.js";
import { UAParser } from "ua-parser-js";
export async function enqueueClick(url, req) {
  const parser = new UAParser(req.headers["user-agent"] || "");
  const ua = parser.getResult();
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip || ""
  ).slice(0, 64);
  const event = {
    url_id: url.id,
    timestamp: new Date().toISOString(),
    country:
      req.headers["cf-ipcountry"] ||
      req.headers["x-vercel-ip-country"] ||
      "Unknown",
    device: ua.device.type || "desktop",
    browser: ua.browser.name || "Unknown",
    os: ua.os.name || "Unknown",
    referrer: (req.get("referer") || "Direct").slice(0, 2048),
    ip_hash: ip ? ip : "unknown",
  };
  // RPUSH is fast; worker performs the durable insert. Do not await analytics in redirect handler.
  void redis
    .rpush("click-events", JSON.stringify(event))
    .catch((err) => console.error("click queue failed:", err.message));
  void redis.incr(`click-count:${url.id}`).catch(() => {});
}
export async function analytics(ownerId, id) {
  const { data: url, error: urlErr } = await supabase
    .from("urls")
    .select("id,code")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (urlErr) throw urlErr;
  if (!url) return null;
  const { data: clicks, error } = await supabase
    .from("clicks")
    .select("timestamp,country,device,browser,os,referrer")
    .eq("url_id", id)
    .order("timestamp", { ascending: false })
    .limit(10000);
  if (error) throw error;
  const group = (key) =>
    Object.entries(
      (clicks || []).reduce((a, c) => {
        const k = c[key] || "Unknown";
        a[k] = (a[k] || 0) + 1;
        return a;
      }, {}),
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  const byDay = {};
  for (const c of clicks || []) {
    const day = String(c.timestamp).slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }
  return {
    url,
    totalClicks: clicks?.length || 0,
    clicksOverTime: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, clicks]) => ({ date, clicks })),
    countries: group("country"),
    devices: group("device"),
    browsers: group("browser"),
    referrers: group("referrer"),
  };
}
