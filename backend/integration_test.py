"""
Backend Integration Test Script
Tests all API endpoints with real Supabase authentication.
"""
import json
import sys
import os
import urllib.request
import urllib.error

# Fix Windows console encoding
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:8000"

# Test credentials — use an existing test account
TEST_EMAIL = "ayeshsrivastava@gmail.com"
TEST_PASSWORD = "AIINTERVIEW@123"

SUPABASE_URL = "https://fiyyiepsdiutloqvonpz.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable__8wmK3kcAvAo3foaI-6fDQ_nCvNdViE"

results = []

def log(status, test, detail=""):
    icon = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
    print(f"{icon} {test}: {detail}")
    results.append({"status": status, "test": test, "detail": detail})

def api_request(method, url, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except:
            body = {"detail": str(e)}
        return e.code, body

def supabase_login(email, password):
    """Login via Supabase Auth REST API to get a JWT token."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY
    }
    data = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result.get("access_token"), result.get("user", {}).get("id")
    except urllib.error.HTTPError as e:
        print(f"Login failed: {e.read().decode()}")
        return None, None

# =============================================
# Phase 1: Server Health
# =============================================
print("\n" + "="*60)
print("PHASE 1: SERVER HEALTH")
print("="*60)

status, body = api_request("GET", f"{BASE_URL}/")
if status == 200 and body.get("status") == "online":
    log("PASS", "GET /", f"Server online: {body.get('service')}")
else:
    log("FAIL", "GET /", f"Status: {status}, Body: {body}")

# =============================================
# Phase 2: Authentication
# =============================================
print("\n" + "="*60)
print("PHASE 2: AUTHENTICATION")
print("="*60)

# Test unauthorized access
status, body = api_request("GET", f"{BASE_URL}/dashboard")
if status == 401:
    log("PASS", "Unauthorized GET /dashboard", f"Correctly rejected: {body.get('detail', '')}")
else:
    log("FAIL", "Unauthorized GET /dashboard", f"Expected 401, got {status}")

status, body = api_request("GET", f"{BASE_URL}/profile")
if status == 401:
    log("PASS", "Unauthorized GET /profile", f"Correctly rejected")
else:
    log("FAIL", "Unauthorized GET /profile", f"Expected 401, got {status}")

status, body = api_request("GET", f"{BASE_URL}/report/latest")
if status == 401:
    log("PASS", "Unauthorized GET /report/latest", f"Correctly rejected")
else:
    log("FAIL", "Unauthorized GET /report/latest", f"Expected 401, got {status}")

# Login
token, user_id = supabase_login(TEST_EMAIL, TEST_PASSWORD)
if token:
    log("PASS", "Supabase Login", f"Got token for user {user_id[:8]}...")
else:
    log("FAIL", "Supabase Login", "Could not obtain JWT token — cannot continue")
    print("\nCANNOT CONTINUE WITHOUT AUTH TOKEN. Exiting.")
    sys.exit(1)

# Test auth verification
status, body = api_request("GET", f"{BASE_URL}/auth/verify", token=token)
if status == 200:
    log("PASS", "GET /auth/verify", f"User verified: {body.get('user_id', '')[:8]}...")
else:
    log("FAIL", "GET /auth/verify", f"Status: {status}, Body: {body}")

# Test invalid token
status, body = api_request("GET", f"{BASE_URL}/dashboard", token="invalid_token_xyz")
if status == 401:
    log("PASS", "Invalid token rejected", f"Correctly rejected")
else:
    log("FAIL", "Invalid token rejected", f"Expected 401, got {status}")

# =============================================
# Phase 3: Profile / Settings
# =============================================
print("\n" + "="*60)
print("PHASE 3: PROFILE / SETTINGS")
print("="*60)

status, body = api_request("GET", f"{BASE_URL}/profile", token=token)
if status == 200:
    log("PASS", "GET /profile", f"Name: {body.get('fullName', 'N/A')}, Position: {body.get('targetPosition', 'N/A')}")
    # Verify no hardcoded defaults
    if body.get("fullName") == "Sameer Mishra":
        log("FAIL", "Profile hardcoded check", "Still returns hardcoded 'Sameer Mishra'")
    else:
        log("PASS", "Profile hardcoded check", "No hardcoded defaults detected")
else:
    log("FAIL", "GET /profile", f"Status: {status}, Body: {body}")

# Test PUT /profile
test_data = {"fullName": "Test User IntegTest", "targetPosition": "Software Engineer", "industry": "Technology"}
status, body = api_request("PUT", f"{BASE_URL}/profile", data=test_data, token=token)
if status == 200 and body.get("fullName") == "Test User IntegTest":
    log("PASS", "PUT /profile", f"Profile updated successfully")
else:
    log("FAIL", "PUT /profile", f"Status: {status}, Body: {body}")

# Verify persistence by re-reading
status, body = api_request("GET", f"{BASE_URL}/profile", token=token)
if status == 200 and body.get("fullName") == "Test User IntegTest":
    log("PASS", "Profile persistence", "Data persisted correctly after re-read")
else:
    log("FAIL", "Profile persistence", f"Expected 'Test User IntegTest', got {body.get('fullName')}")

# Restore original name
restore_data = {"fullName": "Ayesh Srivastava", "targetPosition": "Data engineer", "industry": "IBM DATA ANALYSIS"}
api_request("PUT", f"{BASE_URL}/profile", data=restore_data, token=token)

# =============================================
# Phase 4: Dashboard
# =============================================
print("\n" + "="*60)
print("PHASE 4: DASHBOARD")
print("="*60)

status, body = api_request("GET", f"{BASE_URL}/dashboard", token=token)
if status == 200:
    log("PASS", "GET /dashboard", f"Readiness: {body.get('avgReadiness')}, Rounds: {body.get('roundsDone')}, Streak: {body.get('streak')}")
    
    # Verify no hardcoded streak of 12
    if body.get("streak") == 12 and body.get("roundsDone", 0) > 0:
        log("WARN", "Dashboard streak check", "Streak is 12 — may still be hardcoded")
    else:
        log("PASS", "Dashboard streak check", f"Streak: {body.get('streak')} (appears dynamic)")
    
    # Verify no hardcoded name
    if body.get("fullName") == "Sameer Mishra":
        log("FAIL", "Dashboard name check", "Still showing hardcoded 'Sameer Mishra'")
    else:
        log("PASS", "Dashboard name check", f"Name: {body.get('fullName')}")
    
    # Check areas to improve
    areas = body.get("areasToImprove", "")
    if areas == "Communication: explain logic | Technical depth: data structures | Pacing: timed questions":
        log("FAIL", "Dashboard areas check", "Still showing hardcoded areas to improve")
    else:
        log("PASS", "Dashboard areas check", f"Areas: '{areas[:60]}...' (appears dynamic)")
    
    # Check rounds structure
    rounds = body.get("rounds", [])
    log("PASS" if len(rounds) == 3 else "FAIL", "Dashboard rounds cards", f"Got {len(rounds)} round cards (expected 3)")
    
    # Check history
    history = body.get("recentHistory", [])
    log("PASS", "Dashboard history", f"Got {len(history)} history items")
else:
    log("FAIL", "GET /dashboard", f"Status: {status}, Body: {body}")

# =============================================
# Phase 5: Round Lifecycle — Technical
# =============================================
print("\n" + "="*60)
print("PHASE 5: ROUND LIFECYCLE — TECHNICAL")
print("="*60)

status, body = api_request("POST", f"{BASE_URL}/round/start", data={"roundType": "technical"}, token=token)
if status == 200:
    round_id = body.get("roundId")
    questions = body.get("questions", [])
    log("PASS", "POST /round/start (technical)", f"Round {round_id[:8]}... with {len(questions)} questions")
    
    if len(questions) > 0:
        # Submit an answer
        q = questions[0]
        q_id = q.get("id")
        code = "function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) return [seen.get(complement), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}"
        
        ans_status, ans_body = api_request(
            "POST", 
            f"{BASE_URL}/round/{round_id}/answer?question_id={q_id}",
            data={"answerText": code},
            token=token
        )
        if ans_status == 200:
            log("PASS", "POST /round/{id}/answer (technical)", 
                f"Score: {ans_body.get('score')}, Feedback: {ans_body.get('feedback', '')[:50]}...")
            
            # Verify score is integer
            score = ans_body.get("score")
            if isinstance(score, float) and score != int(score):
                log("FAIL", "Score type check", f"Score {score} is float, DB expects integer")
            else:
                log("PASS", "Score type check", f"Score {score} is valid integer type")
        else:
            log("FAIL", "POST /round/{id}/answer (technical)", f"Status: {ans_status}, Body: {ans_body}")
    else:
        log("FAIL", "Technical questions", "No questions returned")
else:
    log("FAIL", "POST /round/start (technical)", f"Status: {status}, Body: {body}")

# =============================================
# Phase 6: Round Lifecycle — Behavioral
# =============================================
print("\n" + "="*60)
print("PHASE 6: ROUND LIFECYCLE — BEHAVIORAL")
print("="*60)

status, body = api_request("POST", f"{BASE_URL}/round/start", data={"roundType": "behavioral"}, token=token)
if status == 200:
    round_id = body.get("roundId")
    questions = body.get("questions", [])
    log("PASS", "POST /round/start (behavioral)", f"Round {round_id[:8]}... with {len(questions)} questions")
    
    if len(questions) > 0:
        q = questions[0]
        q_id = q.get("id")
        answer = "When I was working on a team project, we had a situation where the deadline was approaching and the code review process was falling behind. I took the initiative to organize pair programming sessions with the team members. As a result, we completed the project on time and received positive feedback from stakeholders."
        
        ans_status, ans_body = api_request(
            "POST",
            f"{BASE_URL}/round/{round_id}/answer?question_id={q_id}",
            data={"answerText": answer},
            token=token
        )
        if ans_status == 200:
            log("PASS", "POST /round/{id}/answer (behavioral)",
                f"Score: {ans_body.get('score')}, Feedback: {ans_body.get('feedback', '')[:50]}...")
        else:
            log("FAIL", "POST /round/{id}/answer (behavioral)", f"Status: {ans_status}, Body: {ans_body}")
else:
    log("FAIL", "POST /round/start (behavioral)", f"Status: {status}, Body: {body}")

# =============================================
# Phase 7: Round Lifecycle — Aptitude
# =============================================
print("\n" + "="*60)
print("PHASE 7: ROUND LIFECYCLE — APTITUDE")
print("="*60)

status, body = api_request("POST", f"{BASE_URL}/round/start", data={"roundType": "aptitude"}, token=token)
if status == 200:
    round_id = body.get("roundId")
    questions = body.get("questions", [])
    log("PASS", "POST /round/start (aptitude)", f"Round {round_id[:8]}... with {len(questions)} questions")
    
    if len(questions) > 0:
        q = questions[0]
        q_id = q.get("id")
        
        ans_status, ans_body = api_request(
            "POST",
            f"{BASE_URL}/round/{round_id}/answer?question_id={q_id}",
            data={"answerText": "B"},
            token=token
        )
        if ans_status == 200:
            log("PASS", "POST /round/{id}/answer (aptitude)",
                f"Score: {ans_body.get('score')}, Feedback: {ans_body.get('feedback', '')[:50]}...")
        else:
            log("FAIL", "POST /round/{id}/answer (aptitude)", f"Status: {ans_status}, Body: {ans_body}")
else:
    log("FAIL", "POST /round/start (aptitude)", f"Status: {status}, Body: {body}")

# =============================================
# Phase 8: Report
# =============================================
print("\n" + "="*60)
print("PHASE 8: REPORT")
print("="*60)

status, body = api_request("GET", f"{BASE_URL}/report/latest", token=token)
if status == 200:
    log("PASS", "GET /report/latest", f"Overall: {body.get('overallScore')}, Rounds: {body.get('roundsDone')}")
    
    # Verify no hardcoded streak of 12
    if body.get("streak") == 12:
        log("WARN", "Report streak check", "Streak is 12 — may still be hardcoded")
    else:
        log("PASS", "Report streak check", f"Streak: {body.get('streak')}")
    
    # Verify no hardcoded name
    if body.get("fullName") == "Sameer Mishra":
        log("FAIL", "Report name check", "Still showing hardcoded 'Sameer Mishra'")
    else:
        log("PASS", "Report name check", f"Name: {body.get('fullName')}")
    
    # Verify no hardcoded areas
    areas = body.get("areasToImprove", "")
    if areas == "Communication: explain logic | Technical depth: data structures | Pacing: timed questions":
        log("FAIL", "Report areas check", "Still showing hardcoded areas")
    else:
        log("PASS", "Report areas check", f"Areas: '{areas[:60]}...'")
else:
    log("FAIL", "GET /report/latest", f"Status: {status}, Body: {body}")

# =============================================
# SUMMARY
# =============================================
print("\n" + "="*60)
print("INTEGRATION TEST SUMMARY")
print("="*60)

passed = sum(1 for r in results if r["status"] == "PASS")
failed = sum(1 for r in results if r["status"] == "FAIL")
warned = sum(1 for r in results if r["status"] == "WARN")
total = len(results)

print(f"\nTotal: {total}")
print(f"  PASSED:   {passed}")
print(f"  FAILED:   {failed}")
print(f"  WARNINGS: {warned}")
print(f"\nOverall: {'PASS' if failed == 0 else 'PARTIAL' if passed > failed else 'FAIL'}")

if failed > 0:
    print(f"\nFailed tests:")
    for r in results:
        if r["status"] == "FAIL":
            print(f"  [FAIL] {r['test']}: {r['detail']}")
