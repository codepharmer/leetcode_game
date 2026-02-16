import { beforeEach, describe, expect, it } from "vitest";

import {
  ROUND_SESSION_SCHEMA_VERSION,
  clearRoundSession,
  loadRoundSession,
  loadRoundSessionForGameType,
  saveRoundSession,
} from "./roundSession";

const STORAGE_KEY = "lc-pattern-round-session-v1";

describe("lib/roundSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("dual-writes snapshots to localStorage and sessionStorage with metadata", () => {
    saveRoundSession({ gameType: "question_to_pattern", roundItems: [{ id: "q1" }] });

    const local = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const session = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));

    expect(local.gameType).toBe("question_to_pattern");
    expect(session.gameType).toBe("question_to_pattern");
    expect(local.savedAt).toEqual(expect.any(Number));
    expect(local.schemaVersion).toBe(ROUND_SESSION_SCHEMA_VERSION);
  });

  it("loads from localStorage first and falls back to sessionStorage", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gameType: "question_to_pattern", roundItems: [{ id: "local" }], savedAt: 20, schemaVersion: 2 })
    );
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gameType: "question_to_pattern", roundItems: [{ id: "session" }], savedAt: 10, schemaVersion: 2 })
    );

    expect(loadRoundSession()?.roundItems?.[0]?.id).toBe("local");

    window.localStorage.removeItem(STORAGE_KEY);
    expect(loadRoundSession()?.roundItems?.[0]?.id).toBe("session");
  });

  it("returns deterministic key and state by game type", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gameType: "template_to_pattern", roundItems: [{ id: "tpl-1" }], savedAt: 123, schemaVersion: 2 })
    );

    expect(loadRoundSessionForGameType("template_to_pattern")).toEqual({
      key: "template_to_pattern:123",
      state: expect.objectContaining({ gameType: "template_to_pattern" }),
    });

    expect(loadRoundSessionForGameType("question_to_pattern")).toEqual({
      key: "question_to_pattern:none",
      state: null,
    });
  });

  it("keeps backward compatibility with legacy snapshots", () => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gameType: "question_to_pattern", roundItems: [{ id: "q1" }], savedAt: 7 })
    );

    const loaded = loadRoundSession();
    expect(loaded?.savedAt).toBe(7);
    expect(loaded?.schemaVersion).toBe(1);
  });

  it("clears both local and session stores", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameType: "question_to_pattern" }));
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ gameType: "question_to_pattern" }));

    clearRoundSession();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
