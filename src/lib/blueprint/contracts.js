import { QUESTIONS } from "../questions";
import { getQuestionBlueprintProfile } from "./taxonomy";
import { solveSemanticProbe } from "./strategies/shared";

function makeContract({
  id,
  questionId,
  strategyId,
  complexity,
  deterministicCases,
  randomTrials,
  constraints,
}) {
  return {
    id,
    questionId,
    strategyId,
    complexity: complexity || {},
    deterministicCases: deterministicCases || [],
    randomTrials: Number(randomTrials || 0),
    constraints: constraints || {},
  };
}

function seedProbeCase(questionId, variant = 0) {
  const base = questionId * 13 + variant * 7;
  const input = {
    left: (base % 31) - 15,
    right: ((base * 3) % 27) - 13,
    text: `q-${questionId}-v-${variant}`,
  };
  return {
    input,
    expected: solveSemanticProbe(input),
  };
}

function defaultDeterministicCases(questionId) {
  return [seedProbeCase(questionId, 0), seedProbeCase(questionId, 1)];
}

const RANDOM_TRIALS_BY_DIFFICULTY = {
  Easy: 40,
  Medium: 60,
  Hard: 80,
  Tutorial: 30,
  Practice: 40,
  Boss: 80,
};

const OUTPUT_MODE_BY_QUESTION_ID = {
  4: "unordered-nested-members",
  5: "unordered-number-members",
  10: "unordered-triplets",
  27: "linked-list-equivalent",
  28: "linked-list-equivalent",
  30: "linked-list-equivalent",
  31: "linked-list-equivalent",
  32: "linked-list-equivalent",
  41: "tree-structure-equivalent",
  43: "tree-structure-equivalent",
  58: "topological-order",
};

const DISALLOW_TOKENS_BY_QUESTION_ID = {
  5: [".sort("],
  6: ["/"],
};

function defaultContract(question) {
  const profile = getQuestionBlueprintProfile(question);
  const outputMode = OUTPUT_MODE_BY_QUESTION_ID[question.id];
  const disallowTokens = DISALLOW_TOKENS_BY_QUESTION_ID[question.id];

  return makeContract({
    id: `question-${question.id}-contract`,
    questionId: question.id,
    strategyId: profile.strategyId,
    complexity: {
      time: "pattern-dependent",
      space: "pattern-dependent",
    },
    deterministicCases: defaultDeterministicCases(question.id),
    randomTrials: RANDOM_TRIALS_BY_DIFFICULTY[question.difficulty] || 40,
    constraints: {
      outputMode: outputMode || "normalized",
      disallowTokens: disallowTokens || [],
    },
  });
}

const FIRST_TEN_CONTRACTS = [
  makeContract({
    id: "two-sum-contract",
    questionId: 1,
    strategyId: "two-sum-hash-map",
    complexity: { time: "O(n)", space: "O(n)" },
    deterministicCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
      { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected: [2, 4] },
    ],
    randomTrials: 120,
    constraints: { outputMode: "normalized" },
  }),
  makeContract({
    id: "valid-anagram-contract",
    questionId: 2,
    strategyId: "valid-anagram-frequency",
    complexity: { time: "O(n)", space: "O(1) to O(n)" },
    deterministicCases: [
      { input: { s: "anagram", t: "nagaram" }, expected: true },
      { input: { s: "rat", t: "car" }, expected: false },
      { input: { s: "", t: "" }, expected: true },
      { input: { s: "aacc", t: "ccac" }, expected: false },
      { input: { s: "listen", t: "silent" }, expected: true },
    ],
    randomTrials: 120,
    constraints: { outputMode: "normalized" },
  }),
  makeContract({
    id: "contains-duplicate-contract",
    questionId: 3,
    strategyId: "contains-duplicate-set",
    complexity: { time: "O(n)", space: "O(n)" },
    deterministicCases: [
      { input: { nums: [1, 2, 3, 1] }, expected: true },
      { input: { nums: [1, 2, 3, 4] }, expected: false },
      { input: { nums: [] }, expected: false },
      { input: { nums: [0, 0] }, expected: true },
      { input: { nums: [-1, -2, -3] }, expected: false },
    ],
    randomTrials: 120,
    constraints: { outputMode: "normalized" },
  }),
  makeContract({
    id: "group-anagrams-contract",
    questionId: 4,
    strategyId: "group-anagrams-signature",
    complexity: { time: "O(n*k)", space: "O(n*k)" },
    deterministicCases: [
      {
        input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] },
        expected: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]],
      },
      { input: { strs: [""] }, expected: [[""]] },
      { input: { strs: ["a"] }, expected: [["a"]] },
      {
        input: { strs: ["ab", "ba", "abc", "cab", "bac", "foo"] },
        expected: [["ab", "ba"], ["abc", "cab", "bac"], ["foo"]],
      },
    ],
    randomTrials: 90,
    constraints: { outputMode: "unordered-nested-members" },
  }),
  makeContract({
    id: "top-k-frequent-contract",
    questionId: 5,
    strategyId: "top-k-frequent-bucket",
    complexity: { time: "O(n)", space: "O(n)" },
    deterministicCases: [
      { input: { nums: [1, 1, 1, 2, 2, 3], k: 2 }, expected: [1, 2] },
      { input: { nums: [1], k: 1 }, expected: [1] },
      { input: { nums: [4, 4, 4, 6, 6, 7, 7, 7, 7], k: 2 }, expected: [7, 4] },
      { input: { nums: [-1, -1, -1, 2, 2, 3], k: 1 }, expected: [-1] },
    ],
    randomTrials: 100,
    constraints: { disallowTokens: [".sort("], outputMode: "unordered-number-members" },
  }),
  makeContract({
    id: "product-except-self-contract",
    questionId: 6,
    strategyId: "product-except-self-prefix-suffix",
    complexity: { time: "O(n)", space: "O(1) extra" },
    deterministicCases: [
      { input: { nums: [1, 2, 3, 4] }, expected: [24, 12, 8, 6] },
      { input: { nums: [-1, 1, 0, -3, 3] }, expected: [0, 0, 9, 0, 0] },
      { input: { nums: [0, 0] }, expected: [0, 0] },
      { input: { nums: [2, 3] }, expected: [3, 2] },
    ],
    randomTrials: 120,
    constraints: { disallowTokens: ["/"], outputMode: "normalized" },
  }),
  makeContract({
    id: "encode-decode-contract",
    questionId: 7,
    strategyId: "encode-decode-length-prefix",
    complexity: { time: "O(total_chars)", space: "O(total_chars)" },
    deterministicCases: [
      { input: { strs: ["lint", "code", "love", "you"] }, expected: ["lint", "code", "love", "you"] },
      { input: { strs: [""] }, expected: [""] },
      { input: { strs: ["#", "12#34", "", "abc"] }, expected: ["#", "12#34", "", "abc"] },
      { input: { strs: ["hello|world", "42", "##"] }, expected: ["hello|world", "42", "##"] },
    ],
    randomTrials: 100,
    constraints: { outputMode: "normalized" },
  }),
  makeContract({
    id: "longest-consecutive-contract",
    questionId: 8,
    strategyId: "longest-consecutive-set",
    complexity: { time: "O(n)", space: "O(n)" },
    deterministicCases: [
      { input: { nums: [100, 4, 200, 1, 3, 2] }, expected: 4 },
      { input: { nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] }, expected: 9 },
      { input: { nums: [] }, expected: 0 },
      { input: { nums: [1, 2, 0, 1] }, expected: 3 },
      { input: { nums: [-1, -2, -3, 10] }, expected: 3 },
    ],
    randomTrials: 120,
    constraints: { outputMode: "normalized" },
  }),
  makeContract({
    id: "valid-palindrome-contract",
    questionId: 9,
    strategyId: "valid-palindrome-two-pointers",
    complexity: { time: "O(n)", space: "O(1)" },
    deterministicCases: [
      { input: { s: "A man, a plan, a canal: Panama" }, expected: true },
      { input: { s: "race a car" }, expected: false },
      { input: { s: " " }, expected: true },
      { input: { s: "0P" }, expected: false },
      { input: { s: "ab_a" }, expected: true },
      { input: { s: ".,," }, expected: true },
    ],
    randomTrials: 120,
    constraints: { outputMode: "normalized" },
  }),
  makeContract({
    id: "three-sum-contract",
    questionId: 10,
    strategyId: "three-sum-two-pointers",
    complexity: { time: "O(n^2)", space: "O(1) extra (excluding output)" },
    deterministicCases: [
      { input: { nums: [-1, 0, 1, 2, -1, -4] }, expected: [[-1, -1, 2], [-1, 0, 1]] },
      { input: { nums: [0, 1, 1] }, expected: [] },
      { input: { nums: [0, 0, 0] }, expected: [[0, 0, 0]] },
      { input: { nums: [-2, 0, 1, 1, 2] }, expected: [[-2, 0, 2], [-2, 1, 1]] },
      { input: { nums: [] }, expected: [] },
    ],
    randomTrials: 90,
    constraints: { outputMode: "unordered-triplets" },
  }),
];

const FIRST_TEN_BY_QUESTION_ID = new Map(FIRST_TEN_CONTRACTS.map((contract) => [Number(contract.questionId), contract]));

const CONTRACTS = QUESTIONS.map((question) => FIRST_TEN_BY_QUESTION_ID.get(question.id) || defaultContract(question));

const CONTRACTS_BY_QUESTION_ID = new Map(CONTRACTS.map((contract) => [Number(contract.questionId), contract]));

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function validateContractSchema(contract) {
  const errors = [];

  if (!contract || typeof contract !== "object") {
    errors.push("contract must be an object");
    return { valid: false, errors };
  }

  if (!contract.id || typeof contract.id !== "string") errors.push("id must be a non-empty string");
  if (!Number.isInteger(contract.questionId) || contract.questionId <= 0) errors.push("questionId must be a positive integer");

  const strategyType = typeof contract.strategyId;
  if (!(strategyType === "string" || contract.strategyId === null)) {
    errors.push("strategyId must be string or null");
  }

  if (!Array.isArray(contract.deterministicCases)) errors.push("deterministicCases must be an array");
  if (!Number.isInteger(contract.randomTrials) || contract.randomTrials < 0) errors.push("randomTrials must be a non-negative integer");
  if (!isPlainObject(contract.constraints)) errors.push("constraints must be an object");

  return { valid: errors.length === 0, errors };
}

export function getContractCoverageSummary() {
  const coveredQuestionIds = new Set(CONTRACTS.map((contract) => Number(contract.questionId)));
  return {
    totalQuestions: QUESTIONS.length,
    coveredQuestions: coveredQuestionIds.size,
    missingQuestionIds: QUESTIONS.map((q) => q.id).filter((id) => !coveredQuestionIds.has(id)),
  };
}

export function getQuestionContract(question) {
  const questionId = Number(question?.id);
  const existing = CONTRACTS_BY_QUESTION_ID.get(questionId);
  if (existing) return existing;

  return makeContract({
    id: `generic-contract-q-${questionId}`,
    questionId,
    strategyId: null,
    complexity: {},
    deterministicCases: defaultDeterministicCases(questionId),
    randomTrials: 0,
    constraints: {},
  });
}

export const QUESTION_CONTRACTS = [...CONTRACTS];
