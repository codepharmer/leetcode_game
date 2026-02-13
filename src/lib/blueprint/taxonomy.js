import {
  BACKTRACKING_TEMPLATE_ID,
  DEFAULT_BLUEPRINT_TEMPLATE_ID,
  RECURSIVE_TOP_DOWN_TEMPLATE_ID,
} from "./templates";

export const WAVE_IDS = {
  WAVE_1: "wave-1",
  WAVE_2: "wave-2",
  WAVE_3: "wave-3",
  WAVE_4: "wave-4",
  WAVE_5: "wave-5",
  WAVE_6: "wave-6",
};

export const WAVE_TEMPLATE_STRATEGY_IDS = {
  [WAVE_IDS.WAVE_1]: "wave-1-template-family",
  [WAVE_IDS.WAVE_2]: "wave-2-template-family",
  [WAVE_IDS.WAVE_3]: "wave-3-template-family",
  [WAVE_IDS.WAVE_4]: "wave-4-template-family",
  [WAVE_IDS.WAVE_5]: "wave-5-template-family",
  [WAVE_IDS.WAVE_6]: "wave-6-template-family",
};

export const ARCHETYPE_DEFINITIONS = {
  "arrays-hashing": {
    id: "arrays-hashing",
    slotSetId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "stack-heap-search": {
    id: "stack-heap-search",
    slotSetId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "linked-list-intervals-greedy": {
    id: "linked-list-intervals-greedy",
    slotSetId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "tree-trie-backtracking": {
    id: "tree-trie-backtracking",
    slotSetId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "pure-backtracking": {
    id: "pure-backtracking",
    slotSetId: BACKTRACKING_TEMPLATE_ID,
    templateId: BACKTRACKING_TEMPLATE_ID,
  },
  graphs: {
    id: "graphs",
    slotSetId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "dp-bit-matrix": {
    id: "dp-bit-matrix",
    slotSetId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
};

const PATTERN_BLUEPRINT_PROFILE = {
  "Hash Map": {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Hash Set": {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Bucket Sort": {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Prefix/Suffix": {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  Design: {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Two Pointers": {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Sliding Window": {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Expand Around Center": {
    wave: WAVE_IDS.WAVE_1,
    archetypeId: "arrays-hashing",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },

  Stack: {
    wave: WAVE_IDS.WAVE_2,
    archetypeId: "stack-heap-search",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Monotonic Stack": {
    wave: WAVE_IDS.WAVE_2,
    archetypeId: "stack-heap-search",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Binary Search": {
    wave: WAVE_IDS.WAVE_2,
    archetypeId: "stack-heap-search",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Heap / Divide & Conquer": {
    wave: WAVE_IDS.WAVE_2,
    archetypeId: "stack-heap-search",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Two Heaps": {
    wave: WAVE_IDS.WAVE_2,
    archetypeId: "stack-heap-search",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Heap / Sorting": {
    wave: WAVE_IDS.WAVE_2,
    archetypeId: "stack-heap-search",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "BST Property / Binary Search": {
    wave: WAVE_IDS.WAVE_2,
    archetypeId: "stack-heap-search",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },

  "Linked List": {
    wave: WAVE_IDS.WAVE_3,
    archetypeId: "linked-list-intervals-greedy",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Fast & Slow Pointers": {
    wave: WAVE_IDS.WAVE_3,
    archetypeId: "linked-list-intervals-greedy",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  Intervals: {
    wave: WAVE_IDS.WAVE_3,
    archetypeId: "linked-list-intervals-greedy",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  Sorting: {
    wave: WAVE_IDS.WAVE_3,
    archetypeId: "linked-list-intervals-greedy",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  Greedy: {
    wave: WAVE_IDS.WAVE_3,
    archetypeId: "linked-list-intervals-greedy",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },
  "Kadane's Algorithm": {
    wave: WAVE_IDS.WAVE_3,
    archetypeId: "linked-list-intervals-greedy",
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
  },

  DFS: {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "tree-trie-backtracking",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  BFS: {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "tree-trie-backtracking",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "BFS / DFS": {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "tree-trie-backtracking",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "DFS (Inorder)": {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "tree-trie-backtracking",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "DFS + Hash Map": {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "tree-trie-backtracking",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  Trie: {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "tree-trie-backtracking",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  Backtracking: {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "pure-backtracking",
    templateId: BACKTRACKING_TEMPLATE_ID,
  },
  "Trie + Backtracking": {
    wave: WAVE_IDS.WAVE_4,
    archetypeId: "pure-backtracking",
    templateId: BACKTRACKING_TEMPLATE_ID,
  },

  "DFS / BFS": {
    wave: WAVE_IDS.WAVE_5,
    archetypeId: "graphs",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "Topological Sort": {
    wave: WAVE_IDS.WAVE_5,
    archetypeId: "graphs",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "Union Find / DFS": {
    wave: WAVE_IDS.WAVE_5,
    archetypeId: "graphs",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },

  "Dynamic Programming": {
    wave: WAVE_IDS.WAVE_6,
    archetypeId: "dp-bit-matrix",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "DP + Binary Search (Patience Sorting)": {
    wave: WAVE_IDS.WAVE_6,
    archetypeId: "dp-bit-matrix",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  "Bit Manipulation": {
    wave: WAVE_IDS.WAVE_6,
    archetypeId: "dp-bit-matrix",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
  Matrix: {
    wave: WAVE_IDS.WAVE_6,
    archetypeId: "dp-bit-matrix",
    templateId: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  },
};

const FALLBACK_PROFILE = {
  wave: WAVE_IDS.WAVE_1,
  archetypeId: "arrays-hashing",
  templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
};

function withStrategyId(profile) {
  const strategyId = WAVE_TEMPLATE_STRATEGY_IDS[profile.wave] || WAVE_TEMPLATE_STRATEGY_IDS[WAVE_IDS.WAVE_1];
  return {
    ...profile,
    strategyId,
  };
}

export function getPatternBlueprintProfile(pattern) {
  const key = String(pattern || "");
  const profile = PATTERN_BLUEPRINT_PROFILE[key] || FALLBACK_PROFILE;
  return withStrategyId(profile);
}

export function getQuestionBlueprintProfile(question) {
  return getPatternBlueprintProfile(question?.pattern);
}

export function getPatternWave(pattern) {
  return getPatternBlueprintProfile(pattern).wave;
}

export function getQuestionWave(question) {
  return getQuestionBlueprintProfile(question).wave;
}

export function getPatternTemplateId(pattern) {
  return getPatternBlueprintProfile(pattern).templateId;
}

export function getQuestionTemplateId(question) {
  return getQuestionBlueprintProfile(question).templateId;
}

export function getPatternStrategyId(pattern) {
  return getPatternBlueprintProfile(pattern).strategyId;
}

export function getWaveTemplateStrategyId(waveId) {
  return WAVE_TEMPLATE_STRATEGY_IDS[waveId] || WAVE_TEMPLATE_STRATEGY_IDS[WAVE_IDS.WAVE_1];
}

export const BLUEPRINT_PATTERN_TAXONOMY = Object.freeze({ ...PATTERN_BLUEPRINT_PROFILE });
