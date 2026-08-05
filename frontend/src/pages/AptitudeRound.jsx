import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Timer, CheckCircle2, HelpCircle, Sparkles, RefreshCcw, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'

const APTITUDE_QUESTIONS = [
  {
    id: 'fermi-1',
    category: 'FERMI ESTIMATION',
    title: 'How many piano tuners are there in Chicago?',
    description: 'Break down your estimation logic using population, household piano ownership rate, tuning frequency, and working hours per tuner.',
    options: [
      'A) Approximately 25 - 35 tuners',
      'B) Approximately 125 - 150 tuners',
      'C) Approximately 500 - 600 tuners',
      'D) Approximately 1,200 - 1,500 tuners'
    ],
    correctOption: 1,
    explanation: 'Estimation breakdown: Chicago pop (~2.7M) -> 1M households -> 2% own pianos (20k pianos) -> tuned once/yr -> 20k tunings/yr. A tuner does 4 tunings/day x 250 days = 1,000/yr -> 20,000 / 1,000 = 20 tuners (with commercial venues ~125-150).'
  },
  {
    id: 'sequence-1',
    category: 'LOGICAL DEDUCTION',
    title: 'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
    description: 'Identify the underlying mathematical pattern governing the step progression between adjacent terms.',
    options: [
      'A) 36',
      'B) 40',
      'C) 42',
      'D) 48'
    ],
    correctOption: 2,
    explanation: 'The differences between consecutive numbers increase by 2 each time: (+4, +6, +8, +10, +12). 30 + 12 = 42.'
  },
  {
    id: 'ratio-1',
    category: 'QUANTITATIVE REASONING',
    title: 'A pipeline processes 1,200 requests per minute with 3 active nodes. If traffic surges by 50%, how many total nodes are required to maintain processing latency?',
    description: 'Calculate node throughput and total required capacity during peak traffic load.',
    options: [
      'A) 4 nodes',
      'B) 5 nodes',
      'C) 6 nodes',
      'D) 8 nodes'
    ],
    correctOption: 1,
    explanation: 'Current capacity = 1,200 req/min across 3 nodes = 400 req/min per node. A 50% surge increases total volume to 1,800 req/min. Total nodes required = 1,800 / 400 = 4.5 -> rounded up to 5 nodes.'
  }
]

export default function AptitudeRound() {
  const navigate = useNavigate()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [scratchpad, setScratchpad] = useState('')
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes timer

  const currentQ = APTITUDE_QUESTIONS[currentIdx]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins}:${s < 10 ? '0' : ''}${s}`
  }

  const handleNextQuestion = () => {
    setCurrentIdx((prev) => (prev + 1) % APTITUDE_QUESTIONS.length)
    setSelectedOption(null)
    setShowExplanation(false)
  }

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
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300 text-amber-900 font-mono text-xs">
            <Timer className="w-3.5 h-3.5 text-amber-700" />
            <span>{formatTime(timeLeft)}</span>
          </div>

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
              Aptitude & Reasoning Assessment
            </h1>
            <p className="text-sm text-stone-600">
              Evaluate Fermi estimation, pattern deduction, and quantitative reasoning under time constraints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {APTITUDE_QUESTIONS.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIdx(idx)
                  setSelectedOption(null)
                  setShowExplanation(false)
                }}
                className={`w-8 h-8 rounded-full font-bold text-xs transition-all cursor-pointer ${
                  currentIdx === idx
                    ? 'bg-black text-white'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid: Question + Scratchpad */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Panel: Question Card & Options (7 Columns) */}
          <div className="lg:col-span-7 bg-[#FFFDF8] border border-stone-300 rounded-2xl p-6 flex flex-col justify-between shadow-xs text-left">
            <div>
              {/* Category Badge */}
              <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">
                {currentQ.category}
              </span>

              {/* Title & Description */}
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-black mb-2 leading-snug">
                {currentQ.title}
              </h2>
              <p className="text-xs text-stone-600 mb-6 leading-relaxed">
                {currentQ.description}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {currentQ.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => setSelectedOption(optIdx)}
                    className={`w-full p-4 rounded-xl border-2 text-left font-radio font-bold text-sm transition-all cursor-pointer flex items-center justify-between ${
                      selectedOption === optIdx
                        ? 'border-black bg-stone-50 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <span>{opt}</span>
                    <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${selectedOption === optIdx ? 'bg-black' : 'bg-white'}`}>
                      {selectedOption === optIdx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-stone-200">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="bg-[#E2F0E0] hover:bg-[#D4E8D2] active:scale-95 text-stone-900 font-radio font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>{showExplanation ? 'Hide Explanation' : 'Check Explanation'}</span>
              </button>

              <button
                onClick={handleNextQuestion}
                className="bg-[#94B48F] hover:bg-[#83A37E] active:scale-95 text-white font-radio font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Next Question →
              </button>
            </div>
          </div>

          {/* Right Panel: Scratchpad & AI Breakdown (5 Columns) */}
          <div className="lg:col-span-5 bg-[#FAF4E5] border border-stone-300 rounded-2xl p-5 flex flex-col gap-4 shadow-xs text-left">
            <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-widest block">
              CALCULATION SCRATCHPAD
            </span>

            {/* Interactive Scratchpad Textarea */}
            <textarea
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Use this area to write down your estimation formulas, ratio breakdowns, or scratch calculations..."
              className="w-full h-44 bg-white border border-stone-300 rounded-xl p-3 font-mono text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />

            {/* Explanation Box */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white border-2 border-black rounded-xl p-4 shadow-xs"
                >
                  <span className="font-fragment text-[10px] font-bold text-[#2F8F6E] uppercase tracking-wider block mb-1">
                    AI LOGICAL BREAKDOWN
                  </span>
                  <p className="font-radio text-xs text-stone-700 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Feedback Actions */}
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
