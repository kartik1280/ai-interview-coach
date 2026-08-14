from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime
from app.dependencies import get_supabase_client, get_user
from app.models.schemas import DashboardResponse, PracticeRoundCard, RecentHistoryItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard(
    user = Depends(get_user),
    client: Client = Depends(get_supabase_client)
):
    try:
        # 1. Fetch user's profile
        prof_res = client.table("profiles").select("*").eq("id", user.id).execute()
        if not prof_res.data or len(prof_res.data) == 0:
            raise HTTPException(status_code=400, detail="Profile onboarding not completed")
        profile = prof_res.data[0]
        
        full_name = profile.get("full_name", "")
        target_position = profile.get("target_position", "")
        industry = profile.get("industry", "")
        
        # 2. Fetch all completed rounds for this user
        rounds_res = client.table("rounds").select("*").eq("user_id", user.id).eq("status", "completed").execute()
        completed_rounds = rounds_res.data if rounds_res.data else []
        
        # For each completed round, calculate the score by averaging answers
        recent_rounds_by_type = {}
        history_items = []
        
        for r in completed_rounds:
            r_id = r["id"]
            r_type = r["round_type"]
            
            # Fetch all questions in this round
            q_res = client.table("questions").select("id").eq("round_id", r_id).execute()
            q_ids = [q["id"] for q in q_res.data] if q_res.data else []
            
            if q_ids:
                # Fetch all answers for these questions
                ans_res = client.table("answers").select("score, created_at").in_("question_id", q_ids).execute()
                answers = ans_res.data if ans_res.data else []
                
                if answers:
                    avg_score = sum(a["score"] for a in answers) / len(answers)
                    created_at_str = answers[0]["created_at"]
                    
                    # Convert to datetime to format "days ago"
                    try:
                        # Postgres timestamp format (ISO)
                        dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                        delta = datetime.now(dt.tzinfo) - dt
                        if delta.days == 0:
                            days_ago = "Today"
                        elif delta.days == 1:
                            days_ago = "1 day ago"
                        else:
                            days_ago = f"{delta.days} days ago"
                    except:
                        days_ago = "Recently"
                        dt = datetime.now()
                        
                    round_data = {
                        "id": r_id,
                        "type": r_type,
                        "score": round(avg_score, 1),
                        "daysAgo": days_ago,
                        "dt": dt
                    }
                    
                    history_items.append(round_data)
                    
                    # Store most recent score per round type
                    if r_type not in recent_rounds_by_type:
                        recent_rounds_by_type[r_type] = round_data
                    else:
                        # Keep the newer attempt
                        if dt > recent_rounds_by_type[r_type]["dt"]:
                            recent_rounds_by_type[r_type] = round_data
                            
        # Sort history newest to oldest
        history_items.sort(key=lambda x: x["dt"], reverse=True)
        
        # Build Recent History list for Response
        recent_history = [
            RecentHistoryItem(
                id=h["id"],
                name=f"{h['type'].capitalize()} round",
                daysAgo=h["daysAgo"],
                score=h["score"]
            )
            for h in history_items[:4]
        ]
        
        # Define Practice Cards for the 3 round types
        round_card_configs = {
            "technical": {"name": "Technical round", "sub": "Data structures and algorithms"},
            "behavioral": {"name": "Behavioral round", "sub": "Teamwork and leadership"},
            "aptitude": {"name": "Aptitude round", "sub": "Career awareness and reasoning"}
        }
        
        rounds_cards = []
        for r_type, config in round_card_configs.items():
            if r_type in recent_rounds_by_type:
                score = recent_rounds_by_type[r_type]["score"]
                feedback = ["Good performance", "Continue practicing key concepts"]
            else:
                score = 0.0
                feedback = ["No attempts completed yet."]
                
            rounds_cards.append(
                PracticeRoundCard(
                    id=r_type,
                    name=config["name"],
                    subtitle=config["sub"],
                    score=score,
                    feedback=feedback
                )
            )
            
        # Calculate dynamic readiness score
        active_scores = [recent_rounds_by_type[rt]["score"] for rt in recent_rounds_by_type]
        avg_readiness = sum(active_scores) / len(active_scores) if active_scores else 0.0
        
        # Streak calculation — count consecutive days ending today with at least one completed round
        streak = 0
        if history_items:
            from datetime import timedelta, timezone
            today = datetime.now(timezone.utc).date()
            # Collect unique completion dates
            completion_dates = set()
            for h in history_items:
                try:
                    completion_dates.add(h["dt"].date())
                except:
                    pass
            # Count consecutive days backward from today
            check_date = today
            while check_date in completion_dates:
                streak += 1
                check_date -= timedelta(days=1)
        
        # Areas to improve — generate one suggestion per completed round type based on lowest score
        areas_parts = []
        improvement_hints = {
            "technical": "Technical depth: focus on data structures and algorithmic optimization",
            "behavioral": "Communication: structure answers using the STAR method more consistently",
            "aptitude": "Pacing: practice timed multiple-choice questions for faster reasoning"
        }
        for r_type in recent_rounds_by_type:
            if recent_rounds_by_type[r_type]["score"] < 10:
                areas_parts.append(improvement_hints.get(r_type, f"{r_type.capitalize()}: keep practicing"))
        areas_to_improve = " | ".join(areas_parts) if areas_parts else ""
        
        return DashboardResponse(
            fullName=full_name,
            targetPosition=target_position,
            industry=industry,
            avgReadiness=round(avg_readiness, 1),
            roundsDone=len(completed_rounds),
            streak=streak,
            rounds=rounds_cards,
            recentHistory=recent_history,
            areasToImprove=areas_to_improve
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard: {str(e)}")
