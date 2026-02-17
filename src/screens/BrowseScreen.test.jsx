import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BrowseScreen } from "./BrowseScreen";

describe("screens/BrowseScreen", () => {
  it("renders grouped patterns and toggles question expansion", () => {
    const setBrowseFilter = vi.fn();
    const setExpandedBrowse = vi.fn();
    render(
      <BrowseScreen
        browseFilter="All"
        setBrowseFilter={setBrowseFilter}
        groupedByPattern={{
          "Hash Map": [
            { id: "q1", title: "Two Sum", pattern: "Hash Map", difficulty: "Easy", promptKind: "question", desc: "desc" },
          ],
        }}
        expandedBrowse={{}}
        setExpandedBrowse={setExpandedBrowse}
        goMenu={vi.fn()}
        history={{}}
        browseTitle="All Patterns"
      />
    );

    expect(screen.getByText("All Patterns")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "easy" }));
    expect(setBrowseFilter).toHaveBeenCalledWith("Easy");
    const toggleRow = screen.getByRole("button", { name: /Two Sum/i });
    expect(toggleRow).toHaveAttribute("aria-expanded", "false");
    expect(toggleRow).toHaveClass("tap-target");
    fireEvent.click(toggleRow);
    expect(setExpandedBrowse).toHaveBeenCalled();
  });

  it("supports keyboard activation after semantic button migration", async () => {
    const setExpandedBrowse = vi.fn();
    const user = userEvent.setup();
    render(
      <BrowseScreen
        browseFilter="All"
        setBrowseFilter={vi.fn()}
        groupedByPattern={{
          "Hash Map": [{ id: "q1", title: "Two Sum", pattern: "Hash Map", difficulty: "Easy", promptKind: "question", desc: "desc" }],
        }}
        expandedBrowse={{}}
        setExpandedBrowse={setExpandedBrowse}
        goMenu={vi.fn()}
        history={{}}
        browseTitle="All Patterns"
      />
    );

    const toggleRow = screen.getByRole("button", { name: /Two Sum/i });
    toggleRow.focus();
    expect(toggleRow).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(setExpandedBrowse).toHaveBeenCalled();
  });

  it("renders code block when expanded item is code prompt", () => {
    render(
      <BrowseScreen
        browseFilter="All"
        setBrowseFilter={vi.fn()}
        groupedByPattern={{
          "Sliding Window": [
            {
              id: "tpl1",
              title: "Snippet 01",
              pattern: "Sliding Window",
              difficulty: "Medium",
              promptKind: "code",
              code: "l = 0",
            },
          ],
        }}
        expandedBrowse={{ tpl1: true }}
        setExpandedBrowse={vi.fn()}
        goMenu={vi.fn()}
        history={{}}
        browseTitle="Pattern Snippets"
      />
    );

    expect(screen.getByText("Pattern Snippets")).toBeInTheDocument();
    expect(screen.getByText("l = 0")).toBeInTheDocument();
  });
});
