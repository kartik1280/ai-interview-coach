from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_supabase_client, get_user, get_admin_client
from app.models.schemas import InterviewCreateRequest, ProfileResponse

router = APIRouter(prefix="/interview", tags=["Interview"])

@router.post("/create", response_model=ProfileResponse)
def create_interview(
    payload: InterviewCreateRequest,
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    try:
        # Check if profile already exists in DB
        res = client.table("profiles").select("*").eq("id", user.id).execute()
        
        profile_data = {
            "id": user.id,
            "full_name": payload.fullName,
            "target_position": payload.targetPosition,
            "industry": payload.industry
        }
        
        if res.data and len(res.data) > 0:
            # Update existing profile
            update_res = client.table("profiles").update(profile_data).eq("id", user.id).execute()
            result = update_res.data[0]
        else:
            # Create a new profile row
            insert_res = client.table("profiles").insert(profile_data).execute()
            result = insert_res.data[0]
            
        return ProfileResponse(
            id=result["id"],
            fullName=result.get("full_name", ""),
            targetPosition=result.get("target_position", ""),
            industry=result.get("industry", ""),
            resumeId=result.get("resume_id")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save profile: {str(e)}")
