import { BACKTRACKING_TEMPLATE_ID, STACK_HEAP_TEMPLATE_ID, TREE_GRAPH_TEMPLATE_ID } from "../templates";
import { buildProblemIr } from "./problemIr";
import { createStrategiesFromProblemSpecs, makeProblemSpec } from "./problemStrategyBuilder";
import { irStep } from "./shared";

function arrayToTree(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const nodes = values.map((value) => (value === null || value === undefined ? null : { val: value, left: null, right: null }));
  let child = 1;
  for (let i = 0; i < nodes.length && child < nodes.length; i += 1) {
    if (!nodes[i]) continue;
    nodes[i].left = child < nodes.length ? nodes[child] : null;
    child += 1;
    nodes[i].right = child < nodes.length ? nodes[child] : null;
    child += 1;
  }
  return nodes[0];
}

function treeToArray(root) {
  if (!root) return [];
  const out = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (!node) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left || null);
    queue.push(node.right || null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

function sameTree(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.val !== b.val) return false;
  return sameTree(a.left, b.left) && sameTree(a.right, b.right);
}

function sortNested(values) {
  return [...(values || [])].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function solveQ33(input) {
  function invert(node) {
    if (!node) return null;
    [node.left, node.right] = [node.right, node.left];
    invert(node.left);
    invert(node.right);
    return node;
  }
  return treeToArray(invert(arrayToTree(input?.root || [])));
}

function solveQ34(input) {
  function depth(node) {
    if (!node) return 0;
    return 1 + Math.max(depth(node.left), depth(node.right));
  }
  return depth(arrayToTree(input?.root || []));
}

function solveQ35(input) {
  return sameTree(arrayToTree(input?.p || []), arrayToTree(input?.q || []));
}

function solveQ36(input) {
  const root = arrayToTree(input?.root || []);
  const subRoot = arrayToTree(input?.subRoot || []);
  function contains(node) {
    if (!node) return false;
    if (sameTree(node, subRoot)) return true;
    return contains(node.left) || contains(node.right);
  }
  return contains(root);
}

function solveQ37(input) {
  const root = arrayToTree(input?.root || []);
  const p = Number(input?.p);
  const q = Number(input?.q);
  const low = Math.min(p, q);
  const high = Math.max(p, q);
  let node = root;
  while (node) {
    if (node.val < low) node = node.right;
    else if (node.val > high) node = node.left;
    else return node.val;
  }
  return null;
}

function solveQ38(input) {
  const root = arrayToTree(input?.root || []);
  if (!root) return [];
  const out = [];
  const queue = [root];
  while (queue.length) {
    const size = queue.length;
    const level = [];
    for (let i = 0; i < size; i += 1) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    out.push(level);
  }
  return out;
}

function solveQ39(input) {
  const root = arrayToTree(input?.root || []);
  function valid(node, low, high) {
    if (!node) return true;
    if (!(low < node.val && node.val < high)) return false;
    return valid(node.left, low, node.val) && valid(node.right, node.val, high);
  }
  return valid(root, -Infinity, Infinity);
}

function solveQ40(input) {
  const root = arrayToTree(input?.root || []);
  const k = Number(input?.k || 1);
  const stack = [];
  let node = root;
  let seen = 0;
  while (node || stack.length) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    seen += 1;
    if (seen === k) return node.val;
    node = node.right;
  }
  return null;
}

function solveQ41(input) {
  const preorder = Array.isArray(input?.preorder) ? input.preorder : [];
  const inorder = Array.isArray(input?.inorder) ? input.inorder : [];
  const indexByValue = new Map(inorder.map((value, index) => [value, index]));
  let preIndex = 0;

  function build(left, right) {
    if (left > right) return null;
    const value = preorder[preIndex++];
    const node = { val: value, left: null, right: null };
    const mid = indexByValue.get(value);
    node.left = build(left, mid - 1);
    node.right = build(mid + 1, right);
    return node;
  }

  return treeToArray(build(0, inorder.length - 1));
}

function solveQ42(input) {
  const root = arrayToTree(input?.root || []);
  let best = -Infinity;
  function dfs(node) {
    if (!node) return 0;
    const left = Math.max(0, dfs(node.left));
    const right = Math.max(0, dfs(node.right));
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  }
  dfs(root);
  return best === -Infinity ? 0 : best;
}

function serializeTree(root) {
  if (!root) return "#";
  const out = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (!node) {
      out.push("#");
      continue;
    }
    out.push(String(node.val));
    queue.push(node.left || null);
    queue.push(node.right || null);
  }
  while (out.length > 1 && out[out.length - 1] === "#") out.pop();
  return out.join(",");
}

function deserializeTree(serialized) {
  const items = String(serialized || "").split(",");
  if (!items.length || items[0] === "#") return null;
  const root = { val: Number(items[0]), left: null, right: null };
  const queue = [root];
  let index = 1;
  while (queue.length && index < items.length) {
    const node = queue.shift();
    const left = items[index++];
    if (left !== undefined && left !== "#") {
      node.left = { val: Number(left), left: null, right: null };
      queue.push(node.left);
    }
    const right = items[index++];
    if (right !== undefined && right !== "#") {
      node.right = { val: Number(right), left: null, right: null };
      queue.push(node.right);
    }
  }
  return root;
}

function solveQ43(input) {
  const root = arrayToTree(input?.root || []);
  return treeToArray(deserializeTree(serializeTree(root)));
}

function solveQ44(input) {
  const operations = Array.isArray(input?.operations) ? input.operations : [];
  const root = { children: new Map(), end: false };
  const out = [];

  function insert(word) {
    let node = root;
    for (const ch of String(word || "")) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), end: false });
      node = node.children.get(ch);
    }
    node.end = true;
  }

  function search(word) {
    let node = root;
    for (const ch of String(word || "")) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch);
    }
    return node.end === true;
  }

  function startsWith(prefix) {
    let node = root;
    for (const ch of String(prefix || "")) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch);
    }
    return true;
  }

  for (const [op, value] of operations) {
    if (op === "insert") insert(value);
    if (op === "search") out.push(search(value));
    if (op === "startsWith") out.push(startsWith(value));
  }
  return out;
}

function solveQ45(input) {
  const board = Array.isArray(input?.board) ? input.board.map((row) => [...row]) : [];
  const words = Array.isArray(input?.words) ? input.words.map((word) => String(word)) : [];
  if (!board.length || !board[0]?.length || !words.length) return [];

  const root = { children: new Map(), word: null };
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), word: null });
      node = node.children.get(ch);
    }
    node.word = word;
  }

  const rows = board.length;
  const cols = board[0].length;
  const out = new Set();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function dfs(r, c, node) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const ch = board[r][c];
    if (ch === "#" || !node.children.has(ch)) return;
    const next = node.children.get(ch);
    if (next.word) out.add(next.word);
    board[r][c] = "#";
    for (const [dr, dc] of dirs) dfs(r + dr, c + dc, next);
    board[r][c] = ch;
  }

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      dfs(r, c, root);
    }
  }

  return [...out].sort();
}

function lowerBound(sorted, value) {
  let left = 0;
  let right = sorted.length;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (sorted[mid] < value) left = mid + 1;
    else right = mid;
  }
  return left;
}

function solveQ46(input) {
  const operations = Array.isArray(input?.operations) ? input.operations : [];
  const sorted = [];
  const out = [];
  for (const [op, valueRaw] of operations) {
    if (op === "addNum") {
      const value = Number(valueRaw);
      const index = lowerBound(sorted, value);
      sorted.splice(index, 0, value);
      continue;
    }
    if (op !== "findMedian") continue;
    if (!sorted.length) {
      out.push(null);
      continue;
    }
    if (sorted.length % 2 === 1) {
      out.push(sorted[(sorted.length - 1) >> 1]);
      continue;
    }
    const right = sorted.length >> 1;
    out.push((sorted[right - 1] + sorted[right]) / 2);
  }
  return out;
}

function solveQ47(input) {
  const candidates = Array.isArray(input?.candidates) ? [...input.candidates].sort((a, b) => a - b) : [];
  const target = Number(input?.target || 0);
  const out = [];
  const path = [];

  function dfs(start, remain) {
    if (remain === 0) {
      out.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length; i += 1) {
      if (candidates[i] > remain) break;
      path.push(candidates[i]);
      dfs(i, remain - candidates[i]);
      path.pop();
    }
  }

  dfs(0, target);
  return sortNested(out);
}

function solveQ48(input) {
  const board = Array.isArray(input?.board) ? input.board.map((row) => [...row]) : [];
  const word = String(input?.word || "");
  if (!word) return true;
  const rows = board.length;
  const cols = rows ? board[0].length : 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function dfs(r, c, index) {
    if (index === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (board[r][c] !== word[index]) return false;
    const tmp = board[r][c];
    board[r][c] = "#";
    for (const [dr, dc] of dirs) {
      if (dfs(r + dr, c + dc, index + 1)) {
        board[r][c] = tmp;
        return true;
      }
    }
    board[r][c] = tmp;
    return false;
  }

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (dfs(r, c, 0)) return true;
    }
  }

  return false;
}

function solveQ49(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  const out = [[]];
  for (const value of nums) {
    const size = out.length;
    for (let i = 0; i < size; i += 1) {
      out.push([...out[i], value]);
    }
  }
  return out.sort((a, b) => a.length - b.length || JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function solveQ50(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  const used = new Array(nums.length).fill(false);
  const path = [];
  const out = [];

  function dfs() {
    if (path.length === nums.length) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i += 1) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      dfs();
      path.pop();
      used[i] = false;
    }
  }

  dfs();
  return sortNested(out);
}

function solveQ51(input) {
  const s = String(input?.s || "");
  const path = [];
  const out = [];

  function palindrome(left, right) {
    while (left < right) {
      if (s[left] !== s[right]) return false;
      left += 1;
      right -= 1;
    }
    return true;
  }

  function dfs(start) {
    if (start === s.length) {
      out.push([...path]);
      return;
    }
    for (let end = start; end < s.length; end += 1) {
      if (!palindrome(start, end)) continue;
      path.push(s.slice(start, end + 1));
      dfs(end + 1);
      path.pop();
    }
  }

  dfs(0);
  return sortNested(out);
}

function solveQ52(input) {
  const digits = String(input?.digits || "");
  if (!digits) return [];
  const map = {
    "2": "abc",
    "3": "def",
    "4": "ghi",
    "5": "jkl",
    "6": "mno",
    "7": "pqrs",
    "8": "tuv",
    "9": "wxyz",
  };
  let out = [""];
  for (const digit of digits) {
    const letters = map[digit] || "";
    const next = [];
    for (const prefix of out) {
      for (const ch of letters) next.push(prefix + ch);
    }
    out = next;
  }
  return out.sort();
}

function solveQ53(input) {
  const n = Number(input?.n || 0);
  if (n <= 0) return [];
  const out = [];
  const cols = new Set();
  const diag = new Set();
  const antiDiag = new Set();
  const board = Array.from({ length: n }, () => ".".repeat(n).split(""));

  function dfs(row) {
    if (row === n) {
      out.push(board.map((line) => line.join("")));
      return;
    }
    for (let col = 0; col < n; col += 1) {
      const d = row - col;
      const ad = row + col;
      if (cols.has(col) || diag.has(d) || antiDiag.has(ad)) continue;
      cols.add(col);
      diag.add(d);
      antiDiag.add(ad);
      board[row][col] = "Q";
      dfs(row + 1);
      board[row][col] = ".";
      cols.delete(col);
      diag.delete(d);
      antiDiag.delete(ad);
    }
  }

  dfs(0);
  return sortNested(out);
}

function treeConstraints() {
  return { outputMode: "normalized", disallowTokens: [] };
}

const WORLD0_WAVE3_IR_OVERRIDES = Object.freeze({
  33: [
    irStep("base-case", "invert-base-case", "function invert(node) { if (!node) return null", "branch"),
    irStep("branch", "invert-swap-children", "[node.left, node.right] = [node.right, node.left]", "update"),
    irStep("prune", "invert-left-branch", "invert(node.left)", "loop"),
    irStep("traverse", "invert-right-and-return", "invert(node.right); return node }", "update"),
    irStep("aggregate", "invert-run", "return invert(root)", "return"),
  ],
  34: [
    irStep("base-case", "depth-base-case", "function depth(node) { if (!node) return 0", "branch"),
    irStep("branch", "depth-children", "const leftDepth = depth(node.left); const rightDepth = depth(node.right)", "loop"),
    irStep("prune", "depth-left-dominant", "if (leftDepth > rightDepth) return leftDepth + 1", "branch"),
    irStep("traverse", "depth-return-right", "return rightDepth + 1 }", "update"),
    irStep("aggregate", "depth-run", "return depth(root)", "return"),
  ],
  35: [
    irStep("base-case", "same-base-both-null", "function sameTree(a, b) { if (!a && !b) return true", "branch"),
    irStep("branch", "same-shape-or-value-mismatch", "if (!a || !b || a.val !== b.val) return false", "branch"),
    irStep("prune", "same-left-subtree", "const sameLeft = sameTree(a.left, b.left)", "loop"),
    irStep("traverse", "same-right-subtree-and-return", "return sameLeft && sameTree(a.right, b.right) }", "update"),
    irStep("aggregate", "same-run", "return sameTree(p, q)", "return"),
  ],
  36: [
    irStep("base-case", "subtree-same-base", "function sameTree(a, b) { if (!a && !b) return true", "branch"),
    irStep("branch", "subtree-same-mismatch", "if (!a || !b || a.val !== b.val) return false; return sameTree(a.left, b.left) && sameTree(a.right, b.right) }", "loop"),
    irStep("prune", "subtree-contains-base", "function contains(node) { if (!node) return false; if (sameTree(node, subRoot)) return true", "branch"),
    irStep("traverse", "subtree-contains-children", "return contains(node.left) || contains(node.right) }", "update"),
    irStep("aggregate", "subtree-run", "return contains(root)", "return"),
  ],
  38: [
    irStep("base-case", "levelorder-init-root", "if (!root) return []", "branch"),
    irStep("branch", "levelorder-start-bfs", "const out = []; const queue = [root]; while (queue.length) { const size = queue.length; const level = []", "loop"),
    irStep(
      "prune",
      "levelorder-read-level",
      "for (let i = 0; i < size; i++) { const node = queue.shift(); level.push(node.val); if (node.left) queue.push(node.left); if (node.right) queue.push(node.right) }",
      "branch"
    ),
    irStep("traverse", "levelorder-close-level", "out.push(level) }", "update"),
    irStep("aggregate", "levelorder-return", "return out", "return"),
  ],
  39: [
    irStep("base-case", "validbst-base", "function valid(node, low, high) { if (!node) return true", "branch"),
    irStep("branch", "validbst-range-check", "if (!(low < node.val && node.val < high)) return false", "loop"),
    irStep("prune", "validbst-left", "const leftOk = valid(node.left, low, node.val)", "branch"),
    irStep("traverse", "validbst-right-and-return", "return leftOk && valid(node.right, node.val, high) }", "update"),
    irStep("aggregate", "validbst-run", "return valid(root, -Infinity, Infinity)", "return"),
  ],
  40: [
    irStep("base-case", "kth-init", "const stack = []; let node = root; let seen = 0", "branch"),
    irStep("branch", "kth-inorder-loop", "while (node || stack.length) { while (node) { stack.push(node); node = node.left }", "loop"),
    irStep("prune", "kth-visit-node", "node = stack.pop(); seen += 1; if (seen === k) return node.val", "branch"),
    irStep("traverse", "kth-move-right", "node = node.right }", "update"),
    irStep("aggregate", "kth-fallback", "return null", "return"),
  ],
  42: [
    irStep("base-case", "maxpath-init-and-base", "let best = -Infinity; function dfs(node) { if (!node) return 0", "branch"),
    irStep("branch", "maxpath-children", "const left = Math.max(0, dfs(node.left)); const right = Math.max(0, dfs(node.right))", "loop"),
    irStep("prune", "maxpath-update-best", "best = Math.max(best, node.val + left + right)", "branch"),
    irStep("traverse", "maxpath-return-branch", "return node.val + Math.max(left, right) }", "update"),
    irStep("aggregate", "maxpath-run", "dfs(root); return best === -Infinity ? 0 : best", "return"),
  ],
  43: [
    irStep("base-case", "codec-serialize-base", "function serializeTree(root) { if (!root) return '#'; const out = []; const queue = [root]", "branch"),
    irStep("branch", "codec-serialize-loop", "while (queue.length) { const node = queue.shift(); if (!node) { out.push('#'); continue } out.push(String(node.val)); queue.push(node.left || null); queue.push(node.right || null) }", "loop"),
    irStep("prune", "codec-serialize-return", "while (out.length > 1 && out[out.length - 1] === '#') out.pop(); return out.join(',') }", "branch"),
    irStep(
      "traverse",
      "codec-deserialize",
      "function deserializeTree(serialized) { const items = String(serialized || '').split(','); if (!items.length || items[0] === '#') return null; const rootNode = { val: Number(items[0]), left: null, right: null }; const queue = [rootNode]; let index = 1; while (queue.length && index < items.length) { const node = queue.shift(); const left = items[index++]; if (left !== undefined && left !== '#') { node.left = { val: Number(left), left: null, right: null }; queue.push(node.left) } const right = items[index++]; if (right !== undefined && right !== '#') { node.right = { val: Number(right), left: null, right: null }; queue.push(node.right) } } return rootNode }",
      "update"
    ),
    irStep("aggregate", "codec-run", "return deserializeTree(serializeTree(root))", "return"),
  ],
});

export const WAVE_3_PROBLEM_SPECS = [
  makeProblemSpec({
    questionId: 33,
    questionName: "Invert Binary Tree",
    strategyId: "q-33-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(h)" },
    constraints: treeConstraints(),
    samples: [{ root: [4, 2, 7, 1, 3, 6, 9] }, { root: [2, 1, 3] }],
    randomTrials: 40,
    solve: solveQ33,
    snippetName: "Invert Binary Tree | DFS swap children",
  }),
  makeProblemSpec({
    questionId: 34,
    questionName: "Maximum Depth of Binary Tree",
    strategyId: "q-34-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(h)" },
    constraints: treeConstraints(),
    samples: [{ root: [3, 9, 20, null, null, 15, 7] }, { root: [1, null, 2] }],
    randomTrials: 40,
    solve: solveQ34,
    snippetName: "Maximum Depth of Binary Tree | DFS depth",
  }),
  makeProblemSpec({
    questionId: 35,
    questionName: "Same Tree",
    strategyId: "q-35-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(h)" },
    constraints: treeConstraints(),
    samples: [{ p: [1, 2, 3], q: [1, 2, 3] }, { p: [1, 2], q: [1, null, 2] }],
    randomTrials: 40,
    solve: solveQ35,
    snippetName: "Same Tree | Structural and value recursion",
  }),
  makeProblemSpec({
    questionId: 36,
    questionName: "Subtree of Another Tree",
    strategyId: "q-36-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n*m) worst-case", space: "O(h)" },
    constraints: treeConstraints(),
    samples: [{ root: [3, 4, 5, 1, 2], subRoot: [4, 1, 2] }, { root: [3, 4, 5, 1, 2, null, null, null, null, 0], subRoot: [4, 1, 2] }],
    randomTrials: 40,
    solve: solveQ36,
    snippetName: "Subtree of Another Tree | Tree match at each node",
  }),
  makeProblemSpec({
    questionId: 37,
    questionName: "Lowest Common Ancestor of a BST",
    strategyId: "q-37-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(h)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 }, { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 4 }],
    randomTrials: 50,
    solve: solveQ37,
    snippetName: "Lowest Common Ancestor of a BST | BST property walk",
  }),
  makeProblemSpec({
    questionId: 38,
    questionName: "Binary Tree Level Order Traversal",
    strategyId: "q-38-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: treeConstraints(),
    samples: [{ root: [3, 9, 20, null, null, 15, 7] }, { root: [1] }],
    randomTrials: 50,
    solve: solveQ38,
    snippetName: "Binary Tree Level Order Traversal | BFS queue",
  }),
  makeProblemSpec({
    questionId: 39,
    questionName: "Validate Binary Search Tree",
    strategyId: "q-39-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(h)" },
    constraints: treeConstraints(),
    samples: [{ root: [2, 1, 3] }, { root: [5, 1, 4, null, null, 3, 6] }],
    randomTrials: 50,
    solve: solveQ39,
    snippetName: "Validate Binary Search Tree | Range recursion",
  }),
  makeProblemSpec({
    questionId: 40,
    questionName: "Kth Smallest Element in a BST",
    strategyId: "q-40-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(h + k)", space: "O(h)" },
    constraints: treeConstraints(),
    samples: [{ root: [3, 1, 4, null, 2], k: 1 }, { root: [5, 3, 6, 2, 4, null, null, 1], k: 3 }],
    randomTrials: 50,
    solve: solveQ40,
    snippetName: "Kth Smallest Element in a BST | Iterative inorder",
  }),
  makeProblemSpec({
    questionId: 41,
    questionName: "Construct Binary Tree from Preorder and Inorder",
    strategyId: "q-41-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "tree-structure-equivalent", disallowTokens: [] },
    samples: [{ preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] }, { preorder: [-1], inorder: [-1] }],
    randomTrials: 50,
    solve: solveQ41,
    snippetName: "Construct Binary Tree from Preorder and Inorder | Index map recursion",
  }),
  makeProblemSpec({
    questionId: 42,
    questionName: "Binary Tree Maximum Path Sum",
    strategyId: "q-42-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(h)" },
    constraints: treeConstraints(),
    samples: [{ root: [1, 2, 3] }, { root: [-10, 9, 20, null, null, 15, 7] }],
    randomTrials: 60,
    solve: solveQ42,
    snippetName: "Binary Tree Maximum Path Sum | Postorder gain + global best",
  }),
  makeProblemSpec({
    questionId: 43,
    questionName: "Serialize and Deserialize Binary Tree",
    strategyId: "q-43-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "tree-structure-equivalent", disallowTokens: [] },
    samples: [{ root: [1, 2, 3, null, null, 4, 5] }, { root: [] }],
    randomTrials: 60,
    solve: solveQ43,
    snippetName: "Serialize and Deserialize Binary Tree | BFS codec roundtrip",
  }),
  makeProblemSpec({
    questionId: 44,
    questionName: "Implement Trie (Prefix Tree)",
    strategyId: "q-44-problem-specific",
    templateId: TREE_GRAPH_TEMPLATE_ID,
    complexity: { time: "O(total operation chars)", space: "O(total chars)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ operations: [["insert", "apple"], ["search", "apple"], ["search", "app"], ["startsWith", "app"], ["insert", "app"], ["search", "app"]] }],
    randomTrials: 50,
    solve: solveQ44,
    snippetName: "Implement Trie (Prefix Tree) | Insert/search/prefix traversal",
  }),
  makeProblemSpec({
    questionId: 45,
    questionName: "Word Search II",
    strategyId: "q-45-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "O(m*n*4^L) worst-case", space: "O(total trie chars)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ board: [["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], words: ["oath", "pea", "eat", "rain"] }, { board: [["a", "b"], ["c", "d"]], words: ["abcb"] }],
    randomTrials: 60,
    solve: solveQ45,
    snippetName: "Word Search II | Trie-guided backtracking",
  }),
  makeProblemSpec({
    questionId: 46,
    questionName: "Find Median from Data Stream",
    strategyId: "q-46-problem-specific",
    templateId: STACK_HEAP_TEMPLATE_ID,
    complexity: { time: "O(log n) update, O(1) median", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ operations: [["addNum", 1], ["addNum", 2], ["findMedian"], ["addNum", 3], ["findMedian"]] }],
    randomTrials: 60,
    solve: solveQ46,
    snippetName: "Find Median from Data Stream | Two-heaps behavior",
  }),
  makeProblemSpec({
    questionId: 47,
    questionName: "Combination Sum",
    strategyId: "q-47-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "exponential", space: "O(target)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ candidates: [2, 3, 6, 7], target: 7 }, { candidates: [2, 3, 5], target: 8 }],
    randomTrials: 50,
    solve: solveQ47,
    snippetName: "Combination Sum | Unbounded include recursion",
  }),
  makeProblemSpec({
    questionId: 48,
    questionName: "Word Search",
    strategyId: "q-48-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "O(m*n*4^L)", space: "O(L)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCCED" }, { board: [["A", "B"], ["C", "D"]], word: "ABCD" }],
    randomTrials: 50,
    solve: solveQ48,
    snippetName: "Word Search | DFS path backtracking",
  }),
  makeProblemSpec({
    questionId: 49,
    questionName: "Subsets",
    strategyId: "q-49-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "O(n*2^n)", space: "O(n*2^n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [1, 2, 3] }, { nums: [0] }],
    randomTrials: 50,
    solve: solveQ49,
    snippetName: "Subsets | Include/exclude expansion",
  }),
  makeProblemSpec({
    questionId: 50,
    questionName: "Permutations",
    strategyId: "q-50-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "O(n*n!)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [1, 2, 3] }, { nums: [0, 1] }],
    randomTrials: 50,
    solve: solveQ50,
    snippetName: "Permutations | Used-set backtracking",
  }),
  makeProblemSpec({
    questionId: 51,
    questionName: "Palindrome Partitioning",
    strategyId: "q-51-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "exponential", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "aab" }, { s: "a" }],
    randomTrials: 50,
    solve: solveQ51,
    snippetName: "Palindrome Partitioning | Partition DFS with palindrome checks",
  }),
  makeProblemSpec({
    questionId: 52,
    questionName: "Letter Combinations of a Phone Number",
    strategyId: "q-52-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "O(4^n)", space: "O(4^n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ digits: "23" }, { digits: "" }],
    randomTrials: 50,
    solve: solveQ52,
    snippetName: "Letter Combinations of a Phone Number | Digit-cartesian expansion",
  }),
  makeProblemSpec({
    questionId: 53,
    questionName: "N-Queens",
    strategyId: "q-53-problem-specific",
    templateId: BACKTRACKING_TEMPLATE_ID,
    complexity: { time: "O(n!)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ n: 4 }, { n: 1 }],
    randomTrials: 60,
    solve: solveQ53,
    snippetName: "N-Queens | Column/diagonal-constrained backtracking",
  }),
].map((spec) => ({
  ...spec,
  ir: WORLD0_WAVE3_IR_OVERRIDES[spec.questionId] || buildProblemIr(spec.templateId, spec.questionName, spec.solve),
}));

export function createWave3Strategies() {
  return createStrategiesFromProblemSpecs(WAVE_3_PROBLEM_SPECS);
}
