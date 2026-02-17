import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { getBlueprintCampaign } from "../lib/blueprint/campaign";
import { buildBlueprintChallengePath } from "../lib/routes";
import { BlueprintScreen } from "./BlueprintScreen";

function renderBlueprint({
  path = "/blueprint",
  goMenu = vi.fn(),
  initialStars = {},
  onSaveStars = vi.fn(),
} = {}) {
  return {
    goMenu,
    onSaveStars,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/blueprint/*"
            element={<BlueprintScreen goMenu={goMenu} initialStars={initialStars} onSaveStars={onSaveStars} />}
          />
        </Routes>
      </MemoryRouter>
    ),
  };
}

function getRequiredSlotCount(level) {
  return (level?.cards || []).filter((card) => card?.correctSlot).length;
}

function findChallenge(predicate) {
  const campaign = getBlueprintCampaign({});
  for (const world of campaign?.worlds || []) {
    for (const stage of world?.stages || []) {
      for (const tier of stage?.tiers || []) {
        for (const challenge of tier?.challenges || []) {
          if (predicate(challenge)) return challenge;
        }
      }
    }
  }
  return null;
}

function findChallengeByRequiredSlotCount(predicate) {
  return findChallenge((challenge) => predicate(getRequiredSlotCount(challenge?.level), challenge));
}

function findChallengeByTitle(titlePart) {
  const safe = String(titlePart || "").toLowerCase();
  return findChallenge((challenge) => {
    const title = String(challenge?.level?.title || challenge?.title || "").toLowerCase();
    return title.includes(safe);
  });
}

function tapPlaceCard(cardId, slotId) {
  fireEvent.click(screen.getByTestId(`blueprint-deck-card-${cardId}`));
  fireEvent.click(screen.getByTestId(`blueprint-slot-${slotId}`));
}

describe("screens/BlueprintScreen", () => {
  it("renders world menu and supports returning to app menu", () => {
    const goMenu = vi.fn();
    renderBlueprint({ goMenu, initialStars: { 1: 2 } });

    expect(screen.getByText("Blueprint Builder")).toBeInTheDocument();
    expect(screen.getByText(/Hash Maps & Sets/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Challenge/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^stats$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(goMenu).toHaveBeenCalled();
  });

  it("opens a challenge and can navigate back to world list", () => {
    renderBlueprint();

    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));
    expect(screen.getByTestId("blueprint-solve-mode")).toHaveTextContent(/mode flat/i);
    expect(screen.getByText("Run Blueprint")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /worlds/i }));
    expect(screen.getByText(/Hash Maps & Sets/i)).toBeInTheDocument();
  });

  it("allows replaying already-solved earlier tier challenges", () => {
    renderBlueprint({
      path: "/blueprint/world/1",
      initialStars: {
        "q-1": 1,
        "q-2": 1,
      },
    });

    const twoSumButton = screen.getByRole("button", { name: /Two Sum/i });
    expect(twoSumButton).not.toBeDisabled();

    fireEvent.click(twoSumButton);
    expect(screen.getByText("Run Blueprint")).toBeInTheDocument();
  });

  it("keeps all world 0 questions playable by default", () => {
    renderBlueprint({ path: "/blueprint/world/0" });

    const firstProblem = screen.getByRole("button", { name: /Two Sum/i });
    const lateProblem = screen.getByRole("button", { name: /Course Schedule/i });

    expect(firstProblem).not.toBeDisabled();
    expect(lateProblem).not.toBeDisabled();
  });

  it("uses a single world-detail nav bar with worlds back, title, and progress/stars meta", () => {
    renderBlueprint({
      path: "/blueprint/world/1",
      initialStars: {
        "q-1": 2,
        "q-2": 3,
      },
    });

    expect(screen.getByRole("button", { name: /^worlds$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^back$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/World 1 Set 1: Hash Maps & Sets/i)).toBeInTheDocument();
    expect(screen.getByTestId("blueprint-world-progress")).toHaveTextContent("2/8");
    expect(screen.getByTestId("blueprint-world-stars")).toHaveTextContent("stars: 5");
  });

  it("uses a single daily nav back button", () => {
    renderBlueprint({ path: "/blueprint/daily" });

    expect(screen.getByRole("button", { name: /^worlds$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^back$/i })).not.toBeInTheDocument();
  });

  it("shows a live countdown while building", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-02-15T12:00:00.000Z"));
      renderBlueprint();

      fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));
      expect(screen.getByText(/left 5:00/i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText(/left 4:58/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows soft-gated worlds", () => {
    renderBlueprint();

    expect(screen.getAllByText(/Complete 2 worlds to unlock/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Complete 5 worlds to unlock/i).length).toBeGreaterThan(0);
  });

  it("uses phased mode for larger challenges and advances active phase after checking", () => {
    const phasedChallenge = findChallengeByRequiredSlotCount((count) => count > 10);
    expect(phasedChallenge).toBeTruthy();
    renderBlueprint({ path: buildBlueprintChallengePath(phasedChallenge.id) });

    expect(screen.getByTestId("blueprint-solve-mode")).toHaveTextContent(/mode phased/i);

    const activeState = screen.getAllByTestId(/blueprint-phase-state-/).find((node) => /active/i.test(String(node.textContent || "")));
    const lockedState = screen.getAllByTestId(/blueprint-phase-state-/).find((node) => /locked/i.test(String(node.textContent || "")));
    expect(activeState).toBeTruthy();
    expect(lockedState).toBeTruthy();

    const activeSlotId = activeState.getAttribute("data-slot-id");
    const lockedSlotId = lockedState.getAttribute("data-slot-id");
    const activeSlot = screen.getByTestId(`blueprint-slot-${activeSlotId}`);
    const lockedSlot = screen.getByTestId(`blueprint-slot-${lockedSlotId}`);

    const cardsForActiveSlot = (phasedChallenge.level.cards || [])
      .filter((card) => String(card?.correctSlot || "") === activeSlotId)
      .sort((a, b) => (a?.correctOrder || 0) - (b?.correctOrder || 0));

    const firstCardId = String(cardsForActiveSlot[0]?.id || "");
    expect(firstCardId).toBeTruthy();

    fireEvent.click(screen.getByTestId(`blueprint-deck-card-${firstCardId}`));
    fireEvent.click(lockedSlot);
    expect(within(lockedSlot).queryByTestId(new RegExp(`blueprint-placed-card-${firstCardId}`))).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`blueprint-deck-card-${firstCardId}`));

    for (const card of cardsForActiveSlot) {
      tapPlaceCard(card.id, activeSlotId);
    }

    const checkButton = screen.getByTestId("blueprint-check-phase-btn");
    expect(checkButton).toHaveTextContent(/^Check /i);
    fireEvent.click(checkButton);

    expect(screen.getByTestId(`blueprint-phase-state-${activeSlotId}`)).toHaveTextContent(/completed/i);
    const nextActive = screen.getAllByTestId(/blueprint-phase-state-/).find((node) => /active/i.test(String(node.textContent || "")));
    expect(nextActive).toBeTruthy();
    expect(nextActive.getAttribute("data-slot-id")).not.toBe(activeSlotId);
    expect(activeSlot).toBeInTheDocument();
  });

  it("shows completion overlay for phased mode and saves stars after continue", async () => {
    const phasedChallenge = findChallengeByRequiredSlotCount((count) => count > 10);
    expect(phasedChallenge).toBeTruthy();

    const { onSaveStars } = renderBlueprint({ path: buildBlueprintChallengePath(phasedChallenge.id) });

    const slotOrder = phasedChallenge.level.slots || [];
    for (const slotId of slotOrder) {
      const expectedCards = (phasedChallenge.level.cards || [])
        .filter((card) => String(card?.correctSlot || "") === String(slotId))
        .sort((a, b) => (a?.correctOrder || 0) - (b?.correctOrder || 0));
      if (expectedCards.length === 0) continue;

      const activeState = screen.getAllByTestId(/blueprint-phase-state-/).find((node) => /active/i.test(String(node.textContent || "")));
      expect(activeState).toBeTruthy();
      expect(activeState.getAttribute("data-slot-id")).toBe(String(slotId));

      for (const card of expectedCards) {
        tapPlaceCard(card.id, slotId);
      }

      fireEvent.click(screen.getByTestId("blueprint-check-phase-btn"));
    }

    expect(screen.getByText(/Puzzle complete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(onSaveStars).toHaveBeenCalled());
    expect(onSaveStars).toHaveBeenCalledWith(String(phasedChallenge.level.id), expect.any(Number));
  });

  it("supports tap-select placement and keeps placed cards visible in the tray", () => {
    const twoSumChallenge = findChallengeByTitle("Two Sum");
    expect(twoSumChallenge).toBeTruthy();
    renderBlueprint({ path: buildBlueprintChallengePath(twoSumChallenge.id) });

    const targetCard = (twoSumChallenge.level.cards || []).find((card) => card?.correctSlot);
    expect(targetCard).toBeTruthy();

    tapPlaceCard(targetCard.id, targetCard.correctSlot);

    expect(screen.getByTestId(`blueprint-placed-card-${targetCard.id}`)).toBeInTheDocument();

    const trayCard = screen.getByTestId(`blueprint-deck-card-${targetCard.id}`);
    expect(trayCard).toHaveStyle("opacity: 0.45");
    expect(within(trayCard).getByText(/check/i)).toBeInTheDocument();
  });

  it("rejects wrong-section tap placement", () => {
    const twoSumChallenge = findChallengeByTitle("Two Sum");
    expect(twoSumChallenge).toBeTruthy();
    renderBlueprint({ path: buildBlueprintChallengePath(twoSumChallenge.id) });

    const targetCard = (twoSumChallenge.level.cards || []).find((card) => card?.correctSlot);
    expect(targetCard).toBeTruthy();

    const wrongSlot = (twoSumChallenge.level.slots || []).find((slotId) => String(slotId) !== String(targetCard.correctSlot));
    expect(wrongSlot).toBeTruthy();

    tapPlaceCard(targetCard.id, wrongSlot);

    expect(screen.queryByTestId(`blueprint-placed-card-${targetCard.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId("blueprint-progress-counter")).toHaveTextContent(/^0\//);
  });

  it("supports per-card undo from blueprint sections", () => {
    const twoSumChallenge = findChallengeByTitle("Two Sum");
    expect(twoSumChallenge).toBeTruthy();
    renderBlueprint({ path: buildBlueprintChallengePath(twoSumChallenge.id) });

    const targetCard = (twoSumChallenge.level.cards || []).find((card) => card?.correctSlot);
    expect(targetCard).toBeTruthy();

    tapPlaceCard(targetCard.id, targetCard.correctSlot);
    expect(screen.getByTestId(`blueprint-placed-card-${targetCard.id}`)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`blueprint-undo-card-${targetCard.id}`));

    expect(screen.queryByTestId(`blueprint-placed-card-${targetCard.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`blueprint-deck-card-${targetCard.id}`)).toHaveStyle("opacity: 1");
  });

  it("keeps run disabled until all solution cards are placed", () => {
    const twoSumChallenge = findChallengeByTitle("Two Sum");
    expect(twoSumChallenge).toBeTruthy();
    renderBlueprint({ path: buildBlueprintChallengePath(twoSumChallenge.id) });

    const runButton = screen.getByRole("button", { name: /run blueprint/i });
    expect(runButton).toBeDisabled();

    const firstCard = (twoSumChallenge.level.cards || []).find((card) => card?.correctSlot);
    expect(firstCard).toBeTruthy();

    tapPlaceCard(firstCard.id, firstCard.correctSlot);
    expect(runButton).toBeDisabled();
  });

  it("keeps problem details collapsed until the header toggle is pressed", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    expect(screen.queryByTestId("blueprint-problem-card")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show problem/i }));
    expect(screen.getByTestId("blueprint-problem-card")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide problem/i }));
    expect(screen.queryByTestId("blueprint-problem-card")).not.toBeInTheDocument();
  });

  it("hides the tap hint bar after two placements", () => {
    const twoSumChallenge = findChallengeByTitle("Two Sum");
    expect(twoSumChallenge).toBeTruthy();
    renderBlueprint({ path: buildBlueprintChallengePath(twoSumChallenge.id) });

    const hintText = "Tap a card in the tray, then tap the matching blueprint section.";
    expect(screen.getByText(hintText)).toBeInTheDocument();

    const cards = (twoSumChallenge.level.cards || []).filter((card) => card?.correctSlot).slice(0, 2);
    expect(cards.length).toBe(2);

    for (const card of cards) {
      tapPlaceCard(card.id, card.correctSlot);
    }

    expect(screen.queryByText(hintText)).not.toBeInTheDocument();
  });

  it("shows per-card feedback badges after a failed run", () => {
    const challenge = findChallengeByRequiredSlotCount((count, candidate) => {
      if (count === 0 || count > 10) return false;
      const bySlot = {};
      for (const card of candidate?.level?.cards || []) {
        const slot = String(card?.correctSlot || "");
        if (!slot) continue;
        bySlot[slot] = (bySlot[slot] || 0) + 1;
      }
      return Object.values(bySlot).some((value) => value >= 2);
    });

    expect(challenge).toBeTruthy();
    renderBlueprint({ path: buildBlueprintChallengePath(challenge.id) });

    const cardsBySlot = new Map();
    for (const card of challenge.level.cards || []) {
      const slotId = String(card?.correctSlot || "");
      if (!slotId) continue;
      if (!cardsBySlot.has(slotId)) cardsBySlot.set(slotId, []);
      cardsBySlot.get(slotId).push(card);
    }

    let reversedOneSlot = false;
    for (const [slotId, cards] of cardsBySlot.entries()) {
      const sorted = [...cards].sort((a, b) => (a?.correctOrder || 0) - (b?.correctOrder || 0));
      const placementOrder = !reversedOneSlot && sorted.length >= 2
        ? [...sorted].reverse()
        : sorted;
      if (!reversedOneSlot && sorted.length >= 2) reversedOneSlot = true;

      for (const card of placementOrder) {
        tapPlaceCard(card.id, slotId);
      }
    }

    expect(reversedOneSlot).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /run blueprint/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit blueprint/i }));

    expect(screen.getAllByTestId(/blueprint-card-feedback-/).length).toBeGreaterThan(0);
  });

  it("does not loop when initialStars prop identity changes with same values", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const view = renderBlueprint({ initialStars: { "q-1": 2 } });

    for (let i = 0; i < 8; i += 1) {
      view.rerender(
        <MemoryRouter initialEntries={["/blueprint"]}>
          <Routes>
            <Route
              path="/blueprint/*"
              element={<BlueprintScreen goMenu={vi.fn()} initialStars={{ "q-1": 2 }} onSaveStars={vi.fn()} />}
            />
          </Routes>
        </MemoryRouter>
      );
    }

    const depthWarning = errorSpy.mock.calls.find((call) => String(call?.[0] || "").includes("Maximum update depth exceeded"));
    expect(depthWarning).toBeFalsy();
    errorSpy.mockRestore();
  });
});
