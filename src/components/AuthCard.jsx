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
          <div style={S.authHint}>sign in with google</div>
          <GoogleLogin onSuccess={onGoogleSuccess} onError={onGoogleError} theme="filled_black" size="large" shape="pill" width="280" />
          {authError && <div style={S.authError}>{authError}</div>}
        </div>
      )}
    </div>
  );
}
