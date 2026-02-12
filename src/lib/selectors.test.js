import { describe, expect, it } from "vitest";

import { calcLifetimePct, calcRoundPct, getMasteredCount, getWeakSpots, groupItemsByPattern } from "./selectors";

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
});
