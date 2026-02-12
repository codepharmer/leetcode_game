import { describe, expect, it } from "vitest";

import { findDivergence, getCorrectTrace, runAllTests } from "./engine";
import { BLUEPRINT_LEVELS } from "./levels";

function toSlots(level, cards) {
  const slots = {};
  for (const slot of level.slots) slots[slot] = [];
  for (const card of cards) {
    if (!card?.correctSlot) continue;
    slots[card.correctSlot].push(card);
  }
  for (const slot of level.slots) {
    slots[slot].sort((a, b) => (a.correctOrder || 0) - (b.correctOrder || 0));
  }
  return slots;
}

describe("lib/blueprint/engine", () => {
  it("passes all tests for every level when using correct cards", () => {
    for (const level of BLUEPRINT_LEVELS) {
      const correctCards = level.cards.filter((card) => card.correctSlot);
      const slots = toSlots(level, correctCards);
      const results = runAllTests(level, slots);
      expect(results.every((result) => result.passed)).toBe(true);
    }
  });

  it("fails when required loop card is missing", () => {
    const level = BLUEPRINT_LEVELS[0];
    const cards = level.cards.filter((card) => card.correctSlot && card.key !== "for-right");
    const slots = toSlots(level, cards);
    const results = runAllTests(level, slots);
    expect(results.some((result) => result.error)).toBe(true);
    expect(results.some((result) => !result.passed)).toBe(true);
  });

  it("detects divergence from the expected trace", () => {
    const level = BLUEPRINT_LEVELS[2];
    const cards = level.cards.filter((card) => card.correctSlot && card.key !== "move-right");
    const wrongCard = { ...level.cards.find((card) => card.key === "move-right-wrong"), correctSlot: "check", correctOrder: 2 };
    const slots = toSlots(level, [...cards, wrongCard]);

    const playerTrace = runAllTests(level, slots)[0].trace;
    const correctTrace = getCorrectTrace(level).trace;
    const divergence = findDivergence(playerTrace, correctTrace);

    expect(divergence).toBeTruthy();
    expect(divergence.step).toBeGreaterThanOrEqual(0);
  });
});
