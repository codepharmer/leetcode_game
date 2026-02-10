import { jwtDecode } from "jwt-decode";

export const GOOGLE_AUTH_STORAGE_KEY = "lc-google-credential";

export function decodeGoogleCredential(credential) {
  if (!credential) return null;

  try {
    const payload = jwtDecode(credential);
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
