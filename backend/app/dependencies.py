from fastapi import Header, HTTPException, Depends
from supabase import create_client, Client
from supabase.client import ClientOptions
from app.config import settings

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
    try:
        res = client.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Invalid or expired user session")
        return res.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication check failed: {str(e)}")

def get_admin_client() -> Client:
    try:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize admin Supabase client: {str(e)}")
