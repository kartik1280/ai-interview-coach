from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_supabase_client, get_user, get_admin_client
from app.models.schemas import ProfileResponse, InterviewCreateRequest

router = APIRouter(prefix="/profile", tags=["Profile/Settings"])

@router.get("", response_model=ProfileResponse)
def get_profile(
    user = Depends(get_user),
    client: Client = Depends(get_supabase_client)
):
    try:
        res = client.table("profiles").select("*").eq("id", user.id).execute()
        if not res.data or len(res.data) == 0:
            # Return default empty profile response instead of 404 to let settings load cleanly
            return ProfileResponse(
                id=user.id,
                fullName="",
                targetPosition="",
                industry="",
                resumeId=None
            )
        result = res.data[0]
        return ProfileResponse(
            id=result["id"],
            fullName=result.get("full_name", ""),
            targetPosition=result.get("target_position", ""),
            industry=result.get("industry", ""),
            resumeId=result.get("resume_id")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch profile: {str(e)}")

@router.put("", response_model=ProfileResponse)
def update_profile(
    payload: InterviewCreateRequest,
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    try:
        profile_data = {
            "full_name": payload.fullName,
            "target_position": payload.targetPosition,
            "industry": payload.industry
        }
        
        # Check if profile exists to decide update vs insert (upsert pattern)
        check_res = client.table("profiles").select("id").eq("id", user.id).execute()
        
        if check_res.data and len(check_res.data) > 0:
            res = client.table("profiles").update(profile_data).eq("id", user.id).execute()
        else:
            profile_data["id"] = user.id
            res = client.table("profiles").insert(profile_data).execute()
            
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to save profile changes")
            
        result = res.data[0]
        return ProfileResponse(
            id=result["id"],
            fullName=result.get("full_name", ""),
            targetPosition=result.get("target_position", ""),
            industry=result.get("industry", ""),
            resumeId=result.get("resume_id")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update profile: {str(e)}")
