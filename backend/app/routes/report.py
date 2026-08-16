from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_admin_client, get_user
from app.models.schemas import ReportResponse
from app.services.analytics_service import get_canonical_user_analytics

router = APIRouter(prefix="/report", tags=["Report"])

@router.get("/latest", response_model=ReportResponse)
def get_latest_report(
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    try:
        # Check that user profile onboarding is completed
        prof_res = client.table("profiles").select("*").eq("id", user.id).execute()
        if not prof_res.data or len(prof_res.data) == 0:
            raise HTTPException(status_code=400, detail="Please complete profile onboarding first")

        analytics_data = get_canonical_user_analytics(user.id, client)
        return ReportResponse(**analytics_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {str(e)}")
