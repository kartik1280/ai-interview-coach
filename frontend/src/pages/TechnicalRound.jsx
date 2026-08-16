import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, Moon, Sun, Timer, AlertCircle, Plus, VolumeX, Volume2, Mic, MicOff, Bookmark, Copy, Trash2, RefreshCw, Check, Lock, Sparkles } from 'lucide-react'
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
  for (let char of s) {
    count[char] = (count[char] || 0) + 1;
  }
  for (let char of t) {
    if (!count[char]) return false;
    count[char]--;
  }
  return true;
}

console.log(isAnagram("anagram", "nagaram")); // -> true`,

      python: `# Implement is_anagram(s, t)
def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    count = {}
    for char in s:
        count[char] = count.get(char, 0) + 1
    for char in t:
        if count.get(char, 0) == 0:
            return False
        count[char] -= 1
    return True

print(is_anagram("anagram", "nagaram"))  # -> True`,

      java: `// Implement isAnagram method
import java.util.*;

public class Solution {
    public static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] counts = new int[26];
        for (int i = 0; i < s.length(); i++) {
            counts[s.charAt(i) - 'a']++;
            counts[t.charAt(i) - 'a']--;
        }
        for (int count : counts) {
            if (count != 0) return false;
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
    vector<int> counts(26, 0);
    for (int i = 0; i < s.length(); i++) {
        counts[s[i] - 'a']++;
        counts[t[i] - 'a']--;
    }
    for (int count : counts) {
        if (count != 0) return false;
    }
    return true;
}

int main() {
    cout << boolalpha << isAnagram("anagram", "nagaram") << endl;
    return 0;
}`
    }
  }
]

function generateStarterCodeForLanguage(starterPython, lang) {
  if (!starterPython) {
    if (lang === 'python') return 'class Solution:\n    def solve(self):\n        pass'
    if (lang === 'javascript') return '/**\n * @return {void}\n */\nvar solve = function() {\n    \n};'
    if (lang === 'java') return 'class Solution {\n    public void solve() {\n        \n    }\n}'
    if (lang === 'cpp') return 'class Solution {\npublic:\n    void solve() {\n        \n    }\n};'
  }

  let cleanCode = starterPython.replace(/```python|```/g, '').trim()

  if (lang === 'python') {
    return cleanCode
  }

  if (lang === 'javascript') {
    let js = cleanCode
      .replace(/class\s+(\w+):/g, 'class $1 {')
      .replace(/def\s+__init__\s*\(\s*self\s*,?\s*(.*?)\):/g, '  constructor($1) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*(->\s*[\w\[\]]+)?:/g, '  $1($2) {')
      .replace(/:\s*list\[.*?\]/g, '')
      .replace(/:\s*int/g, '')
      .replace(/:\s*str/g, '')
      .replace(/:\s*bool/g, '')
      .replace(/pass/g, '    // Write your solution here')

    if (!js.includes('}') && js.includes('class Solution')) {
      js += '\n}'
    }
    return js
  }

  if (lang === 'java') {
    let java = cleanCode
      .replace(/class\s+(\w+):/g, 'public class $1 {')
      .replace(/def\s+__init__\s*\(\s*self\s*,?\s*(.*?)\):/g, '    public $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*bool:/g, '    public boolean $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*int:/g, '    public int $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*list\[.*?\]:/g, '    public int[] $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*None:/g, '    public void $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\):/g, '    public Object $1($2) {')
      .replace(/pass/g, '        // Write your solution here')

    if (!java.includes('}') && java.includes('class Solution')) {
      java += '\n}'
    }
    return java
  }

  if (lang === 'cpp') {
    let cpp = cleanCode
      .replace(/class\s+(\w+):/g, 'class $1 {\npublic:')
      .replace(/def\s+__init__\s*\(\s*self\s*,?\s*(.*?)\):/g, '    $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*bool:/g, '    bool $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*int:/g, '    int $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*list\[.*?\]:/g, '    vector<int> $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\)\s*->\s*None:/g, '    void $1($2) {')
      .replace(/def\s+(\w+)\s*\(\s*self\s*,?\s*(.*?)\):/g, '    void $1($2) {')
      .replace(/pass/g, '        // Write your solution here')

    if (!cpp.includes('};') && cpp.includes('class Solution')) {
      cpp += '\n};'
    }
    return cpp
  }

  return cleanCode
}

export default function TechnicalRound() {
  const navigate = useNavigate()
  const location = useLocation()

  // Retrieve passed round details
  const roundState = location.state || {}
  const roundId = roundState.roundId
  const backendQuestions = roundState.questions || []

  // Map backend questions to PROBLEM shapes
  const mappedProblems = backendQuestions.map((bq) => {
    const rawDiff = (bq.difficulty || 'medium').toLowerCase()
    let timeLimitSec = bq.timeLimitSeconds
    if (!timeLimitSec) {
      if (rawDiff === 'easy') timeLimitSec = 600
      else if (rawDiff === 'hard') timeLimitSec = 2700
      else timeLimitSec = 1500
    }

    // Parse title & description
    const questionText = bq.questionText || 'Technical Coding Problem'
    const titleMatch = questionText.match(/^\[(.*?)\]\s*(.*)/)
    const displayTitle = titleMatch ? titleMatch[2].split('\n')[0] : questionText.split('\n')[0]
    
    // Clean description to remove raw starter code text embedded in description if present
    const cleanDesc = questionText.split('\n\nStarter Code:')[0]
    const rawStarter = bq.starterCode || bq.starter_code || ''

    return {
      id: bq.id,
      questionId: bq.id,
      title: displayTitle || 'Technical Coding Problem',
      difficulty: rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1),
      timeLimitSeconds: timeLimitSec,
      recommendedTimeSeconds: timeLimitSec,
      description: cleanDesc,
      example: 'Refer to problem description for sample inputs.',
      starterCodes: {
        javascript: generateStarterCodeForLanguage(rawStarter, 'javascript'),
        python: generateStarterCodeForLanguage(rawStarter, 'python'),
        java: generateStarterCodeForLanguage(rawStarter, 'java'),
        cpp: generateStarterCodeForLanguage(rawStarter, 'cpp')
      }
    }
  })

  const finalProblemsList = mappedProblems.length > 0 ? mappedProblems : PROBLEMS

  const [selectedProblem, setSelectedProblem] = useState(finalProblemsList[0])
  const [language, setLanguage] = useState('javascript')
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [code, setCode] = useState(finalProblemsList[0].starterCodes?.javascript || '')
  const [output, setOutput] = useState('Run your code to see logs and test results here.')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [evalScore, setEvalScore] = useState(null)
  const [evalFeedback, setEvalFeedback] = useState('')
  const [analysisDetails, setAnalysisDetails] = useState(null)
  const [bookmarkedProblems, setBookmarkedProblems] = useState({})
  const [submittedSolutions, setSubmittedSolutions] = useState({})
  const [copiedToast, setCopiedToast] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  // Timer State
  const [timeLeft, setTimeLeft] = useState(finalProblemsList[0].timeLimitSeconds || finalProblemsList[0].recommendedTimeSeconds)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [showTimeUpModal, setShowTimeUpModal] = useState(false)

  // Web Speech State (TTS & STT)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [vocalNotes, setVocalNotes] = useState('')
  const recognitionRef = useRef(null)

  // Clean up speech synthesis on unmount or problem change
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [selectedProblem])

  // Automatic submit on timeout
  const handleTimeoutAutoSubmit = () => {
    if (isSubmitting) return
    handleSubmitSolution()
  }

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false)
      setShowTimeUpModal(true)
      handleTimeoutAutoSubmit()
    }
    return () => clearInterval(interval)
  }, [isTimerActive, timeLeft])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Timer Badge Color Helper
  const getTimerBadgeStyle = () => {
    if (timeLeft === 0) return 'bg-red-600 text-white font-extrabold border-red-700 animate-bounce'
    if (timeLeft <= 60) return 'bg-red-100 text-red-700 border-red-400 font-extrabold animate-pulse'
    if (timeLeft <= 300) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
    return 'bg-white text-stone-800 border-stone-300 font-bold'
  }

  // Text-To-Speech (TTS): AI Interviewer Reads Problem Aloud
  const handleToggleSpeakProblem = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.')
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const speechText = `Technical question: ${selectedProblem.title}. Difficulty: ${selectedProblem.difficulty}. ${selectedProblem.description} Example input: ${selectedProblem.example}. You may begin writing your code and vocalizing your approach out loud.`
    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.rate = 0.95

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // Speech-To-Text (STT): Candidate Thinks Out Loud & Records Approach
  const handleToggleMicrophone = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech Recognition microphone input is not supported in this browser. Please use Google Chrome or MS Edge.')
      return
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      let currentTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript
      }
      setVocalNotes((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript))
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  // Handle problem switch
  const handleSelectProblem = (prob) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
    setSelectedProblem(prob)
    setCode(prob.starterCodes[language] || prob.starterCodes.javascript)
    setTimeLeft(prob.recommendedTimeSeconds)
    setIsTimerActive(true)
    setShowTimeUpModal(false)
    setVocalNotes('')
    setAnalysisDetails(null)
    setOutput('Run your code to see logs and test results here.')
    setIsSubmitted(false)
  }

  // Handle language switch
  const handleLanguageChange = (e) => {
    const newLang = e.target.value
    setLanguage(newLang)
    setCode(selectedProblem.starterCodes[newLang] || selectedProblem.starterCodes.javascript)
    setAnalysisDetails(null)
    setOutput('Language updated. Click Run to evaluate code.')
  }

  // Code Execution Engine
  const handleRunCode = () => {
    setIsRunning(true)
    setAnalysisDetails(null)
    setOutput(`Compiling & executing ${language.toUpperCase()}...`)

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
        setOutput(`[LOCAL CODE PREVIEW - ${language.toUpperCase()}]\n\nIn-browser instant execution is supported for JavaScript.\nFor ${language.toUpperCase()}, click 'Lock / Submit Problem Solution' below to run full AI Code Analysis & Asymptotic Complexity Review.`)
      }

      setIsRunning(false)
    }, 400)
  }

  const handleSubmitSolution = async (openModal = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setIsSubmitted(false)
    setIsRunning(true)
    setOutput('Submitting your solution and generating AI code analysis...')
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active user session found. Please log in.')
      }
      
      const qId = selectedProblem.questionId || selectedProblem.id
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${qId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answerText: code || "// No answer submitted (Timeout)",
          language: language
        })
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to submit solution')
      }
      
      const data = await res.json()
      setEvalScore(data.score)
      setEvalFeedback(data.feedback)
      setAnalysisDetails(data.analysisDetails || null)
      setIsSubmitted(true)
      setSubmittedSolutions(prev => ({ ...prev, [qId]: true }))
      setOutput(`✓ AI Evaluation Completed (${language.toUpperCase()})\n\nMarks / Score: ${data.score} / 10\n\n========================================\nEVALUATION & ERROR DESCRIPTION\n========================================\n${data.feedback}`)
      
      if (openModal) {
        setIsTimerActive(false)
        setShowCompletionModal(true)
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
      alert(`Submission failed: ${err.message}`)
    } finally {
      setIsRunning(false)
      setIsSubmitting(false)
    }
  }

  const handleSubmitAssessmentAll = async () => {
    await handleSubmitSolution(true)
  }

  return (
    <div className="min-h-screen bg-[#FAF7ED] text-black font-radio selection:bg-parker-red selection:text-white flex flex-col">
      {/* Top Header Bar (Matching Aptitude Round Layout) */}
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
            Submitted: {Object.keys(submittedSolutions).length} / {finalProblemsList.length}
          </span>
        </div>

        {/* Center: Question Numbers Scrollable Pill Track */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[180px] sm:max-w-[340px] md:max-w-[460px] py-1 px-2 bg-stone-100/90 border border-stone-300 rounded-2xl no-scrollbar">
          {finalProblemsList.map((prob, idx) => {
            const pId = prob.questionId || prob.id
            const isCurrent = (selectedProblem.questionId || selectedProblem.id) === pId
            const isSubmittedProb = submittedSolutions[pId]
            const isBookmarked = bookmarkedProblems[pId]

            let style = 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-200'
            if (isCurrent) {
              style = 'bg-black text-white shadow-xs font-bold scale-105'
            } else if (isSubmittedProb) {
              style = 'bg-emerald-600 text-white font-bold'
            }

            return (
              <button
                key={prob.id}
                onClick={() => handleSelectProblem(prob)}
                className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full font-bold text-xs transition-all cursor-pointer flex items-center justify-center relative ${style}`}
                title={isBookmarked ? "Bookmarked problem" : `Problem ${idx + 1}: ${prob.title}`}
              >
                {isBookmarked && <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>}
                {isSubmittedProb && !isCurrent ? '✓' : idx + 1}
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
            onClick={() => handleSubmitAssessmentAll()}
            className="bg-black hover:bg-stone-800 text-white font-radio font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
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
            <span className="text-xs font-radio font-extrabold px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-full">
              {selectedProblem.difficulty}
            </span>
            <span className="text-xs font-mono font-semibold text-stone-500 hidden md:inline">
              Target: {Math.floor(selectedProblem.recommendedTimeSeconds / 60)} Mins
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI Voice Read Aloud */}
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

            {/* Candidate Voice Microphone */}
            <button
              onClick={handleToggleMicrophone}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                isListening
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
              title="Vocalize Thought Process Out Loud"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="hidden md:inline">{isListening ? 'Recording...' : 'Explain Out Loud'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
              className="p-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 transition-all cursor-pointer shadow-2xs"
              title="Toggle Editor Theme"
            >
              {editorTheme === 'vs-dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-700" />}
            </button>

            {/* Language Select Dropdown */}
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-black shadow-2xs cursor-pointer focus:outline-none"
            >
              <option value="javascript">JavaScript (ES6)</option>
              <option value="python">Python 3</option>
              <option value="java">Java 17</option>
              <option value="cpp">C++ 20</option>
            </select>

            {/* Run Button */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-[#8DAA87] hover:bg-[#7A9974] active:scale-95 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>

        {/* Editor & Output 2-Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[520px]">
          {/* Left Column: Problem Description & Monaco Editor (7 Cols) */}
          <div className="lg:col-span-7 bg-[#FFFDF8] border border-stone-300 rounded-2xl p-4 flex flex-col gap-4 shadow-2xs text-left">
            {/* Problem Details Box */}
            <div className="bg-[#FAF4E5] border border-amber-200/80 rounded-xl p-3.5 text-left relative">
              <div className="flex items-center justify-between mb-1">
                <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  PROBLEM STATEMENT
                  {isSpeaking && <span className="text-amber-600 font-bold animate-pulse">· 🔊 AI Speaking</span>}
                </span>
                <span className="font-mono text-[10px] font-bold text-stone-500">
                  Target: {Math.floor(selectedProblem.recommendedTimeSeconds / 60)} Mins
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed mb-2">
                {selectedProblem.description}
              </p>
              <p className="text-xs font-fragment text-stone-600 bg-white/80 p-2 rounded border border-stone-200 font-mono">
                {selectedProblem.example}
              </p>
            </div>

            {/* Spoken Approach & Complexity Notes Box */}
            {(vocalNotes || isListening) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-50/70 border-2 border-emerald-500 rounded-xl p-3 text-left relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-radio font-extrabold text-[10px] text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    VOCALIZED THOUGHT PROCESS & ALGORITHM APPROACH
                  </span>
                  {isListening && <span className="text-[10px] text-red-600 font-bold animate-pulse">● Recording Voice</span>}
                </div>
                <p className="text-xs font-mono text-emerald-950 leading-relaxed italic">
                  "{vocalNotes || 'Speak your algorithm approach out loud into the microphone...'}"
                </p>
              </motion.div>
            )}

            {/* VS Code Monaco Editor */}
            <div className="flex-1 border-2 border-black rounded-xl overflow-hidden shadow-2xs min-h-[350px]">
              <Editor
                height="100%"
                language={language}
                theme={editorTheme}
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'Fragment Mono', monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  autoIndent: 'full',
                  formatOnType: true,
                  padding: { top: 12, bottom: 12 }
                }}
              />
            </div>

            {/* Left Column Bottom Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setCode(selectedProblem.starterCodes[language] || selectedProblem.starterCodes.javascript)}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-black transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Starter Code ({language.toUpperCase()})</span>
              </button>

              <button
                onClick={() => handleSubmitSolution(false)}
                className="bg-black hover:bg-stone-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Lock / Submit Problem Solution</span>
              </button>
            </div>
          </div>

          {/* Right Column: Output Console & AI Feedback (5 Cols) */}
          <div className="lg:col-span-5 bg-[#FAF4E5] border border-stone-300 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs text-left">
            <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest block">
              OUTPUT CONSOLE
            </span>

            {/* Output Display Terminal / Structured AI Evaluation Card */}
            {analysisDetails ? (
              analysisDetails.aiEvaluationAvailable === false ? (
                <div className="flex-1 bg-amber-50/90 border-2 border-amber-300 rounded-xl p-4 space-y-3 font-radio text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm border-b border-amber-200 pb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>AI EVALUATION UNAVAILABLE</span>
                  </div>
                  <p className="text-stone-800 text-xs leading-relaxed">
                    The AI service could not evaluate your submission right now. Please try again.
                  </p>
                  <button
                    onClick={() => handleSubmitSolution(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>Retry AI Evaluation</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 bg-white border border-stone-300 rounded-xl p-3.5 space-y-3 font-radio text-xs overflow-auto min-h-[300px]">
                  {/* Verdict & Score Header */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md font-extrabold text-xs border ${
                      analysisDetails.verdict?.includes('CORRECT') && !analysisDetails.verdict?.includes('INCORRECT')
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : 'bg-red-100 text-red-900 border-red-400'
                    }`}>
                      {analysisDetails.verdict || (evalScore >= 7.5 ? 'CORRECT ANSWER ✅' : 'INCORRECT ANSWER ❌')}
                    </span>
                    <span className="px-2 py-0.5 bg-stone-200 border border-stone-300 rounded text-stone-700 font-mono text-[10px] font-bold">
                      {analysisDetails.language || language.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-extrabold text-stone-900 text-xs">
                    Score: {analysisDetails.score !== undefined ? analysisDetails.score : evalScore}/10
                  </span>
                </div>

                {/* Summary */}
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                  <span className="font-bold text-stone-500 block text-[10px] uppercase mb-0.5">EVALUATION SUMMARY</span>
                  <p className="text-stone-800 text-xs leading-relaxed">{analysisDetails.summary}</p>
                </div>

                {/* Code Analysis Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-stone-500 text-[10px] uppercase">SYNTAX CHECK</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${analysisDetails.syntax?.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {analysisDetails.syntax?.correct ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-700 leading-tight">{analysisDetails.syntax?.details}</p>
                  </div>

                  <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-stone-500 text-[10px] uppercase">ALGORITHMIC LOGIC</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${analysisDetails.correctness?.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {analysisDetails.correctness?.correct ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-700 leading-tight">{analysisDetails.correctness?.details}</p>
                  </div>
                </div>

                {/* Errors & Issues */}
                {analysisDetails.errors && analysisDetails.errors.length > 0 && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <span className="font-bold text-red-900 block text-[10px] uppercase mb-1">DETECTED BUGS & ERRORS</span>
                    <ul className="space-y-1 text-[11px] text-red-950">
                      {analysisDetails.errors.map((err, idx) => (
                        <li key={idx} className="flex flex-col gap-0.5 border-b border-red-100 pb-1 last:border-0 last:pb-0">
                          <span className="font-bold text-red-900">• [{err.type?.toUpperCase() || 'ERROR'}] {err.description}</span>
                          {err.suggestion && <span className="text-[10px] text-red-700 italic">Fix Idea: {err.suggestion}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Edge Cases Tested */}
                {analysisDetails.edgeCases && analysisDetails.edgeCases.length > 0 && (
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-stone-500 block text-[10px] uppercase mb-1">EDGE CASES TESTED</span>
                    <div className="space-y-1 text-[11px]">
                      {analysisDetails.edgeCases.map((ec, idx) => (
                        <div key={idx} className="flex items-center justify-between py-0.5 border-b border-stone-100 last:border-0">
                          <span className="text-stone-700">{ec.case}</span>
                          <span className={`font-bold text-[9px] px-1.5 py-0.2 rounded ${ec.result === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {ec.result?.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complexity Analysis */}
                {analysisDetails.complexity && (
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <span className="font-bold text-stone-500 block text-[10px] uppercase mb-1">ASYMPTOTIC COMPLEXITY</span>
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold mb-1">
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
                        Time: {analysisDetails.complexity.time || 'O(N)'}
                      </span>
                      <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded">
                        Space: {analysisDetails.complexity.space || 'O(1)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-tight">{analysisDetails.complexity.assessment}</p>
                  </div>
                )}

                {/* Suggested Optimizations */}
                {analysisDetails.improvements && analysisDetails.improvements.length > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="font-bold text-emerald-900 block text-[10px] uppercase mb-1">SUGGESTED OPTIMIZATIONS</span>
                    <ul className="list-disc list-inside text-[11px] text-emerald-950 space-y-0.5">
                      {analysisDetails.improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
              )
            ) : (
              <div className="flex-1 bg-white border border-stone-300 rounded-xl p-3.5 font-mono text-xs text-stone-800 overflow-auto whitespace-pre-wrap min-h-[300px] leading-relaxed">
                {output}
              </div>
            )}

            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p>Solution Submitted & AI Evaluated!</p>
                  <p className="text-[11px] font-normal text-emerald-800">Language: {language.toUpperCase()} · Score: {evalScore !== null ? evalScore : 0}/10</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Useful Candidate Action Tools (Matching Aptitude Round) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-stone-600 text-xs pt-2 border-t border-stone-200/80">
          <div className="flex items-center gap-2">
            {/* Bookmark Question Button */}
            <button
              onClick={() => {
                const currentPId = selectedProblem.questionId || selectedProblem.id
                setBookmarkedProblems(prev => ({
                  ...prev,
                  [currentPId]: !prev[currentPId]
                }))
              }}
              className={`px-3 py-2 rounded-xl border font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                bookmarkedProblems[selectedProblem.questionId || selectedProblem.id]
                  ? 'bg-amber-100 border-amber-400 text-amber-900'
                  : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-700'
              }`}
              title="Bookmark problem for review"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarkedProblems[selectedProblem.questionId || selectedProblem.id] ? 'fill-amber-500 text-amber-600' : ''}`} />
              <span>{bookmarkedProblems[selectedProblem.questionId || selectedProblem.id] ? 'Bookmarked ⭐' : 'Bookmark Problem'}</span>
            </button>

            {/* Copy Solution / Code Button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(code)
                setCopiedToast(true)
                setTimeout(() => setCopiedToast(false), 2000)
              }}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Copy code to clipboard"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Console Button */}
            <button
              onClick={() => setOutput('Console cleared. Run your code to see logs.')}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Clear output console"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Clear Console</span>
            </button>

            {/* Re-evaluate Solution Button */}
            {isSubmitted && (
              <button
                onClick={() => handleSubmitSolution(false)}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Re-evaluate solution with AI"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>Re-evaluate Solution</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Time's Up Alert Modal */}
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
                The {Math.floor(selectedProblem.recommendedTimeSeconds / 60)}-minute technical interview time limit for <strong className="text-black">{selectedProblem.title}</strong> has expired.
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
                  onClick={() => {
                    setShowTimeUpModal(false)
                    handleSubmitSolution(false)
                  }}
                  className="w-full sm:w-1/2 bg-black text-white font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Submit Code</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assessment Completed Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] text-center flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-500 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-black">
                  Technical Assessment Completed! 🎉
                </h2>
                <p className="text-xs text-stone-600 mt-1">
                  Your coding algorithms and technical solutions have been submitted and evaluated.
                </p>
              </div>

              <div className="w-full bg-[#FAF7ED] border border-stone-300 rounded-2xl p-4 flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>Last Code Score:</span>
                  <span className="text-emerald-700 font-extrabold text-base">{evalScore !== null ? evalScore : 0} / 10</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Submitted Solutions:</span>
                  <span>{Object.keys(submittedSolutions).length} / {finalProblemsList.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Selected Language:</span>
                  <span className="uppercase font-mono">{language}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 w-full mt-2">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="w-1/2 bg-white border-2 border-black text-black font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Review Code</span>
                </button>

                <button
                  onClick={() => navigate('/full-report')}
                  className="w-1/2 bg-black text-white font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>View Full Report</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
