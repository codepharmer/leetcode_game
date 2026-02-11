import { TEMPLATE_GROUPS } from "./templates";

const TEMPLATE_CODE_BY_KEY = {};
TEMPLATE_GROUPS.forEach((group) => {
  group.templates.forEach((template, index) => {
    TEMPLATE_CODE_BY_KEY[`${group.category}::${index}`] = template.code;
  });
});

function codeFor(category, templateIndex) {
  return TEMPLATE_CODE_BY_KEY[`${category}::${templateIndex}`] || "";
}

function snippet(id, sequence, category, templateIndex, pattern, difficulty) {
  return {
    id,
    title: `Snippet ${String(sequence).padStart(2, "0")}`,
    pattern,
    difficulty,
    promptKind: "code",
    code: codeFor(category, templateIndex),
    desc: "Choose the pattern this template is most closely connected to.",
  };
}

export const TEMPLATE_QUESTIONS = [
  snippet("tpl-001", 1, "Arrays & Hashing", 0, "Hash Map", "Easy"),
  snippet("tpl-002", 2, "Arrays & Hashing", 1, "Hash Map", "Easy"),
  snippet("tpl-003", 3, "Arrays & Hashing", 2, "Hash Map", "Medium"),
  snippet("tpl-004", 4, "Arrays & Hashing", 3, "Hash Map", "Medium"),
  snippet("tpl-005", 5, "Two Pointers", 0, "Two Pointers", "Medium"),
  snippet("tpl-006", 6, "Two Pointers", 1, "Two Pointers", "Easy"),
  snippet("tpl-007", 7, "Palindromes", 0, "Expand Around Center", "Medium"),
  snippet("tpl-008", 8, "Palindromes", 1, "Expand Around Center", "Medium"),
  snippet("tpl-009", 9, "Sliding Window", 0, "Sliding Window", "Easy"),
  snippet("tpl-010", 10, "Sliding Window", 1, "Sliding Window", "Medium"),
  snippet("tpl-011", 11, "Sliding Window", 2, "Sliding Window", "Hard"),
  snippet("tpl-012", 12, "Stack", 0, "Stack", "Easy"),
  snippet("tpl-013", 13, "Stack", 1, "Monotonic Stack", "Medium"),
  snippet("tpl-014", 14, "Binary Search", 0, "Binary Search", "Easy"),
  snippet("tpl-015", 15, "Binary Search", 1, "Binary Search", "Medium"),
  snippet("tpl-016", 16, "Binary Search", 2, "Binary Search", "Medium"),
  snippet("tpl-017", 17, "Linked List", 0, "Linked List", "Easy"),
  snippet("tpl-018", 18, "Linked List", 1, "Linked List", "Easy"),
  snippet("tpl-019", 19, "Linked List", 2, "Fast & Slow Pointers", "Medium"),
  snippet("tpl-020", 20, "Trees", 0, "DFS", "Easy"),
  snippet("tpl-021", 21, "Trees", 1, "DFS", "Medium"),
  snippet("tpl-022", 22, "Trees", 2, "BFS", "Medium"),
  snippet("tpl-023", 23, "Trees", 3, "BST Property / Binary Search", "Medium"),
  snippet("tpl-024", 24, "Heap / Priority Queue", 0, "Heap / Sorting", "Medium"),
  snippet("tpl-025", 25, "Heap / Priority Queue", 1, "Heap / Divide & Conquer", "Hard"),
  snippet("tpl-026", 26, "Heap / Priority Queue", 2, "Two Heaps", "Hard"),
  snippet("tpl-027", 27, "Backtracking", 0, "Backtracking", "Medium"),
  snippet("tpl-028", 28, "Tries", 0, "Trie", "Medium"),
  snippet("tpl-029", 29, "Tries", 1, "Trie", "Hard"),
  snippet("tpl-030", 30, "Graphs", 0, "DFS / BFS", "Medium"),
  snippet("tpl-031", 31, "Graphs", 1, "DFS / BFS", "Medium"),
  snippet("tpl-032", 32, "Graphs", 2, "Topological Sort", "Medium"),
  snippet("tpl-033", 33, "Graphs", 3, "Union Find / DFS", "Medium"),
  snippet("tpl-034", 34, "Dynamic Programming", 0, "Dynamic Programming", "Easy"),
  snippet("tpl-035", 35, "Dynamic Programming", 1, "Dynamic Programming", "Easy"),
  snippet("tpl-036", 36, "Dynamic Programming", 2, "Dynamic Programming", "Medium"),
  snippet("tpl-037", 37, "Dynamic Programming", 3, "Dynamic Programming", "Medium"),
  snippet("tpl-038", 38, "DP + Binary Search", 0, "DP + Binary Search (Patience Sorting)", "Hard"),
  snippet("tpl-039", 39, "Greedy", 0, "Greedy", "Medium"),
  snippet("tpl-040", 40, "Greedy", 1, "Greedy", "Medium"),
  snippet("tpl-041", 41, "Greedy", 2, "Kadane's Algorithm", "Medium"),
  snippet("tpl-042", 42, "Intervals", 0, "Intervals", "Medium"),
  snippet("tpl-043", 43, "Intervals", 1, "Greedy", "Medium"),
  snippet("tpl-044", 44, "Bit Manipulation", 0, "Bit Manipulation", "Easy"),
  snippet("tpl-045", 45, "Bit Manipulation", 1, "Bit Manipulation", "Easy"),
  snippet("tpl-046", 46, "Bit Manipulation", 2, "Bit Manipulation", "Easy"),
  snippet("tpl-047", 47, "Math & Geometry", 0, "Matrix", "Medium"),
  snippet("tpl-048", 48, "Math & Geometry", 1, "Matrix", "Medium"),
];

export const PATTERN_CONFUSION_MAP = {
  "Hash Map": ["Hash Set", "Prefix/Suffix", "Sliding Window", "DFS + Hash Map"],
  "Hash Set": ["Hash Map", "Sliding Window", "Union Find / DFS"],
  "Prefix/Suffix": ["Hash Map", "Dynamic Programming", "Two Pointers"],
  Design: ["Hash Map", "Trie", "Stack"],
  "Two Pointers": ["Sliding Window", "Fast & Slow Pointers", "Expand Around Center"],
  "Expand Around Center": ["Two Pointers", "Dynamic Programming", "Sliding Window"],
  "Sliding Window": ["Two Pointers", "Hash Map", "Prefix/Suffix"],
  Stack: ["Monotonic Stack", "Backtracking", "Two Pointers"],
  "Monotonic Stack": ["Stack", "Heap / Sorting", "Two Pointers"],
  "Binary Search": ["BST Property / Binary Search", "DP + Binary Search (Patience Sorting)", "Two Pointers"],
  "BST Property / Binary Search": ["Binary Search", "DFS", "DFS (Inorder)"],
  "Linked List": ["Fast & Slow Pointers", "Two Pointers", "DFS"],
  "Fast & Slow Pointers": ["Two Pointers", "Linked List", "Sliding Window"],
  DFS: ["BFS", "DFS / BFS", "Backtracking"],
  BFS: ["DFS", "DFS / BFS", "Topological Sort"],
  "DFS / BFS": ["DFS", "BFS", "Union Find / DFS"],
  "BFS / DFS": ["BFS", "DFS", "Topological Sort"],
  "DFS (Inorder)": ["DFS", "BST Property / Binary Search"],
  "DFS + Hash Map": ["DFS", "Hash Map", "BFS / DFS"],
  Trie: ["Trie + Backtracking", "Hash Map", "Backtracking"],
  "Trie + Backtracking": ["Trie", "Backtracking", "DFS / BFS"],
  "Heap / Divide & Conquer": ["Heap / Sorting", "Two Heaps", "Linked List"],
  "Heap / Sorting": ["Heap / Divide & Conquer", "Two Heaps", "Sorting"],
  "Two Heaps": ["Heap / Sorting", "Heap / Divide & Conquer", "Binary Search"],
  Backtracking: ["Trie + Backtracking", "DFS", "Dynamic Programming"],
  "Topological Sort": ["DFS / BFS", "Union Find / DFS", "BFS"],
  "Union Find / DFS": ["DFS / BFS", "Topological Sort", "Hash Set"],
  "Dynamic Programming": ["Greedy", "Prefix/Suffix", "DP + Binary Search (Patience Sorting)"],
  "DP + Binary Search (Patience Sorting)": ["Dynamic Programming", "Binary Search", "Greedy"],
  Greedy: ["Dynamic Programming", "Intervals", "Kadane's Algorithm"],
  Intervals: ["Sorting", "Greedy", "Two Pointers"],
  Sorting: ["Intervals", "Heap / Sorting", "Greedy"],
  "Kadane's Algorithm": ["Dynamic Programming", "Greedy", "Prefix/Suffix"],
  "Bit Manipulation": ["Hash Set", "Dynamic Programming", "Prefix/Suffix"],
  Matrix: ["DFS / BFS", "Dynamic Programming", "Two Pointers"],
};
