import logging
import json
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from supabase import Client
from app.services.ai_service import call_gemini_json

logger = logging.getLogger(__name__)

# In-memory cache for Gemini AI recommendations keyed by (user_id, evidence_hash)
_AI_RECOMMENDATIONS_CACHE: Dict[str, Dict[str, Any]] = {}

def format_days_ago(dt: datetime) -> str:
    try:
        now = datetime.now(dt.tzinfo or timezone.utc)
        delta = now - dt
        if delta.days == 0:
            return "Today"
        elif delta.days == 1:
            return "1 day ago"
        elif delta.days < 30:
            return f"{delta.days} days ago"
        else:
            return dt.strftime("%b %d, %Y")
    except Exception:
        return "Recently"

def parse_iso_datetime(date_str: Optional[str]) -> datetime:
    if not date_str:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)

def calculate_streak(history_dts: List[datetime]) -> int:
    if not history_dts:
        return 0
    today = datetime.now(timezone.utc).date()
    completion_dates = {dt.date() for dt in history_dts if dt}
    streak = 0
    check_date = today
    while check_date in completion_dates:
        streak += 1
        check_date -= timedelta(days=1)
    return streak

def extract_star_components(feedback_text: str, score: float) -> Dict[str, float]:
    """
    Extracts STAR components (Situation, Task, Action, Result) from behavioral feedback and score.
    """
    fb_lower = (feedback_text or "").lower()
    has_sit = "situation" in fb_lower
    has_task = "task" in fb_lower
    has_act = "action" in fb_lower
    has_res = "result" in fb_lower

    sit = round(min(10.0, max(4.0, score * 0.95 + (0.8 if has_sit else 0.0))), 1)
    task = round(min(10.0, max(4.0, score * 0.90 + (0.8 if has_task else 0.0))), 1)
    act = round(min(10.0, max(4.0, score * 1.0 + (0.6 if has_act else 0.0))), 1)
    res = round(min(10.0, max(4.0, score * 0.92 + (1.0 if has_res else 0.0))), 1)

    return {
        "situation": sit,
        "task": task,
        "action": act,
        "result": res
    }

def is_aptitude_answer_correct(answer: Dict[str, Any]) -> bool:
    score = float(answer.get("score") or 0)
    if score >= 10.0:
        return True
    fb = str(answer.get("feedback") or "").strip().lower()
    if "incorrect" in fb or "wrong" in fb:
        return False
    if fb.startswith("correct") or "correct" in fb:
        return True
    return False

def get_canonical_user_analytics(user_id: str, client: Client) -> Dict[str, Any]:
    """
    Canonical single source of truth for user practice analytics across Technical, Behavioral, and Aptitude.
    Calculates deterministic performance statistics from completed Supabase database records.
    """
    # 1. Fetch Profile
    prof_res = client.table("profiles").select("*").eq("id", user_id).execute()
    if not prof_res.data:
        profile = {"full_name": "Candidate", "target_position": "Software Engineer", "industry": "Tech"}
    else:
        profile = prof_res.data[0]

    full_name = profile.get("full_name") or "Candidate"
    target_position = profile.get("target_position") or "Software Engineer"
    industry = profile.get("industry") or "Tech"

    # 2. Fetch completed rounds strictly
    rounds_res = client.table("rounds").select("*").eq("user_id", user_id).eq("status", "completed").execute()
    all_completed_rounds = rounds_res.data or []

    tech_rounds = []
    beh_rounds = []
    apt_rounds = []

    history_list = []
    history_dates = []

    for r in all_completed_rounds:
        r_id = r["id"]
        r_type = (r.get("round_type") or "technical").lower()
        started_at = parse_iso_datetime(r.get("started_at") or r.get("created_at"))
        history_dates.append(started_at)

        q_res = client.table("questions").select("id, question_text").eq("round_id", r_id).execute()
        qs = q_res.data or []
        q_ids = [q["id"] for q in qs]

        answers = []
        if q_ids:
            a_res = client.table("answers").select("*").in_("question_id", q_ids).execute()
            answers = a_res.data or []

        q_count = len(qs) if qs else len(answers)

        if r_type == "aptitude":
            correct_count = sum(1 for a in answers if is_aptitude_answer_correct(a))
            total_answered = len(answers)
            score_out_of_50 = float(correct_count) if q_count >= 50 else (float(correct_count) / max(1, total_answered) * 50.0 if total_answered > 0 else 0.0)
            score_normalized_10 = round((score_out_of_50 / 50.0) * 10.0, 1) if score_out_of_50 > 0 else 0.0
            percentage = round((score_out_of_50 / 50.0) * 100.0) if score_out_of_50 > 0 else 0

            round_obj = {
                "id": r_id,
                "roundType": "aptitude",
                "score": round(score_out_of_50, 1),
                "scoreNormalized": score_normalized_10,
                "maxScore": 50,
                "percentage": percentage,
                "correctCount": correct_count,
                "totalAnswered": total_answered,
                "questionsCount": max(50, q_count),
                "startedAt": started_at,
                "answers": answers,
                "questions": qs
            }
            apt_rounds.append(round_obj)
            history_list.append({
                "id": r_id,
                "name": "Aptitude round",
                "roundType": "aptitude",
                "score": round(score_out_of_50, 1),
                "maxScore": 50,
                "percentage": percentage,
                "questionsCount": max(50, q_count),
                "date": started_at.isoformat(),
                "formattedDate": started_at.strftime("%b %d, %Y"),
                "daysAgo": format_days_ago(started_at),
                "status": "Completed",
                "dt": started_at
            })

        elif r_type == "behavioral":
            scores = [float(a.get("score", 0)) for a in answers] if answers else [0.0]
            avg_score = round(sum(scores) / max(1, len(scores)), 1)
            percentage = round((avg_score / 10.0) * 100.0)

            star_accum = {"situation": [], "task": [], "action": [], "result": []}
            for a in answers:
                extracted = extract_star_components(a.get("feedback", ""), float(a.get("score", 0)))
                for k in star_accum:
                    star_accum[k].append(extracted[k])

            star_avg = {
                k: round(sum(v) / max(1, len(v)), 1) if v else avg_score
                for k, v in star_accum.items()
            }

            round_obj = {
                "id": r_id,
                "roundType": "behavioral",
                "score": avg_score,
                "scoreNormalized": avg_score,
                "maxScore": 10,
                "percentage": percentage,
                "star": star_avg,
                "questionsCount": max(3, q_count),
                "startedAt": started_at,
                "answers": answers,
                "questions": qs
            }
            beh_rounds.append(round_obj)
            history_list.append({
                "id": r_id,
                "name": "Behavioral round",
                "roundType": "behavioral",
                "score": avg_score,
                "maxScore": 10,
                "percentage": percentage,
                "questionsCount": max(3, q_count),
                "date": started_at.isoformat(),
                "formattedDate": started_at.strftime("%b %d, %Y"),
                "daysAgo": format_days_ago(started_at),
                "status": "Completed",
                "dt": started_at
            })

        else: # Technical
            scores = [float(a.get("score", 0)) for a in answers] if answers else [0.0]
            avg_score = round(sum(scores) / max(1, len(scores)), 1)
            percentage = round((avg_score / 10.0) * 100.0)

            round_obj = {
                "id": r_id,
                "roundType": "technical",
                "score": avg_score,
                "scoreNormalized": avg_score,
                "maxScore": 10,
                "percentage": percentage,
                "questionsCount": max(1, q_count),
                "startedAt": started_at,
                "answers": answers,
                "questions": qs
            }
            tech_rounds.append(round_obj)
            history_list.append({
                "id": r_id,
                "name": "Technical round",
                "roundType": "technical",
                "score": avg_score,
                "maxScore": 10,
                "percentage": percentage,
                "questionsCount": max(1, q_count),
                "date": started_at.isoformat(),
                "formattedDate": started_at.strftime("%b %d, %Y"),
                "daysAgo": format_days_ago(started_at),
                "status": "Completed",
                "dt": started_at
            })

    tech_rounds.sort(key=lambda x: x["startedAt"], reverse=True)
    beh_rounds.sort(key=lambda x: x["startedAt"], reverse=True)
    apt_rounds.sort(key=lambda x: x["startedAt"], reverse=True)
    history_list.sort(key=lambda x: x["dt"], reverse=True)

    # 3. Technical Metrics
    tech_attempts = len(tech_rounds)
    if tech_attempts > 0:
        tech_scores = [r["score"] for r in tech_rounds]
        tech_avg = round(sum(tech_scores) / tech_attempts, 1)
        tech_best = max(tech_scores)
        tech_latest = tech_rounds[0]["score"]
        tech_pct = round((tech_avg / 10.0) * 100.0)
        if tech_attempts >= 2:
            diff = round(tech_rounds[0]["score"] - tech_rounds[1]["score"], 1)
            tech_trend = f"{'+' if diff > 0 else ''}{diff}" if diff != 0 else "stable"
        else:
            tech_trend = "baseline"
    else:
        tech_avg, tech_best, tech_latest, tech_pct, tech_trend = 0.0, 0.0, 0.0, 0, "no_attempts"

    # 4. Behavioral Metrics
    beh_attempts = len(beh_rounds)
    if beh_attempts > 0:
        beh_scores = [r["score"] for r in beh_rounds]
        beh_avg = round(sum(beh_scores) / beh_attempts, 1)
        beh_best = max(beh_scores)
        beh_latest = beh_rounds[0]["score"]
        beh_pct = round((beh_avg / 10.0) * 100.0)

        all_sit = [r["star"]["situation"] for r in beh_rounds]
        all_task = [r["star"]["task"] for r in beh_rounds]
        all_act = [r["star"]["action"] for r in beh_rounds]
        all_res = [r["star"]["result"] for r in beh_rounds]
        star_summary = {
            "situation": round(sum(all_sit) / len(all_sit), 1),
            "task": round(sum(all_task) / len(all_task), 1),
            "action": round(sum(all_act) / len(all_act), 1),
            "result": round(sum(all_res) / len(all_res), 1),
        }
    else:
        beh_avg, beh_best, beh_latest, beh_pct = 0.0, 0.0, 0.0, 0
        star_summary = {"situation": 0.0, "task": 0.0, "action": 0.0, "result": 0.0}

    # 5. Aptitude Metrics
    apt_attempts = len(apt_rounds)
    if apt_attempts > 0:
        apt_scores = [r["score"] for r in apt_rounds]
        apt_avg = round(sum(apt_scores) / apt_attempts, 1)
        apt_best = max(apt_scores)
        apt_latest = apt_rounds[0]["score"]
        total_apt_correct = sum(r["correctCount"] for r in apt_rounds)
        total_apt_answered = sum(r["totalAnswered"] for r in apt_rounds)
        apt_accuracy = round((total_apt_correct / max(1, total_apt_answered)) * 100.0, 1) if total_apt_answered > 0 else round((apt_avg / 50.0) * 100.0, 1)
    else:
        apt_avg, apt_best, apt_latest, apt_accuracy, total_apt_answered, total_apt_correct = 0.0, 0.0, 0.0, 0.0, 0, 0

    # 6. Overall Readiness Score & Active Categories
    active_normalized_scores = []
    if tech_attempts > 0:
        active_normalized_scores.append(tech_avg)
    if beh_attempts > 0:
        active_normalized_scores.append(beh_avg)
    if apt_attempts > 0:
        active_normalized_scores.append(round((apt_avg / 50.0) * 10.0, 1))

    overall_readiness = round(sum(active_normalized_scores) / len(active_normalized_scores), 1) if active_normalized_scores else 0.0
    total_completed_rounds = tech_attempts + beh_attempts + apt_attempts
    total_questions_answered = sum(len(r.get("answers", [])) for r in tech_rounds + beh_rounds + apt_rounds)
    streak = calculate_streak(history_dates)

    # 7. Identify Strongest & Weakest Category
    categories_eval = []
    if tech_attempts > 0:
        categories_eval.append(("Technical", tech_avg, "Data Structures & Coding"))
    if beh_attempts > 0:
        categories_eval.append(("Behavioral", beh_avg, "STAR Communication"))
    if apt_attempts > 0:
        categories_eval.append(("Aptitude", round((apt_avg / 50.0) * 10.0, 1), "Quantitative & Logic"))

    if categories_eval:
        categories_eval.sort(key=lambda x: x[1])
        weakest_area = f"{categories_eval[0][0]} ({categories_eval[0][1]}/10)"
        strongest_area = f"{categories_eval[-1][0]} ({categories_eval[-1][1]}/10)"
    else:
        weakest_area = "None yet"
        strongest_area = "None yet"

    # 8. Clean Recent History Items for Response
    recent_history_clean = []
    for h in history_list[:8]:
        clean_item = dict(h)
        clean_item.pop("dt", None)
        recent_history_clean.append(clean_item)

    # 9. AI Areas to Improve Pipeline
    ai_improvement_data = get_ai_improvement_analysis(
        user_id=user_id,
        tech_rounds=tech_rounds,
        beh_rounds=beh_rounds,
        apt_rounds=apt_rounds,
        tech_avg=tech_avg,
        beh_avg=beh_avg,
        apt_avg=apt_avg,
        star_summary=star_summary
    )

    rounds_cards = [
        {
            "id": "technical",
            "name": "Technical round",
            "subtitle": "Data structures and algorithms",
            "score": tech_latest if tech_attempts > 0 else 0.0,
            "attempts": tech_attempts,
            "averageScore": tech_avg,
            "bestScore": tech_best,
            "percentage": tech_pct,
            "feedback": ["Good algorithmic depth", "Focus on boundary test cases"] if tech_attempts > 0 else ["No attempts completed yet."]
        },
        {
            "id": "behavioral",
            "name": "Behavioral round",
            "subtitle": "Teamwork and leadership",
            "score": beh_latest if beh_attempts > 0 else 0.0,
            "attempts": beh_attempts,
            "averageScore": beh_avg,
            "bestScore": beh_best,
            "percentage": beh_pct,
            "feedback": ["Structured STAR responses", "Continue practicing crisp result metrics"] if beh_attempts > 0 else ["No attempts completed yet."]
        },
        {
            "id": "aptitude",
            "name": "Aptitude round",
            "subtitle": "Career awareness and reasoning",
            "score": round((apt_latest / 50.0) * 10.0, 1) if apt_attempts > 0 else 0.0,
            "scoreOutOf50": apt_latest if apt_attempts > 0 else 0.0,
            "attempts": apt_attempts,
            "averageScore": apt_avg,
            "bestScore": apt_best,
            "accuracy": apt_accuracy,
            "feedback": [f"Scored {apt_latest}/50", f"Accuracy {apt_accuracy}%"] if apt_attempts > 0 else ["No attempts completed yet."]
        }
    ]

    areas_str_list = [a["area"] + ": " + a["recommendation"] for a in ai_improvement_data.get("areas", [])]
    areas_str = " | ".join(areas_str_list) if areas_str_list else ""

    return {
        "overview": {
            "fullName": full_name,
            "targetPosition": target_position,
            "industry": industry,
            "overallReadiness": overall_readiness,
            "overallScore": overall_readiness,
            "totalCompletedRounds": total_completed_rounds,
            "roundsDone": total_completed_rounds,
            "totalQuestionsAnswered": total_questions_answered,
            "streak": streak,
            "strongestArea": strongest_area,
            "weakestArea": weakest_area
        },
        "fullName": full_name,
        "targetPosition": target_position,
        "industry": industry,
        "avgReadiness": overall_readiness,
        "overallScore": overall_readiness,
        "roundsDone": total_completed_rounds,
        "streak": streak,
        "rounds": rounds_cards,
        "recentHistory": recent_history_clean,
        "areasToImprove": areas_str,
        "areasToImproveList": ai_improvement_data.get("areas", []),
        "technical": {
            "attempts": tech_attempts,
            "averageScore": tech_avg,
            "bestScore": tech_best,
            "latestScore": tech_latest,
            "percentage": tech_pct,
            "trend": tech_trend
        },
        "behavioral": {
            "attempts": beh_attempts,
            "averageScore": beh_avg,
            "bestScore": beh_best,
            "latestScore": beh_latest,
            "percentage": beh_pct,
            "star": star_summary
        },
        "aptitude": {
            "attempts": apt_attempts,
            "averageScore": apt_avg,
            "bestScore": apt_best,
            "latestScore": apt_latest,
            "accuracy": apt_accuracy,
            "questionsAnswered": total_apt_answered,
            "questionsCorrect": total_apt_correct
        },
        "aiAnalysisAvailable": ai_improvement_data.get("aiAnalysisAvailable", False),
        "aiPlan": ai_improvement_data.get("plan", {})
    }

def get_ai_improvement_analysis(
    user_id: str,
    tech_rounds: List[Dict[str, Any]],
    beh_rounds: List[Dict[str, Any]],
    apt_rounds: List[Dict[str, Any]],
    tech_avg: float,
    beh_avg: float,
    apt_avg: float,
    star_summary: Dict[str, float]
) -> Dict[str, Any]:
    total_rounds = len(tech_rounds) + len(beh_rounds) + len(apt_rounds)
    if total_rounds == 0:
        return {
            "aiAnalysisAvailable": True,
            "areas": [{
                "area": "Getting Started",
                "round": "technical",
                "severity": "medium",
                "evidence": "No completed practice rounds recorded.",
                "recommendation": "Start with a Technical coding round or Aptitude assessment to establish your performance baseline.",
                "priority": 1
            }],
            "plan": {
                "highestPriority": "Complete Initial Practice Rounds",
                "evidence": "Fresh candidate account with no recorded attempt data.",
                "whyItMatters": "Establishes your baseline across algorithms, communication, and quantitative problem solving.",
                "whatToPractice": "Take 1 Technical round, 1 Behavioral round, and 1 Aptitude round.",
                "suggestedTarget": "7.5+ / 10 readiness across all categories."
            }
        }

    # Collect compact historical evidence
    evidence = {
        "technical": {
            "attempts": len(tech_rounds),
            "averageScore": tech_avg,
            "sampleFeedbacks": [a.get("feedback", "")[:120] for r in tech_rounds[:3] for a in r.get("answers", [])[:2] if a.get("feedback")]
        },
        "behavioral": {
            "attempts": len(beh_rounds),
            "averageScore": beh_avg,
            "starScores": star_summary,
            "weakestStar": min(star_summary, key=star_summary.get) if star_summary else "none"
        },
        "aptitude": {
            "attempts": len(apt_rounds),
            "averageScoreOutOf50": apt_avg,
            "accuracy": round((apt_avg / 50.0) * 100.0, 1)
        }
    }

    # Deterministic evidence fingerprint for cache key
    evidence_fingerprint = hashlib.sha256(json.dumps(evidence, sort_keys=True).encode("utf-8")).hexdigest()
    cache_key = f"{user_id}_{evidence_fingerprint}"

    if cache_key in _AI_RECOMMENDATIONS_CACHE:
        return _AI_RECOMMENDATIONS_CACHE[cache_key]

    system_prompt = (
        "You are an expert AI Career Coach evaluating candidate practice history.\n"
        "Analyze the provided historical practice metrics and generate an actionable, evidence-based improvement plan.\n"
        "RULES:\n"
        "1. Base recommendations STRICTLY on the supplied performance data. Do NOT invent weaknesses not present in the data.\n"
        "2. Output ONLY a valid JSON object matching this schema:\n"
        "{\n"
        "  \"areas\": [\n"
        "    {\n"
        "      \"area\": \"string\",\n"
        "      \"round\": \"technical\" | \"behavioral\" | \"aptitude\",\n"
        "      \"severity\": \"high\" | \"medium\" | \"low\",\n"
        "      \"evidence\": \"exact metric from history\",\n"
        "      \"recommendation\": \"concrete action advice\",\n"
        "      \"priority\": 1\n"
        "    }\n"
        "  ],\n"
        "  \"plan\": {\n"
        "    \"highestPriority\": \"string\",\n"
        "    \"evidence\": \"string\",\n"
        "    \"whyItMatters\": \"string\",\n"
        "    \"whatToPractice\": \"string\",\n"
        "    \"suggestedTarget\": \"string\"\n"
        "  }\n"
        "}"
    )

    user_prompt = f"HISTORICAL PRACTICE EVIDENCE:\n{evidence}\n\nAnalyze performance and generate structured JSON improvement plan."

    parsed = call_gemini_json(user_prompt=user_prompt, system_prompt=system_prompt)

    if parsed and isinstance(parsed, dict) and "areas" in parsed:
        result = {
            "aiAnalysisAvailable": True,
            "areas": parsed.get("areas", []),
            "plan": parsed.get("plan", {})
        }
        _AI_RECOMMENDATIONS_CACHE[cache_key] = result
        return result

    # Deterministic fallback when Gemini API is unavailable
    fallback_areas = []
    if tech_rounds and tech_avg < 8.0:
        fallback_areas.append({
            "area": "Algorithmic Optimization & Complexity",
            "round": "technical",
            "severity": "high" if tech_avg < 6.5 else "medium",
            "evidence": f"Technical average is {tech_avg}/10 across {len(tech_rounds)} completed attempts.",
            "recommendation": "Focus on data structures (hash maps, two pointers) to improve execution complexity and edge case handling.",
            "priority": 1
        })
    if beh_rounds and star_summary:
        weakest_star = min(star_summary, key=star_summary.get)
        fallback_areas.append({
            "area": f"Behavioral {weakest_star.capitalize()} Depth",
            "round": "behavioral",
            "severity": "medium",
            "evidence": f"{weakest_star.capitalize()} score averaged {star_summary[weakest_star]}/10.",
            "recommendation": f"Elaborate more deeply on the {weakest_star} phase of your stories with concrete metrics and actions.",
            "priority": 2
        })
    if apt_rounds and apt_avg < 40:
        fallback_areas.append({
            "area": "Quantitative & Logical Pacing",
            "round": "aptitude",
            "severity": "medium",
            "evidence": f"Aptitude score averaged {apt_avg}/50 ({round((apt_avg/50.0)*100)}% accuracy).",
            "recommendation": "Practice speed calculations and time allocation per question to boost score toward 45+/50.",
            "priority": 3
        })

    if not fallback_areas:
        fallback_areas.append({
            "area": "Maintain High Performance Consistency",
            "round": "technical",
            "severity": "low",
            "evidence": f"Solid overall average performance across {total_rounds} assessments.",
            "recommendation": "Continue regular mock rounds to maintain speed and interview readiness.",
            "priority": 1
        })

    return {
        "aiAnalysisAvailable": False,
        "areas": fallback_areas,
        "plan": {
            "highestPriority": fallback_areas[0]["area"],
            "evidence": fallback_areas[0]["evidence"],
            "whyItMatters": "Directly impacts final interview screening readiness.",
            "whatToPractice": fallback_areas[0]["recommendation"],
            "suggestedTarget": "8.5+ / 10 score"
        }
    }
