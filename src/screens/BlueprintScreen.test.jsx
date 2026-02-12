import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BlueprintScreen } from "./BlueprintScreen";

describe("screens/BlueprintScreen", () => {
  it("renders level menu and supports returning to app menu", () => {
    const goMenu = vi.fn();
    render(<BlueprintScreen goMenu={goMenu} initialStars={{ 1: 2 }} onSaveStars={vi.fn()} />);

    expect(screen.getByText("Blueprint Builder")).toBeInTheDocument();
    expect(screen.getByText("Maximum Window Sum")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(goMenu).toHaveBeenCalled();
  });

  it("opens a level and can navigate back to level list", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Maximum Window Sum/i }));
    expect(screen.getByText("Run Blueprint")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /levels/i }));
    expect(screen.getByText("Pair With Target Sum")).toBeInTheDocument();
  });

  it("shows generated blueprint options from the full solution set", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Two Sum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Set Matrix Zeroes/i })).toBeInTheDocument();
  });

  it("supports dragging a deck card into a slot", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Maximum Window Sum/i }));

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

  it("uses solution-only deck and keeps run disabled until all solution cards are placed", () => {
    render(<BlueprintScreen goMenu={vi.fn()} initialStars={{}} onSaveStars={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Maximum Window Sum/i }));

    expect(screen.queryByText("windowSum -= nums[right]")).not.toBeInTheDocument();

    const runButton = screen.getByRole("button", { name: /run blueprint/i });
    expect(runButton).toBeDisabled();

    const firstDeckCard = screen.getAllByTestId(/blueprint-deck-card-/)[0];
    const setupSlot = screen.getByTestId("blueprint-slot-setup");
    fireEvent.click(firstDeckCard);
    fireEvent.click(setupSlot);

    expect(runButton).toBeDisabled();
  });
});
