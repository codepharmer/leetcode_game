import { describe, expect, it } from "vitest";

import {
  calcLifetimePct,
  calcRoundPct,
  getMasteredCount,
  getWeakSpots,
  groupItemsByPattern,
  selectAccuracyTrend,
  selectIncorrectAttempts,
} from "./selectors";

describe("lib/selectors", () => {
  it("calculates round and lifetime percentages", () => {
    expect(calcRoundPct(7, 10)).toBe(70);
    expect(calcRoundPct(0, 0)).toBe(0);
    expect(calcLifetimePct({ totalCorrect: 8, totalAnswered: 10 })).toBe(80);
    expect(calcLifetimePct({ totalCorrect: 0, totalAnswered: 0 })).toBe(0);
  });

  it("finds weak spots sorted by ascending accuracy", () => {
    const items = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ];
    const history = {
      a: { correct: 1, wrong: 2 }, // 33%
      b: { correct: 2, wrong: 2 }, // 50%
      c: { correct: 3, wrong: 0 }, // 100%
    };

    const weak = getWeakSpots(items, history);
    expect(weak.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("counts mastered items", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const history = {
      a: { correct: 4, wrong: 0 },
      b: { correct: 1, wrong: 1 },
      c: { correct: 0, wrong: 2 },
    };
    expect(getMasteredCount(items, history)).toBe(1);
  });

  it("groups items by pattern with optional difficulty filter", () => {
    const items = [
      { id: "a", pattern: "DFS", difficulty: "Easy" },
      { id: "b", pattern: "DFS", difficulty: "Hard" },
      { id: "c", pattern: "BFS", difficulty: "Easy" },
    ];
    expect(Object.keys(groupItemsByPattern(items, "All")).sort()).toEqual(["BFS", "DFS"]);
    const easy = groupItemsByPattern(items, "Easy");
    expect(easy.DFS).toHaveLength(1);
    expect(easy.BFS).toHaveLength(1);
  });

  it("selects incorrect attempts newest-first with filters", () => {
    const meta = {
      attemptEvents: [
        { ts: 10, gameType: "question_to_pattern", itemId: "q1", chosen: "DFS", pattern: "Hash Map", correct: false },
        { ts: 20, gameType: "template_to_pattern", itemId: "tpl-1", chosen: "BFS", pattern: "Stack", correct: false },
        { ts: 30, gameType: "question_to_pattern", itemId: "q2", chosen: "Hash Map", pattern: "DFS", correct: true },
      ],
    };

    expect(selectIncorrectAttempts(meta).map((entry) => entry.itemId)).toEqual(["tpl-1", "q1"]);
    expect(selectIncorrectAttempts(meta, { gameType: "question_to_pattern" }).map((entry) => entry.itemId)).toEqual([
      "q1",
    ]);
    expect(selectIncorrectAttempts(meta, { limit: 1 })).toHaveLength(1);
  });

  it("builds sorted accuracy trend points from round snapshots", () => {
    const meta = {
      roundSnapshots: [
        { ts: 30, gameType: "question_to_pattern", answered: 10, correct: 8, pct: 80 },
        { ts: 10, gameType: "question_to_pattern", answered: 10, correct: 4, pct: 40 },
        { ts: 20, gameType: "template_to_pattern", answered: 10, correct: 6, pct: 60 },
      ],
    };

    expect(selectAccuracyTrend(meta, { gameType: "question_to_pattern" }).map((entry) => entry.ts)).toEqual([
      10,
      30,
    ]);
    expect(selectAccuracyTrend(meta).map((entry) => entry.pct)).toEqual([40, 60, 80]);
  });
});
