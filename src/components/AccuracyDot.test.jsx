import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccuracyDot } from "./AccuracyDot";

describe("components/AccuracyDot", () => {
  it("renders nothing when no history exists", () => {
    const { container } = render(<AccuracyDot qId="q1" history={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders percentage and attempts", () => {
    render(<AccuracyDot qId="q1" history={{ q1: { correct: 3, wrong: 1 } }} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("(4)")).toBeInTheDocument();
  });
});
