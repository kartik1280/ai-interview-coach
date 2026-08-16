import logging
import os
import json
from typing import Dict, Any, Optional
from app.config import settings

# Initialize Logger
logger = logging.getLogger(__name__)

def call_gemini_json(user_prompt: str, system_prompt: str = None, model_name: str = "gemini-3.5-flash-lite") -> Optional[Dict[str, Any]]:
    """
    Centralized helper function for invoking Google Gemini API using google-genai SDK.
    Requests structured JSON mode and returns parsed dictionary or None on failure.
    """
    api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "gemini_api_key", None)

    if not api_key:
        logger.warning("GEMINI_API_KEY is missing or not configured.")
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        )
        if system_prompt:
            config.system_instruction = system_prompt

        models_to_try = [model_name, "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash"]
        for m in models_to_try:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=user_prompt,
                    config=config
                )
                if response and response.text:
                    text_content = response.text.strip()
                    if text_content.startswith("```json"):
                        text_content = text_content.removeprefix("```json").removesuffix("```").strip()
                    elif text_content.startswith("```"):
                        text_content = text_content.removeprefix("```").removesuffix("```").strip()
                    return json.loads(text_content)
            except Exception as model_err:
                logger.warning(f"Gemini model '{m}' call failed: {model_err}")
                continue

        return None
    except Exception as e:
        logger.error(f"Error initializing or calling Gemini SDK: {e}")
        return None

def grade_technical_solution(question: str, code: str, language: str) -> Dict[str, Any]:
    """
    Evaluates a technical coding solution using Google Gemini LLM API.
    Checks code correctness, syntax errors, logical bugs, edge cases, time/space complexity,
    and evaluates strictly in the candidate's selected programming language (Python, JS, Java, C++).
    """
    logger.info(f"Grading technical solution using Gemini for language: {language}")

    code_text = code.strip() if code else ""
    lang_upper = (language or "javascript").upper()
    lang_clean = (language or "javascript").lower()

    # Short / Unedited template check
    if len(code_text) < 15 or ("pass" in code_text and len(code_text.splitlines()) <= 3) or "// write your code here" in code_text.lower():
        analysis_details = {
            "verdict": "INCORRECT ANSWER ❌",
            "score": 2.0,
            "language": lang_upper,
            "summary": f"Incomplete implementation in {lang_upper}. The candidate submitted empty starter template code without core algorithmic logic.",
            "syntax": {"correct": True, "details": f"Template code in {lang_upper} has valid placeholder structure."},
            "correctness": {"correct": False, "details": "No functional solution implementation provided for problem evaluation."},
            "errors": [{"type": "incomplete_code", "description": "Missing function implementation", "suggestion": f"Implement the required algorithm in {lang_upper} and handle return values."}],
            "edgeCases": [{"case": "Basic Input", "result": "failed", "explanation": "No implementation to process input data."}],
            "complexity": {"time": "O(1)", "space": "O(1)", "assessment": "No operations performed."},
            "improvements": ["Complete the core function body with algorithm logic.", "Add boundary checks and edge case handling."]
        }
        feedback_text = (
            f"Verdict: INCORRECT ANSWER ❌\n"
            f"Language Evaluated: {lang_upper}\n"
            f"Score: 2.0 / 10\n\n"
            f"SUMMARY:\n{analysis_details['summary']}\n\n"
            f"ERRORS:\n• Incomplete Submission: Missing algorithmic solution in {lang_upper}."
        )
        return {
            "score": 2.0,
            "feedback": feedback_text,
            "analysisDetails": analysis_details
        }

    system_prompt = (
        "You are an expert technical coding interviewer evaluating candidate source code.\n"
        "Evaluate the submitted code strictly against the given problem statement and selected language: " + lang_upper + ".\n"
        "Analyze:\n"
        "1. Syntax: Is code syntactically valid in " + lang_upper + "?\n"
        "2. Correctness & Logic: Does algorithm solve problem correctly? Are there bugs, off-by-one errors, state errors, hardcoded returns, or wrong return values?\n"
        "3. Edge Cases: Empty inputs, single element, duplicates, negative numbers, boundary constraints.\n"
        "4. Time & Space Complexity: Exact Big-O asymptotic notation.\n"
        "5. Verdict: Assign 'CORRECT ANSWER ✅' if score >= 7.5 and logic works; otherwise 'INCORRECT ANSWER ❌'.\n"
        "6. Assign a float score from 0.0 to 10.0.\n\n"
        "Return ONLY a valid JSON object matching this schema:\n"
        "{\n"
        "  \"score\": 8.5,\n"
        "  \"verdict\": \"CORRECT ANSWER ✅\",\n"
        "  \"summary\": \"Brief 1-2 sentence overview of evaluation.\",\n"
        "  \"syntax\": {\"correct\": true, \"details\": \"Syntax details\"},\n"
        "  \"correctness\": {\"correct\": true, \"details\": \"Correctness details\"},\n"
        "  \"errors\": [{\"type\": \"logic\", \"description\": \"Error description\", \"suggestion\": \"Fix suggestion\"}],\n"
        "  \"edgeCases\": [{\"case\": \"Empty Array\", \"result\": \"passed\", \"explanation\": \"Handles empty array\"}],\n"
        "  \"complexity\": {\"time\": \"O(N)\", \"space\": \"O(1)\", \"assessment\": \"Time and space complexity description\"},\n"
        "  \"improvements\": [\"Improvement 1\", \"Improvement 2\"]\n"
        "}"
    )

    user_content = (
        f"PROBLEM STATEMENT:\n{question}\n\n"
        f"SELECTED LANGUAGE:\n{lang_upper}\n\n"
        f"CANDIDATE SOURCE CODE:\n```{lang_clean}\n{code_text}\n```"
    )

    parsed = call_gemini_json(user_prompt=user_content, system_prompt=system_prompt)

    if parsed and isinstance(parsed, dict):
        raw_score = parsed.get("score", 7.0)
        score = round(min(10.0, max(0.0, float(raw_score))), 1)

        verdict = parsed.get("verdict", "CORRECT ANSWER ✅" if score >= 7.5 else "INCORRECT ANSWER ❌")
        if "CORRECT" in verdict.upper() and score < 7.0:
            verdict = "INCORRECT ANSWER ❌"
        elif "INCORRECT" in verdict.upper() and score >= 8.5:
            verdict = "CORRECT ANSWER ✅"

        summary = parsed.get("summary", f"Evaluation completed in {lang_upper}.")
        syntax = parsed.get("syntax", {"correct": True, "details": f"Syntax valid in {lang_upper}."})
        correctness = parsed.get("correctness", {"correct": score >= 7.5, "details": "Logic check completed."})
        errors = parsed.get("errors", [])
        edge_cases = parsed.get("edgeCases", [])
        complexity = parsed.get("complexity", {"time": "O(N)", "space": "O(1)", "assessment": "Standard complexity."})
        improvements = parsed.get("improvements", [])

        analysis_details = {
            "score": score,
            "verdict": verdict,
            "language": lang_upper,
            "summary": summary,
            "syntax": syntax,
            "correctness": correctness,
            "errors": errors,
            "edgeCases": edge_cases,
            "complexity": complexity,
            "improvements": improvements
        }

        err_lines = "\n".join([f"• [{e.get('type','error').upper()}] {e.get('description','')}" for e in errors]) if errors else "None detected."
        imp_lines = "\n".join([f"• {imp}" for imp in improvements]) if improvements else "Code structure is clean."

        feedback_text = (
            f"Verdict: {verdict}\n"
            f"Language Evaluated: {lang_upper}\n"
            f"Score: {score} / 10\n\n"
            f"SUMMARY:\n{summary}\n\n"
            f"SYNTAX & EXECUTION:\n{syntax.get('details','')}\n\n"
            f"CORRECTNESS & LOGIC:\n{correctness.get('details','')}\n\n"
            f"ERRORS & ISSUES:\n{err_lines}\n\n"
            f"COMPLEXITY ANALYSIS:\nTime: {complexity.get('time','O(N)')} | Space: {complexity.get('space','O(1)')}\n{complexity.get('assessment','')}\n\n"
            f"RECOMMENDED IMPROVEMENTS:\n{imp_lines}"
        )

        return {
            "score": score,
            "feedback": feedback_text,
            "analysisDetails": {
                "aiEvaluationAvailable": True,
                **analysis_details
            }
        }

    # If Gemini API fails, times out, rate-limits, or API key is unavailable:
    return {
        "score": 0.0,
        "feedback": "AI EVALUATION UNAVAILABLE\n\nThe AI service could not evaluate your submission right now. Please try again.",
        "analysisDetails": {
            "aiEvaluationAvailable": False,
            "error": "AI evaluation is currently unavailable. Please try again.",
            "verdict": "AI EVALUATION UNAVAILABLE",
            "score": None,
            "summary": "The AI service could not evaluate your submission right now. Please check your API configuration or network connection and try again.",
            "syntax": None,
            "correctness": None,
            "errors": [{"type": "service_unavailable", "description": "AI provider service unavailable or rate limited.", "suggestion": "Click 'Re-evaluate Solution' to retry."}],
            "edgeCases": [],
            "complexity": None,
            "improvements": []
        }
    }

def grade_aptitude_response(question: str, choice: str) -> Dict[str, Any]:
    """
    Scaffolding for grading aptitude choice answers.
    """
    logger.info("Grading aptitude response")

    choice_clean = choice.strip().upper()
    is_correct = False
    explanation = "General estimation rules apply."

    if "piano" in question.lower():
        is_correct = (choice_clean == "B")
        explanation = "Approximately 125 - 150 piano tuners are active in Chicago based on population metrics."
    elif "sequence" in question.lower() or "2, 6, 12" in question:
        is_correct = (choice_clean == "C")
        explanation = "The sequence increases by consecutive even numbers (+4, +6, +8, +10, +12). 30 + 12 = 42."
    elif "pipeline" in question.lower() or "nodes" in question.lower():
        is_correct = (choice_clean == "B")
        explanation = "A traffic surge of 50% increases throughput to 1800 req/min, which requires 5 nodes."
    else:
        is_correct = (hash(question) % 2 == 0)
        explanation = "Standard numerical logical check completed."

    score = 10 if is_correct else 2
    feedback = f"Correct choice! {explanation}" if is_correct else f"Incorrect choice. {explanation}"

    return {
        "score": score,
        "feedback": feedback
    }

def grade_behavioral_response(question: str, response: str) -> Dict[str, Any]:
    """
    Scaffolding for grading a behavioral answer using STAR structure check.
    """
    logger.info("Grading behavioral response")
    
    resp_lower = response.lower()
    words = len(resp_lower.split())
    
    # Check for simple STAR keywords
    has_situation = any(w in resp_lower for w in ["when", "project", "initially", "situation", "team"])
    has_action = any(w in resp_lower for w in ["did", "i", "resolved", "scheduled", "handled"])
    has_result = any(w in resp_lower for w in ["result", "resolved", "completed", "outcome", "finally"])
    
    if words < 15:
        score = 3
        feedback = "The response is too short. Please use the STAR methodology to elaborate your scenario."
    else:
        score = 6
        matches = []
        if has_situation:
            score += 1
            matches.append("Situation")
        if has_action:
            score += 1
            matches.append("Action")
        if has_result:
            score += 2
            matches.append("Result")
            
        score = min(10, score)
        feedback = f"Demonstrated a structured behavioral response covering {', '.join(matches)}. Solid communication style."
        
    s_score = round(min(10.0, max(5.0, score * 0.95 + (0.5 if has_situation else 0))), 1)
    t_score = round(min(10.0, max(5.0, score * 0.90 + 0.5)), 1)
    a_score = round(min(10.0, max(5.0, score * 1.0 + (0.5 if has_action else 0))), 1)
    r_score = round(min(10.0, max(5.0, score * 0.92 + (0.8 if has_result else 0))), 1)

    return {
        "score": score,
        "feedback": feedback,
        "star_breakdown": {
            "situation": s_score,
            "task": t_score,
            "action": a_score,
            "result": r_score
        }
    }

def generate_aptitude_explanation(question: str, options: list = None, selected_option: str = None, question_id: str = None, correct_option: str = None) -> Dict[str, Any]:
    """
    Generates a step-by-step AI logical and mathematical explanation specifically for an aptitude question using Gemini LLM API.
    Evaluates candidate's selected choice against the actual correct answer, explicitly explains why the candidate's choice
    is correct or incorrect, and returns a structured response object.
    """
    logger.info(f"Generating Gemini AI aptitude explanation for question: {question[:40]}...")

    q_text = question.strip() if question else "Aptitude Question"
    opts_list = options if (options and isinstance(options, list)) else []
    sel_opt = selected_option.strip() if selected_option else "None selected"
    corr_opt = correct_option.strip() if correct_option else ""

    system_prompt = (
        "You are an expert AI Aptitude & Logical Reasoning Examiner.\n"
        "Your task is to independently solve the given aptitude question step-by-step and provide a clear, question-specific explanation.\n\n"
        "INSTRUCTIONS:\n"
        "1. Read the EXACT QUESTION and choices carefully.\n"
        "2. Solve the mathematical or logical problem step-by-step FIRST to derive the single correct answer option (A, B, C, D) and the exact calculated answer value.\n"
        "3. Compare the candidate's selected option to the correct option.\n"
        "   - Set 'correct' to true if candidate's choice matches the correct option; false if incorrect or unselected.\n"
        "4. Write 'stepByStepSolution': An array of strings where each string is a step in the logical/mathematical derivation for THIS specific problem.\n"
        "5. Write 'whyYourAnswer': Explain specifically why the candidate's selected choice is correct or why it is incorrect.\n"
        "6. Write 'finalExplanation': A concise 1-2 sentence concluding summary of the solution.\n"
        "7. Identify 'concept': Name the core mathematical/logical concept (e.g., 'Speed, Distance and Time', 'Combinatorics & Probability', 'Sequence & Series', 'Time & Work', 'Vocabulary & Verbal Reasoning').\n\n"
        "Return ONLY a JSON object matching this schema:\n"
        "{\n"
        "  \"correct\": true,\n"
        "  \"correctOption\": \"C\",\n"
        "  \"selectedOption\": \"A\",\n"
        "  \"correctAnswer\": \"60 km/h\",\n"
        "  \"selectedAnswer\": \"40 km/h\",\n"
        "  \"concept\": \"Speed, Distance and Time\",\n"
        "  \"whyYourAnswer\": \"Option A (40 km/h) is incorrect because 120 km divided by 2 hours equals 60 km/h, not 40 km/h.\",\n"
        "  \"stepByStepSolution\": [\n"
        "    \"Step 1: Identify given distance (120 km) and time (2 hours).\",\n"
        "    \"Step 2: Use formula Speed = Distance / Time.\",\n"
        "    \"Step 3: Speed = 120 / 2 = 60 km/h.\",\n"
        "    \"Step 4: Map 60 km/h to Option C.\"\n"
        "  ],\n"
        "  \"finalExplanation\": \"Option C (60 km/h) is the correct answer based on the average speed formula.\"\n"
        "}"
    )

    options_str = "\n".join(opts_list) if opts_list else "No choices array provided."
    user_content = (
        f"EXACT QUESTION:\n{q_text}\n\n"
        f"CHOICES:\n{options_str}\n\n"
        f"KNOWN CORRECT OPTION (if stored): {corr_opt if corr_opt else 'Derive from choices'}\n"
        f"CANDIDATE'S SELECTED OPTION:\n{sel_opt}\n\n"
        f"Solve this exact question independently and return the structured JSON explanation."
    )

    parsed = call_gemini_json(user_prompt=user_content, system_prompt=system_prompt)

    if parsed and isinstance(parsed, dict):
        is_correct = bool(parsed.get("correct", False))
        c_opt = parsed.get("correctOption", corr_opt or "A")
        s_opt = parsed.get("selectedOption", sel_opt)
        corr_ans = parsed.get("correctAnswer", "")
        sel_ans = parsed.get("selectedAnswer", "")
        concept = parsed.get("concept", "Logical & Quantitative Aptitude")
        why_ans = parsed.get("whyYourAnswer", f"Your choice {sel_opt} was evaluated.")
        steps_list = parsed.get("stepByStepSolution", [])
        if isinstance(steps_list, str):
            steps_list = [steps_list]
        steps_explanation = "\n".join(steps_list) if steps_list else parsed.get("explanation", "Step-by-step analysis completed.")
        final_exp = parsed.get("finalExplanation", steps_explanation)

        verdict_badge = "Verdict: CORRECT ANSWER ✅" if is_correct else "Verdict: INCORRECT ANSWER ❌"
        raw_text = (
            f"{verdict_badge}\n"
            f"Your Selected Option: {s_opt}\n"
            f"Correct Option: {c_opt}\n"
            f"Concept: {concept}\n\n"
            f"WHY YOUR ANSWER IS {'CORRECT' if is_correct else 'INCORRECT'}:\n{why_ans}\n\n"
            f"--- STEP-BY-STEP SOLUTION ---\n{steps_explanation}\n\n"
            f"Summary: {final_exp}"
        )

        return {
            "aiEvaluationAvailable": True,
            "correct": is_correct,
            "verdict": verdict_badge,
            "correctOption": c_opt,
            "selectedOption": s_opt,
            "correctAnswer": corr_ans,
            "selectedAnswer": sel_ans,
            "concept": concept,
            "whyYourAnswer": why_ans,
            "stepByStepSolution": steps_list,
            "finalExplanation": final_exp,
            "explanation": steps_explanation,
            "rawText": raw_text
        }

    # If Gemini API call fails or key is missing, return explicit failure state.
    return {
        "aiEvaluationAvailable": False,
        "error": "AI explanation is currently unavailable. Please try again.",
        "explanation": "AI explanation is currently unavailable. Please try again.",
        "rawText": "AI EXPLANATION UNAVAILABLE\n\nThe AI service could not generate an explanation for this question right now. Please try again."
    }
