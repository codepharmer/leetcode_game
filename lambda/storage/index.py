import base64
import hashlib
import hmac
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

import boto3
from botocore.exceptions import ClientError


S3 = boto3.client("s3")

DATA_BUCKET = os.environ.get("DATA_BUCKET", "")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
SESSION_JWT_SECRET = os.environ.get("SESSION_JWT_SECRET", "")
try:
    SESSION_TTL_DAYS = int(os.environ.get("SESSION_TTL_DAYS", "30") or "30")
except Exception:
    SESSION_TTL_DAYS = 30
SESSION_ISSUER = "leetcode-game-storage"
SESSION_AUDIENCE = "leetcode-game"

# Keep the keyspace tight. We only need a couple of app keys.
KEY_RE = re.compile(r"^[a-zA-Z0-9_.:-]{1,64}$")

def _response(status_code: int, body_obj: dict | None = None, extra_headers: dict | None = None):
    headers = {"Content-Type": "application/json; charset=utf-8"}
    if extra_headers:
        headers.update(extra_headers)
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": "" if body_obj is None else json.dumps(body_obj),
    }


def _get_method(event: dict) -> str:
    # Function URL / HTTP API (v2.0)
    try:
        return event.get("requestContext", {}).get("http", {}).get("method", "") or ""
    except Exception:
        pass
    # REST API (v1.0)
    return event.get("httpMethod", "") or ""


def _get_path(event: dict) -> str:
    return (event.get("rawPath") or event.get("path") or "").strip() or "/"


def _get_header(event: dict, name: str) -> str | None:
    headers = event.get("headers") or {}
    if not isinstance(headers, dict):
        return None
    # API Gateway normalizes header keys inconsistently; check both.
    return headers.get(name) or headers.get(name.lower()) or headers.get(name.upper())


def _extract_bearer_token(event: dict) -> str | None:
    auth = _get_header(event, "authorization")
    if not auth:
        return None
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    s = (s or "").strip()
    if not s:
        return b""
    pad = "=" * ((4 - (len(s) % 4)) % 4)
    return base64.urlsafe_b64decode(s + pad)


def _jwt_sign(payload: dict) -> str:
    if not SESSION_JWT_SECRET:
        raise RuntimeError("Missing SESSION_JWT_SECRET env var")

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    msg = f"{header_b64}.{payload_b64}".encode("ascii")
    sig = hmac.new(SESSION_JWT_SECRET.encode("utf-8"), msg, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def _verify_session_token(token: str) -> dict | None:
    if not SESSION_JWT_SECRET:
        return None
    if not token or token.count(".") != 2:
        return None

    try:
        header_b64, payload_b64, sig_b64 = token.split(".", 2)
        header = json.loads(_b64url_decode(header_b64).decode("utf-8") or "{}")
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8") or "{}")
    except Exception:
        return None

    if header.get("alg") != "HS256":
        return None
    if payload.get("iss") != SESSION_ISSUER:
        return None
    if payload.get("aud") != SESSION_AUDIENCE:
        return None

    # Verify signature
    msg = f"{header_b64}.{payload_b64}".encode("ascii")
    expected = hmac.new(SESSION_JWT_SECRET.encode("utf-8"), msg, hashlib.sha256).digest()
    try:
        got = _b64url_decode(sig_b64)
    except Exception:
        return None
    if not hmac.compare_digest(expected, got):
        return None

    # Verify expiry
    try:
        exp = int(payload.get("exp") or 0)
    except Exception:
        exp = 0
    if exp <= int(time.time()):
        return None

    sub = payload.get("sub")
    if not sub:
        return None

    return payload


def _issue_session_token(info: dict) -> str:
    now = int(time.time())
    ttl_seconds = max(1, SESSION_TTL_DAYS) * 86400
    payload = {
        "iss": SESSION_ISSUER,
        "aud": SESSION_AUDIENCE,
        "iat": now,
        "exp": now + ttl_seconds,
        "sub": info.get("sub"),
    }

    # Convenience claims for UI. Server still uses only sub.
    for k in ("email", "name", "picture"):
        v = info.get(k)
        if isinstance(v, str) and v:
            payload[k] = v

    return _jwt_sign(payload)


def _verify_google_id_token(id_token: str) -> dict | None:
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("Missing GOOGLE_CLIENT_ID env var")
    if not id_token:
        return None

    qs = urllib.parse.urlencode({"id_token": id_token})
    url = f"https://oauth2.googleapis.com/tokeninfo?{qs}"

    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError:
        return None
    except Exception:
        return None

    try:
        info = json.loads(raw)
    except Exception:
        return None

    aud = info.get("aud")
    if aud != GOOGLE_CLIENT_ID:
        return None

    iss = info.get("iss")
    if iss not in ("accounts.google.com", "https://accounts.google.com"):
        return None

    sub = info.get("sub")
    if not sub:
        return None

    return info


def _s3_object_key(sub: str, key: str) -> str:
    # Keep all user data under a dedicated prefix.
    return f"users/{sub}/{key}"


def handler(event, context):
    method = _get_method(event).upper()
    path = _get_path(event)

    if method == "OPTIONS":
        return _response(204, None)

    if not DATA_BUCKET:
        return _response(500, {"error": "Server misconfigured (missing DATA_BUCKET)."})

    # Route: /session (exchange Google ID token -> 30-day session token)
    if path == "/session":
        if method not in ("POST",):
            return _response(405, {"error": "Method not allowed."})
        if not SESSION_JWT_SECRET:
            return _response(500, {"error": "Server misconfigured (missing SESSION_JWT_SECRET)."})

        google_id_token = _extract_bearer_token(event)
        info = _verify_google_id_token(google_id_token or "")
        if not info:
            return _response(401, {"error": "Unauthorized."}, {"Cache-Control": "no-store"})

        token = _issue_session_token(info)
        return _response(200, {"token": token}, {"Cache-Control": "no-store"})

    # Route: /storage/<key>
    if not path.startswith("/storage/"):
        return _response(404, {"error": "Not found."})
    key = urllib.parse.unquote(path[len("/storage/") :])
    if not KEY_RE.match(key):
        return _response(400, {"error": "Invalid key."})

    bearer = _extract_bearer_token(event)

    session = _verify_session_token(bearer or "")
    if session:
        sub = session.get("sub")
    else:
        info = _verify_google_id_token(bearer or "")
        if not info:
            return _response(401, {"error": "Unauthorized."})
        sub = info.get("sub")

    obj_key = _s3_object_key(sub, key)

    if method == "GET":
        try:
            obj = S3.get_object(Bucket=DATA_BUCKET, Key=obj_key)
            value = obj["Body"].read().decode("utf-8")
            return _response(200, {"value": value})
        except ClientError as e:
            code = (((e.response or {}).get("Error") or {}).get("Code") or "").strip()
            status = ((e.response or {}).get("ResponseMetadata") or {}).get("HTTPStatusCode")

            if code in ("NoSuchKey", "404") or status == 404:
                return _response(200, {"value": None})

            print(f"S3 get_object failed: code={code} status={status} key={obj_key} err={e}")
            if code == "AccessDenied":
                return _response(403, {"error": "Forbidden."})
            return _response(500, {"error": "Failed to read data."})
        except Exception as e:
            print(f"Unexpected S3 get_object error: key={obj_key} err={e}")
            return _response(500, {"error": "Failed to read data."})

    if method == "PUT":
        body = event.get("body") or ""
        if event.get("isBase64Encoded"):
            try:
                body = base64.b64decode(body).decode("utf-8")
            except Exception:
                return _response(400, {"error": "Invalid body encoding."})

        try:
            payload = json.loads(body) if body else {}
        except Exception:
            return _response(400, {"error": "Invalid JSON."})

        value = payload.get("value")
        if value is not None and not isinstance(value, str):
            return _response(400, {"error": "Value must be a string or null."})
        if isinstance(value, str) and len(value.encode("utf-8")) > 512 * 1024:
            return _response(413, {"error": "Value too large."})

        # Treat null as delete (reset).
        if value is None:
            try:
                S3.delete_object(Bucket=DATA_BUCKET, Key=obj_key)
            except ClientError as e:
                print(f"S3 delete_object failed: key={obj_key} err={e}")
            except Exception as e:
                print(f"Unexpected S3 delete_object error: key={obj_key} err={e}")
            return _response(200, {"ok": True})

        try:
            S3.put_object(
                Bucket=DATA_BUCKET,
                Key=obj_key,
                Body=value.encode("utf-8"),
                ContentType="application/json; charset=utf-8",
                ServerSideEncryption="AES256",
            )
            return _response(200, {"ok": True})
        except ClientError as e:
            code = (((e.response or {}).get("Error") or {}).get("Code") or "").strip()
            status = ((e.response or {}).get("ResponseMetadata") or {}).get("HTTPStatusCode")
            print(f"S3 put_object failed: code={code} status={status} key={obj_key} err={e}")
            if code == "AccessDenied":
                return _response(403, {"error": "Forbidden."})
            return _response(500, {"error": "Failed to write data."})
        except Exception as e:
            print(f"Unexpected S3 put_object error: key={obj_key} err={e}")
            return _response(500, {"error": "Failed to write data."})

    return _response(405, {"error": "Method not allowed."})
