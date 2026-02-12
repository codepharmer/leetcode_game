import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TemplatesScreen } from "./TemplatesScreen";

describe("screens/TemplatesScreen", () => {
  it("renders templates and supports back action", () => {
    const goMenu = vi.fn();
    render(<TemplatesScreen goMenu={goMenu} />);
    expect(screen.getByText("All Templates")).toBeInTheDocument();
    expect(screen.getByText("Universal Interview Skeleton")).toBeInTheDocument();
    fireEvent.click(screen.getByText("back"));
    expect(goMenu).toHaveBeenCalled();
  });
});
