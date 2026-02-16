import { describe, expect, it } from "vitest";

import { GAME_TYPES } from "./constants";
import {
  MAX_ATTEMPT_EVENTS,
  MAX_ROUND_SNAPSHOTS,
  ONBOARDING_FLOWS,
  ONBOARDING_STATUS,
  ONBOARDING_TIP_KEYS,
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
    expect(progress.onboarding[ONBOARDING_FLOWS.GLOBAL]).toEqual({
      status: ONBOARDING_STATUS.NOT_STARTED,
      lastStep: -1,
    });
    expect(progress.onboarding.tips[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS]).toBe(false);
    expect(progress.onboarding.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP]).toBe(false);
    expect(progress.onboarding.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY]).toBe(false);
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
    expect(normalized.onboarding[ONBOARDING_FLOWS.GLOBAL].status).toBe(ONBOARDING_STATUS.NOT_STARTED);
  });

  it("normalizes onboarding status and tips", () => {
    const normalized = normalizeProgress({
      byGameType: {},
      onboarding: {
        [ONBOARDING_FLOWS.GLOBAL]: { status: ONBOARDING_STATUS.IN_PROGRESS, lastStep: 2 },
        [ONBOARDING_FLOWS.QUESTION_TO_PATTERN]: { status: "invalid", lastStep: "abc" },
        tips: {
          [ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS]: true,
          [ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP]: "yes",
          [ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY]: true,
        },
      },
    });

    expect(normalized.onboarding[ONBOARDING_FLOWS.GLOBAL]).toEqual({
      status: ONBOARDING_STATUS.IN_PROGRESS,
      lastStep: 2,
    });
    expect(normalized.onboarding[ONBOARDING_FLOWS.QUESTION_TO_PATTERN]).toEqual({
      status: ONBOARDING_STATUS.NOT_STARTED,
      lastStep: -1,
    });
    expect(normalized.onboarding.tips[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS]).toBe(true);
    expect(normalized.onboarding.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP]).toBe(false);
    expect(normalized.onboarding.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY]).toBe(true);
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

  it("normalizes and caps attempt events and round snapshots in meta", () => {
    const oversizedAttempts = Array.from({ length: MAX_ATTEMPT_EVENTS + 5 }, (_, index) => ({
      ts: index + 1,
      gameType: GAME_TYPES.QUESTION_TO_PATTERN,
      itemId: `q-${index + 1}`,
      chosen: "DFS",
      pattern: "Hash Map",
      correct: false,
    }));
    const oversizedSnapshots = Array.from({ length: MAX_ROUND_SNAPSHOTS + 5 }, (_, index) => ({
      ts: index + 1,
      gameType: GAME_TYPES.QUESTION_TO_PATTERN,
      answered: 10,
      correct: 7,
      pct: 70,
    }));

    const normalized = normalizeProgress({
      byGameType: {
        [GAME_TYPES.QUESTION_TO_PATTERN]: {
          stats: {},
          history: {},
          meta: {
            attemptEvents: oversizedAttempts,
            roundSnapshots: oversizedSnapshots,
            untouched: "value",
          },
        },
      },
    });

    const meta = normalized.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].meta;
    expect(meta.attemptEvents).toHaveLength(MAX_ATTEMPT_EVENTS);
    expect(meta.roundSnapshots).toHaveLength(MAX_ROUND_SNAPSHOTS);
    expect(meta.untouched).toBe("value");
    expect(meta.attemptEvents[0].itemId).toBe("q-6");
    expect(meta.roundSnapshots[0].ts).toBe(6);
  });
});
