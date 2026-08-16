import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import {
  ArrowLeft, Play, RotateCcw, CheckCircle2, Moon, Sun, Timer,
  AlertCircle, Plus, VolumeX, Volume2, Bookmark, Copy, Trash2,
  RefreshCw, Check, Lock, Sparkles, Code2, Cpu, FileText, ChevronRight, Unlock
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum (simple variant)',
    difficulty: 'Easy',
    recommendedTimeSeconds: 1200, // 20 Mins
    description: 'Given an array of integers and a target, return indices of the two numbers such that they add up to the target. Return [-1, -1] if no solution exists.',
    example: 'Input: nums = [2,7,11,15], target = 9 | Output: [0,1]',
    starterCodes: {
      javascript: `// Implement twoSum(nums, target)
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [-1, -1];
}

console.log(twoSum([2, 7, 11, 15], 9)); // -> [0, 1]`,

      python: `# Implement two_sum(nums, target)
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        need = target - num
        if need in seen:
            return [seen[need], i]
        seen[num] = i
    return [-1, -1]

print(two_sum([2, 7, 11, 15], 9))  # -> [0, 1]`,

      java: `// Implement twoSum method
import java.util.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] { -1, -1 };
    }

    public static void main(String[] args) {
        int[] result = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(Arrays.toString(result)); // -> [0, 1]
    }
}`,

      cpp: `// Implement twoSum function
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) {
            return {seen[need], i};
        }
        seen[nums[i]] = i;
    }
    return {-1, -1};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = twoSum(nums, 9);
    cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}`
    }
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    recommendedTimeSeconds: 900, // 15 Mins
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    example: 'Input: s = "anagram", t = "nagaram" | Output: true',
    starterCodes: {
      javascript: `// Implement isAnagram(s, t)
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = {};
  for (let c of s) count[c] = (count[c] || 0) + 1;
  for (let c of t) {
    if (!count[c]) return false;
    count[c]--;
  }
  return true;
}

console.log(isAnagram("anagram", "nagaram")); // -> true`,

      python: `# Implement is_anagram(s, t)
def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    count = {}
    for c in s:
        count[c] = count.get(c, 0) + 1
    for c in t:
        if c not in count or count[c] == 0:
            return False
        count[c] -= 1
    return True

print(is_anagram("anagram", "nagaram")) # -> True`,

      java: `// Implement isAnagram method
import java.util.*;

public class Solution {
    public static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) {
            if (c != 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("anagram", "nagaram")); // -> true
    }
}`,

      cpp: `// Implement isAnagram function
#include <iostream>
#include <string>
#include <vector>
using namespace std;

bool isAnagram(string s, string t) {
    if (s.length() != t.length()) return false;
    vector<int> count(26, 0);
    for (int i = 0; i < s.length(); i++) {
        count[s[i] - 'a']++;
        count[t[i] - 'a']--;
    }
    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}

int main() {
    cout << (isAnagram("anagram", "nagaram") ? "true" : "false") << endl;
    return 0;
}`
    }
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Medium',
    recommendedTimeSeconds: 1500, // 25 Mins
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    example: 'Input: head = [1,2,3,4,5] | Output: [5,4,3,2,1]',
    starterCodes: {
      javascript: `// Implement reverseList(head)
function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,

      python: `# Implement reverse_list(head)
def reverse_list(head):
    prev = None
    curr = head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`,

      java: `// Implement reverseList method
public class Solution {
    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
}`,

      cpp: `// Implement reverseList function
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr != nullptr) {
        ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`
    }
  },
  {
    id: 'max-subarray',
    title: 'Maximum Subarray (Kadane)',
    difficulty: 'Medium',
    recommendedTimeSeconds: 1500, // 25 Mins
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    example: 'Input: nums = [-2,1,-3,4,-1,2,1,-5,4] | Output: 6 (Subarray [4,-1,2,1])',
    starterCodes: {
      javascript: `// Implement maxSubArray(nums)
function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let currentMax = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currentMax);
  }
  return maxSoFar;
}

console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4])); // -> 6`,

      python: `# Implement max_sub_array(nums)
def max_sub_array(nums):
    max_so_far = nums[0]
    curr_max = nums[0]
    for i in range(1, len(nums)):
        curr_max = max(nums[i], curr_max + nums[i])
        max_so_far = max(max_so_far, curr_max)
    return max_so_far

print(max_sub_array([-2,1,-3,4,-1,2,1,-5,4])) # -> 6`,

      java: `// Implement maxSubArray method
public class Solution {
    public static int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int currMax = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currMax = Math.max(nums[i], currMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currMax);
        }
        return maxSoFar;
    }

    public static void main(String[] args) {
        System.out.println(maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})); // -> 6
    }
}`,

      cpp: `// Implement maxSubArray function
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int maxSubArray(vector<int>& nums) {
    int maxSoFar = nums[0];
    int currMax = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        currMax = max(nums[i], currMax + nums[i]);
        maxSoFar = max(maxSoFar, currMax);
    }
    return maxSoFar;
}

int main() {
    vector<int> nums = {-2,1,-3,4,-1,2,1,-5,4};
    cout << maxSubArray(nums) << endl; // -> 6
    return 0;
}`
    }
  },
  {
    id: 'merge-sorted-array',
    title: 'Merge Sorted Array',
    difficulty: 'Easy',
    recommendedTimeSeconds: 900, // 15 Mins
    description: 'You are given two integer arrays nums1 and nums2, sorted in non-decreasing order. Merge nums2 into nums1 as one sorted array.',
    example: 'Input: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3 | Output: [1,2,2,3,5,6]',
    starterCodes: {
      javascript: `// Implement merge(nums1, m, nums2, n)
function merge(nums1, m, nums2, n) {
  let p1 = m - 1;
  let p2 = n - 1;
  let p = m + n - 1;
  while (p2 >= 0) {
    if (p1 >= 0 && nums1[p1] > nums2[p2]) {
      nums1[p] = nums1[p1];
      p1--;
    } else {
      nums1[p] = nums2[p2];
      p2--;
    }
    p--;
  }
  return nums1;
}`,

      python: `# Implement merge(nums1, m, nums2, n)
def merge(nums1, m, nums2, n):
    p1, p2, p = m - 1, n - 1, m + n - 1
    while p2 >= 0:
        if p1 >= 0 and nums1[p1] > nums2[p2]:
            nums1[p] = nums1[p1]
            p1 -= 1
        else:
            nums1[p] = nums2[p2]
            p2 -= 1
        p -= 1
    return nums1`,

      java: `// Implement merge method
public class Solution {
    public static void merge(int[] nums1, int m, int[] nums2, int n) {
        int p1 = m - 1, p2 = n - 1, p = m + n - 1;
        while (p2 >= 0) {
            if (p1 >= 0 && nums1[p1] > nums2[p2]) {
                nums1[p--] = nums1[p1--];
            } else {
                nums1[p--] = nums2[p2--];
            }
        }
    }
}`,

      cpp: `// Implement merge function
#include <vector>
using namespace std;

void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
    int p1 = m - 1, p2 = n - 1, p = m + n - 1;
    while (p2 >= 0) {
        if (p1 >= 0 && nums1[p1] > nums2[p2]) {
            nums1[p--] = nums1[p1--];
        } else {
            nums1[p--] = nums2[p2--];
        }
    }
}`
    }
  }
]

export default function TechnicalRound() {
  const navigate = useNavigate()
  const location = useLocation()
  const roundState = location.state || {}

  // Parse roundId and dynamic questions passed from dashboard
  const roundId = roundState.roundId || null
  const dynamicQuestions = roundState.questions || []

  // Adapt dynamic questions into full problem objects
  const finalProblemsList = dynamicQuestions.length > 0
    ? dynamicQuestions.map((q, idx) => {
        let title = `Problem ${idx + 1}`
        let desc = q.questionText || ''
        let diff = (q.difficulty || 'Medium')

        if (desc.startsWith('[')) {
          const closeBracket = desc.indexOf(']')
          if (closeBracket !== -1) {
            const rawTitleAndDesc = desc.slice(closeBracket + 1).trim()
            const parts = rawTitleAndDesc.split('\n\nDescription:\n')
            title = parts[0].trim() || `Problem ${idx + 1}`
            desc = parts[1] || parts[0]
          }
        } else if (desc.includes(':')) {
          const parts = desc.split(':')
          title = parts[0].trim()
          desc = parts.slice(1).join(':').trim()
        }

        diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase()

        return {
          id: q.id || `dyn-q-${idx}`,
          questionId: q.id,
          title: title,
          difficulty: diff,
          recommendedTimeSeconds: q.timeLimitSeconds || (diff.toLowerCase() === 'easy' ? 600 : diff.toLowerCase() === 'hard' ? 2700 : 1500),
          description: desc || 'Implement an optimal solution satisfying constraints.',
          example: 'Check test cases in starter code.',
          starterCodes: {
            javascript: q.starterCode || `// Write your ${title} solution in JavaScript\nfunction solution() {\n  // Implementation here\n}\n`,
            python: `# Write your ${title} solution in Python\ndef solution():\n    pass\n`,
            java: `// Write your ${title} solution in Java\npublic class Solution {\n    public static void main(String[] args) {\n        // Code here\n    }\n}`,
            cpp: `// Write your ${title} solution in C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`
          }
        }
      })
    : PROBLEMS

  // Active Problem & Code States
  const [currentIdx, setCurrentIdx] = useState(0)
  const selectedProblem = finalProblemsList[currentIdx] || finalProblemsList[0]

  const [language, setLanguage] = useState('javascript')
  const [editorTheme, setEditorTheme] = useState('vs-dark')

  // Stored code per problem
  const [codePerProblem, setCodePerProblem] = useState({})
  const code = codePerProblem[selectedProblem.questionId || selectedProblem.id] || selectedProblem.starterCodes[language] || selectedProblem.starterCodes.javascript

  const setCode = (newCode) => {
    const qId = selectedProblem.questionId || selectedProblem.id
    setCodePerProblem(prev => ({
      ...prev,
      [qId]: newCode
    }))
  }

  const [output, setOutput] = useState('Run your code to test execution, or Lock In Solution to receive AI grading and step-by-step breakdown.')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Locked answers and AI grading
  const [lockedSolutions, setLockedSolutions] = useState({})
  const [evalScores, setEvalScores] = useState({})
  const [analysisDetailsMap, setAnalysisDetailsMap] = useState({})

  // AI Step-by-Step Explanation state (Aptitude style)
  const [showExplanation, setShowExplanation] = useState(false)
  const [aiExplanations, setAiExplanations] = useState({})
  const [isExplaining, setIsExplaining] = useState(false)
  const [explanationAlert, setExplanationAlert] = useState(null)

  // Bookmarking & Saved State
  const [bookmarkedProblems, setBookmarkedProblems] = useState({})
  const [copiedToast, setCopiedToast] = useState(false)

  // Total Timer / Problem Timer
  const [timeLeft, setTimeLeft] = useState(selectedProblem.recommendedTimeSeconds)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [showTimeUpModal, setShowTimeUpModal] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  // Text-To-Speech (TTS): AI Interviewer Reads Problem
  const [isSpeaking, setIsSpeaking] = useState(false)

  const currentQId = selectedProblem.questionId || selectedProblem.id
  const isCurrentLocked = !!lockedSolutions[currentQId]
  const currentAnalysis = analysisDetailsMap[currentQId] || null
  const currentScore = evalScores[currentQId] !== undefined ? evalScores[currentQId] : null

  // Timer Tick Effect
  useEffect(() => {
    let interval = null
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false)
      setShowTimeUpModal(true)
    }
    return () => clearInterval(interval)
  }, [isTimerActive, timeLeft])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerBadgeStyle = () => {
    if (timeLeft <= 120) return 'bg-red-100 text-red-700 border-red-400 font-extrabold animate-pulse'
    if (timeLeft <= 300) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
    return 'bg-white text-stone-800 border-stone-300 font-bold'
  }

  // Handle Problem Switch
  const handleSelectProblem = (prob, idx) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
    setCurrentIdx(idx)
    setShowExplanation(false)
    setExplanationAlert(null)
    setOutput('Run code to test execution or Lock In Solution for evaluation.')
  }

  // Handle Language Change
  const handleLanguageChange = (e) => {
    const newLang = e.target.value
    setLanguage(newLang)
    if (!isCurrentLocked) {
      setCode(selectedProblem.starterCodes[newLang] || selectedProblem.starterCodes.javascript)
    }
    setOutput(`Language switched to ${newLang.toUpperCase()}. Click Run Code to test.`)
  }

  // Read Problem Aloud (TTS)
  const handleToggleSpeakProblem = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech audio is not supported in this browser.')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const speechText = `Problem: ${selectedProblem.title}. Difficulty: ${selectedProblem.difficulty}. ${selectedProblem.description} Example: ${selectedProblem.example}.`
    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.rate = 0.95
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // Code Execution Sandbox (Local Run)
  const handleRunCode = () => {
    setIsRunning(true)
    setOutput(`Compiling & executing ${language.toUpperCase()} in sandbox...`)

    setTimeout(() => {
      if (language === 'javascript') {
        let logs = []
        const customConsole = {
          log: (...args) => {
            logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
          },
          error: (...args) => {
            logs.push(`[ERROR] ${args.join(' ')}`)
          }
        }

        try {
          const runFn = new Function('console', code)
          runFn(customConsole)

          if (logs.length > 0) {
            setOutput(`Output Logs:\n${logs.join('\n')}\n\n✓ JavaScript execution completed cleanly.`)
          } else {
            setOutput('JavaScript code executed successfully with no console logs.')
          }
        } catch (err) {
          setOutput(`Execution Error:\n${err.message}`)
        }
      } else {
        setOutput(`[LOCAL CODE PREVIEW - ${language.toUpperCase()}]\n\nSyntax and structure formatted.\nClick 'Lock In Solution' to trigger full AI validation, grading, and asymptotic analysis.`)
      }

      setIsRunning(false)
    }, 300)
  }

  // Lock In Solution (Aptitude Round Style)
  const handleLockInSolution = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setIsRunning(true)
    setOutput('Locking in solution and analyzing with AI Examiner...')
    setExplanationAlert(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active user session. Please log in.')
      }

      const qId = currentQId
      const endpoint = roundId
        ? `${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${qId}`
        : `${import.meta.env.VITE_API_BASE_URL}/round/explain-technical`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answerText: code || "// No answer submitted",
          language: language
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to evaluate solution')
      }

      const data = await res.json()
      const score = data.score !== undefined ? data.score : 8.0

      setLockedSolutions(prev => ({ ...prev, [qId]: true }))
      setEvalScores(prev => ({ ...prev, [qId]: score }))
      if (data.analysisDetails) {
        setAnalysisDetailsMap(prev => ({ ...prev, [qId]: data.analysisDetails }))
      }

      setOutput(`✓ Solution Locked & Evaluated (${language.toUpperCase()})\n\nScore: ${score} / 10\n\nFeedback:\n${data.feedback || 'Solution recorded successfully.'}`)
    } catch (err) {
      console.error('Error locking in solution:', err)
      alert(`Lock in failed: ${err.message}`)
    } finally {
      setIsRunning(false)
      setIsSubmitting(false)
    }
  }

  // Fetch AI Step-by-Step Algorithmic Explanation
  const fetchAiExplanation = async () => {
    if (aiExplanations[currentQId]) return
    setIsExplaining(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const endpoint = roundId
        ? `${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/question/${currentQId}/explanation`
        : `${import.meta.env.VITE_API_BASE_URL}/round/explain-technical`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionText: `${selectedProblem.title}\n\n${selectedProblem.description}`,
          candidateCode: code,
          language: language,
          questionId: currentQId
        })
      })

      if (res.ok) {
        const data = await res.json()
        setAiExplanations(prev => ({
          ...prev,
          [currentQId]: data
        }))
      }
    } catch (err) {
      console.warn('Failed to fetch AI explanation:', err)
    } finally {
      setIsExplaining(false)
    }
  }

  // Check / Hide AI Explanation Button Handler
  const handleCheckExplanation = () => {
    if (!isCurrentLocked) {
      setExplanationAlert("Please lock in your solution for this problem first to unlock the AI step-by-step algorithmic breakdown!")
      setShowExplanation(false)
      return
    }
    setExplanationAlert(null)
    const nextShow = !showExplanation
    setShowExplanation(nextShow)
    if (nextShow) {
      fetchAiExplanation()
    }
  }

  // Navigate to Next Problem
  const handleNextProblem = () => {
    const nextIdx = (currentIdx + 1) % finalProblemsList.length
    handleSelectProblem(finalProblemsList[nextIdx], nextIdx)
  }

// Unlock Solution to allow edits
  const handleUnlockSolution = () => {
    setLockedSolutions(prev => ({ ...prev, [currentQId]: false }))
    setShowExplanation(false)
    setOutput('Solution unlocked for editing. Make changes and click "Lock In Solution" again.')
  }

  // Final Assessment Submission
  const [roundSummary, setRoundSummary] = useState(null)

  const handleSubmitAssessmentAll = async (isTimeout = false) => {
    if (isSubmitting) return

    const answeredProblems = finalProblemsList.filter(p => {
      const qId = p.questionId || p.id
      const pCode = codePerProblem[qId]
      return lockedSolutions[qId] || (pCode && pCode.trim().length > 0)
    })

    if (!isTimeout && answeredProblems.length === 0) {
      alert("Please solve at least one problem before submitting.")
      return
    }

    setIsSubmitting(true)
    setIsTimerActive(false)

    let summaryData = null

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active user session. Please log in.')
      }

      if (roundId) {
        // Auto-lock/submit any answered problems that haven't been posted yet
        const unpostedQIds = answeredProblems
          .map(p => p.questionId || p.id)
          .filter(qId => !lockedSolutions[qId])

        if (unpostedQIds.length > 0) {
          const submitPromises = unpostedQIds.map(async (qId) => {
            const prob = finalProblemsList.find(p => (p.questionId || p.id) === qId)
            const cCode = codePerProblem[qId] || (prob ? prob.starterCodes[language] : '')
            try {
              return fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${qId}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  answerText: cCode,
                  language: language
                })
              })
            } catch (pErr) {
              console.warn('Failed auto-posting answer for qId:', qId, pErr)
            }
          })
          await Promise.all(submitPromises)
        }

        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/finish`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
          if (response.ok) {
            summaryData = await response.json()
          }
        } catch (fErr) {
          console.warn('Failed calling finish endpoint:', fErr)
        }
      }

      if (!summaryData || summaryData.questionsAttempted === undefined) {
        const totalCount = finalProblemsList.length
        const completedCount = answeredProblems.length
        const unattemptedCount = Math.max(0, totalCount - completedCount)
        const correctCount = Object.values(evalScores).filter(s => typeof s === 'number' && s >= 7.0).length
        const wrongCount = Math.max(0, completedCount - correctCount)
        const validScores = Object.values(evalScores).filter(s => typeof s === 'number' && !isNaN(s))
        const avgScore = completedCount > 0 && validScores.length > 0
          ? validScores.reduce((a, b) => a + b, 0) / completedCount
          : 0.0
        const accuracy = completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0

        summaryData = {
          status: 'completed',
          totalQuestions: totalCount,
          questionsAttempted: completedCount,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          unattempted: unattemptedCount,
          accuracyPercentage: accuracy,
          overallScore: Number(avgScore.toFixed(1)),
          score: Number(avgScore.toFixed(1)),
          maxScore: 10
        }
      }

      setRoundSummary(summaryData)
      setShowCompletionModal(true)
    } catch (err) {
      console.error('Error submitting technical assessment:', err)
      if (!isTimeout) alert(`Submission failed: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const completedCount = roundSummary?.questionsAttempted !== undefined
    ? roundSummary.questionsAttempted
    : Object.keys(lockedSolutions).filter(k => lockedSolutions[k]).length

  const totalCount = roundSummary?.totalQuestions !== undefined
    ? roundSummary.totalQuestions
    : finalProblemsList.length

  const correctCount = roundSummary?.correctAnswers !== undefined
    ? roundSummary.correctAnswers
    : Object.values(evalScores).filter(s => typeof s === 'number' && s >= 7.0).length

  const wrongCount = roundSummary?.wrongAnswers !== undefined
    ? roundSummary.wrongAnswers
    : Math.max(0, completedCount - correctCount)

  const unattemptedCount = roundSummary?.unattempted !== undefined
    ? roundSummary.unattempted
    : Math.max(0, totalCount - completedCount)

  const validScores = Object.values(evalScores).filter(s => typeof s === 'number' && !isNaN(s))
  const rawAvg = completedCount > 0 && validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / Math.max(1, completedCount)
    : 0.0

  const scoreVal = roundSummary?.overallScore ?? roundSummary?.score ?? rawAvg
  const finalNum = typeof scoreVal === 'number' && !isNaN(scoreVal) ? scoreVal : (parseFloat(scoreVal) || 0.0)
  const finalAvgScore = finalNum.toFixed(1)

  const finalAccuracy = roundSummary?.accuracyPercentage !== undefined
    ? roundSummary.accuracyPercentage
    : (completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0)

  return (
    <div className="min-h-screen bg-[#FAF7ED] text-black font-radio selection:bg-parker-red selection:text-white flex flex-col">
      {/* Top Header Bar (Matching Aptitude Round) */}
      <header className="px-6 py-3.5 border-b border-stone-200 bg-[#FAF7ED] flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <span className="font-fragment text-xs font-extrabold tracking-widest text-stone-500 uppercase">
            TECHNICAL CODING ROUND
          </span>

          <span className="text-xs font-radio font-extrabold px-3 py-1 bg-black text-white rounded-full hidden sm:inline-block">
            Locked: {completedCount} / {finalProblemsList.length}
          </span>
        </div>

        {/* Center: Question Numbers Scrollable Pill Track */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[180px] sm:max-w-[340px] md:max-w-[460px] py-1 px-2 bg-stone-100/90 border border-stone-300 rounded-2xl no-scrollbar">
          {finalProblemsList.map((prob, idx) => {
            const pId = prob.questionId || prob.id
            const isCurrent = idx === currentIdx
            const isLocked = lockedSolutions[pId]
            const isBookmarked = bookmarkedProblems[pId]

            let style = 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-200'
            if (isCurrent) {
              style = 'bg-black text-white shadow-xs font-bold scale-105'
            } else if (isLocked) {
              style = 'bg-emerald-600 text-white font-bold'
            }

            return (
              <button
                key={prob.id}
                onClick={() => handleSelectProblem(prob, idx)}
                className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full font-bold text-xs transition-all cursor-pointer flex items-center justify-center relative ${style}`}
                title={isBookmarked ? "Bookmarked problem" : `Problem ${idx + 1}: ${prob.title}`}
              >
                {isBookmarked && <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>}
                {isLocked && !isCurrent ? '✓' : idx + 1}
              </button>
            )
          })}
        </div>

        {/* Right Header: Timer & Submit Assessment Button */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xs text-xs ${getTimerBadgeStyle()}`}>
            <Timer className="w-3.5 h-3.5" />
            <span className="font-mono tracking-wider">{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={handleSubmitAssessmentAll}
            className="bg-black hover:bg-stone-800 text-white font-radio font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Submit Assessment</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Un-cluttered Controls Strip: Problem Info + Language + Theme + Run */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-300 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-3 text-left">
            <h1 className="font-serif font-bold text-xl text-black">
              {selectedProblem.title}
            </h1>
            <span className={`text-xs font-radio font-extrabold px-2.5 py-0.5 rounded-full border ${
              selectedProblem.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-100 border-emerald-300 text-emerald-900' :
              selectedProblem.difficulty.toLowerCase() === 'hard' ? 'bg-red-100 border-red-300 text-red-900' :
              'bg-amber-100 border-amber-300 text-amber-900'
            }`}>
              {selectedProblem.difficulty}
            </span>
            <span className="text-xs font-mono font-semibold text-stone-500 hidden md:inline">
              Target: {Math.floor(selectedProblem.recommendedTimeSeconds / 60)} Mins
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI Voice Read Problem */}
            <button
              onClick={handleToggleSpeakProblem}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                isSpeaking
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
              title="AI Interviewer Read Problem Aloud"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-parker-red" />}
              <span className="hidden md:inline">{isSpeaking ? 'Stop Reading' : 'AI Voice Read'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
              className="p-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 transition-all cursor-pointer shadow-2xs"
              title="Toggle Editor Theme"
            >
              {editorTheme === 'vs-dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-1">
              <Code2 className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e)}
                className="bg-transparent text-xs font-mono font-bold text-black focus:outline-none cursor-pointer"
              >
                <option value="javascript">JavaScript (ES6)</option>
                <option value="python">Python 3</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++ 20</option>
              </select>
            </div>

            {/* Green Run Code Sandbox Execution Button */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-[#2F8F6E] hover:bg-[#26775C] active:scale-95 text-white font-radio font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Monaco Code Workspace (Left) & Live Console/AI Breakdown (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* Left Column: Problem Brief + Monaco Code Editor (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Collapsible Problem Description & Input/Output Specs */}
            <div className="bg-[#FAF4E5] border border-stone-300 rounded-2xl p-4 text-left shadow-2xs">
              <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">
                PROBLEM STATEMENT
              </span>
              <p className="text-xs font-radio text-stone-800 leading-relaxed font-medium mb-2.5">
                {selectedProblem.description}
              </p>
              <div className="bg-white/80 border border-stone-200 rounded-xl p-2.5 font-mono text-[11px] text-stone-700 overflow-x-auto">
                <span className="text-stone-400 font-bold block text-[9px] uppercase mb-0.5">EXAMPLE</span>
                <code>{selectedProblem.example}</code>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="relative border-2 border-black rounded-2xl overflow-hidden shadow-2xs bg-[#1e1e1e]">
              {/* Lock Status Overlay Banner */}
              {isCurrentLocked && (
                <div className="absolute top-3 right-3 z-20 bg-emerald-500/90 text-white font-radio font-bold text-[11px] px-3 py-1 rounded-full shadow-xs backdrop-blur-xs flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Solution Locked</span>
                </div>
              )}

              <div className="h-[430px] w-full">
                <Editor
                  height="100%"
                  language={language === 'cpp' ? 'cpp' : language}
                  value={code}
                  theme={editorTheme}
                  onChange={(val) => !isCurrentLocked && setCode(val || '')}
                  options={{
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, Menlo, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    readOnly: isCurrentLocked,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    padding: { top: 12, bottom: 12 }
                  }}
                />
              </div>
            </div>

            {/* Action Bar (Check AI Explanation, Reset, Lock In Solution, Next) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white border border-stone-300 rounded-2xl p-3 shadow-2xs">
              <div className="flex items-center gap-2">
                {/* Check AI Explanation Button (Aptitude style) */}
                <button
                  onClick={handleCheckExplanation}
                  disabled={!isCurrentLocked || isExplaining}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    showExplanation
                      ? 'bg-emerald-700 text-white'
                      : isCurrentLocked
                      ? 'bg-[#EAF3EB] border border-[#B3D6B8] text-[#1E5629] hover:bg-[#D5EAD8]'
                      : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                  }`}
                  title={isCurrentLocked ? "View step-by-step algorithmic breakdown" : "Lock in your solution first to unlock AI explanation"}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showExplanation ? 'Hide AI Explanation' : 'Check AI Explanation'}</span>
                </button>

                {!isCurrentLocked && (
                  <button
                    onClick={() => setCode(selectedProblem.starterCodes[language] || selectedProblem.starterCodes.javascript)}
                    className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-black transition-colors cursor-pointer px-2 py-1.5"
                    title="Reset starter template"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isCurrentLocked ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Locked ({evalScores[currentQId] || 0}/10)</span>
                    </div>
                    <button
                      onClick={handleUnlockSolution}
                      className="px-2.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-600 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5 text-stone-500" />
                      <span>Edit</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLockInSolution}
                    disabled={isSubmitting}
                    className="bg-black hover:bg-stone-800 text-white font-radio font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>{isSubmitting ? 'Evaluating...' : 'Lock In Solution'}</span>
                  </button>
                )}

                <button
                  onClick={handleNextProblem}
                  className="bg-[#94B48F] hover:bg-[#83A37E] active:scale-95 text-white font-radio font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Output Console & Step-by-Step AI Breakdown (5 Cols) */}
          <div className="lg:col-span-5 bg-[#FAF4E5] border border-stone-300 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs text-left">
            <div className="flex items-center justify-between pb-1 border-b border-stone-200">
              <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest block">
                {showExplanation ? 'AI STEP-BY-STEP BREAKDOWN' : 'EXECUTION CONSOLE & EVALUATION'}
              </span>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                {showExplanation ? 'Switch to Console' : 'View Breakdown'}
              </button>
            </div>

            {/* AI Explanation View (Aptitude style with Code Errors & Corrected Code) */}
            {showExplanation ? (
              <div className="flex-1 bg-white border-2 border-black rounded-xl p-4 shadow-xs overflow-auto max-h-[520px] space-y-3.5 font-radio text-xs">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-1">
                  <span className="font-fragment text-[10px] font-bold text-[#2F8F6E] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    AI ALGORITHMIC AUDIT & CODE CORRECTION
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                    {language.toUpperCase()}
                  </span>
                </div>

                {isExplaining ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3 text-stone-600 font-bold">
                    <Sparkles className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-sm text-black">AI Examiner is auditing your code & generating correction...</p>
                    <p className="text-[11px] text-stone-400 font-normal">Analyzing asymptotic complexity, errors, and test edge cases...</p>
                  </div>
                ) : aiExplanations[currentQId] ? (
                  <div className="space-y-3.5">
                    {/* 1. ERRORS IN CANDIDATE'S SUBMITTED CODE */}
                    {aiExplanations[currentQId].codeErrors && aiExplanations[currentQId].codeErrors.length > 0 && (
                      <div className="p-3 bg-red-50/90 border-2 border-red-300 rounded-xl space-y-1.5">
                        <span className="font-bold text-red-900 block text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          ERRORS & BUGS IN YOUR SUBMITTED CODE
                        </span>
                        <ul className="space-y-1 text-red-950 text-[11px]">
                          {aiExplanations[currentQId].codeErrors.map((err, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-red-600 font-bold">•</span>
                              <span className="leading-snug">{err}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 2. CORRECTED & OPTIMAL CODE SNIPPET */}
                    {(aiExplanations[currentQId].correctedCode || aiExplanations[currentQId].optimalCodeSnippet) && (
                      <div className="rounded-xl overflow-hidden border-2 border-black bg-[#1E1E1E] text-stone-200 shadow-xs">
                        <div className="flex items-center justify-between px-3.5 py-2 bg-[#2D2D2D] border-b border-stone-700 text-[10px] font-bold text-stone-300">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                            <Code2 className="w-3.5 h-3.5" />
                            <span>CORRECTED & OPTIMAL CODE ({language.toUpperCase()})</span>
                          </div>
                          <button
                            onClick={() => {
                              const codeToCopy = aiExplanations[currentQId].correctedCode || aiExplanations[currentQId].optimalCodeSnippet
                              navigator.clipboard.writeText(codeToCopy)
                              setCopiedToast(true)
                              setTimeout(() => setCopiedToast(false), 2000)
                            }}
                            className="hover:text-white px-2 py-0.5 rounded bg-stone-700 hover:bg-stone-600 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {copiedToast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedToast ? 'Copied!' : 'Copy Code'}</span>
                          </button>
                        </div>
                        <pre className="p-3.5 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed text-emerald-300/90">
                          {aiExplanations[currentQId].correctedCode || aiExplanations[currentQId].optimalCodeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* 3. OPTIMAL APPROACH BOX */}
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                      <span className="font-bold text-emerald-900 block text-[10px] uppercase mb-1 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                        OPTIMAL ALGORITHMIC STRATEGY
                      </span>
                      <p className="text-emerald-950 font-semibold leading-relaxed">
                        {aiExplanations[currentQId].optimalApproach}
                      </p>
                    </div>

                    {/* 4. ASYMPTOTIC COMPLEXITY COMPARISON */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                        <span className="font-bold text-stone-500 text-[10px] uppercase block mb-1">TIME COMPLEXITY</span>
                        <span className="font-mono font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                          {aiExplanations[currentQId].timeComplexity || 'O(N)'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                        <span className="font-bold text-stone-500 text-[10px] uppercase block mb-1">SPACE COMPLEXITY</span>
                        <span className="font-mono font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs">
                          {aiExplanations[currentQId].spaceComplexity || 'O(1)'}
                        </span>
                      </div>
                    </div>

                    {/* 5. STEP-BY-STEP LOGIC DERIVATION */}
                    {aiExplanations[currentQId].stepByStepSolution && (
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                        <span className="font-bold text-stone-700 block text-[10px] uppercase mb-2 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-stone-600" />
                          STEP-BY-STEP DERIVATION & LOGIC
                        </span>
                        <div className="space-y-1.5">
                          {aiExplanations[currentQId].stepByStepSolution.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-stone-800 text-[11px] leading-relaxed">
                              <span className="w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. CRITICAL EDGE CASES */}
                    {aiExplanations[currentQId].edgeCases && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                        <span className="font-bold text-amber-900 block text-[10px] uppercase mb-1">CRITICAL EDGE CASES</span>
                        <ul className="list-disc list-inside space-y-0.5 text-stone-800 text-[11px]">
                          {aiExplanations[currentQId].edgeCases.map((ec, idx) => (
                            <li key={idx}>{ec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-stone-500">
                    Click "Check AI Explanation" to generate the step-by-step audit, bug list, and corrected code.
                  </div>
                )}
              </div>
            ) : (
              /* Output Display Console & AI Feedback */
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-1 bg-white border border-stone-300 rounded-xl p-3.5 font-mono text-xs text-stone-800 overflow-auto whitespace-pre-wrap min-h-[300px] leading-relaxed">
                  {output}
                </div>

                {isCurrentLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                      (evalScores[currentQId] || 0) >= 7.5
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : (evalScores[currentQId] || 0) >= 4.0
                        ? 'bg-amber-50 border-amber-400 text-amber-950'
                        : 'bg-red-50 border-red-400 text-red-950'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${
                      (evalScores[currentQId] || 0) >= 7.5 ? 'text-emerald-600' : (evalScores[currentQId] || 0) >= 4.0 ? 'text-amber-600' : 'text-red-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-extrabold text-xs">
                          {(evalScores[currentQId] || 0) >= 7.5 ? 'Accepted Solution' : (evalScores[currentQId] || 0) >= 4.0 ? 'Partially Correct' : 'Needs Improvement'}
                        </p>
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-white/80 border border-black/10">
                          {evalScores[currentQId] || 0} / 10
                        </span>
                      </div>
                      <p className="text-[11px] font-normal opacity-90 leading-snug">
                        Click <strong className="font-bold">"Check AI Explanation"</strong> to view code bugs, step-by-step logic, and the corrected reference implementation.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Candidate Utilities (Clear Console, Copy Code, Bookmark) */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const pId = currentQId
                    setBookmarkedProblems(prev => ({ ...prev, [pId]: !prev[pId] }))
                  }}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    bookmarkedProblems[currentQId]
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-700'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarkedProblems[currentQId] ? 'fill-amber-500 text-amber-600' : ''}`} />
                  <span>{bookmarkedProblems[currentQId] ? 'Bookmarked' : 'Bookmark'}</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code)
                    setCopiedToast(true)
                    setTimeout(() => setCopiedToast(false), 2000)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {copiedToast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToast ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                onClick={() => setOutput('Console cleared. Run your code to test.')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Time's Up Modal */}
      <AnimatePresence>
        {showTimeUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] text-center flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center border-2 border-red-500 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h2 className="font-serif text-2xl font-bold text-black">
                Time's Up! ⏱️
              </h2>

              <p className="text-xs text-stone-600 max-w-xs">
                The technical interview time limit has expired. Please submit your final assessment.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
                <button
                  onClick={() => {
                    setTimeLeft((prev) => prev + 300)
                    setIsTimerActive(true)
                    setShowTimeUpModal(false)
                  }}
                  className="w-full sm:w-1/2 bg-white border-2 border-black text-black font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+5 Mins</span>
                </button>

                <button
                  onClick={handleSubmitAssessmentAll}
                  className="w-full sm:w-1/2 bg-black hover:bg-stone-800 text-white font-radio font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Submit Assessment</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000] text-center flex flex-col items-center gap-4 text-left"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-500 shadow-sm mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-black text-center">
                  Technical Round Completed! 🎉
                </h2>
                <p className="text-xs text-stone-600 text-center max-w-sm mt-1">
                  Your code solutions and algorithmic performance have been recorded into your official AI performance dossier.
                </p>
              </div>

              {/* Assessment Statistics Grid */}
              <div className="w-full bg-[#FAF7ED] border-2 border-black rounded-2xl p-4 sm:p-5 flex flex-col gap-3 font-radio text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="font-fragment font-extrabold text-[10px] text-stone-500 uppercase tracking-wider">
                    OVERALL EVALUATION
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                    Number(finalAvgScore) >= 7.5 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    Number(finalAvgScore) >= 5.0 ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    'bg-red-100 text-red-900 border-red-300'
                  }`}>
                    {Number(finalAvgScore) >= 7.5 ? 'Passed / High Readiness' : Number(finalAvgScore) >= 5.0 ? 'Competent' : 'Needs Practice'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Attempted</span>
                    <span className="font-extrabold text-sm text-black">{completedCount} / {totalCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Correct</span>
                    <span className="font-extrabold text-sm text-emerald-700">✅ {correctCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-red-700 uppercase block">Wrong / Sub</span>
                    <span className="font-extrabold text-sm text-red-700">❌ {wrongCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Accuracy</span>
                    <span className="font-extrabold text-sm text-black">{finalAccuracy}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                  <span className="text-stone-600 font-bold">Average Score:</span>
                  <span className="font-extrabold text-base text-black">{finalAvgScore} / 10</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="w-full sm:w-1/2 bg-white border-2 border-black text-black font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-100 transition-all cursor-pointer text-center"
                >
                  Review Solutions
                </button>

                <button
                  onClick={() => navigate('/full-report')}
                  className="w-full sm:w-1/2 bg-black hover:bg-stone-800 text-white font-radio font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>View Full AI Report →</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
