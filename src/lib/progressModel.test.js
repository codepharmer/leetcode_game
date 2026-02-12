import { describe, expect, it } from "vitest";

import { GAME_TYPES } from "./constants";
import {
  createDefaultProgress,
  createEmptyModeProgress,
  getModeProgress,
  normalizeProgress,
  setModeProgress,
} from "./progressModel";

describe("lib/progressModel", () => {
  it("creates default structure for all game types", () => {
    const progress = createDefaultProgress();
    expect(progress.version).toBe(2);
    expect(progress.byGameType[GAME_TYPES.QUESTION_TO_PATTERN]).toEqual(createEmptyModeProgress());
    expect(progress.byGameType[GAME_TYPES.TEMPLATE_TO_PATTERN]).toEqual(createEmptyModeProgress());
    expect(progress.byGameType[GAME_TYPES.BLUEPRINT_BUILDER]).toEqual(createEmptyModeProgress());
  });

  it("normalizes legacy payload to question mode", () => {
    const normalized = normalizeProgress({
      stats: { gamesPlayed: 2, totalCorrect: 5, totalAnswered: 10, bestStreak: 3 },
      history: { a: { correct: 2, wrong: 1 }, b: { correct: -2, wrong: 0 } },
    });
    expect(normalized.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].stats.gamesPlayed).toBe(2);
    expect(normalized.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].history.a).toEqual({ correct: 2, wrong: 1 });
    expect(normalized.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].history.b).toBeUndefined();
  });

  it("normalizes v2 payload safely", () => {
    const normalized = normalizeProgress({
      byGameType: {
        [GAME_TYPES.QUESTION_TO_PATTERN]: {
          stats: { gamesPlayed: -1, totalCorrect: 3, totalAnswered: 7, bestStreak: 2 },
          history: { x: { correct: 1, wrong: 2 } },
        },
      },
    });
    expect(normalized.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].stats.gamesPlayed).toBe(0);
    expect(normalized.byGameType[GAME_TYPES.TEMPLATE_TO_PATTERN].stats.gamesPlayed).toBe(0);
  });

  it("gets and sets per-mode progress", () => {
    const base = createDefaultProgress();
    const updated = setModeProgress(base, GAME_TYPES.TEMPLATE_TO_PATTERN, {
      stats: { gamesPlayed: 1, totalCorrect: 4, totalAnswered: 5, bestStreak: 4 },
      history: { t1: { correct: 2, wrong: 0 } },
      meta: { note: "ok" },
    });
    expect(getModeProgress(updated, GAME_TYPES.TEMPLATE_TO_PATTERN).stats.gamesPlayed).toBe(1);
    expect(getModeProgress(updated, GAME_TYPES.TEMPLATE_TO_PATTERN).history.t1).toEqual({ correct: 2, wrong: 0 });
    expect(getModeProgress(updated, GAME_TYPES.TEMPLATE_TO_PATTERN).meta.note).toBe("ok");
  });
});
