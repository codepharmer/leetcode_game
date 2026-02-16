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

function findChallengeByRequiredSlotCount(predicate) {
  const campaign = getBlueprintCampaign({});
  for (const world of campaign?.worlds || []) {
    for (const stage of world?.stages || []) {
      for (const tier of stage?.tiers || []) {
        for (const challenge of tier?.challenges || []) {
          const count = getRequiredSlotCount(challenge?.level);
          if (predicate(count, challenge)) return challenge;
        }
      }
    }
  }
  return null;
}

function createDataTransfer() {
  return {
    data: {},
    setData(type, value) {
      this.data[type] = value;
    },
    getData(type) {
      return this.data[type] || "";
    },
    effectAllowed: "move",
    dropEffect: "move",
  };
}

function dragDeckCardIntoSlot(deckCard, slot) {
  const dataTransfer = createDataTransfer();
  fireEvent.dragStart(deckCard, { dataTransfer });
  fireEvent.dragOver(slot, { dataTransfer });
  fireEvent.drop(slot, { dataTransfer });
  fireEvent.dragEnd(deckCard, { dataTransfer });
}

describe("screens/BlueprintScreen", () => {
  it("renders world menu and supports returning to app menu", () => {
    const goMenu = vi.fn();
    renderBlueprint({ goMenu, initialStars: { 1: 2 } });

    expect(screen.getByText("Blueprint Builder")).toBeInTheDocument();
    expect(screen.getByText(/Hash Maps & Sets/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Challenge/i)).toBeInTheDocument();

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

    const initialDeckCount = screen.getAllByTestId(/blueprint-deck-card-/).length;
    const firstDeckCard = screen.getAllByTestId(/blueprint-deck-card-/)[0];
    fireEvent.click(firstDeckCard);
    fireEvent.click(lockedSlot);
    expect(screen.getAllByTestId(/blueprint-deck-card-/).length).toBe(initialDeckCount);

    const cardsForActiveSlot = (phasedChallenge.level.cards || [])
      .filter((card) => String(card?.correctSlot || "") === activeSlotId)
      .sort((a, b) => (a?.correctOrder || 0) - (b?.correctOrder || 0));

    for (const card of cardsForActiveSlot) {
      dragDeckCardIntoSlot(screen.getByTestId(`blueprint-deck-card-${card.id}`), activeSlot);
    }

    const checkButton = screen.getByTestId("blueprint-check-phase-btn");
    expect(checkButton).toHaveTextContent(/^Check /i);
    fireEvent.click(checkButton);

    expect(screen.getByTestId(`blueprint-phase-state-${activeSlotId}`)).toHaveTextContent(/completed/i);
    const nextActive = screen.getAllByTestId(/blueprint-phase-state-/).find((node) => /active/i.test(String(node.textContent || "")));
    expect(nextActive).toBeTruthy();
    expect(nextActive.getAttribute("data-slot-id")).not.toBe(activeSlotId);
  });

  it("completes immediately after final phased check and saves stars", async () => {
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

      const targetSlot = screen.getByTestId(`blueprint-slot-${slotId}`);
      for (const card of expectedCards) {
        dragDeckCardIntoSlot(screen.getByTestId(`blueprint-deck-card-${card.id}`), targetSlot);
      }

      fireEvent.click(screen.getByTestId("blueprint-check-phase-btn"));
    }

    await waitFor(() => expect(onSaveStars).toHaveBeenCalled());
    expect(onSaveStars).toHaveBeenCalledWith(String(phasedChallenge.level.id), expect.any(Number));
  });

  it("supports dragging a deck card into a slot", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const deckCardsBefore = screen.getAllByTestId(/blueprint-deck-card-/);
    const draggedCard = deckCardsBefore[0];
    const targetSlot = screen.getAllByTestId(/blueprint-slot-/)[0];

    const dataTransfer = {
      data: {},
      setData(type, value) {
        this.data[type] = value;
      },
      getData(type) {
        return this.data[type] || "";
      },
      effectAllowed: "move",
      dropEffect: "move",
    };

    fireEvent.dragStart(draggedCard, { dataTransfer });
    fireEvent.dragOver(targetSlot, { dataTransfer });
    fireEvent.drop(targetSlot, { dataTransfer });
    fireEvent.dragEnd(draggedCard, { dataTransfer });

    expect(screen.getAllByTestId(/blueprint-deck-card-/).length).toBe(deckCardsBefore.length - 1);
    expect(within(targetSlot).getByTestId(/blueprint-placed-card-/)).toBeInTheDocument();
  });

  it("supports dragging a placed card to a different slot", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const slots = screen.getAllByTestId(/blueprint-slot-/);
    const sourceSlot = slots[0];
    const targetSlot = slots[1];
    const deckCard = screen.getAllByTestId(/blueprint-deck-card-/)[0];

    const firstTransfer = {
      data: {},
      setData(type, value) {
        this.data[type] = value;
      },
      getData(type) {
        return this.data[type] || "";
      },
      effectAllowed: "move",
      dropEffect: "move",
    };

    fireEvent.dragStart(deckCard, { dataTransfer: firstTransfer });
    fireEvent.dragOver(sourceSlot, { dataTransfer: firstTransfer });
    fireEvent.drop(sourceSlot, { dataTransfer: firstTransfer });
    fireEvent.dragEnd(deckCard, { dataTransfer: firstTransfer });

    const deckCountAfterPlacement = screen.getAllByTestId(/blueprint-deck-card-/).length;
    const placedCard = within(sourceSlot).getByTestId(/blueprint-placed-card-/);

    const secondTransfer = {
      data: {},
      setData(type, value) {
        this.data[type] = value;
      },
      getData(type) {
        return this.data[type] || "";
      },
      effectAllowed: "move",
      dropEffect: "move",
    };

    fireEvent.dragStart(placedCard, { dataTransfer: secondTransfer });
    fireEvent.dragOver(targetSlot, { dataTransfer: secondTransfer });
    fireEvent.drop(targetSlot, { dataTransfer: secondTransfer });
    fireEvent.dragEnd(placedCard, { dataTransfer: secondTransfer });

    expect(screen.getAllByTestId(/blueprint-deck-card-/).length).toBe(deckCountAfterPlacement);
    expect(within(sourceSlot).queryByTestId(/blueprint-placed-card-/)).not.toBeInTheDocument();
    expect(within(targetSlot).getByTestId(/blueprint-placed-card-/)).toBeInTheDocument();
  });

  it("supports dropping multiple cards into the same step", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const slotCandidates = screen.getAllByTestId(/blueprint-slot-/);
    const targetSlot =
      slotCandidates.find((slot) => within(slot).queryByText(/\(target 1\)/i) || within(slot).queryByText(/\/1\b/)) ||
      slotCandidates[0];
    const [firstCard, secondCard] = screen.getAllByTestId(/blueprint-deck-card-/);

    const firstTransfer = {
      data: {},
      setData(type, value) {
        this.data[type] = value;
      },
      getData(type) {
        return this.data[type] || "";
      },
      effectAllowed: "move",
      dropEffect: "move",
    };

    fireEvent.dragStart(firstCard, { dataTransfer: firstTransfer });
    fireEvent.dragOver(targetSlot, { dataTransfer: firstTransfer });
    fireEvent.drop(targetSlot, { dataTransfer: firstTransfer });
    fireEvent.dragEnd(firstCard, { dataTransfer: firstTransfer });

    const secondTransfer = {
      data: {},
      setData(type, value) {
        this.data[type] = value;
      },
      getData(type) {
        return this.data[type] || "";
      },
      effectAllowed: "move",
      dropEffect: "move",
    };

    fireEvent.dragStart(secondCard, { dataTransfer: secondTransfer });
    fireEvent.dragOver(targetSlot, { dataTransfer: secondTransfer });
    fireEvent.drop(targetSlot, { dataTransfer: secondTransfer });
    fireEvent.dragEnd(secondCard, { dataTransfer: secondTransfer });

    expect(within(targetSlot).getAllByTestId(/blueprint-placed-card-/).length).toBe(2);
  });

  it("supports touch dragging a deck card into a slot", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const deckCardsBefore = screen.getAllByTestId(/blueprint-deck-card-/);
    const draggedCard = deckCardsBefore[0];
    const targetSlot = screen.getAllByTestId(/blueprint-slot-/)[0];

    const originalElementFromPoint = document.elementFromPoint;
    const elementFromPointMock = vi.fn(() => targetSlot);
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      writable: true,
      value: elementFromPointMock,
    });

    fireEvent.pointerDown(draggedCard, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(draggedCard, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 20,
      clientY: 36,
    });
    expect(screen.getByTestId("blueprint-touch-ghost")).toHaveStyle("visibility: visible");

    fireEvent.pointerUp(draggedCard, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 20,
      clientY: 36,
    });
    expect(screen.getByTestId("blueprint-touch-ghost")).toHaveStyle("visibility: hidden");

    if (originalElementFromPoint) {
      Object.defineProperty(document, "elementFromPoint", {
        configurable: true,
        writable: true,
        value: originalElementFromPoint,
      });
    } else {
      delete document.elementFromPoint;
    }

    expect(screen.getAllByTestId(/blueprint-deck-card-/).length).toBe(deckCardsBefore.length - 1);
    expect(within(targetSlot).getByTestId(/blueprint-placed-card-/)).toBeInTheDocument();
  });

  it("supports touch dragging a placed card to a different slot", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const slots = screen.getAllByTestId(/blueprint-slot-/);
    const sourceSlot = slots[0];
    const targetSlot = slots[1];
    const deckCard = screen.getAllByTestId(/blueprint-deck-card-/)[0];

    const originalElementFromPoint = document.elementFromPoint;
    const elementFromPointMock = vi.fn(() => sourceSlot);
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      writable: true,
      value: elementFromPointMock,
    });

    fireEvent.pointerDown(deckCard, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(deckCard, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 20,
      clientY: 36,
    });
    fireEvent.pointerUp(deckCard, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 20,
      clientY: 36,
    });

    const deckCountAfterPlacement = screen.getAllByTestId(/blueprint-deck-card-/).length;
    const placedCard = within(sourceSlot).getByTestId(/blueprint-placed-card-/);
    elementFromPointMock.mockImplementation(() => targetSlot);

    fireEvent.pointerDown(placedCard, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 20,
      clientY: 36,
    });
    fireEvent.pointerMove(placedCard, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 20,
      clientY: 52,
    });
    fireEvent.pointerUp(placedCard, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 20,
      clientY: 52,
    });

    if (originalElementFromPoint) {
      Object.defineProperty(document, "elementFromPoint", {
        configurable: true,
        writable: true,
        value: originalElementFromPoint,
      });
    } else {
      delete document.elementFromPoint;
    }

    expect(screen.getAllByTestId(/blueprint-deck-card-/).length).toBe(deckCountAfterPlacement);
    expect(within(sourceSlot).queryByTestId(/blueprint-placed-card-/)).not.toBeInTheDocument();
    expect(within(targetSlot).getByTestId(/blueprint-placed-card-/)).toBeInTheDocument();
  });

  it("warns about unresolved dependencies while dragging", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const deckCard = screen.getAllByTestId(/blueprint-deck-card-/).find((card) => String(card.textContent || "").includes("target - nums[i]"));
    expect(deckCard).toBeTruthy();
    const targetSlot = screen.getAllByTestId(/blueprint-slot-/)[0];

    const dataTransfer = {
      data: {},
      setData(type, value) {
        this.data[type] = value;
      },
      getData(type) {
        return this.data[type] || "";
      },
      effectAllowed: "move",
      dropEffect: "move",
    };

    fireEvent.dragStart(deckCard, { dataTransfer });
    fireEvent.dragOver(targetSlot, { dataTransfer });

    expect(screen.getByTestId("blueprint-dependency-warning")).toBeInTheDocument();
    expect(screen.getByText(/(isn't defined until|is not declared)/i)).toBeInTheDocument();
  });

  it("keeps run disabled until all solution cards are placed", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const runButton = screen.getByRole("button", { name: /run blueprint/i });
    expect(runButton).toBeDisabled();

    const firstDeckCard = screen.getAllByTestId(/blueprint-deck-card-/)[0];
    const targetSlot = screen.getAllByTestId(/blueprint-slot-/)[0];
    fireEvent.click(firstDeckCard);
    fireEvent.click(targetSlot);

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

  it("opens the slot editor bottom sheet and hides the tray while it is open", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const deckCard = screen.getAllByTestId(/blueprint-deck-card-/)[0];
    const slot = screen.getAllByTestId(/blueprint-slot-/)[0];
    fireEvent.click(deckCard);
    fireEvent.click(slot);

    expect(screen.getByTestId("blueprint-card-tray")).toBeInTheDocument();

    fireEvent.click(slot);
    expect(screen.getByTestId("blueprint-slot-sheet")).toBeInTheDocument();
    expect(screen.queryByTestId("blueprint-card-tray")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("blueprint-slot-sheet-scrim"));
    expect(screen.queryByTestId("blueprint-slot-sheet")).not.toBeInTheDocument();
    expect(screen.getByTestId("blueprint-card-tray")).toBeInTheDocument();
  });

  it("shows per-card feedback badges after a failed run", () => {
    renderBlueprint();
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const targetSlot = screen.getAllByTestId(/blueprint-slot-/)[0];
    while (screen.queryAllByTestId(/blueprint-deck-card-/).length > 0) {
      const card = screen.getAllByTestId(/blueprint-deck-card-/)[0];
      const dataTransfer = {
        data: {},
        setData(type, value) {
          this.data[type] = value;
        },
        getData(type) {
          return this.data[type] || "";
        },
        effectAllowed: "move",
        dropEffect: "move",
      };

      fireEvent.dragStart(card, { dataTransfer });
      fireEvent.dragOver(targetSlot, { dataTransfer });
      fireEvent.drop(targetSlot, { dataTransfer });
      fireEvent.dragEnd(card, { dataTransfer });
    }

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
