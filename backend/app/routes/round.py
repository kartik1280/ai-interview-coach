from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
import uuid
import random
from app.dependencies import get_supabase_client, get_user, get_admin_client
from app.models.schemas import RoundStartRequest, RoundStartResponse, QuestionResponse, AnswerSubmitRequest, AnswerSubmitResponse
from app.services.ai_service import grade_technical_solution, grade_behavioral_response, grade_aptitude_response

router = APIRouter(prefix="/round", tags=["Round Engine"])

# Mock banks in case Supabase tables are empty
DEFAULT_TECHNICAL_QUESTIONS = [
    {"question": "Implement twoSum(nums, target) that returns indices of two numbers adding up to the target.", "starter_code": "function twoSum(nums, target) {\n  // Write code here\n}", "difficulty": "Easy"},
    {"question": "Given a string s, return true if it is a valid anagram of t.", "starter_code": "function isAnagram(s, t) {\n  // Write code here\n}", "difficulty": "Easy"},
    {"question": "Reverse a singly linked list.", "starter_code": "function reverseList(head) {\n  // Write code here\n}", "difficulty": "Medium"}
]

DEFAULT_APTITUDE_QUESTIONS = [
    {
        "question": "How many piano tuners are there in Chicago?",
        "option_a": "Approximately 25 - 35 tuners",
        "option_b": "Approximately 125 - 150 tuners",
        "option_c": "Approximately 500 - 600 tuners",
        "option_d": "Approximately 1,200 - 1,500 tuners",
        "correct_option": "B",
        "explanation": "Chicago pop (~2.7M) -> 1M households -> 2% own pianos -> 125-150 tuners is standard estimation."
    },
    {
        "question": "What comes next in the sequence: 2, 6, 12, 20, 30, ?",
        "option_a": "36",
        "option_b": "40",
        "option_c": "42",
        "option_d": "48",
        "correct_option": "C",
        "explanation": "Sequence grows by consecutive even numbers (+4, +6, +8, +10, +12). 30 + 12 = 42."
    }
]

DEFAULT_BEHAVIORAL_QUESTIONS = [
    "Tell me about a time you faced a difficult teammate. What did you do?",
    "Describe a situation where a project missed a deadline. How did you handle it?",
    "Give an example of how you set goals and achieved them under high pressure."
]

@router.post("/start", response_model=RoundStartResponse)
def start_round(
    payload: RoundStartRequest,
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    try:
        # 1. Fetch user's profile to get position and industry
        prof_res = client.table("profiles").select("*").eq("id", user.id).execute()
        if not prof_res.data or len(prof_res.data) == 0:
            raise HTTPException(status_code=400, detail="Please complete profile onboarding first")
        profile = prof_res.data[0]
        position = profile.get("target_position", "Software Engineer")
        industry = profile.get("industry", "Tech")
        
        # 2. Insert round record into 'rounds' table
        round_data = {
            "user_id": user.id,
            "round_type": payload.roundType,
            "status": "in_progress"
        }
        r_res = client.table("rounds").insert(round_data).execute()
        if not r_res.data or len(r_res.data) == 0:
            raise Exception("Failed to create round record")
        round_record = r_res.data[0]
        round_id = round_record["id"]
        
        questions_to_insert = []
        
        # 3. Fetch/Generate questions based on type
        if payload.roundType == "technical":
            # Fetch from technical_questions table (filtering by position)
            db_q = client.table("technical_questions").select("*").eq("position", position).execute()
            q_list = db_q.data if db_q.data else []
                
            # Fallback to static default mock questions if table is empty
            if len(q_list) == 0:
                q_list = DEFAULT_TECHNICAL_QUESTIONS
                
            # Pick up to 10 questions (or all available if less)
            selected_qs = q_list[:10]
            for idx, q in enumerate(selected_qs):
                q_text = f"Difficulty: {q.get('difficulty', 'Medium')} | {q.get('question', '')}"
                questions_to_insert.append({"round_id": round_id, "question_text": q_text})
                
        elif payload.roundType == "aptitude":
            # Fetch from aptitude_questions table
            db_q = client.table("aptitude_questions").select("*").eq("industry", industry).execute()
            q_list = db_q.data if db_q.data else []
            
            if len(q_list) == 0:
                q_list = DEFAULT_APTITUDE_QUESTIONS
                
            # Shuffle and pick up to 10 questions
            random.shuffle(q_list)
            selected_qs = q_list[:10]
            for idx, q in enumerate(selected_qs):
                options_str = f"A) {q.get('option_a', '')} | B) {q.get('option_b', '')} | C) {q.get('option_c', '')} | D) {q.get('option_d', '')}"
                q_text = f"{q.get('question', '')} Options: {options_str}"
                questions_to_insert.append({"round_id": round_id, "question_text": q_text})
                
        elif payload.roundType == "behavioral":
            # Fetch resume text if available for AI generation context
            resume_res = client.table("resumes").select("*").eq("user_id", user.id).execute()
            resume_text = ""
            if resume_res.data and len(resume_res.data) > 0:
                resume_text = resume_res.data[0].get("extracted_text", "")
            
            # Simulate or call OpenAI to generate personalized behavioral questions
            # For now, return standard behavioral questions
            for q_text in DEFAULT_BEHAVIORAL_QUESTIONS:
                questions_to_insert.append({"round_id": round_id, "question_text": q_text})
        else:
            raise HTTPException(status_code=400, detail="Invalid round type")
            
        # 4. Insert question records into 'questions' table
        inserted_qs = []
        for q_data in questions_to_insert:
            q_res = client.table("questions").insert(q_data).execute()
            if q_res.data and len(q_res.data) > 0:
                inserted_qs.append(q_res.data[0])
                
        # 5. Format response
        questions_resp = [
            QuestionResponse(id=q["id"], roundId=q["round_id"], questionText=q["question_text"])
            for q in inserted_qs
        ]
        
        return RoundStartResponse(
            roundId=round_id,
            roundType=payload.roundType,
            status="in_progress",
            questions=questions_resp
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start practice round: {str(e)}")

@router.post("/{id}/answer", response_model=AnswerSubmitResponse)
def submit_answer(
    id: str,
    payload: AnswerSubmitRequest,
    question_id: str, # passed as a query param
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    try:
        # Verify the round exists and belongs to the user
        round_res = client.table("rounds").select("*").eq("id", id).eq("user_id", user.id).execute()
        if not round_res.data or len(round_res.data) == 0:
            raise HTTPException(status_code=404, detail="Round not found or access denied")
        round_record = round_res.data[0]
        
        # Verify the question belongs to this round
        q_res = client.table("questions").select("*").eq("id", question_id).eq("round_id", id).execute()
        if not q_res.data or len(q_res.data) == 0:
            raise HTTPException(status_code=404, detail="Question not found in this round")
        question_record = q_res.data[0]
        
        # Score the answer dynamically
        round_type = round_record.get("round_type")
        q_text = question_record.get("question_text", "")
        
        if round_type == "technical":
            grade = grade_technical_solution(q_text, payload.answerText, "javascript")
        elif round_type == "behavioral":
            grade = grade_behavioral_response(q_text, payload.answerText)
        elif round_type == "aptitude":
            grade = grade_aptitude_response(q_text, payload.answerText)
        else:
            grade = {"score": 8, "feedback": "Good attempt."}
            
        score = int(round(grade["score"]))
        feedback = grade["feedback"]
        
        # Save the answer record in 'answers' table
        answer_data = {
            "question_id": question_id,
            "answer_text": payload.answerText,
            "score": score,
            "feedback": feedback
        }
        ans_res = client.table("answers").insert(answer_data).execute()
        
        # Check if all questions in this round have been answered
        all_qs_res = client.table("questions").select("id").eq("round_id", id).execute()
        all_q_ids = [q["id"] for q in all_qs_res.data]
        
        # Fetch answered questions
        ans_qs_res = client.table("answers").select("question_id, score").in_("question_id", all_q_ids).execute()
        answered_q_ids = [a["question_id"] for a in ans_qs_res.data]
        
        is_completed = len(answered_q_ids) >= len(all_q_ids)
        overall_score = None
        
        if is_completed:
            # Calculate overall score (average score of all answers)
            scores = [a["score"] for a in ans_qs_res.data]
            if len(scores) > 0:
                overall_score = sum(scores) / len(scores)
            else:
                overall_score = score
                
            # Update round status (rounds table has no score column)
            client.table("rounds").update({
                "status": "completed"
            }).eq("id", id).execute()
            
        star_breakdown = grade.get("star_breakdown")
        
        return AnswerSubmitResponse(
            score=score,
            feedback=feedback,
            isCompleted=is_completed,
            overallScore=overall_score,
            starBreakdown=star_breakdown
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")
