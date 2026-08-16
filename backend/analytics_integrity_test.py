import os
import sys
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.analytics_service import (
    get_canonical_user_analytics,
    calculate_streak,
    extract_star_components,
    format_days_ago,
    is_aptitude_answer_correct
)

class TestAnalyticsIntegrity(unittest.TestCase):

    def setUp(self):
        self.mock_client = MagicMock()

    def test_01_zero_completed_rounds(self):
        """When user has 0 completed rounds, metrics should safely default to 0.0 without errors."""
        self.mock_client.table("profiles").select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"full_name": "Test User", "target_position": "Frontend Dev", "industry": "Tech"}]
        )
        self.mock_client.table("rounds").select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[]
        )

        analytics = get_canonical_user_analytics("user_123", self.mock_client)

        self.assertEqual(analytics["overview"]["totalCompletedRounds"], 0)
        self.assertEqual(analytics["overview"]["overallReadiness"], 0.0)
        self.assertEqual(analytics["technical"]["attempts"], 0)
        self.assertEqual(analytics["technical"]["averageScore"], 0.0)
        self.assertEqual(analytics["behavioral"]["attempts"], 0)
        self.assertEqual(analytics["behavioral"]["averageScore"], 0.0)
        self.assertEqual(analytics["aptitude"]["attempts"], 0)
        self.assertEqual(analytics["aptitude"]["averageScore"], 0.0)
        self.assertEqual(len(analytics["recentHistory"]), 0)

    def test_02_attempt_counts_strict_completed_only(self):
        """Ensure rounds query filters ONLY status='completed'."""
        self.mock_client.table("profiles").select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"full_name": "Test User", "target_position": "Backend Dev", "industry": "Finance"}]
        )

        def mock_table(tbl):
            m = MagicMock()
            if tbl == "profiles":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"full_name": "Test User"}])
            elif tbl == "rounds":
                # Ensure the eq chaining filters by user_id and status=completed
                def round_eq_status(col, val):
                    self.assertEqual(col, "status")
                    self.assertEqual(val, "completed")
                    return MagicMock(execute=lambda: MagicMock(
                        data=[
                            {"id": "r1", "round_type": "technical", "started_at": "2026-08-15T10:00:00Z"},
                            {"id": "r2", "round_type": "behavioral", "started_at": "2026-08-15T11:00:00Z"},
                            {"id": "r3", "round_type": "aptitude", "started_at": "2026-08-15T12:00:00Z"}
                        ]
                    ))
                round_sel = MagicMock()
                round_sel.eq.side_effect = lambda c, uid: MagicMock(eq=round_eq_status)
                m.select.return_value = round_sel
            elif tbl == "questions":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "q1", "round_id": "r1"}])
            elif tbl == "answers":
                m.select.return_value.in_.return_value.execute.return_value = MagicMock(
                    data=[{"id": "a1", "question_id": "q1", "score": 8, "feedback": "Good job."}]
                )
            return m

        self.mock_client.table.side_effect = mock_table

        analytics = get_canonical_user_analytics("u1", self.mock_client)
        self.assertEqual(analytics["technical"]["attempts"], 1)
        self.assertEqual(analytics["behavioral"]["attempts"], 1)
        self.assertEqual(analytics["aptitude"]["attempts"], 1)
        self.assertEqual(analytics["overview"]["totalCompletedRounds"], 3)

    def test_03_technical_score_aggregation_and_trend(self):
        """Verify Technical average, best, latest, and trend calculations."""
        def mock_table(tbl):
            m = MagicMock()
            if tbl == "profiles":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"full_name": "Dev"}])
            elif tbl == "rounds":
                m.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[
                        {"id": "r_old", "round_type": "technical", "started_at": "2026-08-10T10:00:00Z"},
                        {"id": "r_new", "round_type": "technical", "started_at": "2026-08-15T10:00:00Z"}
                    ]
                )
            elif tbl == "questions":
                def q_mock(col):
                    qm = MagicMock()
                    qm.eq.side_effect = lambda c, rid: MagicMock(
                        execute=lambda: MagicMock(data=[{"id": f"q_{rid}"}])
                    )
                    return qm
                m.select.side_effect = q_mock
            elif tbl == "answers":
                def a_mock(col):
                    am = MagicMock()
                    am.in_.side_effect = lambda c, qids: MagicMock(
                        execute=lambda: MagicMock(
                            data=[{"id": "a1", "score": 9 if "r_new" in qids[0] else 6, "feedback": "Code analysis."}]
                        )
                    )
                    return am
                m.select.side_effect = a_mock
            return m

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("u_tech", self.mock_client)

        self.assertEqual(analytics["technical"]["attempts"], 2)
        self.assertEqual(analytics["technical"]["averageScore"], 7.5)
        self.assertEqual(analytics["technical"]["bestScore"], 9.0)
        self.assertEqual(analytics["technical"]["latestScore"], 9.0)
        self.assertEqual(analytics["technical"]["percentage"], 75)
        self.assertEqual(analytics["technical"]["trend"], "+3.0")

    def test_04_aptitude_score_out_of_50(self):
        """Verify Aptitude correctly tracks score out of 50 and accuracy %."""
        def mock_table(tbl):
            m = MagicMock()
            if tbl == "profiles":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"full_name": "Aptitude Candidate"}])
            elif tbl == "rounds":
                m.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[
                        {"id": "r_apt", "round_type": "aptitude", "started_at": "2026-08-15T10:00:00Z"}
                    ]
                )
            elif tbl == "questions":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[{"id": f"q_{i}"} for i in range(50)]
                )
            elif tbl == "answers":
                ans_data = [{"id": f"a_{i}", "question_id": f"q_{i}", "score": 10 if i < 45 else 2, "feedback": "Correct choice!" if i < 45 else "Incorrect choice."} for i in range(50)]
                m.select.return_value.in_.return_value.execute.return_value = MagicMock(data=ans_data)
            return m

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("u_apt", self.mock_client)

        self.assertEqual(analytics["aptitude"]["attempts"], 1)
        self.assertEqual(analytics["aptitude"]["averageScore"], 9.0)
        self.assertEqual(analytics["aptitude"]["bestScore"], 9.0)
        self.assertEqual(analytics["aptitude"]["accuracy"], 90.0)
        self.assertEqual(analytics["aptitude"]["questionsAnswered"], 50)
        self.assertEqual(analytics["aptitude"]["questionsCorrect"], 45)

    def test_05_behavioral_star_scoring(self):
        """Verify Behavioral STAR sub-scores extraction and averaging."""
        def mock_table(tbl):
            m = MagicMock()
            if tbl == "profiles":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"full_name": "Behavioral Candidate"}])
            elif tbl == "rounds":
                m.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[{"id": "r_beh", "round_type": "behavioral", "started_at": "2026-08-15T10:00:00Z"}]
                )
            elif tbl == "questions":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[{"id": f"qb_{i}"} for i in range(3)]
                )
            elif tbl == "answers":
                ans_data = [
                    {"id": "ab_1", "question_id": "qb_0", "score": 8, "feedback": "Solid Situation and Action."},
                    {"id": "ab_2", "question_id": "qb_1", "score": 8, "feedback": "Good Task execution and Result."},
                    {"id": "ab_3", "question_id": "qb_2", "score": 8, "feedback": "Clear Situation, Task, Action, Result."}
                ]
                m.select.return_value.in_.return_value.execute.return_value = MagicMock(data=ans_data)
            return m

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("u_beh", self.mock_client)

        self.assertEqual(analytics["behavioral"]["attempts"], 1)
        self.assertEqual(analytics["behavioral"]["averageScore"], 8.0)
        self.assertIn("situation", analytics["behavioral"]["star"])
        self.assertIn("task", analytics["behavioral"]["star"])
        self.assertIn("action", analytics["behavioral"]["star"])
        self.assertIn("result", analytics["behavioral"]["star"])
        self.assertGreater(analytics["behavioral"]["star"]["situation"], 0)

    def test_06_cross_endpoint_consistency(self):
        """
        Verify that canonical analytics object returned for Dashboard matches Full Report 100%.
        """
        def mock_table(tbl):
            m = MagicMock()
            if tbl == "profiles":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[{"full_name": "Sameer", "target_position": "SDE", "industry": "Google"}]
                )
            elif tbl == "rounds":
                m.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[
                        {"id": "r1", "round_type": "technical", "started_at": "2026-08-15T10:00:00Z"},
                        {"id": "r2", "round_type": "behavioral", "started_at": "2026-08-15T11:00:00Z"},
                        {"id": "r3", "round_type": "aptitude", "started_at": "2026-08-15T12:00:00Z"}
                    ]
                )
            elif tbl == "questions":
                m.select.return_value.eq.return_value.execute.return_value = MagicMock(
                    data=[{"id": "q1"}]
                )
            elif tbl == "answers":
                m.select.return_value.in_.return_value.execute.return_value = MagicMock(
                    data=[{"id": "a1", "score": 8, "feedback": "Good."}]
                )
            return m

        self.mock_client.table.side_effect = mock_table

        dash_analytics = get_canonical_user_analytics("sameer_1", self.mock_client)
        report_analytics = get_canonical_user_analytics("sameer_1", self.mock_client)

        self.assertEqual(dash_analytics["technical"]["attempts"], report_analytics["technical"]["attempts"])
        self.assertEqual(dash_analytics["technical"]["averageScore"], report_analytics["technical"]["averageScore"])
        self.assertEqual(dash_analytics["behavioral"]["attempts"], report_analytics["behavioral"]["attempts"])
        self.assertEqual(dash_analytics["behavioral"]["averageScore"], report_analytics["behavioral"]["averageScore"])
        self.assertEqual(dash_analytics["aptitude"]["attempts"], report_analytics["aptitude"]["attempts"])
        self.assertEqual(dash_analytics["aptitude"]["averageScore"], report_analytics["aptitude"]["averageScore"])
        self.assertEqual(dash_analytics["overview"]["totalCompletedRounds"], report_analytics["overview"]["totalCompletedRounds"])
        self.assertEqual(dash_analytics["recentHistory"], report_analytics["recentHistory"])

    def test_07_user_isolation(self):
        """Verify User A's analytics queries filter by user_id='user_A' and never returns User B's data."""
        queried_user_ids = []

        def mock_table(tbl):
            m = MagicMock()
            if tbl == "profiles":
                def prof_eq(col, val):
                    queried_user_ids.append(val)
                    return MagicMock(execute=lambda: MagicMock(data=[{"full_name": f"User {val}"}]))
                m.select.return_value.eq.side_effect = prof_eq
            elif tbl == "rounds":
                def round_eq(col, val):
                    queried_user_ids.append(val)
                    sub = MagicMock()
                    sub.eq.return_value.execute.return_value = MagicMock(data=[])
                    return sub
                m.select.return_value.eq.side_effect = round_eq
            return m

        self.mock_client.table.side_effect = mock_table

        get_canonical_user_analytics("user_A", self.mock_client)
        self.assertIn("user_A", queried_user_ids)
        self.assertNotIn("user_B", queried_user_ids)

        queried_user_ids.clear()
        get_canonical_user_analytics("user_B", self.mock_client)
        self.assertIn("user_B", queried_user_ids)
        self.assertNotIn("user_A", queried_user_ids)

    def test_08_gemini_unavailable_fallback(self):
        """Verify that when Gemini API call fails, deterministic analytics continue without crash."""
        with patch("app.services.analytics_service.call_gemini_json", return_value=None):
            def mock_table(tbl):
                m = MagicMock()
                if tbl == "profiles":
                    m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"full_name": "Candidate"}])
                elif tbl == "rounds":
                    m.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                        data=[{"id": "r1", "round_type": "technical", "started_at": "2026-08-15T10:00:00Z"}]
                    )
                elif tbl == "questions":
                    m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "q1"}])
                elif tbl == "answers":
                    m.select.return_value.in_.return_value.execute.return_value = MagicMock(
                        data=[{"id": "a1", "score": 6, "feedback": "Suboptimal complexity."}]
                    )
                return m

            self.mock_client.table.side_effect = mock_table
            analytics = get_canonical_user_analytics("u_fail_gemini", self.mock_client)

            self.assertFalse(analytics["aiAnalysisAvailable"])
            self.assertEqual(analytics["technical"]["attempts"], 1)
            self.assertEqual(analytics["technical"]["averageScore"], 6.0)
            self.assertGreater(len(analytics["areasToImproveList"]), 0)
            self.assertIn("Algorithmic Optimization", analytics["areasToImproveList"][0]["area"])

    def test_09_streak_calculation(self):
        """Verify streak calculation with consecutive days and gaps."""
        today = datetime.now(timezone.utc)
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)
        four_days_ago = today - timedelta(days=4)

        # Streak 3: today, yesterday, 2 days ago
        self.assertEqual(calculate_streak([today, yesterday, two_days_ago]), 3)
        # Streak 1: today only (gap yesterday)
        self.assertEqual(calculate_streak([today, two_days_ago]), 1)
        # Streak 0: no activity today
        self.assertEqual(calculate_streak([yesterday, two_days_ago]), 0)

    def test_10_aptitude_answer_correctness_helper(self):
        """Verify is_aptitude_answer_correct with diverse score and feedback inputs."""
        self.assertTrue(is_aptitude_answer_correct({"score": 10, "feedback": "Correct choice!"}))
        self.assertTrue(is_aptitude_answer_correct({"score": 10, "feedback": ""}))
        self.assertTrue(is_aptitude_answer_correct({"score": 0, "feedback": "Correct choice! Sequence is even numbers"}))
        self.assertFalse(is_aptitude_answer_correct({"score": 2, "feedback": "Incorrect choice. Standard check"}))
        self.assertFalse(is_aptitude_answer_correct({"score": 0, "feedback": "Wrong answer."}))

    def test_11_evidence_fingerprint_cache_invalidation(self):
        """Verify that when answer scores or feedback change within same completed round, cache invalidates."""
        mock_gemini_calls = []

        def mock_call_gemini(user_prompt, system_prompt):
            mock_gemini_calls.append(user_prompt)
            return {
                "areas": [{"area": "Test Area", "round": "technical", "severity": "low", "evidence": "Score changed", "recommendation": "Practice", "priority": 1}],
                "plan": {"highestPriority": "Test Area", "evidence": "Score changed", "whyItMatters": "Important", "whatToPractice": "Code", "suggestedTarget": "8+"}
            }

        with patch("app.services.analytics_service.call_gemini_json", side_effect=mock_call_gemini):
            score_holder = [6]
            def mock_table(tbl):
                m = MagicMock()
                if tbl == "profiles":
                    m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"full_name": "Dev"}])
                elif tbl == "rounds":
                    m.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                        data=[{"id": "r_cached", "round_type": "technical", "started_at": "2026-08-15T10:00:00Z"}]
                    )
                elif tbl == "questions":
                    m.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "q1"}])
                elif tbl == "answers":
                    m.select.return_value.in_.return_value.execute.return_value = MagicMock(
                        data=[{"id": "a1", "score": score_holder[0], "feedback": f"Score {score_holder[0]} feedback"}]
                    )
                return m

            self.mock_client.table.side_effect = mock_table

            # First call -> triggers Gemini call 1
            res1 = get_canonical_user_analytics("u_cache_test", self.mock_client)
            self.assertEqual(len(mock_gemini_calls), 1)

            # Second call with identical data -> cache hit (no new call)
            res2 = get_canonical_user_analytics("u_cache_test", self.mock_client)
            self.assertEqual(len(mock_gemini_calls), 1)

            # Third call with mutated answer score -> cache invalidated (triggers Gemini call 2)
            score_holder[0] = 9
            res3 = get_canonical_user_analytics("u_cache_test", self.mock_client)
            self.assertEqual(len(mock_gemini_calls), 2)

if __name__ == "__main__":
    unittest.main()
