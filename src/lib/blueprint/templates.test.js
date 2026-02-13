import { describe, expect, it } from "vitest";

import { BLUEPRINT_LEVELS } from "./levels";
import {
  ARRAY_HASHING_TEMPLATE_ID,
  BACKTRACKING_TEMPLATE_ID,
  BINARY_SEARCH_TEMPLATE_ID,
  DEFAULT_BLUEPRINT_TEMPLATE_ID,
  DP_STATE_TEMPLATE_ID,
  INTERVAL_GREEDY_TEMPLATE_ID,
  LINKED_LIST_TEMPLATE_ID,
  RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  SLIDING_WINDOW_TEMPLATE_ID,
  STACK_HEAP_TEMPLATE_ID,
  TREE_GRAPH_TEMPLATE_ID,
  TWO_POINTERS_TEMPLATE_ID,
  getBlueprintTemplate,
  getTemplateSlotIds,
} from "./templates";

describe("lib/blueprint/templates", () => {
  it("resolves standard template and fallback behavior", () => {
    const standard = getBlueprintTemplate(DEFAULT_BLUEPRINT_TEMPLATE_ID);
    const fallback = getBlueprintTemplate("unknown-template");
    expect(standard.id).toBe(DEFAULT_BLUEPRINT_TEMPLATE_ID);
    expect(fallback.id).toBe(DEFAULT_BLUEPRINT_TEMPLATE_ID);
    expect(getTemplateSlotIds(DEFAULT_BLUEPRINT_TEMPLATE_ID)).toEqual(standard.slots.map((slot) => slot.id));
  });

  it("materializes level slots from the assigned template", () => {
    for (const level of BLUEPRINT_LEVELS) {
      const expected = getTemplateSlotIds(level.templateId);
      expect(level.slots).toEqual(expected);
    }
  });

  it("defines the backtracking slot template", () => {
    expect(getTemplateSlotIds(BACKTRACKING_TEMPLATE_ID)).toEqual([
      "choose",
      "constrain",
      "base",
      "explore",
      "return",
    ]);

    const backtracking = getBlueprintTemplate(BACKTRACKING_TEMPLATE_ID);
    expect(backtracking.slots.find((slot) => slot.id === "constrain")?.desc).toContain("pruning");
  });

  it("defines the recursive top-down slot template", () => {
    expect(getTemplateSlotIds(RECURSIVE_TOP_DOWN_TEMPLATE_ID)).toEqual([
      "base",
      "choose",
      "constrain",
      "explore",
      "combine",
    ]);

    const recursive = getBlueprintTemplate(RECURSIVE_TOP_DOWN_TEMPLATE_ID);
    expect(recursive.slots.find((slot) => slot.id === "combine")?.desc).toContain("subresults");
  });

  it("defines specialized pattern templates beyond the universal flow", () => {
    expect(getTemplateSlotIds(ARRAY_HASHING_TEMPLATE_ID)).toEqual(["seed", "scan", "record", "match", "emit"]);
    expect(getTemplateSlotIds(TWO_POINTERS_TEMPLATE_ID)).toEqual(["anchors", "converge", "shift", "compare", "emit"]);
    expect(getTemplateSlotIds(SLIDING_WINDOW_TEMPLATE_ID)).toEqual(["bootstrap", "expand", "shrink", "window-check", "emit"]);
    expect(getTemplateSlotIds(STACK_HEAP_TEMPLATE_ID)).toEqual(["init-structure", "iterate", "push-pop", "resolve", "emit"]);
    expect(getTemplateSlotIds(BINARY_SEARCH_TEMPLATE_ID)).toEqual(["bounds", "halve", "move-bounds", "mid-check", "emit"]);
    expect(getTemplateSlotIds(LINKED_LIST_TEMPLATE_ID)).toEqual(["anchors", "walk", "relink", "guard", "emit"]);
    expect(getTemplateSlotIds(INTERVAL_GREEDY_TEMPLATE_ID)).toEqual(["order", "sweep", "commit", "overlap", "emit"]);
    expect(getTemplateSlotIds(TREE_GRAPH_TEMPLATE_ID)).toEqual(["base-case", "branch", "prune", "traverse", "aggregate"]);
    expect(getTemplateSlotIds(DP_STATE_TEMPLATE_ID)).toEqual(["base-state", "subproblem", "state-guard", "transition", "memoize"]);
  });
});
