export const DEFAULT_BLUEPRINT_TEMPLATE_ID = "standard_algo_flow";
export const BACKTRACKING_TEMPLATE_ID = "backtracking_flow";
export const RECURSIVE_TOP_DOWN_TEMPLATE_ID = "recursive_top_down_flow";

export const BLUEPRINT_TEMPLATES = {
  [DEFAULT_BLUEPRINT_TEMPLATE_ID]: {
    id: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    name: "Standard Algorithm Flow",
    slots: [
      { id: "setup", name: "Setup", icon: "S", color: "#818CF8", desc: "Initialize variables" },
      { id: "loop", name: "Loop", icon: "L", color: "#34D399", desc: "Define iteration" },
      { id: "update", name: "Update", icon: "U", color: "#60A5FA", desc: "Update state each step" },
      { id: "check", name: "Check", icon: "C", color: "#FBBF24", desc: "Conditions and invariants" },
      { id: "return", name: "Return", icon: "R", color: "#F472B6", desc: "Return the answer" },
    ],
  },
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
    name: "Backtracking / Tree / DP (Top-down)",
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
};

export function getBlueprintTemplate(templateId) {
  return BLUEPRINT_TEMPLATES[templateId] || BLUEPRINT_TEMPLATES[DEFAULT_BLUEPRINT_TEMPLATE_ID];
}

export function getTemplateSlotIds(templateId) {
  return getBlueprintTemplate(templateId).slots.map((slot) => slot.id);
}
