import { describe, expect, it } from "vitest";

import { compareByOutputMode, validTopologicalOrder } from "./comparators";

describe("lib/blueprint/strategies/comparators", () => {
  it("supports linked-list equivalence", () => {
    const listA = { val: 1, next: { val: 2, next: { val: 3, next: null } } };
    const listB = [1, 2, 3];
    expect(compareByOutputMode({ mode: "linked-list-equivalent", got: listA, expected: listB })).toBe(true);
  });

  it("supports tree structure equivalence", () => {
    const treeA = { val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } };
    const treeB = [1, 2, 3];
    expect(compareByOutputMode({ mode: "tree-structure-equivalent", got: treeA, expected: treeB })).toBe(true);
  });

  it("validates topological order", () => {
    const input = {
      numCourses: 4,
      prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]],
    };
    expect(validTopologicalOrder(input, [0, 1, 2, 3])).toBe(true);
    expect(validTopologicalOrder(input, [1, 0, 2, 3])).toBe(false);
  });

  it("rejects linked-list false positives with truncated structure", () => {
    const listA = { val: 1, next: { val: 2, next: null } };
    const expected = [1, 2, 3];
    expect(compareByOutputMode({ mode: "linked-list-equivalent", got: listA, expected })).toBe(false);
  });

  it("rejects tree false positives when shape differs", () => {
    const treeA = { val: 1, left: null, right: { val: 2, left: null, right: null } };
    const treeB = [1, 2];
    expect(compareByOutputMode({ mode: "tree-structure-equivalent", got: treeA, expected: treeB })).toBe(false);
  });

  it("rejects invalid topological outputs with duplicate nodes", () => {
    const input = {
      numCourses: 3,
      prerequisites: [[1, 0], [2, 1]],
    };
    expect(validTopologicalOrder(input, [0, 1, 1])).toBe(false);
    expect(validTopologicalOrder(input, [0, 1])).toBe(false);
  });
});
