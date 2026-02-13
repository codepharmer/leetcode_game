import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MemoryRouter } from "react-router-dom";

import App from "./App";

describe("App strict mode", () => {
  it.each([
    "/",
    "/?",
    "/?difficulty=All&count=20&browse=All",
    "/?gameType=question_to_pattern&difficulty=All&count=20&browse=All",
    "/?gameType=blueprint_builder",
    "/?count=0",
    "/?difficulty=all",
    "/?unknown=1",
  ])("does not trigger maximum update depth warning for %s", async (entry) => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <StrictMode>
        <GoogleOAuthProvider clientId="test-client-id">
          <MemoryRouter initialEntries={[entry]}>
            <App />
          </MemoryRouter>
        </GoogleOAuthProvider>
      </StrictMode>
    );

    await waitFor(() => {
      const depthWarning = errorSpy.mock.calls.find((call) =>
        String(call?.[0] || "").includes("Maximum update depth exceeded")
      );
      expect(depthWarning).toBeFalsy();
    });

    errorSpy.mockRestore();
  });
});
