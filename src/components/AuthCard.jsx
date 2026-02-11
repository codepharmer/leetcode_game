import { GoogleLogin } from "@react-oauth/google";

import { S } from "../styles";

export function AuthCard({ user, authError, onGoogleSuccess, onGoogleError, onSignOut }) {
  return (
    <div style={S.authCard}>
      {user ? (
        <div style={S.authRow}>
          {user.picture ? (
            <img src={user.picture} alt="" style={S.authAvatar} referrerPolicy="no-referrer" />
          ) : (
            <div style={S.authAvatarFallback} />
          )}
          <div style={S.authText}>
            <div style={S.authName}>{user.name || user.email || "signed in"}</div>
            {user.name && user.email && <div style={S.authEmail}>{user.email}</div>}
          </div>
          <button onClick={onSignOut} style={S.authBtn}>
            sign out
          </button>
        </div>
      ) : (
        <div style={S.authCol}>
          <div style={S.authHint}>sign in to sync results</div>
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={onGoogleError}
            theme="filled_black"
            size="large"
            shape="pill"
            width="280"
            // GIS renders the button inside a cross-origin iframe. In dark-mode contexts,
            // browsers sometimes paint a white iframe background that can't be styled via CSS.
            // Forcing a light color-scheme on the container prevents that artifact.
            containerProps={{ style: { colorScheme: "light" } }}
          />
        </div>
      )}
      {authError && <div style={{ ...S.authError, marginTop: 10 }}>{authError}</div>}
    </div>
  );
}
