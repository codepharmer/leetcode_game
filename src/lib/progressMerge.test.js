import { describe, expect, it } from "vitest";

import { GAME_TYPES } from "./constants";
import {
  historyIsSubset,
  historyTotals,
  mergeHistoryMax,
  mergeOnboardingStatus,
  mergeProgressData,
  normalizeHistoryEntry,
  normalizeStats,
  statsEqual,
} from "./progressMerge";
import { ONBOARDING_FLOWS, ONBOARDING_STATUS, ONBOARDING_TIP_KEYS, createDefaultProgress } from "./progressModel";

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
    expect(mergeOnboardingStatus(ONBOARDING_STATUS.NOT_STARTED, ONBOARDING_STATUS.IN_PROGRESS)).toBe(
      ONBOARDING_STATUS.IN_PROGRESS
    );
    expect(mergeOnboardingStatus(ONBOARDING_STATUS.SKIPPED, ONBOARDING_STATUS.COMPLETED)).toBe(
      ONBOARDING_STATUS.COMPLETED
    );
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

  it("merges and deduplicates attempt events and round snapshots", () => {
    const remote = createDefaultProgress();
    const local = createDefaultProgress();
    remote.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].meta = {
      attemptEvents: [
        { ts: 100, gameType: GAME_TYPES.QUESTION_TO_PATTERN, itemId: "q1", chosen: "DFS", pattern: "Hash Map", correct: false },
      ],
      roundSnapshots: [{ ts: 100, gameType: GAME_TYPES.QUESTION_TO_PATTERN, answered: 10, correct: 6, pct: 60 }],
    };
    local.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].meta = {
      attemptEvents: [
        { ts: 100, gameType: GAME_TYPES.QUESTION_TO_PATTERN, itemId: "q1", chosen: "DFS", pattern: "Hash Map", correct: false },
        { ts: 120, gameType: GAME_TYPES.QUESTION_TO_PATTERN, itemId: "q2", chosen: "BFS", pattern: "DFS", correct: false },
      ],
      roundSnapshots: [
        { ts: 100, gameType: GAME_TYPES.QUESTION_TO_PATTERN, answered: 10, correct: 6, pct: 60 },
        { ts: 120, gameType: GAME_TYPES.QUESTION_TO_PATTERN, answered: 10, correct: 7, pct: 70 },
      ],
    };

    const merged = mergeProgressData(remote, local);
    const meta = merged.mergedProgress.byGameType[GAME_TYPES.QUESTION_TO_PATTERN].meta;

    expect(meta.attemptEvents).toHaveLength(2);
    expect(meta.roundSnapshots).toHaveLength(2);
    expect(meta.attemptEvents.map((entry) => entry.itemId)).toEqual(["q1", "q2"]);
    expect(meta.roundSnapshots.map((entry) => entry.pct)).toEqual([60, 70]);
  });

  it("merges onboarding status by precedence, maxes lastStep, and ORs tips", () => {
    const remote = createDefaultProgress();
    const local = createDefaultProgress();

    remote.onboarding[ONBOARDING_FLOWS.QUESTION_TO_PATTERN] = {
      status: ONBOARDING_STATUS.IN_PROGRESS,
      lastStep: 1,
    };
    local.onboarding[ONBOARDING_FLOWS.QUESTION_TO_PATTERN] = {
      status: ONBOARDING_STATUS.SKIPPED,
      lastStep: 3,
    };
    remote.onboarding[ONBOARDING_FLOWS.BLUEPRINT_BUILDER] = {
      status: ONBOARDING_STATUS.SKIPPED,
      lastStep: 0,
    };
    local.onboarding[ONBOARDING_FLOWS.BLUEPRINT_BUILDER] = {
      status: ONBOARDING_STATUS.COMPLETED,
      lastStep: 2,
    };
    local.onboarding.tips[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS] = true;
    remote.onboarding.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY] = true;

    const merged = mergeProgressData(remote, local);
    expect(merged.mergedProgress.onboarding[ONBOARDING_FLOWS.QUESTION_TO_PATTERN]).toEqual({
      status: ONBOARDING_STATUS.SKIPPED,
      lastStep: 3,
    });
    expect(merged.mergedProgress.onboarding[ONBOARDING_FLOWS.BLUEPRINT_BUILDER]).toEqual({
      status: ONBOARDING_STATUS.COMPLETED,
      lastStep: 2,
    });
    expect(merged.mergedProgress.onboarding.tips[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS]).toBe(true);
    expect(merged.mergedProgress.onboarding.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY]).toBe(true);
    expect(merged.shouldWriteRemote).toBe(true);
  });
});
