import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

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
    expect(screen.getByText("Run Blueprint")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /worlds/i }));
    expect(screen.getByText(/Hash Maps & Sets/i)).toBeInTheDocument();
  });

  it("shows soft-gated worlds", () => {
    renderBlueprint();

    expect(screen.getAllByText(/Complete 2 worlds to unlock/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Complete 5 worlds to unlock/i).length).toBeGreaterThan(0);
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
    expect(within(targetSlot).getByText("remove")).toBeInTheDocument();
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
    expect(within(targetSlot).getByText("remove")).toBeInTheDocument();
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
