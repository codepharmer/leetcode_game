export function trackEvent(name, properties = {}) {
  const eventName = String(name || "").trim();
  if (!eventName) return;

  if (import.meta.env.DEV) {
    console.debug("[analytics]", eventName, properties);
  }

  const endpoint = String(import.meta.env.VITE_ANALYTICS_ENDPOINT || "").trim();
  if (!endpoint) return;

  const payload = {
    name: eventName,
    properties: properties && typeof properties === "object" ? properties : {},
    ts: Date.now(),
  };

  void fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
