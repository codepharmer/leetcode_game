import { DEFAULT_STATS, STORAGE_KEY } from "./constants";

function getStorageAdapter() {
  if (typeof window === "undefined") {
    return {
      get: async () => ({ value: null }),
      set: async () => {},
    };
  }

  const w = window;

  // Supports environments that provide a KV-like async storage adapter (e.g., browser extensions).
  if (w.storage && typeof w.storage.get === "function" && typeof w.storage.set === "function") {
    return w.storage;
  }

  // Default web fallback.
  return {
    get: async (key) => ({ value: w.localStorage.getItem(key) }),
    set: async (key, value) => {
      w.localStorage.setItem(key, value);
    },
  };
}

export async function loadData() {
  const storage = getStorageAdapter();
  let stats = { ...DEFAULT_STATS };
  let history = {};

  try {
    const r = await storage.get(STORAGE_KEY);
    if (r && r.value) {
      const p = JSON.parse(r.value);
      stats = p.stats || stats;
      history = p.history || history;
    }
  } catch (e) {
    // ignore
  }

  return { stats, history };
}

export async function saveData(stats, history) {
  const storage = getStorageAdapter();
  try {
    await storage.set(STORAGE_KEY, JSON.stringify({ stats, history }));
  } catch (e) {
    // ignore
  }
}
