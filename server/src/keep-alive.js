/**
 * Self-ping to prevent Render free tier from sleeping.
 * Pings the health endpoint every 14 minutes.
 */
export function startKeepAlive() {
  const url = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (!url) {
    console.log("[KeepAlive] No RENDER_EXTERNAL_URL or APP_URL set, skipping");
    return;
  }

  const pingUrl = `${url}/api/health`;
  const INTERVAL = 14 * 60 * 1000; // 14 minutes

  setInterval(async () => {
    try {
      const res = await fetch(pingUrl);
      console.log(`[KeepAlive] Ping ${res.status} at ${new Date().toISOString()}`);
    } catch (err) {
      console.error(`[KeepAlive] Ping failed:`, err.message);
    }
  }, INTERVAL);

  console.log(`[KeepAlive] Pinging ${pingUrl} every 14 min`);
}
