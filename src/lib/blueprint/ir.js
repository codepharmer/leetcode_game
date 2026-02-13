import { getTemplateSlotIds } from "./templates";

function titleCaseSlot(slotId) {
  return String(slotId || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildCardsFromIr({ levelId, templateId, irNodes }) {
  const slotIds = getTemplateSlotIds(templateId);
  const slotIdSet = new Set(slotIds);
  const nextOrderBySlot = Object.fromEntries(slotIds.map((slotId) => [slotId, 0]));

  const cards = [];
  for (const node of irNodes || []) {
    const slotId = String(node?.slot || "");
    const text = String(node?.text || "").trim();
    if (!slotIdSet.has(slotId) || !text) continue;

    const order = nextOrderBySlot[slotId] || 0;
    nextOrderBySlot[slotId] = order + 1;

    cards.push({
      id: `${levelId}-c${cards.length + 1}`,
      text,
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
