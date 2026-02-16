import { SLIDING_WINDOW_TEMPLATE_ID, TWO_POINTERS_TEMPLATE_ID } from "../templates";
import { buildProblemIr } from "./problemIr";
import { createStrategiesFromProblemSpecs, makeProblemSpec } from "./problemStrategyBuilder";
import { irStep } from "./shared";

function solveQ11(input) {
  const height = Array.isArray(input?.height) ? input.height : [];
  let left = 0;
  let right = height.length - 1;
  let best = 0;
  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    if (area > best) best = area;
    if (height[left] <= height[right]) left += 1;
    else right -= 1;
  }
  return best;
}

function solveQ12(input) {
  const height = Array.isArray(input?.height) ? input.height : [];
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] <= height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left += 1;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right -= 1;
    }
  }
  return water;
}

function solveQ13(input) {
  const prices = Array.isArray(input?.prices) ? input.prices : [];
  let minPrice = Infinity;
  let best = 0;
  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    best = Math.max(best, price - minPrice);
  }
  return best;
}

function solveQ14(input) {
  const s = String(input?.s || "");
  const last = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    if (last.has(ch)) left = Math.max(left, last.get(ch) + 1);
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}

function solveQ15(input) {
  const s = String(input?.s || "");
  const k = Number(input?.k || 0);
  const freq = new Map();
  let left = 0;
  let best = 0;
  let maxCount = 0;
  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    const next = (freq.get(ch) || 0) + 1;
    freq.set(ch, next);
    maxCount = Math.max(maxCount, next);
    while (right - left + 1 - maxCount > k) {
      const leftCh = s[left];
      freq.set(leftCh, (freq.get(leftCh) || 1) - 1);
      left += 1;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}

function solveQ16(input) {
  const s = String(input?.s || "");
  const t = String(input?.t || "");
  if (!s || !t || t.length > s.length) return "";

  const need = new Map();
  for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);
  const have = new Map();
  const needKinds = need.size;
  let matchedKinds = 0;
  let left = 0;
  let bestStart = 0;
  let bestLen = Infinity;

  for (let right = 0; right < s.length; right += 1) {
    const ch = s[right];
    have.set(ch, (have.get(ch) || 0) + 1);
    if (need.has(ch) && have.get(ch) === need.get(ch)) matchedKinds += 1;

    while (matchedKinds === needKinds) {
      const len = right - left + 1;
      if (len < bestLen) {
        bestLen = len;
        bestStart = left;
      }
      const leftCh = s[left];
      have.set(leftCh, (have.get(leftCh) || 1) - 1);
      if (need.has(leftCh) && have.get(leftCh) < need.get(leftCh)) matchedKinds -= 1;
      left += 1;
    }
  }

  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}

const WORLD0_WAVE1_IR_OVERRIDES = Object.freeze({
  14: [
    irStep("bootstrap", "init-window-state", "const last = new Map(); let left = 0; let best = 0", "declare"),
    irStep("expand", "for-right", "for (let right = 0; right < s.length; right++)", "loop"),
    irStep(
      "shrink",
      "advance-left-on-duplicate",
      "const ch = s[right]; if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1",
      "update"
    ),
    irStep("window-check", "record-window", "last.set(ch, right); best = Math.max(best, right - left + 1)", "branch"),
    irStep("emit", "return-best", "return best", "return"),
  ],
});

export const WAVE_1_PROBLEM_SPECS = [
  makeProblemSpec({
    questionId: 11,
    questionName: "Container With Most Water",
    strategyId: "q-11-problem-specific",
    templateId: TWO_POINTERS_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, { height: [1, 1] }],
    randomTrials: 50,
    solve: solveQ11,
    snippetName: "Container With Most Water | Two pointers",
  }),
  makeProblemSpec({
    questionId: 12,
    questionName: "Trapping Rain Water",
    strategyId: "q-12-problem-specific",
    templateId: TWO_POINTERS_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] }, { height: [4, 2, 0, 3, 2, 5] }],
    randomTrials: 60,
    solve: solveQ12,
    snippetName: "Trapping Rain Water | Two pointers with side maxima",
  }),
  makeProblemSpec({
    questionId: 13,
    questionName: "Best Time to Buy and Sell Stock",
    strategyId: "q-13-problem-specific",
    templateId: SLIDING_WINDOW_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ prices: [7, 1, 5, 3, 6, 4] }, { prices: [7, 6, 4, 3, 1] }],
    randomTrials: 40,
    solve: solveQ13,
    snippetName: "Best Time to Buy and Sell Stock | Sliding min-price window",
  }),
  makeProblemSpec({
    questionId: 14,
    questionName: "Longest Substring Without Repeating Characters",
    strategyId: "q-14-problem-specific",
    templateId: SLIDING_WINDOW_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "abcabcbb" }, { s: "bbbbb" }, { s: "pwwkew" }],
    randomTrials: 50,
    solve: solveQ14,
    snippetName: "Longest Substring Without Repeating Characters | Variable window",
  }),
  makeProblemSpec({
    questionId: 15,
    questionName: "Longest Repeating Character Replacement",
    strategyId: "q-15-problem-specific",
    templateId: SLIDING_WINDOW_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1) alphabet" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "ABAB", k: 2 }, { s: "AABABBA", k: 1 }],
    randomTrials: 50,
    solve: solveQ15,
    snippetName: "Longest Repeating Character Replacement | Max-frequency window",
  }),
  makeProblemSpec({
    questionId: 16,
    questionName: "Minimum Window Substring",
    strategyId: "q-16-problem-specific",
    templateId: SLIDING_WINDOW_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "ADOBECODEBANC", t: "ABC" }, { s: "a", t: "a" }, { s: "a", t: "aa" }],
    randomTrials: 60,
    solve: solveQ16,
    snippetName: "Minimum Window Substring | Need/have counts",
  }),
].map((spec) => ({
  ...spec,
  ir: WORLD0_WAVE1_IR_OVERRIDES[spec.questionId] || buildProblemIr(spec.templateId, spec.questionName, spec.solve),
}));

export function createWave1Strategies() {
  return createStrategiesFromProblemSpecs(WAVE_1_PROBLEM_SPECS);
}
