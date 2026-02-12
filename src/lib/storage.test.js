import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_TYPES } from "./constants";

describe("lib/storage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses local adapter and reads/writes progress", async () => {
    const { getStorageAdapter, loadData, saveData } = await import("./storage");
    const storage = getStorageAdapter();
    expect(storage.kind).toBe("local");

    const empty = await loadData(storage);
    expect(empty.found).toBe(false);
    expect(empty.progress.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].stats.gamesPlayed).toBe(0);

    const progress = {
      version: 2,
      byGameType: {
        [GAME_TYPES.QUESTION_TO_PATTERN]: {
          stats: { gamesPlayed: 1, totalCorrect: 1, totalAnswered: 1, bestStreak: 1 },
          history: { q1: { correct: 1, wrong: 0 } },
        },
        [GAME_TYPES.TEMPLATE_TO_PATTERN]: {
          stats: { gamesPlayed: 0, totalCorrect: 0, totalAnswered: 0, bestStreak: 0 },
          history: {},
        },
      },
    };

    await saveData(storage, progress);
    const loaded = await loadData(storage);
    expect(loaded.found).toBe(true);
    expect(loaded.progress.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].history.q1).toEqual({ correct: 1, wrong: 0 });
  });

  it("prefers window.storage adapter when present", async () => {
    window.storage = {
      get: vi.fn(async () => ({ value: null })),
      set: vi.fn(async () => {}),
    };

    const { getStorageAdapter } = await import("./storage");
    const storage = getStorageAdapter();
    expect(storage.kind).toBe("local");
    await storage.get("x");
    expect(window.storage.get).toHaveBeenCalled();

    delete window.storage;
  });

  it("loads gracefully when storage throws or payload is invalid", async () => {
    const { loadData } = await import("./storage");
    const storage = {
      get: vi.fn(async () => {
        throw new Error("fail");
      }),
    };
    const out = await loadData(storage);
    expect(out.found).toBe(false);
    expect(out.progress.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].stats.gamesPlayed).toBe(0);
  });

  it("uses API adapter when credential and env base url are present", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.resetModules();
    const fetchMock = vi.fn(async (url, init) => {
      if (init.method === "GET") return { ok: true, json: async () => ({ value: null }) };
      return { ok: true };
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getStorageAdapter } = await import("./storage");
    const storage = getStorageAdapter({ credential: "abc" });
    expect(storage.kind).toBe("api");
    await storage.get("k1");
    await storage.set("k2", "v2");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/storage/k1",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/storage/k2",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("throws when API adapter receives non-ok response", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
      }))
    );

    const { getStorageAdapter } = await import("./storage");
    const storage = getStorageAdapter({ credential: "abc" });
    await expect(storage.get("k")).rejects.toMatchObject({ status: 500 });
    await expect(storage.set("k", "v")).rejects.toMatchObject({ status: 500 });
  });
});
