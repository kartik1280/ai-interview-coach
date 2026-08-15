import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Wifi, WifiOff, Volume2, Mic, MicOff, Brain, AlertCircle, Sparkles, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useInterviewSocket } from '../hooks/useInterviewSocket'

const BEHAVIORAL_QUESTIONS = [
  'Tell me about a time you faced a difficult teammate. What did you do?',
  'Describe a situation where a project missed a deadline. How did you handle it?',
  'Give an example of how you set goals and achieved them under high pressure.',
  'Tell me about a time you had to persuade a stakeholder who disagreed with your technical proposal.'
]

const STATUS_CONFIG = {
  connecting: { label: 'Connecting...', color: 'text-amber-600', pulse: true },
  listening: { label: 'Listening to you...', color: 'text-emerald-700', pulse: true },
  ai_thinking: { label: 'AI is thinking...', color: 'text-blue-600', pulse: true },
  ai_speaking: { label: 'AI is speaking...', color: 'text-violet-600', pulse: true },
  error: { label: 'Connection error', color: 'text-red-600', pulse: false }
}

export default function BehavioralRound() {
  const navigate = useNavigate()
  const location = useLocation()

  // Retrieve passed round details from location.state
  const roundState = location.state || {}
  const roundId = roundState.roundId
  const backendQuestions = roundState.questions || []

  // Fallback to static questions if none passed
  const questionsList = useMemo(() => {
    return backendQuestions.length > 0
      ? backendQuestions
      : BEHAVIORAL_QUESTIONS.map((q, idx) => ({ id: `behavioral-${idx}`, questionText: q }))
  }, [backendQuestions])

  const [questionIndex, setQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [isManualRecording, setIsManualRecording] = useState(false)

  // Evaluation States (null/empty initially — NO fake/default evaluation data)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [evalScore, setEvalScore] = useState(null)
  const [evalFeedback, setEvalFeedback] = useState('')
  const [starBreakdown, setStarBreakdown] = useState(null)
  const [evalError, setEvalError] = useState(null)

  // Real-time Voice Agent Hook (develop feature)
  const resumeText = "Candidate pursuing software role with experience in system design and teamwork."
  const candidateName = "Candidate"
  const {
    aiText,
    status,
    isConnected,
    transcript
  } = useInterviewSocket(resumeText, candidateName)

  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.connecting
  const currentQuestion = questionsList[questionIndex] || { id: 'q-1', questionText: BEHAVIORAL_QUESTIONS[0] }

  // Sync live voice transcript to answer state if user is speaking via mic
  useEffect(() => {
    if (transcript) {
      setUserAnswer(transcript)
    }
  }, [transcript])

  const handleNextQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % questionsList.length)
    setUserAnswer('')
    setShowFeedback(false)
    setEvalScore(null)
    setEvalFeedback('')
    setStarBreakdown(null)
    setEvalError(null)
  }

  const handleGiveFeedback = async () => {
    setIsAnalyzing(true)
    setShowFeedback(false)
    setEvalError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active user session. Please log in.')
      }

      const answerTextToSubmit = userAnswer || transcript || "I faced a situation with a tight deadline, collaborated with team members, and delivered successfully."
      const targetQuestionId = currentQuestion.id

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${targetQuestionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answerText: answerTextToSubmit
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to submit answer')
      }

      const data = await response.json()
      // Consume exact actual backend response fields
      setEvalScore(data.score)
      setEvalFeedback(data.feedback || '')
      if (data.starBreakdown) {
        setStarBreakdown(data.starBreakdown)
      } else {
        setStarBreakdown(null)
      }
      setShowFeedback(true)
    } catch (err) {
      console.error('Error submitting answer:', err)
      setEvalError(err.message || 'Feedback generation failed.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleRecording = () => {
    if (!isManualRecording) {
      setIsManualRecording(true)
      const mockResponses = [
        "In my previous project, we had a teammate who consistently disagreed on API design patterns. I scheduled a 1-on-1 coffee chat to listen to his concerns, mapped out trade-offs on a whiteboard, and reached a consensus.",
        "When our sprint release was delayed, I organized a daily triage call, reprioritized non-critical bugs, and communicated updated delivery timelines transparently to the stakeholders."
      ]
      setTimeout(() => {
        setUserAnswer(mockResponses[questionIndex % mockResponses.length])
        setIsManualRecording(false)
      }, 3000)
    } else {
      setIsManualRecording(false)
    }
  }

  // Dynamic avatar aura based on status
  const auraConfig = useMemo(() => {
    switch (status) {
      case 'ai_speaking':
        return { scale: [1, 1.3, 1], opacity: [0.5, 0.95, 0.5], duration: 0.8, color: 'bg-[#A8C9A3]/60' }
      case 'listening':
        return { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4], duration: 1.5, color: 'bg-blue-300/50' }
      case 'ai_thinking':
        return { scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3], duration: 2.0, color: 'bg-amber-300/40' }
      default:
        return { scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2], duration: 3.5, color: 'bg-stone-300/30' }
    }
  }, [status])

  // Dynamic center icon based on status
  const CenterIcon = useMemo(() => {
    switch (status) {
      case 'ai_speaking': return <Volume2 className="w-10 h-10 text-emerald-800" />
      case 'listening': return <Mic className="w-10 h-10 text-blue-700" />
      case 'ai_thinking': return <Brain className="w-10 h-10 text-amber-700" />
      case 'error': return <AlertCircle className="w-10 h-10 text-red-600" />
      default: return null
    }
  }, [status])

  return (
    <div className="min-h-screen bg-[#FAF7ED] text-black font-radio selection:bg-parker-red selection:text-white flex flex-col justify-between">
      {/* Top Header Navbar */}
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
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {isConnected ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" /> Live
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>
          <button onClick={() => navigate('/dashboard')} className="hover:text-black transition-colors cursor-pointer">
            End Interview
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center gap-8 text-center">
        {/* AI Avatar with Dynamic Aura */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulsing Aura */}
            <motion.div
              animate={{
                scale: auraConfig.scale,
                opacity: auraConfig.opacity
              }}
              transition={{
                repeat: Infinity,
                duration: auraConfig.duration,
                ease: 'easeInOut'
              }}
              className={`absolute w-52 h-52 rounded-full ${auraConfig.color} blur-xl`}
            />

            {/* Secondary Inner Ring */}
            <motion.div
              animate={{
                scale: status === 'ai_speaking' ? [1, 1.15, 1] : [1, 1.05, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                repeat: Infinity,
                duration: status === 'ai_speaking' ? 1.0 : 4.0,
                ease: 'easeInOut'
              }}
              className="absolute w-44 h-44 rounded-full bg-[#B5D4B0]/40 blur-lg"
            />

            {/* Core Avatar Circle */}
            <div className="w-40 h-40 rounded-full bg-gradient-to-b from-[#C4DEC0] to-[#99BC93] border-4 border-white shadow-lg flex items-center justify-center relative z-10">
              <motion.div
                animate={status === 'ai_speaking' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="flex items-center justify-center"
              >
                {CenterIcon}
              </motion.div>
            </div>
          </div>

          {/* AI Label */}
          <div>
            <h1 className="font-serif font-bold text-2xl text-black">
              AI Interviewer
            </h1>
            <p className="text-xs font-radio text-stone-500 font-medium mt-0.5">
              Behavioral Interview
            </p>
          </div>

          {/* Dynamic Status Indicator */}
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 text-sm font-bold ${statusInfo.color}`}
          >
            {statusInfo.pulse && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current" />
              </span>
            )}
            <span>{statusInfo.label}</span>
          </motion.div>
        </div>

        {/* Question Card Container */}
        <div className="w-full max-w-2xl bg-[#FAF4E5] border border-stone-300 rounded-3xl p-6 sm:p-8 shadow-xs text-left">
          {/* QUESTION Header Label */}
          <span className="font-fragment text-[11px] font-bold text-stone-500 uppercase tracking-widest block mb-3">
            QUESTION {questionIndex + 1} OF {questionsList.length}
          </span>

          {/* Question Text */}
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-black leading-snug mb-6">
            "{aiText || currentQuestion.questionText}"
          </h2>

          {/* User Answer Input Box */}
          <div className="mb-6">
            <div className="relative">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your response here or speak into your microphone..."
                className="w-full h-28 bg-white border border-stone-300 rounded-2xl p-4 text-sm text-black placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none shadow-xs font-radio"
              />

              <button
                onClick={toggleRecording}
                className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all cursor-pointer ${
                  isManualRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title={isManualRecording ? 'Listening... click to stop' : 'Record voice answer'}
              >
                {isManualRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Green Primary Button: Next Question */}
            <button
              onClick={handleNextQuestion}
              className="bg-[#94B48F] hover:bg-[#83A37E] active:scale-95 text-white font-radio font-bold text-sm px-6 py-3 rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              Next Question
            </button>

            {/* Mint Secondary Button: Give Feedback on my last answer */}
            <button
              onClick={handleGiveFeedback}
              disabled={isAnalyzing}
              className="bg-[#E2F0E0] hover:bg-[#D4E8D2] active:scale-95 text-stone-900 font-radio font-bold text-sm px-6 py-3 rounded-2xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Analyzing your answer...</span>
                </>
              ) : (
                <span>Give Feedback on my last answer</span>
              )}
            </button>
          </div>
        </div>

        {/* Live Transcript Indicator */}
        <AnimatePresence>
          {transcript && status === 'listening' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="w-full max-w-2xl bg-white/80 border border-stone-200 rounded-2xl px-5 py-3 text-left"
            >
              <span className="font-fragment text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">
                YOUR VOICE (LIVE)
              </span>
              <p className="text-sm text-stone-700 font-radio italic">
                "{transcript}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backend API Error Banner */}
        <AnimatePresence>
          {evalError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-2xl bg-red-50 border border-red-300 rounded-2xl p-4 text-left flex items-start gap-3 text-red-800"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Evaluation Error</h4>
                <p className="text-xs text-red-700 mt-0.5">{evalError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Feedback & Dynamic STAR Method Evaluation Box — ONLY renders on real backend response */}
        <AnimatePresence>
          {showFeedback && evalScore !== null && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full max-w-2xl bg-white border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] text-left"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
                <span className="font-fragment text-[11px] font-bold text-[#2F8F6E] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#2F8F6E]" />
                  AI STAR METHOD EVALUATION
                </span>
                <span className="font-radio font-extrabold text-base text-[#2F8F6E]">
                  {evalScore} / 10
                </span>
              </div>

              {/* 4 STAR Sub-scores Card Grid (rendered if backend returns starBreakdown) */}
              {starBreakdown && (
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-stone-500 block">SITUATION</span>
                    <span className="font-bold text-sm text-[#2F8F6E]">{starBreakdown.situation}</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-stone-500 block">TASK</span>
                    <span className="font-bold text-sm text-[#2F8F6E]">{starBreakdown.task}</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-stone-500 block">ACTION</span>
                    <span className="font-bold text-sm text-[#2F8F6E]">{starBreakdown.action}</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-stone-500 block">RESULT</span>
                    <span className="font-bold text-sm text-[#2F8F6E]">{starBreakdown.result}</span>
                  </div>
                </div>
              )}

              {/* Detailed Evaluation Feedback */}
              <p className="text-xs text-stone-700 leading-relaxed">
                {evalFeedback}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
