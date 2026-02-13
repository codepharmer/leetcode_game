import { QUESTIONS } from "../questions";
import { WAVE_1_PROBLEM_SPECS } from "./strategies/wave1Strategies";
import { WAVE_2_PROBLEM_SPECS } from "./strategies/wave2Strategies";
import { WAVE_3_PROBLEM_SPECS } from "./strategies/wave3Strategies";
import { WAVE_4_PROBLEM_SPECS } from "./strategies/wave4Strategies";
import { WAVE_5_PROBLEM_SPECS } from "./strategies/wave5Strategies";
import { WAVE_6_PROBLEM_SPECS } from "./strategies/wave6Strategies";

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

const PRODUCTION_QUESTION_IDS = new Set(QUESTIONS.map((question) => Number(question.id)));

const PROBLEM_SPEC_BY_QUESTION_ID = new Map(
  [
    ...WAVE_1_PROBLEM_SPECS,
    ...WAVE_2_PROBLEM_SPECS,
    ...WAVE_3_PROBLEM_SPECS,
    ...WAVE_4_PROBLEM_SPECS,
    ...WAVE_5_PROBLEM_SPECS,
    ...WAVE_6_PROBLEM_SPECS,
  ].map((spec) => [Number(spec.questionId), spec])
);

function defaultContract(question) {
  return makeContract({
    id: `question-${question.id}-contract`,
    questionId: question.id,
    strategyId: null,
    complexity: { time: "pattern-dependent", space: "pattern-dependent" },
    deterministicCases: [],
    randomTrials: 0,
    constraints: { outputMode: "normalized", disallowTokens: [] },
  });
}

function contractFromProblemSpec(spec) {
  return makeContract({
    id: `question-${spec.questionId}-contract`,
    questionId: spec.questionId,
    strategyId: spec.strategyId,
    complexity: spec.complexity,
    deterministicCases: spec.deterministicCases,
    randomTrials: spec.randomTrials,
    constraints: spec.constraints,
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

const CONTRACTS = QUESTIONS.map((question) => {
  if (FIRST_TEN_BY_QUESTION_ID.has(question.id)) return FIRST_TEN_BY_QUESTION_ID.get(question.id);
  const problemSpec = PROBLEM_SPEC_BY_QUESTION_ID.get(question.id);
  if (problemSpec) return contractFromProblemSpec(problemSpec);
  return defaultContract(question);
});

const CONTRACTS_BY_QUESTION_ID = new Map(CONTRACTS.map((contract) => [Number(contract.questionId), contract]));

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isProbePlaceholderInput(input) {
  if (!isPlainObject(input)) return false;
  const keys = Object.keys(input).sort();
  if (keys.length !== 3) return false;
  return keys[0] === "left" && keys[1] === "right" && keys[2] === "text";
}

export function hasPlaceholderProbeCases(contract) {
  return (contract?.deterministicCases || []).some((testCase) => isProbePlaceholderInput(testCase?.input));
}

export function getPlaceholderContractCount(contracts = CONTRACTS) {
  return (contracts || []).filter((contract) => PRODUCTION_QUESTION_IDS.has(Number(contract?.questionId)) && hasPlaceholderProbeCases(contract)).length;
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

  const isProductionQuestion = PRODUCTION_QUESTION_IDS.has(Number(contract.questionId));
  if (isProductionQuestion && Array.isArray(contract.deterministicCases) && contract.deterministicCases.length === 0) {
    errors.push("production contracts require deterministic cases");
  }
  if (isProductionQuestion && Number(contract.randomTrials) <= 0) {
    errors.push("production contracts require positive randomTrials");
  }
  if (isProductionQuestion && hasPlaceholderProbeCases(contract)) {
    errors.push("production contracts may not use probe placeholder inputs");
  }

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
    deterministicCases: [],
    randomTrials: 0,
    constraints: { outputMode: "normalized", disallowTokens: [] },
  });
}

export const QUESTION_CONTRACTS = [...CONTRACTS];
