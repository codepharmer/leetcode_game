export const DEFAULT_BLUEPRINT_TEMPLATE_ID = "standard_algo_flow";
export const ARRAY_HASHING_TEMPLATE_ID = "array_hashing_flow";
export const TWO_POINTERS_TEMPLATE_ID = "two_pointers_flow";
export const SLIDING_WINDOW_TEMPLATE_ID = "sliding_window_flow";
export const STACK_HEAP_TEMPLATE_ID = "stack_heap_flow";
export const BINARY_SEARCH_TEMPLATE_ID = "binary_search_flow";
export const LINKED_LIST_TEMPLATE_ID = "linked_list_flow";
export const INTERVAL_GREEDY_TEMPLATE_ID = "interval_greedy_flow";
export const BACKTRACKING_TEMPLATE_ID = "backtracking_flow";
export const RECURSIVE_TOP_DOWN_TEMPLATE_ID = "recursive_top_down_flow";
export const TREE_GRAPH_TEMPLATE_ID = "tree_graph_flow";
export const DP_STATE_TEMPLATE_ID = "dp_state_flow";

const BASE_SLOT_DEFS = {
  setup: { icon: "S", color: "#818CF8", desc: "Initialize variables" },
  loop: { icon: "L", color: "#34D399", desc: "Define iteration" },
  update: { icon: "U", color: "#60A5FA", desc: "Update state each step" },
  check: { icon: "C", color: "#FBBF24", desc: "Conditions and invariants" },
  return: { icon: "R", color: "#F472B6", desc: "Return the answer" },
};

function makeSlot(id, name, icon, color, desc) {
  return { id, name, icon, color, desc };
}

function makeStandardFamilyTemplate(templateId, templateName, roleNames) {
  return {
    id: templateId,
    name: templateName,
    slots: [
      makeSlot(roleNames.setup.id, roleNames.setup.name, "S", "#818CF8", roleNames.setup.desc),
      makeSlot(roleNames.loop.id, roleNames.loop.name, "L", "#34D399", roleNames.loop.desc),
      makeSlot(roleNames.update.id, roleNames.update.name, "U", "#60A5FA", roleNames.update.desc),
      makeSlot(roleNames.check.id, roleNames.check.name, "C", "#FBBF24", roleNames.check.desc),
      makeSlot(roleNames.return.id, roleNames.return.name, "R", "#F472B6", roleNames.return.desc),
    ],
  };
}

function makeRecursiveFamilyTemplate(templateId, templateName, roleNames) {
  return {
    id: templateId,
    name: templateName,
    slots: [
      makeSlot(roleNames.base.id, roleNames.base.name, "B", "#818CF8", roleNames.base.desc),
      makeSlot(roleNames.choose.id, roleNames.choose.name, "C", "#34D399", roleNames.choose.desc),
      makeSlot(roleNames.constrain.id, roleNames.constrain.name, "P", "#F59E0B", roleNames.constrain.desc),
      makeSlot(roleNames.explore.id, roleNames.explore.name, "E", "#60A5FA", roleNames.explore.desc),
      makeSlot(roleNames.combine.id, roleNames.combine.name, "M", "#F472B6", roleNames.combine.desc),
    ],
  };
}

export const TEMPLATE_CLASSIFICATION_FAMILY = {
  [DEFAULT_BLUEPRINT_TEMPLATE_ID]: "standard",
  [ARRAY_HASHING_TEMPLATE_ID]: "standard",
  [TWO_POINTERS_TEMPLATE_ID]: "standard",
  [SLIDING_WINDOW_TEMPLATE_ID]: "standard",
  [STACK_HEAP_TEMPLATE_ID]: "standard",
  [BINARY_SEARCH_TEMPLATE_ID]: "standard",
  [LINKED_LIST_TEMPLATE_ID]: "standard",
  [INTERVAL_GREEDY_TEMPLATE_ID]: "standard",
  [BACKTRACKING_TEMPLATE_ID]: "backtracking",
  [RECURSIVE_TOP_DOWN_TEMPLATE_ID]: "recursive",
  [TREE_GRAPH_TEMPLATE_ID]: "recursive",
  [DP_STATE_TEMPLATE_ID]: "recursive",
};

export const TEMPLATE_CANONICAL_SLOT_ROLE_MAP = {
  [DEFAULT_BLUEPRINT_TEMPLATE_ID]: {
    setup: "setup",
    loop: "loop",
    update: "update",
    check: "check",
    return: "return",
  },
  [ARRAY_HASHING_TEMPLATE_ID]: {
    setup: "seed",
    loop: "scan",
    update: "record",
    check: "match",
    return: "emit",
  },
  [TWO_POINTERS_TEMPLATE_ID]: {
    setup: "anchors",
    loop: "converge",
    update: "shift",
    check: "compare",
    return: "emit",
  },
  [SLIDING_WINDOW_TEMPLATE_ID]: {
    setup: "bootstrap",
    loop: "expand",
    update: "shrink",
    check: "window-check",
    return: "emit",
  },
  [STACK_HEAP_TEMPLATE_ID]: {
    setup: "init-structure",
    loop: "iterate",
    update: "push-pop",
    check: "resolve",
    return: "emit",
  },
  [BINARY_SEARCH_TEMPLATE_ID]: {
    setup: "bounds",
    loop: "halve",
    update: "move-bounds",
    check: "mid-check",
    return: "emit",
  },
  [LINKED_LIST_TEMPLATE_ID]: {
    setup: "anchors",
    loop: "walk",
    update: "relink",
    check: "guard",
    return: "emit",
  },
  [INTERVAL_GREEDY_TEMPLATE_ID]: {
    setup: "order",
    loop: "sweep",
    update: "commit",
    check: "overlap",
    return: "emit",
  },
  [BACKTRACKING_TEMPLATE_ID]: {
    choose: "choose",
    constrain: "constrain",
    base: "base",
    explore: "explore",
    return: "return",
  },
  [RECURSIVE_TOP_DOWN_TEMPLATE_ID]: {
    base: "base",
    choose: "choose",
    constrain: "constrain",
    explore: "explore",
    combine: "combine",
  },
  [TREE_GRAPH_TEMPLATE_ID]: {
    base: "base-case",
    choose: "branch",
    constrain: "prune",
    explore: "traverse",
    combine: "aggregate",
  },
  [DP_STATE_TEMPLATE_ID]: {
    base: "base-state",
    choose: "subproblem",
    constrain: "state-guard",
    explore: "transition",
    combine: "memoize",
  },
};

export const BLUEPRINT_TEMPLATES = {
  [DEFAULT_BLUEPRINT_TEMPLATE_ID]: {
    id: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    name: "Standard Algorithm Flow",
    slots: [
      makeSlot("setup", "Setup", BASE_SLOT_DEFS.setup.icon, BASE_SLOT_DEFS.setup.color, BASE_SLOT_DEFS.setup.desc),
      makeSlot("loop", "Loop", BASE_SLOT_DEFS.loop.icon, BASE_SLOT_DEFS.loop.color, BASE_SLOT_DEFS.loop.desc),
      makeSlot("update", "Update", BASE_SLOT_DEFS.update.icon, BASE_SLOT_DEFS.update.color, BASE_SLOT_DEFS.update.desc),
      makeSlot("check", "Check", BASE_SLOT_DEFS.check.icon, BASE_SLOT_DEFS.check.color, BASE_SLOT_DEFS.check.desc),
      makeSlot("return", "Return", BASE_SLOT_DEFS.return.icon, BASE_SLOT_DEFS.return.color, BASE_SLOT_DEFS.return.desc),
    ],
  },
  [ARRAY_HASHING_TEMPLATE_ID]: makeStandardFamilyTemplate(
    ARRAY_HASHING_TEMPLATE_ID,
    "Array / Hashing Flow",
    {
      setup: { id: "seed", name: "SEED", desc: "Initialize map/set/counter state" },
      loop: { id: "scan", name: "SCAN", desc: "Iterate values or keys once" },
      update: { id: "record", name: "RECORD", desc: "Write hash/frequency/prefix updates" },
      check: { id: "match", name: "MATCH", desc: "Check complement/signature/invariant" },
      return: { id: "emit", name: "EMIT", desc: "Return answer structure" },
    }
  ),
  [TWO_POINTERS_TEMPLATE_ID]: makeStandardFamilyTemplate(
    TWO_POINTERS_TEMPLATE_ID,
    "Two Pointers Flow",
    {
      setup: { id: "anchors", name: "ANCHORS", desc: "Initialize pointer anchors" },
      loop: { id: "converge", name: "CONVERGE", desc: "Advance until pointers meet" },
      update: { id: "shift", name: "SHIFT", desc: "Move left/right pointer(s)" },
      check: { id: "compare", name: "COMPARE", desc: "Evaluate pair/triplet condition" },
      return: { id: "emit", name: "EMIT", desc: "Return best pair/result" },
    }
  ),
  [SLIDING_WINDOW_TEMPLATE_ID]: makeStandardFamilyTemplate(
    SLIDING_WINDOW_TEMPLATE_ID,
    "Sliding Window Flow",
    {
      setup: { id: "bootstrap", name: "BOOTSTRAP", desc: "Initialize bounds and counters" },
      loop: { id: "expand", name: "EXPAND", desc: "Grow window with right bound" },
      update: { id: "shrink", name: "SHRINK", desc: "Shrink left bound when invalid" },
      check: { id: "window-check", name: "WINDOW CHECK", desc: "Check validity and update answer" },
      return: { id: "emit", name: "EMIT", desc: "Return best window metric" },
    }
  ),
  [STACK_HEAP_TEMPLATE_ID]: makeStandardFamilyTemplate(
    STACK_HEAP_TEMPLATE_ID,
    "Stack / Heap Flow",
    {
      setup: { id: "init-structure", name: "INIT STRUCTURE", desc: "Initialize stack/heap/deque" },
      loop: { id: "iterate", name: "ITERATE", desc: "Scan incoming elements/events" },
      update: { id: "push-pop", name: "PUSH/POP", desc: "Maintain structure invariants" },
      check: { id: "resolve", name: "RESOLVE", desc: "Resolve waiting indices/tasks" },
      return: { id: "emit", name: "EMIT", desc: "Return extracted answer" },
    }
  ),
  [BINARY_SEARCH_TEMPLATE_ID]: makeStandardFamilyTemplate(
    BINARY_SEARCH_TEMPLATE_ID,
    "Binary Search Flow",
    {
      setup: { id: "bounds", name: "BOUNDS", desc: "Initialize low/high search bounds" },
      loop: { id: "halve", name: "HALVE", desc: "Iteratively split search range" },
      update: { id: "move-bounds", name: "MOVE BOUNDS", desc: "Move left/right boundary" },
      check: { id: "mid-check", name: "MID CHECK", desc: "Check midpoint predicate" },
      return: { id: "emit", name: "EMIT", desc: "Return found index/answer bound" },
    }
  ),
  [LINKED_LIST_TEMPLATE_ID]: makeStandardFamilyTemplate(
    LINKED_LIST_TEMPLATE_ID,
    "Linked List Flow",
    {
      setup: { id: "anchors", name: "ANCHORS", desc: "Initialize prev/slow/fast pointers" },
      loop: { id: "walk", name: "WALK", desc: "Traverse node by node" },
      update: { id: "relink", name: "RELINK", desc: "Mutate next pointers safely" },
      check: { id: "guard", name: "GUARD", desc: "Handle edge cases and stop conditions" },
      return: { id: "emit", name: "EMIT", desc: "Return new head/result node" },
    }
  ),
  [INTERVAL_GREEDY_TEMPLATE_ID]: makeStandardFamilyTemplate(
    INTERVAL_GREEDY_TEMPLATE_ID,
    "Intervals / Greedy Flow",
    {
      setup: { id: "order", name: "ORDER", desc: "Sort by start/end or prepare state" },
      loop: { id: "sweep", name: "SWEEP", desc: "Sweep through ordered candidates" },
      update: { id: "commit", name: "COMMIT", desc: "Accept/merge current candidate" },
      check: { id: "overlap", name: "OVERLAP CHECK", desc: "Check overlap/conflict feasibility" },
      return: { id: "emit", name: "EMIT", desc: "Return merged/optimal count" },
    }
  ),
  [BACKTRACKING_TEMPLATE_ID]: {
    id: BACKTRACKING_TEMPLATE_ID,
    name: "Backtracking Flow",
    slots: [
      { id: "choose", name: "CHOOSE", icon: "C", color: "#34D399", desc: "Define the choices at each step" },
      { id: "constrain", name: "CONSTRAIN", icon: "P", color: "#F59E0B", desc: "Filter out invalid choices (pruning)" },
      { id: "base", name: "BASE", icon: "B", color: "#818CF8", desc: "When to stop recursing and collect a result" },
      { id: "explore", name: "EXPLORE", icon: "E", color: "#60A5FA", desc: "Make a choice, recurse, undo the choice" },
      { id: "return", name: "RETURN", icon: "R", color: "#F472B6", desc: "Aggregate or return results" },
    ],
  },
  [RECURSIVE_TOP_DOWN_TEMPLATE_ID]: {
    id: RECURSIVE_TOP_DOWN_TEMPLATE_ID,
    name: "Recursive Top-down Flow",
    slots: [
      {
        id: "base",
        name: "BASE",
        icon: "B",
        color: "#818CF8",
        desc: "Solution found / dead end; Null node / leaf; Already computed (memo hit)",
      },
      {
        id: "choose",
        name: "CHOOSE",
        icon: "C",
        color: "#34D399",
        desc: "Generate candidates; Left / right child; Subproblem choices",
      },
      { id: "constrain", name: "CONSTRAIN", icon: "P", color: "#F59E0B", desc: "Prune invalid paths" },
      {
        id: "explore",
        name: "EXPLORE",
        icon: "E",
        color: "#60A5FA",
        desc: "Recurse + undo; Recurse on children; Recurse on subproblems",
      },
      {
        id: "combine",
        name: "COMBINE",
        icon: "M",
        color: "#F472B6",
        desc: "Collect into result list; Merge subtree answers; min/max/sum of subresults",
      },
    ],
  },
  [TREE_GRAPH_TEMPLATE_ID]: makeRecursiveFamilyTemplate(
    TREE_GRAPH_TEMPLATE_ID,
    "Tree / Graph Traversal Flow",
    {
      base: { id: "base-case", name: "BASE CASE", desc: "Stop at null/visited/terminal nodes" },
      choose: { id: "branch", name: "BRANCH", desc: "Select children or neighbor frontier" },
      constrain: { id: "prune", name: "PRUNE", desc: "Reject invalid edges, revisits, cycles" },
      explore: { id: "traverse", name: "TRAVERSE", desc: "Traverse DFS/BFS/recursive branch" },
      combine: { id: "aggregate", name: "AGGREGATE", desc: "Merge traversal results" },
    }
  ),
  [DP_STATE_TEMPLATE_ID]: makeRecursiveFamilyTemplate(
    DP_STATE_TEMPLATE_ID,
    "Dynamic Programming State Flow",
    {
      base: { id: "base-state", name: "BASE STATE", desc: "Initialize base cases" },
      choose: { id: "subproblem", name: "SUBPROBLEM", desc: "Select prior state(s)" },
      constrain: { id: "state-guard", name: "STATE GUARD", desc: "Skip invalid transitions" },
      explore: { id: "transition", name: "TRANSITION", desc: "Compute next state value" },
      combine: { id: "memoize", name: "MEMOIZE", desc: "Store/return optimal state" },
    }
  ),
};

export function getBlueprintTemplate(templateId) {
  return BLUEPRINT_TEMPLATES[templateId] || BLUEPRINT_TEMPLATES[DEFAULT_BLUEPRINT_TEMPLATE_ID];
}

export function getTemplateSlotIds(templateId) {
  return getBlueprintTemplate(templateId).slots.map((slot) => slot.id);
}
