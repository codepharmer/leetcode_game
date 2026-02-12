import { QUESTIONS } from "../questions";
import {
  BACKTRACKING_TEMPLATE_ID,
  DEFAULT_BLUEPRINT_TEMPLATE_ID,
  RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  getTemplateSlotIds,
} from "./templates";

const BASE_BLUEPRINT_LEVELS = [
  {
    id: 1,
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    title: "Maximum Window Sum",
    pattern: "Fixed Sliding Window",
    difficulty: "Tutorial",
    description: "Find the maximum sum of any contiguous subarray of exactly size k.",
    example: "nums = [2, 1, 5, 1, 3, 2], k = 3 => 9",
    hints: true,
    slotLimits: { loop: 1, return: 1 },
    cards: [
      { id: "1-c1", text: "let left = 0", correctSlot: "setup", correctOrder: 0, key: "init-left", hint: "Setup" },
      { id: "1-c2", text: "let windowSum = 0", correctSlot: "setup", correctOrder: 1, key: "init-sum", hint: "Setup" },
      { id: "1-c3", text: "let maxSum = -Infinity", correctSlot: "setup", correctOrder: 2, key: "init-max", hint: "Setup" },
      { id: "1-c4", text: "for right = 0 .. end", correctSlot: "loop", correctOrder: 0, key: "for-right", hint: "Loop" },
      { id: "1-c5", text: "windowSum += nums[right]", correctSlot: "update", correctOrder: 0, key: "add-right", hint: "Update" },
      {
        id: "1-c6",
        text: "if window > k:\n  windowSum -= nums[left]\n  left++",
        correctSlot: "check",
        correctOrder: 0,
        key: "shrink",
        hint: "Check",
      },
      {
        id: "1-c7",
        text: "if window == k:\n  maxSum = max(maxSum, windowSum)",
        correctSlot: "check",
        correctOrder: 1,
        key: "update-max",
        hint: "Check",
      },
      { id: "1-c8", text: "return maxSum", correctSlot: "return", correctOrder: 0, key: "ret-max", hint: "Return" },
      { id: "1-d1", text: "let right = nums.length - 1", correctSlot: null, key: "init-right-end", isDistractor: true },
      { id: "1-d2", text: "windowSum -= nums[right]", correctSlot: null, key: "sub-right", isDistractor: true },
    ],
    testCases: [
      { input: { nums: [2, 1, 5, 1, 3, 2], k: 3 }, expected: 9 },
      { input: { nums: [1, 4, 2, 10, 23, 3, 1, 0, 20], k: 4 }, expected: 39 },
      { input: { nums: [5, 5, 5, 5], k: 2 }, expected: 10 },
    ],
  },
  {
    id: 2,
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    title: "Longest Unique Substring",
    pattern: "Variable Sliding Window",
    difficulty: "Practice",
    description: "Find the length of the longest substring without repeating characters.",
    example: 's = "abcabcbb" => 3',
    hints: false,
    slotLimits: { loop: 1, return: 1 },
    cards: [
      { id: "2-c1", text: "let left = 0", correctSlot: "setup", correctOrder: 0, key: "init-left" },
      { id: "2-c2", text: "let maxLen = 0", correctSlot: "setup", correctOrder: 1, key: "init-maxlen" },
      { id: "2-c3", text: "let seen = new Set()", correctSlot: "setup", correctOrder: 2, key: "init-seen" },
      { id: "2-c4", text: "for right = 0 .. end", correctSlot: "loop", correctOrder: 0, key: "for-right" },
      {
        id: "2-c5",
        text: "while seen has s[right]:\n  remove s[left], left++",
        correctSlot: "update",
        correctOrder: 0,
        key: "shrink-dup",
      },
      { id: "2-c6", text: "add s[right] to seen", correctSlot: "update", correctOrder: 1, key: "add-seen" },
      {
        id: "2-c7",
        text: "maxLen = max(maxLen,\n  right - left + 1)",
        correctSlot: "check",
        correctOrder: 0,
        key: "update-maxlen",
      },
      { id: "2-c8", text: "return maxLen", correctSlot: "return", correctOrder: 0, key: "ret-maxlen" },
      { id: "2-d1", text: "let maxLen = -Infinity", correctSlot: null, key: "init-maxlen-wrong", isDistractor: true },
      { id: "2-d2", text: "remove s[right] from seen", correctSlot: null, key: "remove-right", isDistractor: true },
      { id: "2-d3", text: "maxLen = right - left", correctSlot: null, key: "maxlen-off1", isDistractor: true },
    ],
    testCases: [
      { input: { s: "abcabcbb" }, expected: 3 },
      { input: { s: "bbbbb" }, expected: 1 },
      { input: { s: "pwwkew" }, expected: 3 },
      { input: { s: "abcdef" }, expected: 6 },
    ],
  },
  {
    id: 3,
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    title: "Pair With Target Sum",
    pattern: "Two Pointers",
    difficulty: "Boss",
    description: "Given a sorted array, find two numbers that add up to a target. Return their indices.",
    example: "nums = [1, 3, 5, 7, 11], target = 10 => [1, 3]",
    hints: false,
    slotLimits: { loop: 1, return: 1 },
    cards: [
      { id: "3-c1", text: "let left = 0", correctSlot: "setup", correctOrder: 0, key: "init-left" },
      { id: "3-c2", text: "let right = nums.length - 1", correctSlot: "setup", correctOrder: 1, key: "init-right-end" },
      { id: "3-c3", text: "while left < right", correctSlot: "loop", correctOrder: 0, key: "while-lt" },
      {
        id: "3-c4",
        text: "let sum = nums[left]\n         + nums[right]",
        correctSlot: "update",
        correctOrder: 0,
        key: "calc-sum",
      },
      { id: "3-c5", text: "if sum === target:\n  return [left, right]", correctSlot: "check", correctOrder: 0, key: "found" },
      { id: "3-c6", text: "if sum < target: left++", correctSlot: "check", correctOrder: 1, key: "move-left" },
      { id: "3-c7", text: "if sum > target: right--", correctSlot: "check", correctOrder: 2, key: "move-right" },
      { id: "3-c8", text: "return [-1, -1]", correctSlot: "return", correctOrder: 0, key: "ret-notfound" },
      { id: "3-d1", text: "let left = 1", correctSlot: null, key: "init-left-1", isDistractor: true },
      { id: "3-d2", text: "if sum < target: right--", correctSlot: null, key: "move-right-wrong", isDistractor: true },
      { id: "3-d3", text: "while left <= right", correctSlot: null, key: "while-lte", isDistractor: true },
    ],
    testCases: [
      { input: { nums: [1, 3, 5, 7, 11], target: 10 }, expected: [1, 3] },
      { input: { nums: [2, 4, 6, 8, 10], target: 14 }, expected: [1, 4] },
      { input: { nums: [1, 2, 3, 9], target: 8 }, expected: [-1, -1] },
    ],
  },
];

const BACKTRACKING_PATTERNS = new Set(["Backtracking", "Trie + Backtracking"]);

const RECURSIVE_TOP_DOWN_PATTERNS = new Set([
  "DFS",
  "BFS",
  "DFS / BFS",
  "BFS / DFS",
  "DFS (Inorder)",
  "DFS + Hash Map",
  "Dynamic Programming",
  "DP + Binary Search (Patience Sorting)",
  "BST Property / Binary Search",
  "Topological Sort",
  "Union Find / DFS",
]);

function pickTemplateId(pattern) {
  if (BACKTRACKING_PATTERNS.has(pattern)) return BACKTRACKING_TEMPLATE_ID;
  if (RECURSIVE_TOP_DOWN_PATTERNS.has(pattern)) return RECURSIVE_TOP_DOWN_TEMPLATE_ID;
  return DEFAULT_BLUEPRINT_TEMPLATE_ID;
}

function buildStandardCards(levelId) {
  return [
    {
      id: `${levelId}-c1`,
      text: "initialize core state",
      correctSlot: "setup",
      correctOrder: 0,
      key: "std-setup-state",
      hint: "Setup",
    },
    {
      id: `${levelId}-c2`,
      text: "initialize best answer",
      correctSlot: "setup",
      correctOrder: 1,
      key: "std-setup-best",
      hint: "Setup",
    },
    {
      id: `${levelId}-c3`,
      text: "iterate through candidates",
      correctSlot: "loop",
      correctOrder: 0,
      key: "std-loop-iterate",
      hint: "Loop",
    },
    {
      id: `${levelId}-c4`,
      text: "update running state",
      correctSlot: "update",
      correctOrder: 0,
      key: "std-update-state",
      hint: "Update",
    },
    {
      id: `${levelId}-c5`,
      text: "check invariant / improve answer",
      correctSlot: "check",
      correctOrder: 0,
      key: "std-check-answer",
      hint: "Check",
    },
    {
      id: `${levelId}-c6`,
      text: "return the best answer",
      correctSlot: "return",
      correctOrder: 0,
      key: "std-return-answer",
      hint: "Return",
    },
  ];
}

function buildBacktrackingCards(levelId) {
  return [
    {
      id: `${levelId}-c1`,
      text: "generate next choices",
      correctSlot: "choose",
      correctOrder: 0,
      key: "bt-choose-options",
      hint: "Choose",
    },
    {
      id: `${levelId}-c2`,
      text: "prune invalid choices",
      correctSlot: "constrain",
      correctOrder: 0,
      key: "bt-constrain-prune",
      hint: "Constrain",
    },
    {
      id: `${levelId}-c3`,
      text: "if complete solution: record it",
      correctSlot: "base",
      correctOrder: 0,
      key: "bt-base-record",
      hint: "Base",
    },
    {
      id: `${levelId}-c4`,
      text: "choose -> recurse -> unchoose",
      correctSlot: "explore",
      correctOrder: 0,
      key: "bt-explore-recurse",
      hint: "Explore",
    },
    {
      id: `${levelId}-c5`,
      text: "return collected results",
      correctSlot: "return",
      correctOrder: 0,
      key: "bt-return-results",
      hint: "Return",
    },
  ];
}

function buildRecursiveTopDownCards(levelId) {
  return [
    {
      id: `${levelId}-c1`,
      text: "handle base case / memo hit",
      correctSlot: "base",
      correctOrder: 0,
      key: "rt-base-case",
      hint: "Base",
    },
    {
      id: `${levelId}-c2`,
      text: "select branches / subproblems",
      correctSlot: "choose",
      correctOrder: 0,
      key: "rt-choose-branches",
      hint: "Choose",
    },
    {
      id: `${levelId}-c3`,
      text: "prune invalid branch",
      correctSlot: "constrain",
      correctOrder: 0,
      key: "rt-constrain-prune",
      hint: "Constrain",
    },
    {
      id: `${levelId}-c4`,
      text: "recurse into next state",
      correctSlot: "explore",
      correctOrder: 0,
      key: "rt-explore-recurse",
      hint: "Explore",
    },
    {
      id: `${levelId}-c5`,
      text: "combine child results",
      correctSlot: "combine",
      correctOrder: 0,
      key: "rt-combine-results",
      hint: "Combine",
    },
  ];
}

function buildCardsForTemplate(levelId, templateId) {
  if (templateId === BACKTRACKING_TEMPLATE_ID) return buildBacktrackingCards(levelId);
  if (templateId === RECURSIVE_TOP_DOWN_TEMPLATE_ID) return buildRecursiveTopDownCards(levelId);
  return buildStandardCards(levelId);
}

function buildSlotLimits(cards) {
  const limits = {};
  for (const card of cards) {
    if (!card.correctSlot) continue;
    limits[card.correctSlot] = (limits[card.correctSlot] || 0) + 1;
  }
  return limits;
}

function buildExpectedSignature(templateId, cards) {
  const slots = getTemplateSlotIds(templateId);
  const bySlot = {};
  for (const slotId of slots) bySlot[slotId] = [];

  for (const card of cards.filter((item) => item.correctSlot)) {
    bySlot[card.correctSlot].push(card);
  }

  for (const slotId of slots) {
    bySlot[slotId].sort((a, b) => (a.correctOrder || 0) - (b.correctOrder || 0));
  }

  return slots.map((slotId) => `${slotId}:${bySlot[slotId].map((card) => card.key).join(">")}`).join("|");
}

function summarizeDescription(desc) {
  if (!desc) return "Assemble the canonical solution flow.";
  const first = String(desc).split(". ")[0]?.trim() || "";
  if (!first) return "Assemble the canonical solution flow.";
  return first.endsWith(".") ? first : `${first}.`;
}

const AUTO_BLUEPRINT_LEVELS = QUESTIONS.map((question) => {
  const levelId = `q-${question.id}`;
  const templateId = pickTemplateId(question.pattern);
  const cards = buildCardsForTemplate(levelId, templateId);

  return {
    id: levelId,
    templateId,
    title: question.name,
    pattern: question.pattern,
    difficulty: question.difficulty || "Medium",
    description: summarizeDescription(question.desc),
    example: `Pattern: ${question.pattern}`,
    hints: false,
    slotLimits: buildSlotLimits(cards),
    cards,
    testCases: [{ input: {}, expected: buildExpectedSignature(templateId, cards) }],
  };
});

const ALL_BLUEPRINT_LEVELS = [...BASE_BLUEPRINT_LEVELS, ...AUTO_BLUEPRINT_LEVELS];

export const BLUEPRINT_LEVELS = ALL_BLUEPRINT_LEVELS.map((level) => ({
  ...level,
  slots: level.slots || getTemplateSlotIds(level.templateId),
}));
