from fastapi import APIRouter, Depends, HTTPException, Body
from supabase import Client
import uuid
import random
from typing import Optional, Dict, Any
from app.dependencies import get_supabase_client, get_user, get_admin_client
from app.models.schemas import (
    RoundStartRequest, RoundStartResponse, QuestionResponse,
    AnswerSubmitRequest, AnswerSubmitResponse,
    AptitudeExplainRequest, TechnicalExplainRequest
)
from app.services.ai_service import (
    grade_technical_solution, grade_behavioral_response,
    grade_aptitude_response, generate_aptitude_explanation,
    generate_technical_explanation
)

router = APIRouter(prefix="/round", tags=["Round Engine"])

# Mock banks in case Supabase tables are empty
DEFAULT_TECHNICAL_QUESTIONS = [
    {"question": "Implement twoSum(nums, target) that returns indices of two numbers adding up to the target.", "starter_code": "function twoSum(nums, target) {\n  // Write code here\n}", "difficulty": "Easy"},
    {"question": "Given a string s, return true if it is a valid anagram of t.", "starter_code": "function isAnagram(s, t) {\n  // Write code here\n}", "difficulty": "Easy"},
    {"question": "Reverse a singly linked list.", "starter_code": "function reverseList(head) {\n  // Write code here\n}", "difficulty": "Medium"},
    {"question": "Find the maximum subarray sum (Kadane's algorithm).", "starter_code": "function maxSubArray(nums) {\n  // Write code here\n}", "difficulty": "Medium"},
    {"question": "Implement a function to merge two sorted arrays into one sorted array.", "starter_code": "function mergeSorted(nums1, nums2) {\n  // Write code here\n}", "difficulty": "Easy"}
]

DEFAULT_APTITUDE_QUESTIONS = [
    {
        "question": "If a train travels 60 km in 45 minutes, what is its speed in km/h?",
        "option_a": "60", "option_b": "75", "option_c": "80", "option_d": "90",
        "correct_option": "C",
        "explanation": "Speed = Distance / Time = 60 km / (45/60 hours) = 60 * 4/3 = 80 km/h."
    },
    {
        "question": "What comes next in the sequence: 2, 6, 12, 20, 30, ?",
        "option_a": "36", "option_b": "40", "option_c": "42", "option_d": "48",
        "correct_option": "C",
        "explanation": "Sequence grows by consecutive even numbers (+4, +6, +8, +10, +12). 30 + 12 = 42."
    },
    {
        "question": "A sum of money doubles itself in 5 years at simple interest. In how many years will it become 4 times itself?",
        "option_a": "10 years", "option_b": "12 years", "option_c": "15 years", "option_d": "20 years",
        "correct_option": "C",
        "explanation": "To double, interest earned = P in 5 years (rate = 20%). To become 4P, interest earned = 3P, which takes 3 * 5 = 15 years."
    }
]

DEFAULT_BEHAVIORAL_QUESTIONS = [
    "Tell me about a time you faced a difficult teammate. What did you do?",
    "Describe a situation where a project missed a deadline. How did you handle it?",
    "Give an example of how you set goals and achieved them under high pressure."
]

TECHNICAL_TIME_LIMITS = {
    "easy": 10 * 60,     # 600 seconds
    "medium": 25 * 60,   # 1500 seconds
    "hard": 45 * 60      # 2700 seconds
}

APTITUDE_TOTAL_TIME_LIMIT = 15 * 60 # 900 seconds (15 minutes)

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
        total_time_limit = None

        # 3. Fetch/Generate questions based on type and user configuration
        req_diff = (payload.difficulty or "all").lower()

        if payload.roundType == "technical":
            # Determine question count: minimum 5, default 10 if not provided
            target_count = max(5, min(20, payload.questionCount)) if payload.questionCount else 10

            # Fetch from technical_questions table (role-specific filtering)
            db_q = client.table("technical_questions").select("*").eq("position", position).execute()
            q_list = db_q.data if db_q.data else []

            # Fallback: search for partial position match if exact position yields empty
            if len(q_list) == 0:
                all_tech = client.table("technical_questions").select("*").execute()
                all_qs = all_tech.data if all_tech.data else []
                q_list = [q for q in all_qs if position.lower() in q.get("position", "").lower() or q.get("position", "").lower() in position.lower()]
                if len(q_list) == 0:
                    q_list = all_qs if len(all_qs) > 0 else DEFAULT_TECHNICAL_QUESTIONS

            # Difficulty filtering if specific difficulty chosen
            if req_diff in ["easy", "medium", "hard"]:
                diff_filtered = [q for q in q_list if (q.get("difficulty") or "").lower() == req_diff]
                if diff_filtered:
                    q_list = diff_filtered

            # Ensure we have target_count problems by cycling if needed
            selected_qs = []
            while len(selected_qs) < target_count and q_list:
                for q in q_list:
                    selected_qs.append(q)
                    if len(selected_qs) >= target_count:
                        break
            if not selected_qs:
                selected_qs = DEFAULT_TECHNICAL_QUESTIONS[:target_count]

            diff_cycle = ["easy", "medium", "hard"]

            for idx, q in enumerate(selected_qs):
                raw_diff = (q.get("difficulty") or (req_diff if req_diff in ["easy", "medium", "hard"] else diff_cycle[idx % len(diff_cycle)])).lower()
                if raw_diff not in TECHNICAL_TIME_LIMITS:
                    raw_diff = "medium"
                time_sec = TECHNICAL_TIME_LIMITS[raw_diff]

                # Format question text
                q_title = q.get("title") or q.get("question") or ""
                q_desc = q.get("problem_description") or ""
                starter = q.get("starter_code_python") or q.get("starter_code") or ""

                full_q_text = f"[{raw_diff.upper()}] {q_title}"
                if q_desc:
                    full_q_text += f"\n\nDescription:\n{q_desc}"

                questions_to_insert.append({
                    "round_id": round_id,
                    "question_text": full_q_text,
                    "difficulty": raw_diff,
                    "time_limit_seconds": time_sec,
                    "starter_code": starter
                })

        elif payload.roundType == "aptitude":
            # Determine question count: minimum 10, default 50 if not provided
            target_count = max(10, min(50, payload.questionCount)) if payload.questionCount else 50

            db_q = client.table("aptitude_questions").select("*").execute()
            q_list = db_q.data if db_q.data else []

            if len(q_list) == 0:
                q_list = DEFAULT_APTITUDE_QUESTIONS

            # Pick target_count questions
            selected_qs = []
            while len(selected_qs) < target_count and q_list:
                for q in q_list:
                    selected_qs.append(q)
                    if len(selected_qs) >= target_count:
                        break

            # Dynamic total time limit: approx 18 seconds per question, min 5 minutes (300s), max 15 mins (900s)
            total_time_limit = max(300, min(900, target_count * 20))
            apt_diff = req_diff if req_diff in ["easy", "medium", "hard"] else "medium"

            for idx, q in enumerate(selected_qs):
                options_str = f"A) {q.get('option_a', '')} | B) {q.get('option_b', '')} | C) {q.get('option_c', '')} | D) {q.get('option_d', '')}"
                q_text = f"{q.get('question', '')} Options: {options_str}"
                questions_to_insert.append({
                    "round_id": round_id,
                    "question_text": q_text,
                    "difficulty": apt_diff,
                    "time_limit_seconds": total_time_limit,
                    "explanation": q.get("explanation", "")
                })

        elif payload.roundType == "behavioral":
            for q_text in DEFAULT_BEHAVIORAL_QUESTIONS:
                questions_to_insert.append({
                    "round_id": round_id,
                    "question_text": q_text,
                    "difficulty": "medium",
                    "time_limit_seconds": 600
                })
        else:
            raise HTTPException(status_code=400, detail="Invalid round type")

        # 4. Insert question records into 'questions' table
        inserted_qs = []
        for q_data in questions_to_insert:
            db_insert_data = {
                "round_id": q_data["round_id"],
                "question_text": q_data["question_text"]
            }
            q_res = client.table("questions").insert(db_insert_data).execute()
            if q_res.data and len(q_res.data) > 0:
                inserted_rec = q_res.data[0]
                inserted_rec["difficulty"] = q_data.get("difficulty", "medium")
                inserted_rec["time_limit_seconds"] = q_data.get("time_limit_seconds", 600)
                inserted_rec["starter_code"] = q_data.get("starter_code", "")
                inserted_rec["explanation"] = q_data.get("explanation", "")
                inserted_qs.append(inserted_rec)

        # 5. Format response
        formatted_questions = []
        for q in inserted_qs:
            q_id = q["id"]
            q_text = q["question_text"]
            difficulty = q.get("difficulty", "medium")
            time_limit = q.get("time_limit_seconds", 600)
            starter_code = q.get("starter_code", "")
            explanation = q.get("explanation", "")

            # If aptitude, parse options from question_text if available
            options = None
            if payload.roundType == "aptitude" and " Options: " in q_text:
                parts = q_text.split(" Options: ")
                if len(parts) > 1:
                    raw_opts = parts[1].split(" | ")
                    options = [opt.strip() for opt in raw_opts]

            formatted_questions.append(
                QuestionResponse(
                    id=q_id,
                    roundId=round_id,
                    questionText=q_text,
                    difficulty=difficulty,
                    timeLimitSeconds=time_limit,
                    starterCode=starter_code,
                    options=options,
                    explanation=explanation
                )
            )

        return RoundStartResponse(
            roundId=round_id,
            roundType=payload.roundType,
            status="in_progress",
            questions=formatted_questions,
            totalTimeLimitSeconds=total_time_limit
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
            grade = grade_technical_solution(q_text, payload.answerText, payload.language or "javascript")
        elif round_type == "behavioral":
            grade = grade_behavioral_response(q_text, payload.answerText)
        elif round_type == "aptitude":
            grade = grade_aptitude_response(q_text, payload.answerText)
        else:
            grade = {"score": 8, "feedback": "Good attempt."}

        score = int(round(grade["score"]))
        feedback = grade["feedback"]

        # Check if an answer for this question_id already exists (duplicate submission protection)
        existing_ans = client.table("answers").select("*").eq("question_id", question_id).execute()

        answer_data = {
            "question_id": question_id,
            "answer_text": payload.answerText,
            "score": score,
            "feedback": feedback
        }

        if existing_ans.data and len(existing_ans.data) > 0:
            existing_id = existing_ans.data[0]["id"]
            client.table("answers").update(answer_data).eq("id", existing_id).execute()
        else:
            client.table("answers").insert(answer_data).execute()

        # Check if all questions in this round have been answered
        all_qs_res = client.table("questions").select("id").eq("round_id", id).execute()
        all_q_ids = [q["id"] for q in (all_qs_res.data or [])]

        # Fetch answered questions
        ans_qs_res = client.table("answers").select("question_id, score").in_("question_id", all_q_ids).execute()
        answered_q_ids = [a["question_id"] for a in (ans_qs_res.data or [])]

        is_completed = len(answered_q_ids) >= len(all_q_ids)
        overall_score = None

        if is_completed:
            # Calculate overall score (average score of all answers)
            scores = [float(a["score"]) for a in (ans_qs_res.data or [])]
            if len(scores) > 0:
                overall_score = sum(scores) / len(scores)
            else:
                overall_score = float(score)

            # Update round status
            client.table("rounds").update({
                "status": "completed"
            }).eq("id", id).execute()

        star_breakdown = grade.get("star_breakdown")
        analysis_details = grade.get("analysisDetails")

        return AnswerSubmitResponse(
            score=score,
            feedback=feedback,
            isCompleted=is_completed,
            overallScore=overall_score,
            starBreakdown=star_breakdown,
            analysisDetails=analysis_details
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")

@router.post("/{id}/question/{question_id}/explanation")
def get_question_explanation(
    id: str,
    question_id: str,
    payload: Optional[Dict[str, Any]] = Body(default={}),
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    try:
        # 1. Verify round exists and belongs to authenticated user
        round_res = client.table("rounds").select("*").eq("id", id).eq("user_id", user.id).execute()
        if not round_res.data or len(round_res.data) == 0:
            raise HTTPException(status_code=404, detail="Round not found or access denied")
        round_record = round_res.data[0]
        round_type = round_record.get("round_type", "aptitude")

        # 2. Verify question belongs to this round
        q_res = client.table("questions").select("*").eq("id", question_id).eq("round_id", id).execute()
        if not q_res.data or len(q_res.data) == 0:
            raise HTTPException(status_code=404, detail="Question not found in this round")

        q_record = q_res.data[0]
        q_text = q_record.get("question_text", "")

        # Handle Technical Explanation
        if round_type == "technical":
            candidate_code = payload.get("candidateCode") or ""
            language = payload.get("language") or "javascript"
            if not candidate_code:
                ans_res = client.table("answers").select("answer_text").eq("question_id", question_id).execute()
                if ans_res.data and len(ans_res.data) > 0:
                    candidate_code = ans_res.data[0].get("answer_text", "")

            explanation_data = generate_technical_explanation(
                question=q_text,
                candidate_code=candidate_code,
                language=language,
                question_id=question_id
            )
            return explanation_data

        # Handle Aptitude Explanation
        options = payload.get("options")
        if not options and " Options: " in q_text:
            parts = q_text.split(" Options: ")
            if len(parts) > 1 and " | " in parts[1]:
                options = parts[1].split(" | ")

        selected_option = payload.get("selectedOption")
        if not selected_option:
            ans_res = client.table("answers").select("answer_text").eq("question_id", question_id).execute()
            if ans_res.data and len(ans_res.data) > 0:
                selected_option = ans_res.data[0].get("answer_text")

        explanation_data = generate_aptitude_explanation(
            question=q_text,
            options=options,
            selected_option=selected_option,
            question_id=question_id
        )

        if isinstance(explanation_data, dict):
            if explanation_data.get("aiEvaluationAvailable") == False:
                return {
                    "aiEvaluationAvailable": False,
                    "error": explanation_data.get("error", "AI explanation is currently unavailable. Please try again."),
                    "explanation": "AI explanation is currently unavailable. Please try again."
                }
            return {
                "aiEvaluationAvailable": True,
                "explanation": explanation_data.get("explanation") or explanation_data.get("rawText"),
                "correct": explanation_data.get("correct"),
                "verdict": explanation_data.get("verdict") or ("Verdict: CORRECT ANSWER ✅" if explanation_data.get("correct") else "Verdict: INCORRECT ANSWER ❌"),
                "correctOption": explanation_data.get("correctOption"),
                "selectedOption": selected_option or explanation_data.get("selectedOption"),
                "correctAnswer": explanation_data.get("correctAnswer"),
                "selectedAnswer": explanation_data.get("selectedAnswer"),
                "concept": explanation_data.get("concept"),
                "whyYourAnswer": explanation_data.get("whyYourAnswer"),
                "stepByStepSolution": explanation_data.get("stepByStepSolution") or [],
                "finalExplanation": explanation_data.get("finalExplanation"),
                "details": explanation_data
            }

        return {"explanation": str(explanation_data)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate question explanation: {str(e)}")

@router.post("/explain-aptitude")
def explain_aptitude(
    payload: AptitudeExplainRequest,
    user = Depends(get_user)
):
    try:
        explanation_data = generate_aptitude_explanation(payload.questionText, payload.options, payload.selectedOption, payload.questionId)
        if isinstance(explanation_data, dict):
            if explanation_data.get("aiEvaluationAvailable") == False:
                return {
                    "aiEvaluationAvailable": False,
                    "error": explanation_data.get("error", "AI explanation is currently unavailable. Please try again."),
                    "explanation": "AI explanation is currently unavailable. Please try again."
                }
            return {
                "aiEvaluationAvailable": True,
                "explanation": explanation_data.get("explanation") or explanation_data.get("rawText"),
                "correct": explanation_data.get("correct"),
                "verdict": explanation_data.get("verdict") or ("Verdict: CORRECT ANSWER ✅" if explanation_data.get("correct") else "Verdict: INCORRECT ANSWER ❌"),
                "correctOption": explanation_data.get("correctOption"),
                "selectedOption": payload.selectedOption or explanation_data.get("selectedOption"),
                "correctAnswer": explanation_data.get("correctAnswer"),
                "selectedAnswer": explanation_data.get("selectedAnswer"),
                "concept": explanation_data.get("concept"),
                "whyYourAnswer": explanation_data.get("whyYourAnswer"),
                "stepByStepSolution": explanation_data.get("stepByStepSolution") or [],
                "finalExplanation": explanation_data.get("finalExplanation"),
                "details": explanation_data
            }
        return {"explanation": str(explanation_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate AI explanation: {str(e)}")

@router.post("/explain-technical")
def explain_technical(
    payload: TechnicalExplainRequest,
    user = Depends(get_user)
):
    try:
        explanation_data = generate_technical_explanation(
            question=payload.questionText or "",
            candidate_code=payload.candidateCode or "",
            language=payload.language or "javascript",
            starter_code=payload.starterCode or "",
            question_id=payload.questionId or ""
        )
        return explanation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate technical AI explanation: {str(e)}")

@router.post("/{id}/finish")
def finish_round(
    id: str,
    user = Depends(get_user),
    client: Client = Depends(get_admin_client)
):
    """
    Finalizes a practice round, marking status='completed' in Supabase.
    Computes overall score from submitted answers.
    """
    try:
        # Verify the round exists and belongs to the user
        round_res = client.table("rounds").select("*").eq("id", id).eq("user_id", user.id).execute()
        if not round_res.data or len(round_res.data) == 0:
            raise HTTPException(status_code=404, detail="Round not found or access denied")

        # Fetch all questions for this round
        all_qs_res = client.table("questions").select("id").eq("round_id", id).execute()
        all_q_ids = [q["id"] for q in (all_qs_res.data or [])]

        # Fetch answered questions
        ans_count = 0
        overall_score = 0.0
        if all_q_ids:
            ans_res = client.table("answers").select("score").in_("question_id", all_q_ids).execute()
            answers = ans_res.data or []
            ans_count = len(answers)
            if ans_count > 0:
                scores = [float(a.get("score") or 0) for a in answers]
                overall_score = round(sum(scores) / ans_count, 1)

        # Mark round status as completed
        client.table("rounds").update({
            "status": "completed"
        }).eq("id", id).execute()

        return {
            "status": "completed",
            "roundId": id,
            "questionsAnswered": ans_count,
            "overallScore": overall_score
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to finish round: {str(e)}")
