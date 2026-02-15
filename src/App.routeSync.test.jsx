import { StrictMode } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";

describe("App route sync", () => {
  it("does not loop on external route settings change", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState({}, "", "/?gameType=blueprint_builder");

    render(
      <StrictMode>
        <GoogleOAuthProvider clientId="test-client-id">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </StrictMode>
    );

    await screen.findByText(/Build algorithm blueprints/i);

    act(() => {
      window.history.pushState({}, "", "/?gameType=template_to_pattern&difficulty=Hard&count=10");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Match code snippets/i)).toBeInTheDocument();
    });

    act(() => {
      window.history.pushState({}, "", "/?gameType=question_to_pattern&difficulty=Medium&count=40");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Map Blind 75 questions/i)).toBeInTheDocument();
    });

    act(() => {
      window.history.back();
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Match code snippets/i)).toBeInTheDocument();
    });

    const depthWarning = errorSpy.mock.calls.find((call) =>
      String(call?.[0] || "").includes("Maximum update depth exceeded")
    );
    expect(depthWarning).toBeFalsy();

    errorSpy.mockRestore();
  });
});
