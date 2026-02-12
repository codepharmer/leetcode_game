import { describe, expect, it } from "vitest";

import { GAME_TYPES } from "./constants";
import {
  historyIsSubset,
  historyTotals,
  mergeHistoryMax,
  mergeProgressData,
  normalizeHistoryEntry,
  normalizeStats,
  statsEqual,
} from "./progressMerge";
import { createDefaultProgress } from "./progressModel";

describe("lib/progressMerge", () => {
  it("normalizes history entries and stats", () => {
    expect(normalizeHistoryEntry({ correct: -1, wrong: 3 })).toEqual({ correct: 0, wrong: 3 });
    expect(normalizeStats({ gamesPlayed: -1, totalCorrect: 3, totalAnswered: 4, bestStreak: -9 })).toEqual({
      gamesPlayed: 0,
      totalCorrect: 3,
      totalAnswered: 4,
      bestStreak: 0,
    });
  });

  it("checks subset and merges histories", () => {
    const a = { x: { correct: 1, wrong: 0 } };
    const b = { x: { correct: 1, wrong: 1 }, y: { correct: 2, wrong: 0 } };
    expect(historyIsSubset(a, b)).toBe(true);
    expect(historyIsSubset(b, a)).toBe(false);
    expect(mergeHistoryMax(a, b)).toEqual({
      x: { correct: 1, wrong: 1 },
      y: { correct: 2, wrong: 0 },
    });
    expect(historyTotals({ k: { correct: 2, wrong: 1 } })).toEqual({ totalCorrect: 2, totalAnswered: 3 });
  });

  it("compares stats equality", () => {
    expect(statsEqual({ gamesPlayed: 1 }, { gamesPlayed: 1 })).toBe(true);
    expect(statsEqual({ gamesPlayed: 1 }, { gamesPlayed: 2 })).toBe(false);
  });

  it("merges progress for both game types and flags remote writes", () => {
    const remote = createDefaultProgress();
    const local = createDefaultProgress();

    remote.byGameType[GAME_TYPES.QUESTION_TO_PATTERN] = {
      stats: { gamesPlayed: 1, totalCorrect: 3, totalAnswered: 4, bestStreak: 2 },
      history: { a: { correct: 1, wrong: 0 } },
    };
    local.byGameType[GAME_TYPES.QUESTION_TO_PATTERN] = {
      stats: { gamesPlayed: 2, totalCorrect: 5, totalAnswered: 6, bestStreak: 3 },
      history: { a: { correct: 1, wrong: 1 }, b: { correct: 2, wrong: 0 } },
      meta: {},
    };
    remote.byGameType[GAME_TYPES.BLUEPRINT_BUILDER].meta = { levelStars: { "1": 1 } };
    local.byGameType[GAME_TYPES.BLUEPRINT_BUILDER].meta = { levelStars: { "1": 2, "2": 3 } };

    const merged = mergeProgressData(remote, local);
    expect(merged.shouldWriteRemote).toBe(true);
    expect(merged.allLocalIsSubset).toBe(false);
    expect(merged.mergedProgress.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].history.b).toEqual({ correct: 2, wrong: 0 });
    expect(merged.mergedProgress.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].stats.gamesPlayed).toBe(2);
    expect(merged.mergedProgress.byGameType[GAME_TYPES.BLUEPRINT_BUILDER].meta.levelStars["1"]).toBe(2);
    expect(merged.mergedProgress.byGameType[GAME_TYPES.BLUEPRINT_BUILDER].meta.levelStars["2"]).toBe(3);
  });
});
