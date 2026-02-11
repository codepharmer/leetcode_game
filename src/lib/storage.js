import { STORAGE_KEY } from "./constants";
import { createDefaultProgress, normalizeProgress } from "./progressModel";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function getLocalStorageAdapter() {
  if (typeof window === "undefined") {
    return {
      kind: "local",
      get: async () => ({ value: null }),
      set: async () => {},
    };
  }

  const w = window;

  // Supports environments that provide a KV-like async storage adapter (e.g., browser extensions).
  if (w.storage && typeof w.storage.get === "function" && typeof w.storage.set === "function") {
    return { kind: "local", ...w.storage };
  }

  // Default web fallback.
  return {
    kind: "local",
    get: async (key) => ({ value: w.localStorage.getItem(key) }),
    set: async (key, value) => {
      w.localStorage.setItem(key, value);
    },
  };
}

function createApiStorageAdapter(credential) {
  const base = String(API_BASE_URL || "").replace(/\/+$/, "");
  return {
    kind: "api",
    get: async (key) => {
      const r = await fetch(`${base}/storage/${encodeURIComponent(key)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${credential}` },
      });
      if (!r.ok) {
        const e = new Error(`API GET failed (${r.status})`);
        e.status = r.status;
        throw e;
      }
      return await r.json();
    },
    set: async (key, value) => {
      const r = await fetch(`${base}/storage/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${credential}` },
        body: JSON.stringify({ value }),
      });
      if (!r.ok) {
        const e = new Error(`API PUT failed (${r.status})`);
        e.status = r.status;
        throw e;
      }
    },
  };
}

export function getStorageAdapter({ credential } = {}) {
  if (credential && API_BASE_URL) return createApiStorageAdapter(credential);
  return getLocalStorageAdapter();
}

export async function loadData(storage) {
  let progress = createDefaultProgress();
  let found = false;

  try {
    const r = await storage.get(STORAGE_KEY);
    if (r && r.value) {
      const payload = JSON.parse(r.value);
      progress = normalizeProgress(payload);
      found = true;
    }
  } catch (e) {
    // ignore
  }

  return { progress, found };
}

export async function saveData(storage, progress) {
  try {
    const normalized = normalizeProgress(progress);
    await storage.set(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    // ignore
  }
}
