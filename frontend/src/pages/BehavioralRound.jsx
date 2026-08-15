import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Mic, MicOff, Sparkles, Award, CheckCircle2, ChevronRight, MessageSquare, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BEHAVIORAL_QUESTIONS = [
  'Tell me about a time you faced a difficult teammate. What did you do?',
  'Describe a situation where a project missed a deadline. How did you handle it?',
  'Give an example of how you set goals and achieved them under high pressure.',
  'Tell me about a time you had to persuade a stakeholder who disagreed with your technical proposal.'
]

export default function BehavioralRound() {
  const navigate = useNavigate()
  const location = useLocation()

  // Retrieve passed round details
  const roundState = location.state || {}
  const roundId = roundState.roundId
  const backendQuestions = roundState.questions || []

  // Fallback to static questions if none passed
  const questionsList = backendQuestions.length > 0 
    ? backendQuestions 
    : BEHAVIORAL_QUESTIONS.map((q, idx) => ({ id: `behavioral-${idx}`, questionText: q }))

  const [questionIndex, setQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [evalScore, setEvalScore] = useState(9.1)
  const [evalFeedback, setEvalFeedback] = useState('Excellent use of STAR method. Clear metrics and STAR structure details.')
  const [starBreakdown, setStarBreakdown] = useState({
    situation: 9.2,
    task: 8.8,
    action: 9.4,
    result: 9.0
  })

  const currentQuestion = questionsList[questionIndex]

  const handleNextQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % questionsList.length)
    setUserAnswer('')
    setShowFeedback(false)
  }

  const handleGiveFeedback = async () => {
    setIsAnalyzing(true)
    setShowFeedback(false)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active user session. Please log in.')
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/${roundId}/answer?question_id=${currentQuestion.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answerText: userAnswer
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to submit answer')
      }

      const data = await response.json()
      setEvalScore(data.score)
      setEvalFeedback(data.feedback)
      if (data.starBreakdown) {
        setStarBreakdown(data.starBreakdown)
      }
      setShowFeedback(true)
    } catch (err) {
      console.error('Error submitting answer:', err)
      alert(`Feedback generation failed: ${err.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
      // Simulate live audio transcription
      const mockResponses = [
        "In my previous project, we had a teammate who consistently disagreed on API design patterns. I scheduled a 1-on-1 coffee chat to listen to his concerns, mapped out trade-offs on a whiteboard, and reached a consensus.",
        "When our sprint release was delayed, I organized a daily triage call, reprioritized non-critical bugs, and communicated updated delivery timelines transparently to the stakeholders."
      ]
      setTimeout(() => {
        setUserAnswer(mockResponses[questionIndex % mockResponses.length])
        setIsRecording(false)
      }, 3000)
    } else {
      setIsRecording(false)
    }
  }

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
          <button onClick={() => navigate('/dashboard')} className="hover:text-black transition-colors cursor-pointer">
            Interview Start
          </button>
          <button onClick={() => navigate('/full-report')} className="hover:text-black transition-colors cursor-pointer">
            Interview Prep
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center gap-8 text-center">
        {/* AI Interviewer Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          {/* Glowing Green Circular Avatar */}
          <div className="relative flex items-center justify-center">
            {/* Animated Pulsing Aura */}
            <motion.div
              animate={{
                scale: isRecording ? [1, 1.25, 1] : [1, 1.08, 1],
                opacity: isRecording ? [0.6, 0.9, 0.6] : [0.3, 0.5, 0.3]
              }}
              transition={{ repeat: Infinity, duration: isRecording ? 1.2 : 3.5, ease: "easeInOut" }}
              className="absolute w-44 h-44 rounded-full bg-[#A8C9A3]/50 blur-xl"
            />

            {/* Core Avatar Circle */}
            <div className="w-36 h-36 rounded-full bg-gradient-to-b from-[#C4DEC0] to-[#99BC93] border-4 border-white shadow-lg flex items-center justify-center relative z-10">
              <div className="w-28 h-28 rounded-full bg-[#B2D4AD]/80 blur-xs" />
            </div>
          </div>

          {/* AI Avatar Label */}
          <div>
            <h1 className="font-serif font-bold text-2xl text-black">
              AI Interviewer
            </h1>
            <p className="text-xs font-radio text-stone-500 font-medium">
              Behavioral Interview
            </p>
          </div>
        </div>

        {/* Question Card Container */}
        <div className="w-full max-w-2xl bg-[#FAF4E5] border border-stone-300 rounded-3xl p-6 sm:p-8 shadow-xs text-left">
          {/* QUESTION Header Label */}
          <span className="font-fragment text-[11px] font-bold text-stone-500 uppercase tracking-widest block mb-3">
            QUESTION
          </span>

          {/* Question Text */}
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-black leading-snug mb-6">
            "{currentQuestion.questionText}"
          </h2>

          {/* User Answer Input Box */}
          <div className="mb-6">
            <div className="relative">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your response here or click the microphone to speak..."
                className="w-full h-28 bg-white border border-stone-300 rounded-2xl p-4 text-sm text-black placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none shadow-xs font-radio"
              />

              <button
                onClick={toggleRecording}
                className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title={isRecording ? 'Listening... click to stop' : 'Record voice answer'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                  <span>Evaluating STAR method...</span>
                </>
              ) : (
                <span>Give Feedback on my last answer</span>
              )}
            </button>
          </div>
        </div>

        {/* AI Feedback Analysis Box */}
        <AnimatePresence>
          {showFeedback && (
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
