import time
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel

security_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    """Minimal representation of the signed-in Microsoft user."""
    oid: Optional[str] = None
    name: Optional[str] = None
    preferred_username: Optional[str] = None
    raw: Dict[str, Any]


def validate_access_token(token: str) -> Dict[str, Any]:
    """
    DEV-GRADE VALIDATION:

    - Parse JWT without verifying signature.
    - Ensure token has not expired.

    We deliberately do NOT enforce issuer or audience here,
    to avoid blocking valid tokens in development.
    """
    try:
        # Parse claims without verifying the signature.
        claims = jwt.get_unverified_claims(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token format.",
        ) from exc

    # Basic expiration check
    exp = claims.get("exp")
    now = int(time.time())
    if isinstance(exp, int) and exp < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )

    return claims


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> CurrentUser:
    """
    FastAPI dependency to require a Bearer token and expose basic user info.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    token = credentials.credentials
    claims = validate_access_token(token)

    return CurrentUser(
        oid=claims.get("oid"),
        name=claims.get("name"),
        preferred_username=claims.get("preferred_username")
        or claims.get("upn")
        or claims.get("email"),
        raw=claims,
    )
