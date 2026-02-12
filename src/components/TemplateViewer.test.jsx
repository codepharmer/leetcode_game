import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TemplateViewer } from "./TemplateViewer";

describe("components/TemplateViewer", () => {
  it("returns null for unknown pattern", () => {
    const { container } = render(<TemplateViewer pattern="Unknown Pattern" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("toggles compact template panel", () => {
    render(<TemplateViewer pattern="Hash Map" compact />);
    const toggle = screen.getByRole("button", { name: /templates/i });
    fireEvent.click(toggle);
    expect(screen.getByText(/Hash Lookup/i)).toBeInTheDocument();
  });

  it("supports controlled open mode and universal skeleton toggle", () => {
    const onOpenChange = vi.fn();
    render(<TemplateViewer pattern="Sliding Window" open onOpenChange={onOpenChange} />);

    expect(screen.getByText(/view template: Sliding Window/i)).toBeInTheDocument();
    const universalToggle = screen.getByRole("button", { name: /universal skeleton/i });
    fireEvent.click(universalToggle);
    expect(screen.getByText(/def solve\(input\)/i)).toBeInTheDocument();
  });
});
