import { describe, expect, it } from "vitest";

import { genChoices, genChoicesWithConfusions, shuffle } from "./utils";

describe("lib/utils", () => {
  it("shuffle keeps all elements", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it("genChoices includes correct answer with 4 options", () => {
    const allPatterns = ["A", "B", "C", "D", "E"];
    const out = genChoices("A", allPatterns);
    expect(out).toHaveLength(4);
    expect(new Set(out).size).toBe(4);
    expect(out).toContain("A");
  });

  it("genChoicesWithConfusions prioritizes confusion patterns then random fill", () => {
    const allPatterns = ["A", "B", "C", "D", "E", "F"];
    const confusionMap = {
      A: ["B", "C"],
    };
    const out = genChoicesWithConfusions("A", allPatterns, confusionMap);
    expect(out).toHaveLength(4);
    expect(out).toContain("A");
    expect(out).toContain("B");
    expect(out).toContain("C");
    expect(new Set(out).size).toBe(4);
  });

  it("genChoicesWithConfusions handles tiny pools", () => {
    const out = genChoicesWithConfusions("A", ["A", "B"], { A: ["B"] }, 4);
    expect(out.sort()).toEqual(["A", "B"]);
  });

  it("genChoicesWithConfusions ignores invalid confusions", () => {
    const out = genChoicesWithConfusions("A", ["A", "B", "C", "D"], { A: ["Z", "A"] }, 4);
    expect(out).toContain("A");
    expect(out).toHaveLength(4);
  });
});
