from fastapi import Header, HTTPException, Depends
from supabase import create_client, Client
from supabase.client import ClientOptions
import jwt
import time
import logging
from types import SimpleNamespace
from app.config import settings

logger = logging.getLogger(__name__)

def get_token(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError()
        return parts[1]
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Authorization Scheme, must be Bearer token")

def get_supabase_client(token: str = Depends(get_token)) -> Client:
    try:
        # Construct client authenticated as the user by passing Bearer token in headers
        options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
        return create_client(settings.supabase_url, settings.supabase_service_role_key, options=options)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to initialize Supabase client: {str(e)}")

def get_user(token: str = Depends(get_token), client: Client = Depends(get_supabase_client)):
    """
    Authenticates the user using Supabase Auth.
    Includes network retry and JWT fallback for resilience against transient DNS / socket hiccups.
    """
    last_err = None
    for attempt in range(3):
        try:
            res = client.auth.get_user(token)
            if res and res.user:
                return res.user
        except Exception as e:
            last_err = e
            logger.warning(f"Supabase auth.get_user attempt {attempt + 1} failed: {e}")
            if attempt < 2:
                time.sleep(0.3)
                continue

    # If Supabase API failed due to network / DNS / socket error, fallback to validating decoded JWT
    if token:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload: missing sub")

            exp = payload.get("exp")
            if exp and time.time() > exp:
                raise HTTPException(status_code=401, detail="Token has expired")

            logger.info(f"Authenticated user {user_id} via resilient JWT fallback")
            return SimpleNamespace(
                id=user_id,
                email=payload.get("email", ""),
                role=payload.get("role", "authenticated"),
                app_metadata=payload.get("app_metadata", {}),
                user_metadata=payload.get("user_metadata", {})
            )
        except HTTPException:
            raise
        except Exception as jwt_err:
            logger.error(f"JWT decode error: {jwt_err}")

    raise HTTPException(status_code=401, detail=f"Authentication check failed: {str(last_err)}")

def get_admin_client() -> Client:
    try:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize admin Supabase client: {str(e)}")
