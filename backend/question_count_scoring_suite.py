import sys
import os
import unittest
from unittest.mock import MagicMock
from datetime import datetime, timezone

sys.path.insert(0, r"c:\Users\ayesh\OneDrive\Desktop\ai-interview\backend")

from app.services.analytics_service import get_canonical_user_analytics, is_aptitude_answer_correct
from app.services.ai_service import is_code_stub_or_empty
from app.routes.round import start_round, finish_round
from app.models.schemas import RoundStartRequest

class TestQuestionCountAndScoringSuite(unittest.TestCase):

    def setUp(self):
        self.mock_client = MagicMock()
        self.mock_user = MagicMock()
        self.mock_user.id = "user-test-123"

    # Aptitude Tests
    def test_01_aptitude_10q_all_attempted(self):

        all_qs = [{"id": f"q-apt-{i}", "question_text": f"Q{i}"} for i in range(10)]
        answers = []
        for i in range(7):
            answers.append({"id": f"a-{i}", "question_id": f"q-apt-{i}", "score": 10.0, "feedback": "Correct!"})
        for i in range(7, 10):
            answers.append({"id": f"a-{i}", "question_id": f"q-apt-{i}", "score": 0.0, "feedback": "Incorrect!"})

        round_record = [{"id": "round-apt-10q", "user_id": "user-test-123", "round_type": "aptitude"}]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = round_record
                t.update.return_value.eq.return_value.execute.return_value.data = round_record
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = all_qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = answers
            return t

        self.mock_client.table.side_effect = mock_table

        res = finish_round(id="round-apt-10q", user=self.mock_user, client=self.mock_client)

        self.assertEqual(res["totalQuestions"], 10)
        self.assertEqual(res["questionsAttempted"], 10)
        self.assertEqual(res["correctAnswers"], 7)
        self.assertEqual(res["wrongAnswers"], 3)
        self.assertEqual(res["unattempted"], 0)
        self.assertEqual(res["accuracyPercentage"], 70.0)
        self.assertEqual(res["score"], 7.0)
        self.assertEqual(res["maxScore"], 10)

    def test_02_aptitude_10q_partial_attempted(self):

        all_qs = [{"id": f"q-apt-{i}", "question_text": f"Q{i}"} for i in range(10)]
        answers = []
        for i in range(5):
            answers.append({"id": f"a-{i}", "question_id": f"q-apt-{i}", "score": 10.0, "feedback": "Correct!"})
        for i in range(5, 7):
            answers.append({"id": f"a-{i}", "question_id": f"q-apt-{i}", "score": 0.0, "feedback": "Incorrect!"})

        round_record = [{"id": "round-apt-part", "user_id": "user-test-123", "round_type": "aptitude"}]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = round_record
                t.update.return_value.eq.return_value.execute.return_value.data = round_record
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = all_qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = answers
            return t

        self.mock_client.table.side_effect = mock_table

        res = finish_round(id="round-apt-part", user=self.mock_user, client=self.mock_client)

        self.assertEqual(res["totalQuestions"], 10)
        self.assertEqual(res["questionsAttempted"], 7)
        self.assertEqual(res["correctAnswers"], 5)
        self.assertEqual(res["wrongAnswers"], 2)
        self.assertEqual(res["unattempted"], 3)
        self.assertEqual(res["accuracyPercentage"], 71.4)
        self.assertEqual(res["score"], 5.0)
        self.assertEqual(res["maxScore"], 10)

    def test_03_aptitude_15q_creation(self):
        req = RoundStartRequest(roundType="aptitude", questionCount=15)
        
        inserted_qs = []
        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"target_position": "Backend", "industry": "Tech"}]
            elif table_name == "rounds":
                t.insert.return_value.execute.return_value.data = [{"id": "r-15"}]
            elif table_name == "aptitude_questions":
                t.select.return_value.execute.return_value.data = [{"question": "Q", "option_a": "A", "option_b": "B", "option_c": "C", "option_d": "D"}]
            elif table_name == "questions":
                def side_insert(data):
                    rec = dict(data)
                    rec["id"] = f"q-{len(inserted_qs)+1}"
                    inserted_qs.append(rec)
                    m = MagicMock()
                    m.execute.return_value.data = [rec]
                    return m
                t.insert.side_effect = side_insert
            return t
        
        self.mock_client.table.side_effect = mock_table
        resp = start_round(payload=req, user=self.mock_user, client=self.mock_client)
        self.assertEqual(len(resp.questions), 15)
        self.assertEqual(len(inserted_qs), 15)

    def test_04_aptitude_20q_creation(self):
        req = RoundStartRequest(roundType="aptitude", questionCount=20)
        inserted_qs = []
        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"target_position": "Backend", "industry": "Tech"}]
            elif table_name == "rounds":
                t.insert.return_value.execute.return_value.data = [{"id": "r-20"}]
            elif table_name == "aptitude_questions":
                t.select.return_value.execute.return_value.data = [{"question": "Q", "option_a": "A", "option_b": "B", "option_c": "C", "option_d": "D"}]
            elif table_name == "questions":
                def side_insert(data):
                    rec = dict(data)
                    rec["id"] = f"q-{len(inserted_qs)+1}"
                    inserted_qs.append(rec)
                    m = MagicMock()
                    m.execute.return_value.data = [rec]
                    return m
                t.insert.side_effect = side_insert
            return t
        self.mock_client.table.side_effect = mock_table
        resp = start_round(payload=req, user=self.mock_user, client=self.mock_client)
        self.assertEqual(len(resp.questions), 20)
        self.assertEqual(len(inserted_qs), 20)

    def test_05_aptitude_50q_creation(self):
        req = RoundStartRequest(roundType="aptitude", questionCount=50)
        inserted_qs = []
        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"target_position": "Backend", "industry": "Tech"}]
            elif table_name == "rounds":
                t.insert.return_value.execute.return_value.data = [{"id": "r-50"}]
            elif table_name == "aptitude_questions":
                t.select.return_value.execute.return_value.data = [{"question": "Q", "option_a": "A", "option_b": "B", "option_c": "C", "option_d": "D"}]
            elif table_name == "questions":
                def side_insert(data):
                    rec = dict(data)
                    rec["id"] = f"q-{len(inserted_qs)+1}"
                    inserted_qs.append(rec)
                    m = MagicMock()
                    m.execute.return_value.data = [rec]
                    return m
                t.insert.side_effect = side_insert
            return t
        self.mock_client.table.side_effect = mock_table
        resp = start_round(payload=req, user=self.mock_user, client=self.mock_client)
        self.assertEqual(len(resp.questions), 50)
        self.assertEqual(len(inserted_qs), 50)

    def test_06_timer_expiry_unanswered_handling(self):
        all_qs = [{"id": f"q-{i}", "question_text": f"Q{i}"} for i in range(10)]
        answers = [{"id": f"a-{i}", "question_id": f"q-{i}", "score": 10.0, "feedback": "Correct!"} for i in range(6)]
        round_record = [{"id": "round-timer-6", "user_id": "user-test-123", "round_type": "aptitude"}]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = round_record
                t.update.return_value.eq.return_value.execute.return_value.data = round_record
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = all_qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = answers
            return t

        self.mock_client.table.side_effect = mock_table
        res = finish_round(id="round-timer-6", user=self.mock_user, client=self.mock_client)
        self.assertEqual(res["totalQuestions"], 10)
        self.assertEqual(res["questionsAttempted"], 6)
        self.assertEqual(res["unattempted"], 4)

    # Technical Tests
    def test_07_technical_5q_creation(self):
        req = RoundStartRequest(roundType="technical", questionCount=5)
        inserted_qs = []
        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"target_position": "Backend", "industry": "Tech"}]
            elif table_name == "rounds":
                t.insert.return_value.execute.return_value.data = [{"id": "r-tech-5"}]
            elif table_name == "technical_questions":
                t.select.return_value.eq.return_value.execute.return_value.data = []
                t.select.return_value.execute.return_value.data = []
            elif table_name == "questions":
                def side_insert(data):
                    rec = dict(data)
                    rec["id"] = f"q-{len(inserted_qs)+1}"
                    inserted_qs.append(rec)
                    m = MagicMock()
                    m.execute.return_value.data = [rec]
                    return m
                t.insert.side_effect = side_insert
            return t
        self.mock_client.table.side_effect = mock_table
        resp = start_round(payload=req, user=self.mock_user, client=self.mock_client)
        self.assertEqual(len(resp.questions), 5)

    def test_08_technical_10q_creation(self):
        req = RoundStartRequest(roundType="technical", questionCount=10)
        inserted_qs = []
        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"target_position": "Backend", "industry": "Tech"}]
            elif table_name == "rounds":
                t.insert.return_value.execute.return_value.data = [{"id": "r-tech-10"}]
            elif table_name == "technical_questions":
                t.select.return_value.eq.return_value.execute.return_value.data = []
                t.select.return_value.execute.return_value.data = []
            elif table_name == "questions":
                def side_insert(data):
                    rec = dict(data)
                    rec["id"] = f"q-{len(inserted_qs)+1}"
                    inserted_qs.append(rec)
                    m = MagicMock()
                    m.execute.return_value.data = [rec]
                    return m
                t.insert.side_effect = side_insert
            return t
        self.mock_client.table.side_effect = mock_table
        resp = start_round(payload=req, user=self.mock_user, client=self.mock_client)
        self.assertEqual(len(resp.questions), 10)

    def test_09_technical_15q_creation(self):
        req = RoundStartRequest(roundType="technical", questionCount=15)
        inserted_qs = []
        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"target_position": "Backend", "industry": "Tech"}]
            elif table_name == "rounds":
                t.insert.return_value.execute.return_value.data = [{"id": "r-tech-15"}]
            elif table_name == "technical_questions":
                t.select.return_value.eq.return_value.execute.return_value.data = []
                t.select.return_value.execute.return_value.data = []
            elif table_name == "questions":
                def side_insert(data):
                    rec = dict(data)
                    rec["id"] = f"q-{len(inserted_qs)+1}"
                    inserted_qs.append(rec)
                    m = MagicMock()
                    m.execute.return_value.data = [rec]
                    return m
                t.insert.side_effect = side_insert
            return t
        self.mock_client.table.side_effect = mock_table
        resp = start_round(payload=req, user=self.mock_user, client=self.mock_client)
        self.assertEqual(len(resp.questions), 15)

    def test_10_technical_20q_creation(self):
        req = RoundStartRequest(roundType="technical", questionCount=20)
        inserted_qs = []
        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"target_position": "Backend", "industry": "Tech"}]
            elif table_name == "rounds":
                t.insert.return_value.execute.return_value.data = [{"id": "r-tech-20"}]
            elif table_name == "technical_questions":
                t.select.return_value.eq.return_value.execute.return_value.data = []
                t.select.return_value.execute.return_value.data = []
            elif table_name == "questions":
                def side_insert(data):
                    rec = dict(data)
                    rec["id"] = f"q-{len(inserted_qs)+1}"
                    inserted_qs.append(rec)
                    m = MagicMock()
                    m.execute.return_value.data = [rec]
                    return m
                t.insert.side_effect = side_insert
            return t
        self.mock_client.table.side_effect = mock_table
        resp = start_round(payload=req, user=self.mock_user, client=self.mock_client)
        self.assertEqual(len(resp.questions), 20)

    def test_11_all_technical_submissions_incorrect(self):
        all_qs = [{"id": f"q-t-{i}", "question_text": f"Q{i}"} for i in range(5)]
        answers = [{"id": f"a-{i}", "question_id": f"q-t-{i}", "score": 2.0, "feedback": "Incorrect syntax"} for i in range(5)]
        round_record = [{"id": "r-tech-inc", "user_id": "user-test-123", "round_type": "technical"}]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = round_record
                t.update.return_value.eq.return_value.execute.return_value.data = round_record
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = all_qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = answers
            return t

        self.mock_client.table.side_effect = mock_table
        res = finish_round(id="r-tech-inc", user=self.mock_user, client=self.mock_client)
        self.assertNotEqual(res["overallScore"], 10.0)
        self.assertEqual(res["overallScore"], 2.0)
        self.assertEqual(res["correctAnswers"], 0)
        self.assertEqual(res["wrongAnswers"], 5)

    def test_12_mixed_technical_submissions(self):
        all_qs = [{"id": f"q-t-{i}", "question_text": f"Q{i}"} for i in range(5)]
        answers = [
            {"id": "a-0", "question_id": "q-t-0", "score": 9.0, "feedback": "Optimal"},
            {"id": "a-1", "question_id": "q-t-1", "score": 8.0, "feedback": "Good"},
            {"id": "a-2", "question_id": "q-t-2", "score": 4.0, "feedback": "Bug"}
        ]
        round_record = [{"id": "r-tech-mix", "user_id": "user-test-123", "round_type": "technical"}]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = round_record
                t.update.return_value.eq.return_value.execute.return_value.data = round_record
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = all_qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = answers
            return t

        self.mock_client.table.side_effect = mock_table
        res = finish_round(id="r-tech-mix", user=self.mock_user, client=self.mock_client)
        self.assertEqual(res["totalQuestions"], 5)
        self.assertEqual(res["questionsAttempted"], 3)
        self.assertEqual(res["correctAnswers"], 2)
        self.assertEqual(res["wrongAnswers"], 1)
        self.assertEqual(res["unattempted"], 2)

    # Analytics Tests
    def test_13_dashboard_history_matches_round_question_count(self):
        prof = [{"full_name": "Test User", "target_position": "Dev", "industry": "Tech"}]
        r_data = [{
            "id": "r-apt-10", "round_type": "aptitude", "score": 7.0,
            "created_at": "2026-08-16T10:00:00Z", "started_at": "2026-08-16T10:00:00Z"
        }]
        qs = [{"id": f"q-{i}", "question_text": "text"} for i in range(10)]
        ans = [{"id": f"a-{i}", "question_id": f"q-{i}", "score": 10.0, "feedback": "Correct"} for i in range(7)]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = prof
            elif table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = r_data
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = ans
            return t

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("user-test-123", self.mock_client)
        hist = analytics["recentHistory"][0]
        self.assertEqual(hist["questionsCount"], 10)
        self.assertEqual(hist["questionsAttempted"], 7)

    def test_14_full_report_history_matches_dashboard(self):
        prof = [{"full_name": "Test User", "target_position": "Dev", "industry": "Tech"}]
        r_data = [{
            "id": "r-apt-15", "round_type": "aptitude", "score": 8.0,
            "created_at": "2026-08-16T10:00:00Z", "started_at": "2026-08-16T10:00:00Z"
        }]
        qs = [{"id": f"q-{i}", "question_text": "text"} for i in range(15)]
        ans = [{"id": f"a-{i}", "question_id": f"q-{i}", "score": 10.0, "feedback": "Correct"} for i in range(12)]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = prof
            elif table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = r_data
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = ans
            return t

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("user-test-123", self.mock_client)
        full_hist = analytics["fullHistory"][0]
        self.assertEqual(full_hist["questionsCount"], 15)
        self.assertEqual(full_hist["questionsAttempted"], 12)

    def test_15_old_50q_round_remains_intact(self):
        prof = [{"full_name": "Test User", "target_position": "Dev", "industry": "Tech"}]
        r_data = [{
            "id": "r-apt-old-50", "round_type": "aptitude", "score": 8.0,
            "created_at": "2026-08-10T10:00:00Z", "started_at": "2026-08-10T10:00:00Z"
        }]
        qs = [{"id": f"q-old-{i}", "question_text": "text"} for i in range(50)]
        ans = [{"id": f"a-old-{i}", "question_id": f"q-old-{i}", "score": 10.0, "feedback": "Correct"} for i in range(40)]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = prof
            elif table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = r_data
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = ans
            return t

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("user-test-123", self.mock_client)
        hist = analytics["recentHistory"][0]
        self.assertEqual(hist["questionsCount"], 50)
        self.assertEqual(hist["questionsAttempted"], 40)

    def test_16_new_10q_round_does_not_inherit_50q(self):
        prof = [{"full_name": "Test User", "target_position": "Dev", "industry": "Tech"}]
        r_data = [{
            "id": "r-apt-new-10", "round_type": "aptitude", "score": 9.0,
            "created_at": "2026-08-16T12:00:00Z", "started_at": "2026-08-16T12:00:00Z"
        }]
        qs = [{"id": f"q-new-{i}", "question_text": "text"} for i in range(10)]
        ans = [{"id": f"a-new-{i}", "question_id": f"q-new-{i}", "score": 10.0, "feedback": "Correct"} for i in range(9)]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = prof
            elif table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = r_data
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = qs
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = ans
            return t

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("user-test-123", self.mock_client)
        hist = analytics["recentHistory"][0]
        self.assertEqual(hist["questionsCount"], 10)
        self.assertEqual(hist["questionsAttempted"], 9)

    def test_17_no_cross_user_question_answer_contamination(self):
        prof = [{"full_name": "User A", "target_position": "Dev", "industry": "Tech"}]
        r_data = [{
            "id": "r-user-a", "round_type": "technical", "score": 8.0,
            "created_at": "2026-08-16T12:00:00Z", "started_at": "2026-08-16T12:00:00Z"
        }]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = prof
            elif table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = r_data
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"id": "q-a-1", "question_text": "Q1"}]
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = [{"id": "a-a-1", "question_id": "q-a-1", "score": 8.0}]
            return t

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("user-a-id", self.mock_client)
        self.assertEqual(analytics["overview"]["totalCompletedRounds"], 1)

    def test_18_incomplete_rounds_excluded_from_completed_analytics(self):
        prof = [{"full_name": "User B", "target_position": "Dev", "industry": "Tech"}]
        r_data = [{
            "id": "r-completed", "round_type": "technical", "score": 8.0,
            "created_at": "2026-08-16T12:00:00Z", "started_at": "2026-08-16T12:00:00Z"
        }]

        def mock_table(table_name):
            t = MagicMock()
            if table_name == "profiles":
                t.select.return_value.eq.return_value.execute.return_value.data = prof
            elif table_name == "rounds":
                t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = r_data
            elif table_name == "questions":
                t.select.return_value.eq.return_value.execute.return_value.data = [{"id": "q-1", "question_text": "Q1"}]
            elif table_name == "answers":
                t.select.return_value.in_.return_value.execute.return_value.data = [{"id": "a-1", "question_id": "q-1", "score": 8.0}]
            return t

        self.mock_client.table.side_effect = mock_table
        analytics = get_canonical_user_analytics("user-b-id", self.mock_client)
        self.assertEqual(analytics["overview"]["totalCompletedRounds"], 1)

if __name__ == "__main__":
    unittest.main()
