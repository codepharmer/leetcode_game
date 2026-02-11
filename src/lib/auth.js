import { jwtDecode } from "jwt-decode";

// Legacy (pre-session) auth token storage key.
export const GOOGLE_AUTH_STORAGE_KEY = "lc-google-credential";
// 30-day session token storage key.
export const SESSION_AUTH_STORAGE_KEY = "lc-session-token";

export function decodeJwt(token) {
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    if (!payload || typeof payload !== "object") return null;

    if (typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

export function userFromToken(token, { kind } = {}) {
  const payload = decodeJwt(token);
  if (!payload) return null;

  return {
    kind: kind || "unknown",
    credential: token,
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

