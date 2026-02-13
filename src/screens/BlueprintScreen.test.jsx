import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BlueprintScreen } from "./BlueprintScreen";

describe("screens/BlueprintScreen", () => {
  it("renders world menu and supports returning to app menu", () => {
    const goMenu = vi.fn();
    render(<BlueprintScreen goMenu={goMenu} initialStars={{ 1: 2 }} onSaveStars={vi.fn()} />);

    expect(screen.getByText("Blueprint Builder")).toBeInTheDocument();
    expect(screen.getByText(/World 1: Hash Maps & Sets/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Problem/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(goMenu).toHaveBeenCalled();
  });

  it("opens a challenge and can navigate back to world list", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));
    expect(screen.getByText("Run Blueprint")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /worlds/i }));
    expect(screen.getByText(/World 10/i)).toBeInTheDocument();
  });

  it("shows soft-gated worlds", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);

    expect(screen.getAllByText(/Unlocks after completing any 2 worlds/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Boss rush unlocks after completing any 5 worlds/i)).toBeInTheDocument();
  });

  it("supports dragging a deck card into a slot", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const deckCardsBefore = screen.getAllByTestId(/blueprint-deck-card-/);
    const draggedCard = deckCardsBefore[0];
    const setupSlot = screen.getByTestId("blueprint-slot-setup");

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
    fireEvent.dragOver(setupSlot, { dataTransfer });
    fireEvent.drop(setupSlot, { dataTransfer });
    fireEvent.dragEnd(draggedCard, { dataTransfer });

    expect(screen.getAllByTestId(/blueprint-deck-card-/).length).toBe(deckCardsBefore.length - 1);
    expect(within(setupSlot).getByText("remove")).toBeInTheDocument();
  });

  it("supports touch dragging a deck card into a slot", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const deckCardsBefore = screen.getAllByTestId(/blueprint-deck-card-/);
    const draggedCard = deckCardsBefore[0];
    const setupSlot = screen.getByTestId("blueprint-slot-setup");

    const originalElementFromPoint = document.elementFromPoint;
    const elementFromPointMock = vi.fn(() => setupSlot);
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
    fireEvent.pointerUp(draggedCard, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 20,
      clientY: 36,
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

    expect(screen.getAllByTestId(/blueprint-deck-card-/).length).toBe(deckCardsBefore.length - 1);
    expect(within(setupSlot).getByText("remove")).toBeInTheDocument();
  });

  it("keeps run disabled until all solution cards are placed", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Two Sum/i }));

    const runButton = screen.getByRole("button", { name: /run blueprint/i });
    expect(runButton).toBeDisabled();

    const firstDeckCard = screen.getAllByTestId(/blueprint-deck-card-/)[0];
    const setupSlot = screen.getByTestId("blueprint-slot-setup");
    fireEvent.click(firstDeckCard);
    fireEvent.click(setupSlot);

    expect(runButton).toBeDisabled();
  });
});
