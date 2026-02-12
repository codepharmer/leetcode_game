import { describe, expect, it } from "vitest";

import { BLUEPRINT_LEVELS } from "./levels";
import {
  BACKTRACKING_TEMPLATE_ID,
  DEFAULT_BLUEPRINT_TEMPLATE_ID,
  RECURSIVE_TOP_DOWN_TEMPLATE_ID,
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
});
