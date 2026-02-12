import { fireEvent, render, screen } from "@testing-library/react";
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
    fireEvent.click(screen.getByText("Two Sum"));
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
