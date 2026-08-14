import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Wifi, WifiOff, Volume2, Mic, Brain, AlertCircle, Play, Clock, Sparkles, StopCircle, FileText, UploadCloud, CheckCircle2 } from 'lucide-react'
import { useInterviewSocket } from '../hooks/useInterviewSocket'
import { useInterviewTimer } from '../hooks/useInterviewTimer'

// Status label configuration
const STATUS_CONFIG = {
  idle: { label: 'Click Start to begin session', color: 'text-stone-500', pulse: false },
  connecting: { label: 'Connecting to AI coach...', color: 'text-amber-600', pulse: true },
  listening: { label: 'Listening to you...', color: 'text-emerald-700', pulse: true },
  ai_thinking: { label: 'AI is thinking...', color: 'text-blue-600', pulse: true },
  ai_speaking: { label: 'AI is speaking...', color: 'text-violet-600', pulse: true },
  error: { label: 'Connection error', color: 'text-red-600', pulse: false }
}

export default function BehavioralRound() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state || {}

  // Context & Resume States
  const candidateName = locationState.fullName || localStorage.getItem('candidate_name') || 'Manik'
  const targetPosition = locationState.targetPosition || localStorage.getItem('target_position') || 'Software Developer'
  const industry = locationState.industry || localStorage.getItem('industry') || 'Tech'

  const [resumeText, setResumeText] = useState('')
  const [resumeCandidateName, setResumeCandidateName] = useState(locationState.resumeCandidateName || localStorage.getItem('resume_candidate_name') || '')
  const [resumeFile, setResumeFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [resumeParsed, setResumeParsed] = useState(false)

  const [hasStarted, setHasStarted] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalProgress, setEvalProgress] = useState('Submitting transcript to AI evaluator...')

  // Load pre-parsed resume context if available from Create Interview or localStorage
  useEffect(() => {
    const savedText = locationState.resumeText || localStorage.getItem('interview_resume_text') || ''
    const savedName = locationState.resumeCandidateName || localStorage.getItem('resume_candidate_name') || ''
    if (savedText) {
      setResumeText(savedText)
      setResumeCandidateName(savedName)
      setResumeParsed(true)
    }
  }, [])

  const [isDragOver, setIsDragOver] = useState(false)
  const [showReupload, setShowReupload] = useState(false)

  // Handler for uploading resume directly on the Behavioral Round page
  const processResumeFile = async (fileToUpload) => {
    const file = fileToUpload || resumeFile
    if (!file) return

    setIsUploading(true)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const response = await fetch('http://localhost:5050/api/parse-resume', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to parse resume (Status ${response.status})`)
      }

      const data = await response.json()
      const extractedText = data.resumeText || ''
      const extractedName = data.resumeCandidateName || ''

      setResumeText(extractedText)
      setResumeCandidateName(extractedName)
      localStorage.setItem('interview_resume_text', extractedText)
      if (extractedName) {
        localStorage.setItem('resume_candidate_name', extractedName)
      }
      setResumeParsed(true)
      setShowReupload(false)
    } catch (error) {
      console.error('Error parsing resume:', error)
      alert(`Failed to parse resume: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = (e) => {
    e.preventDefault()
    processResumeFile()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setResumeFile(file)
      processResumeFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const {
    aiText,
    status,
    isConnected,
    transcript,
    fullTranscript,
    fullTranscriptRef,
    endSession
  } = useInterviewSocket(resumeText, candidateName, resumeCandidateName, hasStarted && !isEvaluating)

  // End & Evaluate Interview Callback
  const handleTerminateAndScore = useCallback(async () => {
    console.log('🛑 Terminating 5-Minute Interview & Evaluating Scorecard...');
    endSession()
    setIsEvaluating(true)

    try {
      setEvalProgress('Transcribing audio stream & gathering transcript...')
      const currentHistory = fullTranscriptRef?.current?.length > 0 ? fullTranscriptRef.current : fullTranscript

      setEvalProgress('Evaluating technical accuracy & communication via Groq Llama-3.3-70b...')
      const res = await fetch('http://localhost:5050/api/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: currentHistory })
      })

      if (!res.ok) {
        throw new Error(`Evaluation failed with status ${res.status}`)
      }

      const data = await res.json()
      setEvalProgress('Generating scorecard visualization...')

      setTimeout(() => {
        navigate('/full-report', {
          state: {
            userProfile: {
              fullName: candidateName,
              targetPosition,
              industry
            },
            scorecard: data.scorecard,
            transcript: currentHistory
          }
        })
      }, 800)
    } catch (err) {
      console.error('Failed to score interview:', err)
      navigate('/full-report', {
        state: {
          userProfile: {
            fullName: candidateName,
            targetPosition,
            industry
          }
        }
      })
    }
  }, [endSession, fullTranscript, fullTranscriptRef, candidateName, targetPosition, industry, navigate])

  // 5-Minute Countdown Timer Hook (300 seconds)
  const { formatTime } = useInterviewTimer(handleTerminateAndScore, 300, hasStarted && !isEvaluating)

  const handleStartSession = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        const ctx = new AudioContextClass()
        ctx.resume()
      }
      const unlockAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
      unlockAudio.play().catch(() => {})
    } catch (e) {
      // ignore
    }
    setHasStarted(true)
  }

  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  // Dynamic avatar aura based on state
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

  // Dynamic center icon
  const CenterIcon = useMemo(() => {
    switch (status) {
      case 'ai_speaking': return <Volume2 className="w-10 h-10 text-emerald-800" />
      case 'listening': return <Mic className="w-10 h-10 text-blue-700" />
      case 'ai_thinking': return <Brain className="w-10 h-10 text-amber-700" />
      case 'error': return <AlertCircle className="w-10 h-10 text-red-600" />
      default: return <Mic className="w-10 h-10 text-stone-500" />
    }
  }, [status])

  return (
    <div className="min-h-screen bg-[#FAF7ED] text-black font-radio selection:bg-parker-red selection:text-white flex flex-col justify-between relative">
      {/* Hidden Audio Tag for DOM Mounting */}
      <audio id="ai-audio-player" hidden />

      {/* Retro Loading & Evaluation Modal Overlay */}
      <AnimatePresence>
        {isEvaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#FFFDF8] border-4 border-black rounded-3xl p-8 max-w-md w-full text-center shadow-[10px_10px_0px_0px_#000000] flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-black flex items-center justify-center animate-bounce">
                <Sparkles className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-2xl text-black">
                  Loading Your Results...
                </h3>
                <p className="text-xs font-radio text-stone-600 mt-1 font-semibold">
                  5-Minute Session Terminated
                </p>
              </div>

              <div className="w-full bg-stone-100 border border-stone-300 rounded-xl p-3 text-xs font-mono font-bold text-stone-700">
                {evalProgress}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

        <div className="flex items-center gap-5 font-radio text-sm font-bold text-stone-600">
          {/* Live 5-Minute Timer Badge */}
          {hasStarted && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 border border-stone-300 rounded-full font-mono text-xs font-bold text-stone-800 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-parker-red animate-pulse" />
              <span>{formatTime()}</span>
            </div>
          )}

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

          <button
            onClick={handleTerminateAndScore}
            className="hover:text-parker-red transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold bg-stone-200 hover:bg-stone-300 px-3 py-1.5 rounded-lg border border-stone-400"
          >
            <StopCircle className="w-3.5 h-3.5 text-parker-red" />
            <span>End Interview</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center gap-8 text-center relative">
        {!hasStarted ? (
          /* STEP 1 & 2: DYNAMIC RESUME SETUP & PRE-INTERVIEW SCREEN */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#FFFDF8] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center gap-6 my-auto text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#E2F0E0] border-2 border-black flex items-center justify-center">
              <Mic className="w-8 h-8 text-emerald-800" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-serif font-bold text-3xl text-black tracking-tight">
                Behavioral Voice Interview
              </h2>
              <p className="text-sm font-radio text-stone-700 font-medium">
                Candidate: <strong className="text-black font-bold">{candidateName}</strong> · Position: <strong className="text-black font-bold">{targetPosition}</strong>
              </p>
            </div>

            {/* Dynamic Resume Upload / Context Status Card */}
            <div className="w-full bg-stone-50 border-2 border-stone-300 rounded-2xl p-5 flex flex-col items-center gap-3">
              {resumeParsed && !showReupload ? (
                /* Dynamic Success Badge with Snippet & Change Option */
                <div className="w-full flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Resume Context Loaded</span>
                    </div>
                    <button
                      onClick={() => setShowReupload(true)}
                      className="text-[11px] font-radio text-stone-600 hover:text-black underline cursor-pointer"
                    >
                      Change Resume
                    </button>
                  </div>

                  {resumeText && (
                    <div className="w-full bg-white border border-stone-200 rounded-xl p-3 text-left">
                      <span className="font-fragment text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
                        PARSED CONTEXT PREVIEW
                      </span>
                      <p className="text-xs text-stone-600 line-clamp-2 font-mono leading-relaxed">
                        "{resumeText.substring(0, 180)}..."
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Drag & Drop Upload Zone */
                <form
                  onSubmit={handleFileUpload}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="w-full flex flex-col gap-3"
                >
                  <label
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer block ${
                      isDragOver
                        ? 'border-emerald-600 bg-emerald-50/70 scale-102'
                        : 'border-stone-400 bg-white hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setResumeFile(file)
                          processResumeFile(file)
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud className={`w-8 h-8 mb-1 ${isDragOver ? 'text-emerald-700 animate-bounce' : 'text-stone-500'}`} />
                      <span className="font-radio font-bold text-xs text-black">
                        {resumeFile?.name || 'Drag & Drop PDF Resume here or click to browse'}
                      </span>
                      <span className="text-[11px] text-stone-400">PDF, DOCX parsed dynamically in memory</span>
                    </div>
                  </label>

                  {showReupload && (
                    <button
                      type="button"
                      onClick={() => setShowReupload(false)}
                      className="text-xs text-stone-500 hover:text-black font-semibold underline cursor-pointer"
                    >
                      Keep Previously Loaded Resume
                    </button>
                  )}
                </form>
              )}
            </div>

            {/* Start Interview Action Button */}
            <button
              onClick={handleStartSession}
              disabled={!resumeParsed || isUploading}
              className="w-full bg-black hover:bg-stone-800 disabled:bg-stone-300 disabled:text-stone-500 text-white font-radio font-bold text-base py-4 rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              {isUploading ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                  <span>Parsing Resume Context...</span>
                </>
              ) : !resumeParsed ? (
                <span>Upload Resume Above to Unlock Interview</span>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                  <span>Start 5-Min Voice Interview</span>
                </>
              )}
            </button>
          </motion.div>
        ) : (
          /* STEP 3: ACTIVE VOICE SESSION UI */
          <>
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

                {/* Secondary inner ring */}
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
                  AI Technical Interviewer
                </h1>
                <p className="text-xs font-radio text-stone-500 font-medium mt-0.5">
                  Contextual Screening · 5-Min Timer Active ({formatTime()})
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

            {/* AI Question / Response Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={aiText}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl bg-[#FAF4E5] border border-stone-300 rounded-3xl p-6 sm:p-8 shadow-xs text-left"
              >
                <span className="font-fragment text-[11px] font-bold text-stone-500 uppercase tracking-widest block mb-3">
                  AI INTERVIEWER
                </span>

                <h2 className="font-serif font-bold text-xl sm:text-2xl text-black leading-snug">
                  "{aiText || 'Connecting to your AI interviewer...'}"
                </h2>
              </motion.div>
            </AnimatePresence>

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

            {/* Minimal Footer Instructions */}
            <p className="text-xs text-stone-400 font-radio max-w-md">
              Just speak naturally. The AI asks one short question at a time.
              You can interrupt the AI at any time by speaking.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
