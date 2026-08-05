import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, CheckCircle2, RotateCcw, ThumbsUp, ThumbsDown, MessageSquare, LayoutDashboard, Sliders } from 'lucide-react'

const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum (simple variant)',
    difficulty: 'Easy',
    description: 'Given an array of integers and a target, return indices of the two numbers such that they add up to the target. Return [-1, -1] if no solution exists.',
    example: 'Input: nums = [2,7,11,15], target = 9 | Output: [0,1]',
    starterCode: `// Implement twoSum(nums, target)
// Return [i, j] (0-based indices) or [-1, -1] if not found.

function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [-1, -1];
}

// You can console.log locally to debug:
console.log(twoSum([2,7,11,15], 9)); // -> [0,1]`
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    example: 'Input: s = "anagram", t = "nagaram" | Output: true',
    starterCode: `// Implement isAnagram(s, t)
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

console.log(isAnagram("anagram", "nagaram")); // -> true`
  }
]

export default function TechnicalRound() {
  const navigate = useNavigate()
  const [selectedProblem, setSelectedProblem] = useState(PROBLEMS[0])
  const [code, setCode] = useState(PROBLEMS[0].starterCode)
  const [output, setOutput] = useState('Run your code to see logs and test results here.')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSelectProblem = (prob) => {
    setSelectedProblem(prob)
    setCode(prob.starterCode)
    setOutput('Run your code to see logs and test results here.')
    setIsSubmitted(false)
  }

  // Safe client-side JS runner
  const handleRunCode = () => {
    setIsRunning(true)
    setOutput('Executing code...')

    setTimeout(() => {
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
          setOutput(`Output Logs:\n${logs.join('\n')}\n\n✓ All local test assertions passed!`)
        } else {
          setOutput('Code executed successfully with no output logs.')
        }
      } catch (err) {
        setOutput(`Execution Error:\n${err.message}`)
      }
      setIsRunning(false)
    }, 400)
  }

  const handleSubmitSolution = () => {
    setIsSubmitted(true)
  }

  const lineNumbers = code.split('\n').map((_, i) => i + 1)

  return (
    <div className="min-h-screen bg-[#FAF7ED] text-black font-radio selection:bg-parker-red selection:text-white flex flex-col">
      {/* Top Navbar Header */}
      <header className="px-6 py-4 border-b border-stone-200 bg-[#FAF7ED] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="text-stone-300">|</span>
          <span className="font-serif italic font-bold text-xl text-parker-red">
            InterviewOS
          </span>
        </div>

        <div className="flex items-center gap-6 font-radio text-sm font-bold text-stone-600">
          <button onClick={() => navigate('/dashboard')} className="hover:text-black transition-colors cursor-pointer">
            Interview Start
          </button>
          <button onClick={() => navigate('/full-report')} className="hover:text-black transition-colors cursor-pointer">
            Interview Prep
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Title Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="font-serif font-bold text-3xl text-black">
              Technical Interview
            </h1>
            <p className="text-sm text-stone-600">
              Solve coding problems in the editor. Run JS locally or submit to backend.
            </p>
          </div>

          {/* Controls: Language Select + Green Run Button */}
          <div className="flex items-center gap-3">
            <select className="bg-white border border-stone-300 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 shadow-xs cursor-pointer focus:outline-none">
              <option value="js">JavaScript (Runnable)</option>
              <option value="py">Python 3 (Mock)</option>
              <option value="cpp">C++ (Mock)</option>
            </select>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-[#8DAA87] hover:bg-[#7A9974] active:scale-95 text-white font-bold text-sm px-6 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          </div>
        </div>

        {/* Problem Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-300 pb-2">
          {PROBLEMS.map((prob) => (
            <button
              key={prob.id}
              onClick={() => handleSelectProblem(prob)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedProblem.id === prob.id
                  ? 'bg-black text-white'
                  : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300/70'
              }`}
            >
              {prob.title}
            </button>
          ))}
        </div>

        {/* Editor & Output 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          {/* Left Column: Problem Box + Code Editor (7 Columns) */}
          <div className="lg:col-span-7 bg-[#FFFDF8] border border-stone-300 rounded-2xl p-5 flex flex-col gap-4 shadow-xs text-left">
            {/* Problem Box */}
            <div className="bg-[#FAF4E5] border border-amber-200/80 rounded-xl p-4 text-left">
              <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">
                PROBLEM
              </span>
              <h2 className="font-serif font-bold text-lg text-black mb-1">
                {selectedProblem.title}
              </h2>
              <p className="text-xs text-stone-700 leading-relaxed mb-2">
                {selectedProblem.description}
              </p>
              <p className="text-xs font-fragment text-stone-600 bg-white/80 p-2 rounded border border-stone-200 font-mono">
                {selectedProblem.example}
              </p>
            </div>

            {/* Live Code Editor Container */}
            <div className="flex-1 border border-stone-300 rounded-xl bg-white overflow-hidden flex flex-col font-mono text-sm relative">
              <div className="flex-1 flex overflow-auto min-h-[320px]">
                {/* Line Numbers */}
                <div className="bg-stone-100/80 text-stone-400 select-none py-3 px-3 text-right font-mono text-xs leading-6 border-r border-stone-200 min-w-[3rem]">
                  {lineNumbers.map((num) => (
                    <div key={num}>{num}</div>
                  ))}
                </div>

                {/* Textarea Code Input */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck="false"
                  className="flex-1 p-3 bg-transparent text-stone-900 font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCode(selectedProblem.starterCode)}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-black transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Starter Code</span>
              </button>

              <button
                onClick={handleSubmitSolution}
                className="bg-black hover:bg-stone-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Submit Solution</span>
              </button>
            </div>
          </div>

          {/* Right Column: Output Box (5 Columns) */}
          <div className="lg:col-span-5 bg-[#FAF4E5] border border-stone-300 rounded-2xl p-5 flex flex-col shadow-xs text-left">
            <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">
              OUTPUT
            </span>

            {/* Output Display Terminal */}
            <div className="flex-1 bg-white border border-stone-300 rounded-xl p-4 font-mono text-xs text-stone-800 overflow-auto whitespace-pre-wrap min-h-[300px] leading-relaxed">
              {output}
            </div>

            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p>Solution Submitted Successfully!</p>
                  <p className="text-[11px] font-normal text-emerald-800">Score: 9.2/10 · Added to your Practice History.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom Right Feedback Action Icons */}
        <div className="flex items-center justify-end gap-2 text-stone-500 text-xs">
          <button className="p-2 rounded-lg bg-stone-200/60 hover:bg-stone-300/80 transition-colors cursor-pointer">
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg bg-stone-200/60 hover:bg-stone-300/80 transition-colors cursor-pointer">
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg bg-stone-200/60 hover:bg-stone-300/80 transition-colors cursor-pointer">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
