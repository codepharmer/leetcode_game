import { canonicalGroupOutput, canonicalTriplets, deepEqual, sameNumberMembers } from "./shared";

function normalizeListNodeLike(value) {
  if (!value) return [];
  if (Array.isArray(value)) return [...value];

  const out = [];
  const seen = new Set();
  let node = value;
  while (node && typeof node === "object" && !seen.has(node)) {
    seen.add(node);
    if ("val" in node) out.push(node.val);
    else if ("value" in node) out.push(node.value);
    else break;
    node = node.next;
  }
  return out;
}

function normalizeTreeLike(root) {
  if (!root) return [];
  if (Array.isArray(root)) return [...root];

  const queue = [root];
  const out = [];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      out.push(null);
      continue;
    }
    if (typeof node !== "object") {
      out.push(node);
      continue;
    }
    const value = "val" in node ? node.val : ("value" in node ? node.value : null);
    out.push(value);
    queue.push(node.left || null);
    queue.push(node.right || null);
  }

  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}

function validTopologicalOrder(input, order) {
  const list = Array.isArray(order) ? order : [];
  const numCourses = Number(input?.numCourses || 0);
  const prerequisites = Array.isArray(input?.prerequisites) ? input.prerequisites : [];
  if (numCourses <= 0) return list.length === 0;
  if (list.length !== numCourses) return false;

  const index = new Map();
  for (let i = 0; i < list.length; i += 1) {
    const course = Number(list[i]);
    if (!Number.isInteger(course) || course < 0 || course >= numCourses || index.has(course)) return false;
    index.set(course, i);
  }

  for (const edge of prerequisites) {
    const [course, prereq] = edge || [];
    if (!index.has(course) || !index.has(prereq)) return false;
    if (index.get(prereq) > index.get(course)) return false;
  }
  return true;
}

function compareUnorderedNested(got, expected) {
  return deepEqual(canonicalGroupOutput(got), canonicalGroupOutput(expected));
}

function compareUnorderedTriplets(got, expected) {
  return deepEqual(canonicalTriplets(got), canonicalTriplets(expected));
}

export function compareByOutputMode({ mode, input, got, expected, normalizeResult }) {
  switch (mode) {
    case "unordered-number-members":
      return sameNumberMembers(got, expected);
    case "unordered-nested-members":
      return compareUnorderedNested(got, expected);
    case "unordered-triplets":
      return compareUnorderedTriplets(got, expected);
    case "linked-list-equivalent":
      return deepEqual(normalizeListNodeLike(got), normalizeListNodeLike(expected));
    case "tree-structure-equivalent":
      return deepEqual(normalizeTreeLike(got), normalizeTreeLike(expected));
    case "topological-order":
      return validTopologicalOrder(input, got);
    case "normalized":
      if (typeof normalizeResult === "function") {
        return deepEqual(normalizeResult(got), normalizeResult(expected));
      }
      return deepEqual(got, expected);
    default:
      if (typeof normalizeResult === "function") {
        return deepEqual(normalizeResult(got), normalizeResult(expected));
      }
      return deepEqual(got, expected);
  }
}

export { validTopologicalOrder };
