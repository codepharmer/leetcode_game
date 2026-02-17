import { TEMPLATE_CANONICAL_SLOT_ROLE_MAP, getTemplateSlotIds } from "./templates";
import { pythonizeCardText } from "./pythonSyntax";

function titleCaseSlot(slotId) {
  return String(slotId || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function isCommentOnlyCardText(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return true;
  if (/^(\/\/|#)/.test(trimmed)) return true;
  if (/^\/\*[\s\S]*\*\/$/.test(trimmed)) return true;
  if (/^\*+/.test(trimmed)) return true;
  return false;
}

export function buildCardsFromIr({ levelId, templateId, irNodes }) {
  const slotIds = getTemplateSlotIds(templateId);
  const slotIdSet = new Set(slotIds);
  const nextOrderBySlot = Object.fromEntries(slotIds.map((slotId) => [slotId, 0]));
  const slotRoleMap = TEMPLATE_CANONICAL_SLOT_ROLE_MAP[templateId] || {};

  const cards = [];
  for (const node of irNodes || []) {
    const rawSlotId = String(node?.slot || "");
    const slotId = slotIdSet.has(rawSlotId) ? rawSlotId : (slotRoleMap[rawSlotId] || rawSlotId);
    const execText = String(node?.text || "").trim();
    if (!slotIdSet.has(slotId) || isCommentOnlyCardText(execText)) continue;

    const text = pythonizeCardText(execText);

    const order = nextOrderBySlot[slotId] || 0;
    nextOrderBySlot[slotId] = order + 1;

    cards.push({
      id: `${levelId}-c${cards.length + 1}`,
      text,
      execText,
      correctSlot: slotId,
      correctOrder: order,
      key: String(node?.key || `ir-${slotId}-${cards.length + 1}`),
      hint: titleCaseSlot(slotId),
      op: node?.op ? String(node.op) : "step",
    });
  }

  return cards;
}

export function buildSlotLimits(cards) {
  const limits = {};
  for (const card of cards || []) {
    if (!card?.correctSlot) continue;
    limits[card.correctSlot] = (limits[card.correctSlot] || 0) + 1;
  }
  return limits;
}
