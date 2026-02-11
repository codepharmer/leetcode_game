import { useCallback, useEffect, useState } from "react";
import { googleLogout } from "@react-oauth/google";

import { decodeJwt, GOOGLE_AUTH_STORAGE_KEY, SESSION_AUTH_STORAGE_KEY, userFromToken } from "../lib/auth";
import { getStorageAdapter, saveData } from "../lib/storage";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

async function exchangeGoogleIdTokenForSession(googleIdToken) {
  if (!API_BASE_URL) return null;
  if (!googleIdToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${googleIdToken}` },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.token || null;
  } catch (error) {
    return null;
  }
}

function getInitialUserFromStorage() {
  if (typeof window === "undefined") return null;

  const sessionToken = window.localStorage.getItem(SESSION_AUTH_STORAGE_KEY);
  const sessionUser = userFromToken(sessionToken, { kind: "session" });
  if (sessionUser) return sessionUser;
  if (sessionToken) window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);

  const legacyGoogleToken = window.localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
  const legacyUser = userFromToken(legacyGoogleToken, { kind: "google" });
  if (legacyUser) return legacyUser;
  if (legacyGoogleToken) window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);

  return null;
}

export function useAuthSession({ getProgressSnapshot } = {}) {
  const [user, setUser] = useState(() => getInitialUserFromStorage());
  const [authError, setAuthError] = useState(null);

  // Migration: if a user still has a legacy Google ID token stored, exchange it for a 30-day session token.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!API_BASE_URL) return;
    if (!user || user.kind !== "google") return;

    let cancelled = false;
    (async () => {
      const sessionToken = await exchangeGoogleIdTokenForSession(user.credential);
      const sessionUser = userFromToken(sessionToken, { kind: "session" });
      if (!sessionUser) return;

      try {
        window.localStorage.setItem(SESSION_AUTH_STORAGE_KEY, sessionToken);
        window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
      } catch (error) {
        // ignore
      }

      if (!cancelled) setUser(sessionUser);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleGoogleSuccess = useCallback(
    async (credentialResponse) => {
      const googleIdToken = credentialResponse?.credential;
      const googlePayload = decodeJwt(googleIdToken);
      if (!googlePayload) {
        setAuthError("Google sign-in returned an invalid token.");
        return;
      }

      const sessionToken = await exchangeGoogleIdTokenForSession(googleIdToken);
      const sessionUser = userFromToken(sessionToken, { kind: "session" });

      // If the user signs in after they've started playing, ensure in-memory progress is written to local storage
      // before swapping to the cloud adapter (so the login migration/merge can pick it up).
      try {
        const snapshot = getProgressSnapshot?.();
        if (snapshot?.progress) {
          const localStorage = getStorageAdapter();
          await saveData(localStorage, snapshot.progress);
        }
      } catch (error) {
        // ignore
      }

      if (sessionUser) {
        try {
          window.localStorage.setItem(SESSION_AUTH_STORAGE_KEY, sessionToken);
          window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
        } catch (error) {
          // ignore
        }
        setUser(sessionUser);
      } else {
        // Fallback: store the Google token directly (short-lived). Backend still accepts it.
        try {
          window.localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, googleIdToken);
          window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
        } catch (error) {
          // ignore
        }

        setUser({
          kind: "google",
          credential: googleIdToken,
          sub: googlePayload.sub,
          email: googlePayload.email,
          name: googlePayload.name,
          picture: googlePayload.picture,
        });
      }

      setAuthError(null);
    },
    [getProgressSnapshot]
  );

  const handleGoogleError = useCallback(() => {
    setAuthError("Google sign-in failed. Double-check your OAuth Client's authorized origins.");
  }, []);

  const handleSignOut = useCallback(() => {
    try {
      googleLogout();
    } catch (error) {
      // ignore
    }

    try {
      window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
      window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
    } catch (error) {
      // ignore
    }

    setUser(null);
  }, []);

  return {
    user,
    setUser,
    authError,
    setAuthError,
    handleGoogleSuccess,
    handleGoogleError,
    handleSignOut,
  };
}
