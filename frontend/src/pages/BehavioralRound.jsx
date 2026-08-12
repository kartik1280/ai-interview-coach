import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wifi, WifiOff, Volume2, Mic, Brain, AlertCircle, Play } from 'lucide-react'
import { useInterviewSocket } from '../hooks/useInterviewSocket'

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
  const [hasStarted, setHasStarted] = useState(false)

  const resumeText = "Candidate pursuing B.S. in Computer Science with experience in React, Node.js, and database design."
  const candidateName = "Manik"

  const {
    aiText,
    status,
    isConnected,
    transcript
  } = useInterviewSocket(resumeText, candidateName, hasStarted)

  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.idle

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
    <div className="min-h-screen bg-[#FAF7ED] text-black font-radio selection:bg-parker-red selection:text-white flex flex-col justify-between">
      {/* Hidden Audio Tag for DOM Mounting */}
      <audio id="ai-audio-player" hidden />

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
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center gap-8 text-center relative">
        {!hasStarted ? (
          /* Start Interaction Gate Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#FFFDF8] border-2 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center gap-6 my-auto"
          >
            <div className="w-16 h-16 rounded-full bg-[#E2F0E0] border-2 border-black flex items-center justify-center">
              <Mic className="w-8 h-8 text-emerald-800" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-serif font-bold text-3xl text-black">
                Ready for your AI Voice Interview?
              </h2>
              <p className="text-sm font-radio text-stone-600 max-w-sm mx-auto">
                Click below to grant audio permission and start your hands-free, real-time voice session with your AI coach.
              </p>
            </div>

            <button
              onClick={handleStartSession}
              className="w-full bg-black hover:bg-stone-800 text-white font-radio font-bold text-base py-4 rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-5 h-5 fill-emerald-400 text-emerald-400" />
              <span>Start Voice Interview</span>
            </button>
          </motion.div>
        ) : (
          /* Active Voice Session UI */
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
                  AI Interviewer
                </h1>
                <p className="text-xs font-radio text-stone-500 font-medium mt-0.5">
                  Hands-Free Voice Interview
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
              Just speak naturally. The AI will listen, respond, and ask follow-up questions automatically.
              You can interrupt the AI at any time by speaking.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
