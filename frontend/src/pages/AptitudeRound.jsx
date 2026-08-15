import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Timer, CheckCircle2, HelpCircle, Pause, Play, RotateCcw, AlertCircle, Plus, Lock, Sparkles, Bookmark, Copy, Trash2, RefreshCw, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

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
  const location = useLocation()

  // Retrieve passed round details
  const roundState = location.state || {}
  const roundId = roundState.roundId
  const backendQuestions = roundState.questions || []

  // Map backend questions to PROBLEM shapes
  const mappedQuestions = backendQuestions.map((bq) => {
    // Parse Options: A) ... | B) ... | C) ... | D) ...
    let questionTitle = bq.questionText || ''
    let options = ['A) Option A', 'B) Option B', 'C) Option C', 'D) Option D']
    
    if (questionTitle.includes(' Options: ')) {
      const parts = questionTitle.split(' Options: ')
      questionTitle = parts[0]
      const optStr = parts[1]
      if (optStr.includes(' | ')) {
        options = optStr.split(' | ')
      }
    }
    
    return {
      id: bq.id,
      questionId: bq.id,
      category: 'APTITUDE',
      title: questionTitle,
      description: 'Select the correct choice from the options below.',
      options: options,
      correctOption: 1, // fallback
      explanation: bq.explanation || 'See performance report for detailed category analysis.'
    }
  })

  const finalQuestionsList = mappedQuestions.length > 0 ? mappedQuestions : APTITUDE_QUESTIONS

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [lockedAnswers, setLockedAnswers] = useState({})
  const [aiExplanations, setAiExplanations] = useState({})
  const [isExplaining, setIsExplaining] = useState(false)
  const [explanationAlert, setExplanationAlert] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [scratchpad, setScratchpad] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [evalScore, setEvalScore] = useState(null)
  const [evalFeedback, setEvalFeedback] = useState('')

  const currentQ = finalQuestionsList[currentIdx]
  const currentQId = currentQ.questionId || currentQ.id
  const selectedOption = answers[currentQId] !== undefined ? answers[currentQId] : null

  const saveAnswerToBackend = async (qId, optIdx) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) return
      const letter = ['A', 'B', 'C', 'D'][optIdx]
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${qId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answerText: letter
        })
      })
    } catch (err) {
      console.warn('Background sync failed:', err)
    }
  }

  const handleOptionSelect = (optIdx) => {
    if (isSubmitted || lockedAnswers[currentQId]) return
    setAnswers((prev) => ({
      ...prev,
      [currentQId]: optIdx
    }))
    setExplanationAlert(null)
  }

  const handleLockInAnswer = () => {
    if (selectedOption === null || lockedAnswers[currentQId] || isSubmitted) return
    setLockedAnswers((prev) => ({
      ...prev,
      [currentQId]: true
    }))
    saveAnswerToBackend(currentQId, selectedOption)
    setExplanationAlert(null)
  }

  const [bookmarkedQuestions, setBookmarkedQuestions] = useState({})
  const [copiedToast, setCopiedToast] = useState(false)

  const fetchAiExplanation = async (forceRefresh = false) => {
    if (aiExplanations[currentQId] && !forceRefresh) return
    setIsExplaining(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const selectedOptText = selectedOption !== null ? currentQ.options[selectedOption] : null
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/explain-aptitude`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionText: `${currentQ.title} ${currentQ.description || ''}`,
          options: currentQ.options,
          selectedOption: selectedOptText
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.explanation) {
          setAiExplanations(prev => ({
            ...prev,
            [currentQId]: data.explanation
          }))
        }
      }
    } catch (err) {
      console.warn('Failed to fetch AI explanation:', err)
    } finally {
      setIsExplaining(false)
    }
  }

  const handleCheckExplanation = () => {
    if (!lockedAnswers[currentQId] && !isSubmitted) {
      setExplanationAlert("Please lock in your answer for this question first to unlock the AI step-by-step explanation!")
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

  // 15 Minutes Total Timer State (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [showTimeUpModal, setShowTimeUpModal] = useState(false)

  // Handle timeout auto-submit
  const handleTimeoutAutoSubmit = () => {
    if (isSubmitting) return
    handleSubmitAssessment(true)
  }

  // Timer Effect with Auto-Submit on Expiry
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

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`
  }

  const getTimerBadgeStyle = () => {
    if (timeLeft === 0) return 'bg-red-600 text-white font-extrabold border-red-700 animate-bounce'
    if (timeLeft <= 60) return 'bg-red-100 text-red-700 border-red-400 font-extrabold animate-pulse'
    if (timeLeft <= 300) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
    return 'bg-white text-stone-800 border-stone-300 font-bold'
  }

  const handleNextQuestion = () => {
    setCurrentIdx((prev) => (prev + 1) % finalQuestionsList.length)
    setShowExplanation(false)
  }

  const handleSubmitAssessment = async (isTimeout = false) => {
    if (isSubmitting) return
    if (!isTimeout && Object.keys(answers).length === 0) {
      alert("Please answer at least one question before submitting.")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active user session. Please log in.')
      }

      const firstCount = finalQuestionsList.length - 1
      const firstPart = finalQuestionsList.slice(0, firstCount)
      const lastQ = finalQuestionsList[firstCount]

      // Submit first 49 (or all but last) in parallel
      const firstPromises = firstPart.map(async (q) => {
        const qId = q.questionId || q.id
        const savedOptionIdx = answers[qId]
        const letter = (savedOptionIdx !== undefined && savedOptionIdx !== null) ? ['A', 'B', 'C', 'D'][savedOptionIdx] : 'unanswered'

        return fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${qId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            answerText: letter
          })
        })
      })

      await Promise.all(firstPromises)

      // Submit the last question sequentially to trigger final evaluation
      const lastQId = lastQ.questionId || lastQ.id
      const lastOptionIdx = answers[lastQId]
      const lastLetter = (lastOptionIdx !== undefined && lastOptionIdx !== null) ? ['A', 'B', 'C', 'D'][lastOptionIdx] : 'unanswered'

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${lastQId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answerText: lastLetter
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to submit final assessment')
      }

      const data = await res.json()
      setEvalScore(data.overallScore || data.score)
      setEvalFeedback(data.feedback)
      setIsSubmitted(true)
      setIsTimerActive(false)
      setShowCompletionModal(true)
    } catch (err) {
      console.error('Error submitting assessment:', err)
      if (!isTimeout) alert(`Submission failed: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
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
        {/* Title Header Bar & Interactive Timer Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="font-serif font-bold text-3xl text-black">
              Aptitude & Reasoning Assessment
            </h1>
            <p className="text-sm text-stone-600">
              Evaluate Fermi estimation, pattern deduction, and quantitative reasoning under time constraints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Locked Count Progress Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-200/80 border border-stone-300 text-stone-800 font-bold text-xs">
              <Lock className="w-3.5 h-3.5 text-stone-600" />
              <span>{Object.keys(lockedAnswers).length} / {finalQuestionsList.length} Locked</span>
            </div>

            {/* Global Submit Assessment Button */}
            <button
              onClick={handleSubmitAssessment}
              disabled={isSubmitting}
              className="bg-black hover:bg-stone-800 active:scale-95 text-white font-radio font-bold text-xs px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Submit Assessment</span>
            </button>

            {/* Interactive Timer Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 shadow-xs transition-all ${getTimerBadgeStyle()}`}>
              <Timer className="w-4 h-4" />
              <span className="font-mono text-sm tracking-wider">{formatTime(timeLeft)}</span>

              <button
                onClick={() => setIsTimerActive(!isTimerActive)}
                className="p-1 hover:bg-black/10 rounded transition-colors cursor-pointer ml-1"
                title={isTimerActive ? "Pause Timer" : "Resume Timer"}
              >
                {isTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                onClick={() => {
                  setTimeLeft(900)
                  setIsTimerActive(true)
                  setShowTimeUpModal(false)
                  setIsSubmitted(false)
                }}
                className="p-1 hover:bg-black/10 rounded transition-colors cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Question Numbers Scrollable Track */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-[340px] md:max-w-[460px] py-1 px-2 bg-stone-100/90 border border-stone-300 rounded-2xl no-scrollbar">
              {finalQuestionsList.map((q, idx) => {
                const qId = q.questionId || q.id
                const isCurrent = currentIdx === idx
                const isLocked = lockedAnswers[qId]
                const isAnswered = answers[qId] !== undefined

                const isBookmarked = bookmarkedQuestions[qId]
                let style = 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-200'
                if (isCurrent) {
                  style = 'bg-black text-white shadow-xs font-bold scale-105'
                } else if (isLocked) {
                  style = 'bg-emerald-600 text-white font-bold'
                } else if (isAnswered) {
                  style = 'bg-stone-300 text-black font-semibold'
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx)
                      setShowExplanation(false)
                      setExplanationAlert(null)
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full font-bold text-xs transition-all cursor-pointer flex items-center justify-center relative ${style}`}
                    title={isBookmarked ? "Bookmarked question" : `Question ${idx + 1}`}
                  >
                    {isBookmarked && <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>}
                    {isLocked && !isCurrent ? '✓' : idx + 1}
                  </button>
                )
              })}
            </div>
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
                {currentQ.options.map((opt, optIdx) => {
                  const isLocked = lockedAnswers[currentQId]
                  return (
                    <button
                      key={optIdx}
                      onClick={() => !isSubmitted && !isLocked && handleOptionSelect(optIdx)}
                      disabled={isSubmitted || isLocked}
                      className={`w-full p-4 rounded-xl border-2 text-left font-radio font-bold text-sm transition-all cursor-pointer flex items-center justify-between ${
                        selectedOption === optIdx
                          ? isLocked ? 'border-emerald-600 bg-emerald-50 shadow-xs' : 'border-black bg-stone-50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      } ${(isSubmitted || isLocked) ? 'cursor-default opacity-90' : ''}`}
                    >
                      <span>{opt}</span>
                      <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${selectedOption === optIdx ? (isLocked ? 'bg-emerald-600 border-emerald-600' : 'bg-black') : 'bg-white'}`}>
                        {selectedOption === optIdx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Warning Alert if explanation requested before locking */}
            {explanationAlert && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{explanationAlert}</span>
              </motion.div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-stone-200">
              <button
                onClick={handleCheckExplanation}
                className={`font-radio font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  lockedAnswers[currentQId] || isSubmitted
                    ? 'bg-[#E2F0E0] hover:bg-[#D4E8D2] text-stone-900 active:scale-95'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>{showExplanation ? 'Hide AI Explanation' : 'Check AI Explanation'}</span>
              </button>

              <div className="flex items-center gap-2">
                {lockedAnswers[currentQId] || isSubmitted ? (
                  <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Answer Locked</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLockInAnswer}
                    disabled={selectedOption === null}
                    className={`font-radio font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedOption === null
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                        : 'bg-black hover:bg-stone-800 text-white active:scale-95'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Lock In Answer</span>
                  </button>
                )}

                <button
                  onClick={handleNextQuestion}
                  className="bg-[#94B48F] hover:bg-[#83A37E] active:scale-95 text-white font-radio font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Next →
                </button>
              </div>
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

            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[11px] font-normal text-emerald-800">Time Taken: {formatTime(900 - timeLeft)} · Score: {evalScore}/10</p>
                </div>
              </motion.div>
            )}

            {/* Explanation Box */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white border-2 border-black rounded-xl p-4 shadow-xs"
                >
                  <span className="font-fragment text-[10px] font-bold text-[#2F8F6E] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    AI STEP-BY-STEP LOGICAL BREAKDOWN
                  </span>

                  {isExplaining ? (
                    <div className="py-4 flex items-center gap-2 text-stone-600 text-xs font-radio font-bold">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Generating step-by-step AI explanation...</span>
                    </div>
                  ) : (
                    <p className="font-radio text-xs text-stone-800 leading-relaxed whitespace-pre-wrap mb-3">
                      {aiExplanations[currentQId] || currentQ.explanation}
                    </p>
                  )}

                  {evalFeedback && (
                    <p className="font-radio text-xs text-stone-600 border-t pt-2 border-stone-100 leading-relaxed">
                      <strong>AI Evaluation Feedback:</strong> {evalFeedback}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Useful Candidate Action Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-stone-600 text-xs pt-2 border-t border-stone-200/80">
          <div className="flex items-center gap-2">
            {/* Bookmark Question Button */}
            <button
              onClick={() => {
                setBookmarkedQuestions(prev => ({
                  ...prev,
                  [currentQId]: !prev[currentQId]
                }))
              }}
              className={`px-3 py-2 rounded-xl border font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                bookmarkedQuestions[currentQId]
                  ? 'bg-amber-100 border-amber-400 text-amber-900'
                  : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-700'
              }`}
              title="Bookmark question for review"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarkedQuestions[currentQId] ? 'fill-amber-500 text-amber-600' : ''}`} />
              <span>{bookmarkedQuestions[currentQId] ? 'Bookmarked ⭐' : 'Bookmark Question'}</span>
            </button>

            {/* Copy AI Explanation Button */}
            <button
              onClick={() => {
                const textToCopy = aiExplanations[currentQId] || `${currentQ.title}\n\nExplanation: ${currentQ.explanation}`
                navigator.clipboard.writeText(textToCopy)
                setCopiedToast(true)
                setTimeout(() => setCopiedToast(false), 2000)
              }}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Copy AI step-by-step explanation"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy AI Explanation'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Scratchpad Button */}
            <button
              onClick={() => setScratchpad('')}
              disabled={!scratchpad}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear scratchpad text"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Clear Scratchpad</span>
            </button>

            {/* Regenerate AI Analysis Button */}
            {lockedAnswers[currentQId] && (
              <button
                onClick={() => fetchAiExplanation(true)}
                disabled={isExplaining}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-radio font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Regenerate AI solution analysis"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isExplaining ? 'animate-spin' : ''}`} />
                <span>Regenerate AI Analysis</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Time's Up Alert Modal for Aptitude Round */}
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
                The 15-minute aptitude assessment time limit has expired. Your answers up to this point have been automatically submitted.
              </p>

              <div className="flex items-center justify-center gap-3 w-full mt-2">
                <button
                  onClick={() => {
                    setTimeLeft(300)
                    setIsTimerActive(true)
                    setShowTimeUpModal(false)
                  }}
                  className="w-1/2 bg-white border-2 border-black text-black font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+5 Mins</span>
                </button>

                <button
                  onClick={() => {
                    setShowTimeUpModal(false)
                    handleSubmitAssessment()
                  }}
                  className="w-1/2 bg-black text-white font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>View Results</span>
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
                  Assessment Completed! 🎉
                </h2>
                <p className="text-xs text-stone-600 mt-1">
                  Your Aptitude & Quantitative Reasoning test has been submitted and evaluated.
                </p>
              </div>

              <div className="w-full bg-[#FAF7ED] border border-stone-300 rounded-2xl p-4 flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>Score Evaluated:</span>
                  <span className="text-emerald-700 font-extrabold text-base">{evalScore !== null ? evalScore : 0} / 10</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Locked Answers:</span>
                  <span>{Object.keys(lockedAnswers).length} / {finalQuestionsList.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Time Elapsed:</span>
                  <span>{formatTime(900 - timeLeft)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 w-full mt-2">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="w-1/2 bg-white border-2 border-black text-black font-radio font-bold text-xs py-3 rounded-xl hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Review Solutions</span>
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
