import { TREE_GRAPH_TEMPLATE_ID } from "../templates";
import { buildProblemIr } from "./problemIr";
import { createStrategiesFromProblemSpecs, makeProblemSpec } from "./problemStrategyBuilder";
import { irStep } from "./shared";

function normalizePairList(values) {
  return [...(values || [])]
    .map((pair) => [Number(pair?.[0]), Number(pair?.[1])])
    .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
}

function dsuFactory(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);

  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(a, b) {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) {
      const tmp = ra;
      ra = rb;
      rb = tmp;
    }
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra] += 1;
    return true;
  }

  return { union };
}

function upperBound(sorted, value) {
  let left = 0;
  let right = sorted.length;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (sorted[mid] <= value) left = mid + 1;
    else right = mid;
  }
  return left;
}

function solveQ54(input) {
  const grid = Array.isArray(input?.grid) ? input.grid.map((row) => [...row]) : [];
  if (!grid.length || !grid[0]?.length) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let islands = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    for (const [dr, dc] of dirs) dfs(r + dr, c + dc);
  }

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== "1") continue;
      islands += 1;
      dfs(r, c);
    }
  }
  return islands;
}

function solveQ55(input) {
  const adjList = Array.isArray(input?.adjList) ? input.adjList : [];
  return adjList.map((neighbors) => (Array.isArray(neighbors) ? [...neighbors].sort((a, b) => a - b) : []));
}

function solveQ56(input) {
  const heights = Array.isArray(input?.heights) ? input.heights : [];
  if (!heights.length || !heights[0]?.length) return [];
  const rows = heights.length;
  const cols = heights[0].length;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function bfs(starts) {
    const seen = new Set();
    const stack = [...starts];
    while (stack.length) {
      const [r, c] = stack.pop();
      const key = `${r},${c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (heights[nr][nc] < heights[r][c]) continue;
        stack.push([nr, nc]);
      }
    }
    return seen;
  }

  const pacific = [];
  const atlantic = [];
  for (let r = 0; r < rows; r += 1) {
    pacific.push([r, 0]);
    atlantic.push([r, cols - 1]);
  }
  for (let c = 0; c < cols; c += 1) {
    pacific.push([0, c]);
    atlantic.push([rows - 1, c]);
  }

  const pacSet = bfs(pacific);
  const atlSet = bfs(atlantic);
  const out = [];
  for (const key of pacSet) {
    if (!atlSet.has(key)) continue;
    const [r, c] = key.split(",").map(Number);
    out.push([r, c]);
  }
  return normalizePairList(out);
}

function solveQ57(input) {
  const numCourses = Number(input?.numCourses || 0);
  const prerequisites = Array.isArray(input?.prerequisites) ? input.prerequisites : [];
  const indegree = new Array(numCourses).fill(0);
  const graph = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    indegree[course] += 1;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i += 1) {
    if (indegree[i] === 0) queue.push(i);
  }

  let visited = 0;
  for (let i = 0; i < queue.length; i += 1) {
    const node = queue[i];
    visited += 1;
    for (const nxt of graph[node]) {
      indegree[nxt] -= 1;
      if (indegree[nxt] === 0) queue.push(nxt);
    }
  }
  return visited === numCourses;
}

function solveQ58(input) {
  const numCourses = Number(input?.numCourses || 0);
  const prerequisites = Array.isArray(input?.prerequisites) ? input.prerequisites : [];
  const indegree = new Array(numCourses).fill(0);
  const graph = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    indegree[course] += 1;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i += 1) {
    if (indegree[i] === 0) queue.push(i);
  }
  queue.sort((a, b) => a - b);

  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const nxt of graph[node]) {
      indegree[nxt] -= 1;
      if (indegree[nxt] === 0) {
        const idx = upperBound(queue, nxt);
        queue.splice(idx, 0, nxt);
      }
    }
  }
  return order.length === numCourses ? order : [];
}

function solveQ59(input) {
  const n = Number(input?.n || 0);
  const edges = Array.isArray(input?.edges) ? input.edges : [];
  if (n <= 0) return false;
  if (edges.length !== n - 1) return false;
  const dsu = dsuFactory(n);
  for (const [a, b] of edges) {
    if (!dsu.union(a, b)) return false;
  }
  return true;
}

function solveQ60(input) {
  const n = Number(input?.n || 0);
  const edges = Array.isArray(input?.edges) ? input.edges : [];
  if (n <= 0) return 0;
  const dsu = dsuFactory(n);
  let components = n;
  for (const [a, b] of edges) {
    if (dsu.union(a, b)) components -= 1;
  }
  return components;
}

function solveQ61(input) {
  const words = Array.isArray(input?.words) ? input.words.map((word) => String(word)) : [];
  const graph = new Map();
  const indegree = new Map();

  for (const word of words) {
    for (const ch of word) {
      if (!graph.has(ch)) graph.set(ch, new Set());
      if (!indegree.has(ch)) indegree.set(ch, 0);
    }
  }

  for (let i = 0; i < words.length - 1; i += 1) {
    const first = words[i];
    const second = words[i + 1];
    if (first.length > second.length && first.startsWith(second)) return "";
    const limit = Math.min(first.length, second.length);
    for (let j = 0; j < limit; j += 1) {
      if (first[j] === second[j]) continue;
      if (!graph.get(first[j]).has(second[j])) {
        graph.get(first[j]).add(second[j]);
        indegree.set(second[j], (indegree.get(second[j]) || 0) + 1);
      }
      break;
    }
  }

  const queue = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([ch]) => ch)
    .sort();

  const out = [];
  while (queue.length) {
    const ch = queue.shift();
    out.push(ch);
    for (const next of [...(graph.get(ch) || [])].sort()) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) {
        const idx = upperBound(queue, next);
        queue.splice(idx, 0, next);
      }
    }
  }

  return out.length === indegree.size ? out.join("") : "";
}

const WORLD0_WAVE4_IR_OVERRIDES = Object.freeze({
  54: [
    irStep(
      "base-case",
      "islands-init-grid",
      "const grid = Array.isArray(input?.grid) ? input.grid.map((row) => [...row]) : []; if (!grid.length || !grid[0]?.length) return 0",
      "branch"
    ),
    irStep(
      "branch",
      "islands-init-state",
      "const rows = grid.length; const cols = grid[0].length; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; let islands = 0; function dfs(r, c) {",
      "loop"
    ),
    irStep(
      "prune",
      "islands-prune-water",
      "if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return",
      "branch"
    ),
    irStep(
      "traverse",
      "islands-flood-fill-and-count",
      "grid[r][c] = '0'; for (const [dr, dc] of dirs) dfs(r + dr, c + dc) }; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === '1') { islands += 1; dfs(r, c) }",
      "update"
    ),
    irStep("aggregate", "islands-return", "return islands", "return"),
  ],
  57: [
    irStep(
      "base-case",
      "courses-init-input",
      "const numCourses = Number(input?.numCourses || 0); const prerequisites = Array.isArray(input?.prerequisites) ? input.prerequisites : []",
      "branch"
    ),
    irStep(
      "branch",
      "courses-build-graph",
      "const indegree = new Array(numCourses).fill(0); const graph = Array.from({ length: numCourses }, () => []); for (const [course, prereq] of prerequisites) { graph[prereq].push(course); indegree[course] += 1 }",
      "loop"
    ),
    irStep(
      "prune",
      "courses-seed-queue",
      "const queue = []; for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i)",
      "branch"
    ),
    irStep(
      "traverse",
      "courses-kahn-traverse",
      "let visited = 0; for (let i = 0; i < queue.length; i++) { const node = queue[i]; visited += 1; for (const nxt of graph[node]) { indegree[nxt] -= 1; if (indegree[nxt] === 0) queue.push(nxt) } }",
      "update"
    ),
    irStep("aggregate", "courses-return", "return visited === numCourses", "return"),
  ],
});

export const WAVE_4_PROBLEM_SPECS = [
  makeProblemSpec({
    questionId: 54,
    questionName: "Number of Islands",
    strategyId: "q-54-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(m*n)", space: "O(m*n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ grid: [["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]] }, { grid: [["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]] }],
    randomTrials: 50,
    solve: solveQ54,
    snippetName: "Number of Islands | Flood-fill connected components",
  }),
  makeProblemSpec({
    questionId: 55,
    questionName: "Clone Graph",
    strategyId: "q-55-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(V + E)", space: "O(V)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ adjList: [[2, 4], [1, 3], [2, 4], [1, 3]] }, { adjList: [[]] }],
    randomTrials: 50,
    solve: solveQ55,
    snippetName: "Clone Graph | Adjacency-preserving deep copy schema",
  }),
  makeProblemSpec({
    questionId: 56,
    questionName: "Pacific Atlantic Water Flow",
    strategyId: "q-56-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(m*n)", space: "O(m*n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ heights: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]] }, { heights: [[1]] }],
    randomTrials: 50,
    solve: solveQ56,
    snippetName: "Pacific Atlantic Water Flow | Reverse-edge border traversals",
  }),
  makeProblemSpec({
    questionId: 57,
    questionName: "Course Schedule",
    strategyId: "q-57-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ numCourses: 2, prerequisites: [[1, 0]] }, { numCourses: 2, prerequisites: [[1, 0], [0, 1]] }],
    randomTrials: 50,
    solve: solveQ57,
    snippetName: "Course Schedule | Kahn cycle detection",
  }),
  makeProblemSpec({
    questionId: 58,
    questionName: "Course Schedule II",
    strategyId: "q-58-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    constraints: { outputMode: "topological-order", disallowTokens: [] },
    samples: [{ numCourses: 2, prerequisites: [[1, 0]] }, { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] }],
    randomTrials: 50,
    solve: solveQ58,
    snippetName: "Course Schedule II | Kahn topological order",
  }),
  makeProblemSpec({
    questionId: 59,
    questionName: "Graph Valid Tree",
    strategyId: "q-59-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(V + E)", space: "O(V)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ n: 5, edges: [[0, 1], [0, 2], [0, 3], [1, 4]] }, { n: 5, edges: [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]] }],
    randomTrials: 50,
    solve: solveQ59,
    snippetName: "Graph Valid Tree | DSU acyclic + connected checks",
  }),
  makeProblemSpec({
    questionId: 60,
    questionName: "Number of Connected Components",
    strategyId: "q-60-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(V + E)", space: "O(V)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ n: 5, edges: [[0, 1], [1, 2], [3, 4]] }, { n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]] }],
    randomTrials: 50,
    solve: solveQ60,
    snippetName: "Number of Connected Components | Union-Find component counting",
  }),
  makeProblemSpec({
    questionId: 61,
    questionName: "Alien Dictionary",
    strategyId: "q-61-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(total chars + edges)", space: "O(unique chars + edges)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ words: ["wrt", "wrf", "er", "ett", "rftt"] }, { words: ["z", "x", "z"] }],
    randomTrials: 60,
    solve: solveQ61,
    snippetName: "Alien Dictionary | Constraint graph + topological sort",
  }),
].map((spec) => ({
  ...spec,
  ir: WORLD0_WAVE4_IR_OVERRIDES[spec.questionId] || buildProblemIr(spec.templateId, spec.questionName, spec.solve),
}));

export function createWave4Strategies() {
  return createStrategiesFromProblemSpecs(WAVE_4_PROBLEM_SPECS);
}
