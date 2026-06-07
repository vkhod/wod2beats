"""App gate: validate a Cognito-issued JWT and enforce the email allow-list.

Send the Cognito **ID token** (it carries the `email` claim and `aud` =
app client id). The frontend gets it after 'Sign in with Google' via the
Cognito Hosted UI."""
import time

import httpx
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import settings

_bearer = HTTPBearer(auto_error=False)
_jwks_cache = {"keys": None, "exp": 0.0}


def _issuer() -> str:
    return f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}"


def _jwks():
    if _jwks_cache["keys"] and _jwks_cache["exp"] > time.time():
        return _jwks_cache["keys"]
    url = f"{_issuer()}/.well-known/jwks.json"
    keys = httpx.get(url, timeout=10).json()["keys"]
    _jwks_cache.update(keys=keys, exp=time.time() + 3600)
    return keys


def require_user(cred: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    # Bypass auth when Cognito is not configured (local dev without Cognito setup).
    if not settings.cognito_user_pool_id:
        return {"email": "dev@local", "sub": "dev"}

    if cred is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = cred.credentials
    try:
        header = jwt.get_unverified_header(token)
        key = next(k for k in _jwks() if k["kid"] == header["kid"])
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.cognito_app_client_id,
            issuer=_issuer(),
        )
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    email = (claims.get("email") or "").lower()
    allow = settings.allowed_email_set
    if allow and email not in allow:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Email not on the allow-list")
    return claims
