import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Flame, ChevronRight, Sparkles, X, Sliders, LayoutDashboard, CheckCircle2, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Helper for score tier colors
const getScoreColor = (score) => {
  const num = parseFloat(score)
  if (num >= 8.5) return '#2F8F6E' // Green
  if (num >= 7.0) return '#B8862E' // Amber
  return '#C0533F' // Red / Coral
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get user details (initially falls back to local routing details, then loads backend data)
  const [userProfile, setUserProfile] = useState(location.state || {
    fullName: 'Loading...',
    targetPosition: '',
    industry: ''
  })

  // State for practice rounds
  const [rounds, setRounds] = useState([])
  const [history, setHistory] = useState([])
  const [streak, setStreak] = useState(0)
  const [roundsDone, setRoundsDone] = useState(0)
  const [avgReadiness, setAvgReadiness] = useState('0.0')
  const [areasToImprove, setAreasToImprove] = useState('')

  // State for accordion (only 1 expanded at a time)
  const [expandedRoundId, setExpandedRoundId] = useState(null)

  // Practice round modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoundType, setSelectedRoundType] = useState('technical')
  const [isSimulating, setIsSimulating] = useState(false)
  const [simStep, setSimStep] = useState('Running your round...')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          throw new Error('No active user session. Please log in.')
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          const errData = await response.json()
          if (response.status === 400 && errData.detail === "Please complete profile onboarding first") {
            navigate('/create-interview')
            return
          }
          throw new Error(errData.detail || 'Failed to fetch dashboard data')
        }

        const data = await response.json()
        setUserProfile({
          fullName: data.fullName,
          targetPosition: data.targetPosition,
          industry: data.industry
        })
        setRounds(data.rounds)
        setHistory(data.recentHistory)
        setStreak(data.streak)
        setRoundsDone(data.roundsDone)
        setAvgReadiness(data.avgReadiness.toFixed(1))
        setAreasToImprove(data.areasToImprove)
        
        if (data.rounds && data.rounds.length > 0) {
          setExpandedRoundId(data.rounds[0].id)
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const initialLetter = (userProfile.fullName || 'S').charAt(0).toUpperCase()

  // Calculate dynamic stats
  const totalRoundsCount = roundsDone

  const handleStartPracticeRound = () => {
    setIsModalOpen(true)
  }

  const handleRunSimulatedRound = async () => {
    setIsModalOpen(false)
    setIsSimulating(true)
    setSimStep('Initializing your session on backend...')
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active user session. Please log in.')
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roundType: selectedRoundType
        })
      })
      
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to start practice round')
      }
      
      const data = await response.json()
      
      const routeMap = {
        technical: '/technical-round',
        behavioral: '/behavioral-round',
        aptitude: '/aptitude-round'
      }
      
      navigate(routeMap[selectedRoundType] || '/technical-round', {
        state: {
          roundId: data.roundId,
          questions: data.questions
        }
      })
    } catch (err) {
      console.error('Error starting round:', err)
      alert(`Failed to start round: ${err.message}`)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF5E2] text-black font-radio selection:bg-parker-red selection:text-white">
      {/* Dashboard Top Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_#000000] flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="font-serif italic font-bold text-2xl tracking-tight text-parker-red">
            InterviewOS
          </a>

          {/* Nav Options */}
          <div className="flex items-center gap-6 font-radio text-sm font-bold text-black">
            <button className="flex items-center gap-1.5 text-black border-b-2 border-black pb-0.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/settings', { state: userProfile })}
              className="flex items-center gap-1.5 text-stone-500 hover:text-black transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="pt-28 pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto bg-white border-2 border-black rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000000]"
        >
          {/* INTERVIEW COACH Label */}
          <div className="text-center mb-4">
            <span className="font-fragment text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              INTERVIEW COACH
            </span>
          </div>

          {/* Header Profile */}
          <div className="flex flex-col items-center text-center mb-8">
            {/* Avatar Circle */}
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center font-serif text-2xl font-bold text-black bg-stone-50 shadow-xs mb-3">
              {initialLetter}
            </div>

            {/* Name */}
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight">
              {userProfile.fullName || 'Sameer'}
            </h1>

            {/* Subtitle */}
            <p className="font-radio text-sm text-[#55607A] mt-1">
              Preparing for {userProfile.targetPosition || 'Software Development Engineer'} · {userProfile.industry || 'Google'}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 my-8 py-4 border-y border-stone-200">
            {/* Readiness */}
            <div className="flex flex-col items-center">
              <div className="font-radio font-extrabold text-xl sm:text-2xl" style={{ color: getScoreColor(avgReadiness) }}>
                {avgReadiness}<span className="text-stone-400 font-medium text-sm">/10</span>
              </div>
              <span className="font-fragment text-[10px] font-bold text-stone-400 tracking-wider uppercase mt-1">
                READINESS
              </span>
            </div>

            <div className="w-px h-8 bg-stone-300" />

            {/* Rounds Done */}
            <div className="flex flex-col items-center">
              <div className="font-radio font-extrabold text-xl sm:text-2xl text-black">
                {totalRoundsCount}
              </div>
              <span className="font-fragment text-[10px] font-bold text-stone-400 tracking-wider uppercase mt-1">
                ROUNDS DONE
              </span>
            </div>

            <div className="w-px h-8 bg-stone-300" />

            {/* Day Streak Badge */}
            <div className="flex items-center gap-2 bg-[#FFF4E5] border border-[#FFD8A8] rounded-full px-4 py-2 shadow-xs">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              <div className="flex flex-col items-start leading-none">
                <span className="font-radio font-extrabold text-base text-amber-900">
                  {streak}
                </span>
                <span className="font-fragment text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                  DAY STREAK
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <button
              onClick={handleStartPracticeRound}
              className="bg-black hover:bg-stone-800 active:scale-95 text-white font-radio font-bold text-sm py-3 px-6 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Start a practice round
            </button>

            <button
              disabled={totalRoundsCount === 0}
              onClick={() => navigate('/full-report', { state: { rounds, history, userProfile } })}
              title={totalRoundsCount === 0 ? 'Complete at least 1 practice round to view full report' : ''}
              className={`font-radio font-bold text-sm py-3 px-6 rounded-xl border-2 transition-all ${
                totalRoundsCount === 0
                  ? 'bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed opacity-60'
                  : 'bg-white border-black text-black hover:bg-stone-50 active:scale-95 cursor-pointer shadow-xs'
              }`}
            >
              View full report
            </button>
          </div>

          {/* PRACTICE ROUNDS SECTION */}
          <section className="mb-10 text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A]">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                PRACTICE ROUNDS
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {rounds.map((round) => {
                const isExpanded = expandedRoundId === round.id
                const scoreColor = getScoreColor(round.score)

                return (
                  <div
                    key={round.id}
                    className={`rounded-2xl border border-stone-200 transition-all ${
                      isExpanded ? 'bg-stone-50/80 shadow-xs' : 'bg-white hover:bg-stone-50/40'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedRoundId(isExpanded ? null : round.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-radio font-bold text-base text-black">
                          {round.name},
                        </span>
                        <span className="font-serif italic text-sm text-stone-500">
                          {round.subtitle}
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      {/* Score Bar & Number */}
                      <div className="flex items-center gap-4">
                        <div className="w-20 sm:w-28 h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(round.score / 10) * 100}%`,
                              backgroundColor: scoreColor
                            }}
                          />
                        </div>
                        <span className="font-radio font-extrabold text-base" style={{ color: scoreColor }}>
                          {round.score}
                        </span>
                      </div>
                    </div>

                    {/* Accordion Collapsible Feedback Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden px-4 pb-4"
                        >
                          <div className="pt-3 border-t border-stone-200/80 text-left">
                            <span className="inline-block font-fragment text-[10px] font-bold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded mb-2.5 uppercase tracking-wider">
                              AI FEEDBACK
                            </span>
                            <ul className="space-y-1.5 text-xs text-stone-700 list-disc list-inside leading-relaxed font-radio">
                              {round.feedback.map((bullet, idx) => (
                                <li key={idx}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </section>

          {/* RECENT HISTORY SECTION */}
          <section className="mb-10 text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A]">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                RECENT HISTORY
              </h2>
            </div>

            <div className="divide-y divide-stone-100">
              {history.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                  <span className="font-radio text-stone-900 font-medium">
                    {item.name}
                  </span>
                  <span className="font-radio text-stone-500 text-xs">
                    {item.daysAgo} · <strong className="text-stone-800 font-bold">{item.score} / 10</strong>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* AREAS TO IMPROVE SECTION */}
          <section className="text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                AREAS TO IMPROVE
              </h2>
              <span className="font-radio text-[11px] text-stone-400">
                Generated from your last 3 rounds
              </span>
            </div>

            <p className="font-radio text-xs text-stone-700 leading-relaxed">
              {areasToImprove || "No completed rounds yet. Finish some practice sessions to view recommendations."}
            </p>
          </section>
        </motion.div>
      </main>

      {/* Start a Practice Round Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] text-left"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
                <h3 className="font-serif font-bold text-xl text-black">
                  Start Practice Round
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSimulating ? (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                  <Sparkles className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="font-radio font-bold text-base text-black">
                    {simStep}
                  </p>
                  <p className="text-xs text-stone-500">
                    Evaluating responses against industry benchmarks...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-stone-600">
                    Choose the focus area for this mock practice round:
                  </p>

                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'technical', label: 'Technical round', sub: 'Data structures & algorithms' },
                      { id: 'behavioral', label: 'Behavioral round', sub: 'Teamwork & leadership' },
                      { id: 'aptitude', label: 'Aptitude round', sub: 'Career awareness & reasoning' }
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        onClick={() => setSelectedRoundType(opt.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                          selectedRoundType === opt.id
                            ? 'border-black bg-stone-50 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm text-black">{opt.label}</p>
                          <p className="text-xs text-stone-500">{opt.sub}</p>
                        </div>
                        <input
                          type="radio"
                          name="roundType"
                          checked={selectedRoundType === opt.id}
                          onChange={() => setSelectedRoundType(opt.id)}
                          className="accent-black"
                        />
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleRunSimulatedRound}
                    className="mt-2 w-full bg-black hover:bg-stone-800 text-white font-radio font-bold text-sm py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Begin Practice Session</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
