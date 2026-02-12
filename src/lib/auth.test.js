import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

import { jwtDecode } from "jwt-decode";
import { decodeJwt, userFromToken } from "./auth";

describe("lib/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for missing token", () => {
    expect(decodeJwt("")).toBeNull();
    expect(decodeJwt(null)).toBeNull();
  });

  it("returns null when jwtDecode throws", () => {
    jwtDecode.mockImplementation(() => {
      throw new Error("bad");
    });
    expect(decodeJwt("token")).toBeNull();
  });

  it("returns null for expired token payload", () => {
    jwtDecode.mockReturnValue({ sub: "abc", exp: Math.floor(Date.now() / 1000) - 60 });
    expect(decodeJwt("token")).toBeNull();
  });

  it("returns payload for valid non-expired token", () => {
    const payload = { sub: "abc", email: "x@y.com", exp: Math.floor(Date.now() / 1000) + 300 };
    jwtDecode.mockReturnValue(payload);
    expect(decodeJwt("token")).toEqual(payload);
  });

  it("builds user object from token with explicit and default kind", () => {
    jwtDecode.mockReturnValue({ sub: "s1", email: "e", name: "n", picture: "p", exp: Math.floor(Date.now() / 1000) + 300 });
    expect(userFromToken("tok", { kind: "session" })).toEqual({
      kind: "session",
      credential: "tok",
      sub: "s1",
      email: "e",
      name: "n",
      picture: "p",
    });
    expect(userFromToken("tok2")).toMatchObject({ kind: "unknown", credential: "tok2", sub: "s1" });
  });

  it("returns null user when decode fails", () => {
    jwtDecode.mockImplementation(() => {
      throw new Error("nope");
    });
    expect(userFromToken("bad")).toBeNull();
  });
});
