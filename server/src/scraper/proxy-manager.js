import "dotenv/config";

const proxies = (process.env.PROXY_LIST || "")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

let currentIndex = 0;

export function getNextProxy() {
  if (proxies.length === 0) return null;
  const proxy = proxies[currentIndex];
  currentIndex = (currentIndex + 1) % proxies.length;
  return proxy;
}

export function getProxyCount() {
  return proxies.length;
}
