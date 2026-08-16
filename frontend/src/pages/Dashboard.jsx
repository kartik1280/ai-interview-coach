import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Flame, Sparkles, X, Sliders, LayoutDashboard, Play, ArrowRight, Brain, MessageSquare, Zap, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react'
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

  // User Profile
  const [userProfile, setUserProfile] = useState(location.state || {
    fullName: 'Candidate',
    targetPosition: 'Software Engineer',
    industry: 'Tech'
  })

  // Canonical Analytics State
  const [analytics, setAnalytics] = useState({
    overview: {
      overallReadiness: 0.0,
      totalCompletedRounds: 0,
      totalQuestionsAnswered: 0,
      streak: 0,
      strongestArea: 'None yet',
      weakestArea: 'None yet'
    },
    technical: {
      attempts: 0,
      averageScore: 0.0,
      bestScore: 0.0,
      latestScore: 0.0,
      percentage: 0,
      trend: 'no_attempts'
    },
    behavioral: {
      attempts: 0,
      averageScore: 0.0,
      bestScore: 0.0,
      latestScore: 0.0,
      percentage: 0,
      star: { situation: 0.0, task: 0.0, action: 0.0, result: 0.0 }
    },
    aptitude: {
      attempts: 0,
      averageScore: 0.0,
      bestScore: 0.0,
      latestScore: 0.0,
      accuracy: 0.0,
      questionsAnswered: 0,
      questionsCorrect: 0
    },
    recentHistory: [],
    fullHistory: [],
    areasToImproveList: [],
    aiAnalysisAvailable: false
  })

  // History Category Filter state
  const [historyFilter, setHistoryFilter] = useState('all')

  // Practice round modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoundType, setSelectedRoundType] = useState('technical')
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
  const [selectedTechCount, setSelectedTechCount] = useState(5)
  const [selectedAptCount, setSelectedAptCount] = useState(10)
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
          fullName: data.fullName || (data.overview && data.overview.fullName) || 'Candidate',
          targetPosition: data.targetPosition || (data.overview && data.overview.targetPosition) || 'Software Engineer',
          industry: data.industry || (data.overview && data.overview.industry) || 'Tech'
        })

        setAnalytics({
          overview: data.overview || {
            overallReadiness: data.avgReadiness || 0.0,
            totalCompletedRounds: data.roundsDone || 0,
            totalQuestionsAnswered: (data.overview && data.overview.totalQuestionsAnswered) || 0,
            streak: data.streak || 0,
            strongestArea: (data.overview && data.overview.strongestArea) || 'None yet',
            weakestArea: (data.overview && data.overview.weakestArea) || 'None yet'
          },
          technical: data.technical || {
            attempts: 0,
            averageScore: 0.0,
            bestScore: 0.0,
            latestScore: 0.0,
            percentage: 0,
            trend: 'no_attempts'
          },
          behavioral: data.behavioral || {
            attempts: 0,
            averageScore: 0.0,
            bestScore: 0.0,
            latestScore: 0.0,
            percentage: 0,
            star: { situation: 0.0, task: 0.0, action: 0.0, result: 0.0 }
          },
          aptitude: data.aptitude || {
            attempts: 0,
            averageScore: 0.0,
            bestScore: 0.0,
            latestScore: 0.0,
            accuracy: 0.0,
            questionsAnswered: 0,
            questionsCorrect: 0
          },
          recentHistory: data.recentHistory || [],
          fullHistory: data.fullHistory || data.recentHistory || [],
          areasToImproveList: data.areasToImproveList || [],
          aiAnalysisAvailable: data.aiAnalysisAvailable || false
        })
      } catch (err) {
        console.error('Error loading dashboard:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Filtered History for Recent History section
  const displayedHistory = useMemo(() => {
    const list = analytics.fullHistory && analytics.fullHistory.length > 0 ? analytics.fullHistory : (analytics.recentHistory || [])
    if (historyFilter === 'all') return list
    return list.filter(item => item.roundType === historyFilter)
  }, [analytics.fullHistory, analytics.recentHistory, historyFilter])

  const initialLetter = (userProfile.fullName || 'C').charAt(0).toUpperCase()
  const totalRoundsCount = analytics.overview.totalCompletedRounds || 0
  const avgReadiness = analytics.overview.overallReadiness.toFixed(1)
  const streak = analytics.overview.streak || 0

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

      const qCount = selectedRoundType === 'technical' ? selectedTechCount : (selectedRoundType === 'aptitude' ? selectedAptCount : 3)

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/round/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roundType: selectedRoundType,
          difficulty: selectedDifficulty,
          questionCount: qCount
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
          questions: data.questions,
          difficulty: selectedDifficulty,
          questionCount: qCount,
          totalTimeLimitSeconds: data.totalTimeLimitSeconds
        }
      })
    } catch (err) {
      console.error('Error starting round:', err)
      alert(`Failed to start round: ${err.message}`)
    } finally {
      setIsSimulating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FCF5E2] flex items-center justify-center font-radio">
        <div className="text-stone-600 font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
          <span>Loading performance analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FCF5E2] text-black font-radio selection:bg-parker-red selection:text-white">
      {/* Top Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_#000000] flex items-center justify-between">
          <a href="#" className="font-serif italic font-bold text-2xl tracking-tight text-parker-red">
            InterviewOS
          </a>

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

      {/* Main Container */}
      <main className="pt-28 pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto bg-white border-2 border-black rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000000]"
        >
          {/* Header Tag */}
          <div className="text-center mb-4">
            <span className="font-fragment text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              INTERVIEW PRACTICE ANALYTICS
            </span>
          </div>

          {/* Profile Details */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center font-serif text-2xl font-bold text-black bg-stone-50 shadow-xs mb-3">
              {initialLetter}
            </div>

            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight">
              {userProfile.fullName}
            </h1>

            <p className="font-radio text-sm text-[#55607A] mt-1">
              Preparing for <span className="font-bold text-black">{userProfile.targetPosition}</span> · <span className="text-stone-600">{userProfile.industry}</span>
            </p>
          </div>

          {/* Overview Metrics Bar */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 my-8 py-4 border-y border-stone-200">
            {/* Readiness */}
            <div className="flex flex-col items-center">
              <div className="font-radio font-extrabold text-xl sm:text-2xl" style={{ color: getScoreColor(avgReadiness) }}>
                {avgReadiness}<span className="text-stone-400 font-medium text-sm">/10</span>
              </div>
              <span className="font-fragment text-[10px] font-bold text-stone-400 tracking-wider uppercase mt-1">
                OVERALL READINESS
              </span>
            </div>

            <div className="w-px h-8 bg-stone-300" />

            {/* Total Attempts */}
            <div className="flex flex-col items-center">
              <div className="font-radio font-extrabold text-xl sm:text-2xl text-black">
                {totalRoundsCount}
              </div>
              <span className="font-fragment text-[10px] font-bold text-stone-400 tracking-wider uppercase mt-1">
                ROUNDS DONE
              </span>
            </div>

            <div className="w-px h-8 bg-stone-300" />

            {/* Day Streak */}
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

          {/* Main Action CTAs */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <button
              onClick={handleStartPracticeRound}
              className="bg-black hover:bg-stone-800 active:scale-95 text-white font-radio font-bold text-sm py-3 px-6 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start a practice round</span>
            </button>

            <button
              disabled={totalRoundsCount === 0}
              onClick={() => navigate('/full-report', { state: { analytics, userProfile } })}
              title={totalRoundsCount === 0 ? 'Complete at least 1 practice round to view full report' : ''}
              className={`font-radio font-bold text-sm py-3 px-6 rounded-xl border-2 transition-all flex items-center gap-1.5 ${
                totalRoundsCount === 0
                  ? 'bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed opacity-60'
                  : 'bg-white border-black text-black hover:bg-stone-50 active:scale-95 cursor-pointer shadow-xs'
              }`}
            >
              <span>View full report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 DISTINCT CATEGORY PERFORMANCE BARS/CARDS */}
          <section className="mb-10 text-left">
            <div className="pb-2 mb-5 border-b border-[#1A1A1A] flex items-center justify-between">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                PERFORMANCE BY ROUND CATEGORY
              </h2>
              <span className="font-radio text-[11px] text-stone-400">
                Calculated from {totalRoundsCount} completed assessments
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {/* 1. TECHNICAL PERFORMANCE CARD */}
              <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-800">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-radio font-extrabold text-base text-black leading-tight">
                        TECHNICAL
                      </h3>
                      <p className="text-[11px] text-stone-500">Data structures, coding logic & algorithms</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-radio font-extrabold text-xl" style={{ color: getScoreColor(analytics.technical.averageScore) }}>
                      {analytics.technical.percentage}%
                    </span>
                    <span className="text-xs text-stone-400 block font-medium">
                      Avg {analytics.technical.averageScore}/10
                    </span>
                  </div>
                </div>

                {/* Technical Progress Bar */}
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden mb-3 border border-stone-200">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${analytics.technical.percentage}%`,
                      backgroundColor: getScoreColor(analytics.technical.averageScore)
                    }}
                  />
                </div>

                {/* Technical Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-center font-radio">
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Attempts</span>
                    <span className="font-extrabold text-sm text-black">{analytics.technical.attempts}</span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Average</span>
                    <span className="font-extrabold text-sm text-black">{analytics.technical.averageScore}</span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Best</span>
                    <span className="font-extrabold text-sm text-emerald-700">{analytics.technical.bestScore}</span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Latest</span>
                    <span className="font-extrabold text-sm text-black">{analytics.technical.latestScore}</span>
                  </div>
                </div>
              </div>

              {/* 2. BEHAVIORAL PERFORMANCE CARD */}
              <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-300 flex items-center justify-center text-blue-800">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-radio font-extrabold text-base text-black leading-tight">
                        BEHAVIORAL
                      </h3>
                      <p className="text-[11px] text-stone-500">STAR communication, leadership & situational responses</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-radio font-extrabold text-xl" style={{ color: getScoreColor(analytics.behavioral.averageScore) }}>
                      {analytics.behavioral.percentage}%
                    </span>
                    <span className="text-xs text-stone-400 block font-medium">
                      Avg {analytics.behavioral.averageScore}/10
                    </span>
                  </div>
                </div>

                {/* Behavioral Progress Bar */}
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden mb-3 border border-stone-200">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${analytics.behavioral.percentage}%`,
                      backgroundColor: getScoreColor(analytics.behavioral.averageScore)
                    }}
                  />
                </div>

                {/* STAR Performance Sub-Scores */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-center font-radio">
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Situation</span>
                    <span className="font-extrabold text-sm text-black">{analytics.behavioral.star.situation}</span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Task</span>
                    <span className="font-extrabold text-sm text-black">{analytics.behavioral.star.task}</span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Action</span>
                    <span className="font-extrabold text-sm text-black">{analytics.behavioral.star.action}</span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Result</span>
                    <span className="font-extrabold text-sm text-black">{analytics.behavioral.star.result}</span>
                  </div>
                </div>
              </div>

              {/* 3. APTITUDE PERFORMANCE CARD */}
              <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-800">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-radio font-extrabold text-base text-black leading-tight">
                        APTITUDE
                      </h3>
                      <p className="text-[11px] text-stone-500">Quantitative problem solving, pattern deduction & speed math</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-radio font-extrabold text-xl" style={{ color: getScoreColor((analytics.aptitude.averageScore / 50.0) * 10) }}>
                      {analytics.aptitude.accuracy}%
                    </span>
                    <span className="text-xs text-stone-400 block font-medium">
                      Avg {analytics.aptitude.averageScore} / 50
                    </span>
                  </div>
                </div>

                {/* Aptitude Progress Bar */}
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden mb-3 border border-stone-200">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${analytics.aptitude.accuracy}%`,
                      backgroundColor: getScoreColor((analytics.aptitude.averageScore / 50.0) * 10)
                    }}
                  />
                </div>

                {/* Aptitude Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-center font-radio">
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Attempts</span>
                    <span className="font-extrabold text-sm text-black">{analytics.aptitude.attempts}</span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Avg Score</span>
                    <span className="font-extrabold text-sm text-black">{analytics.aptitude.averageScore} <span className="text-[10px] text-stone-400">/50</span></span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Best Score</span>
                    <span className="font-extrabold text-sm text-amber-800">{analytics.aptitude.bestScore} <span className="text-[10px] text-stone-400">/50</span></span>
                  </div>
                  <div className="bg-stone-50/70 p-2 rounded-lg">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Accuracy</span>
                    <span className="font-extrabold text-sm text-black">{analytics.aptitude.accuracy}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RECENT PRACTICE HISTORY */}
          <section className="mb-10 text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                  RECENT PRACTICE HISTORY
                </h2>
                <span className="font-radio text-[11px] text-stone-400">
                  Completed practice sessions
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-radio font-bold">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyFilter === 'all'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-stone-600 hover:text-black hover:bg-stone-200'
                  }`}
                >
                  All ({analytics.fullHistory ? analytics.fullHistory.length : analytics.recentHistory.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('technical')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyFilter === 'technical'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-black hover:bg-stone-200'
                  }`}
                >
                  Technical ({analytics.technical.attempts})
                </button>
                <button
                  onClick={() => setHistoryFilter('behavioral')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyFilter === 'behavioral'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-black hover:bg-stone-200'
                  }`}
                >
                  Behavioral ({analytics.behavioral.attempts})
                </button>
                <button
                  onClick={() => setHistoryFilter('aptitude')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyFilter === 'aptitude'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-black hover:bg-stone-200'
                  }`}
                >
                  Aptitude ({analytics.aptitude.attempts})
                </button>
              </div>
            </div>

            {displayedHistory.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {displayedHistory.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.roundType === 'technical' ? 'bg-emerald-600' : item.roundType === 'behavioral' ? 'bg-blue-600' : 'bg-amber-600'
                      }`} />
                      <div>
                        <span className="font-radio text-stone-900 font-bold block leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {item.formattedDate || item.daysAgo} · {item.questionsCount} questions
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-radio font-extrabold text-sm text-stone-900">
                        {item.score} <span className="text-stone-400 font-medium text-xs">/ {item.maxScore}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.roundType === 'technical'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.roundType === 'behavioral'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.roundType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center bg-stone-50/50 rounded-2xl border border-stone-200">
                <p className="text-xs text-stone-500 font-medium">No completed practice sessions in this category yet.</p>
                <p className="text-[11px] text-stone-400 mt-1">Start a {historyFilter !== 'all' ? historyFilter : 'practice'} round above to begin building your history.</p>
              </div>
            )}
          </section>

          {/* AI AREAS TO IMPROVE */}
          <section className="text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI AREAS TO IMPROVE</span>
              </h2>
              <span className="font-radio text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                {analytics.aiAnalysisAvailable ? 'Google Gemini Intelligence' : 'Performance Analysis'}
              </span>
            </div>

            {analytics.areasToImproveList && analytics.areasToImproveList.length > 0 ? (
              <div className="flex flex-col gap-3">
                {analytics.areasToImproveList.map((areaItem, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-radio font-bold text-sm text-black flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                          {areaItem.priority || idx + 1}
                        </span>
                        {areaItem.area}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        areaItem.severity === 'high' ? 'bg-red-100 text-red-800 border border-red-200' : areaItem.severity === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {areaItem.severity} priority
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mb-1 leading-relaxed">
                      <strong className="text-stone-700">Evidence:</strong> {areaItem.evidence}
                    </p>
                    <p className="text-xs text-stone-800 font-medium leading-relaxed">
                      <strong className="text-stone-900">Recommendation:</strong> {areaItem.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-radio text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
                Complete your initial Technical, Behavioral, or Aptitude rounds to generate personalized AI improvement insights.
              </p>
            )}
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
              className="w-full max-w-lg bg-white border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
                <h3 className="font-serif font-bold text-xl text-black">
                  Configure Practice Round
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-black transition-colors cursor-pointer"
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
                    Preparing real-time interview evaluation environment...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 font-radio">
                  {/* Step 1: Round Type Selection */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                      1. Select Round Category
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'technical', label: 'Technical', sub: 'Coding & Algorithms', icon: Brain },
                        { id: 'behavioral', label: 'Behavioral', sub: 'STAR Leadership', icon: MessageSquare },
                        { id: 'aptitude', label: 'Aptitude', sub: 'Logic & Reasoning', icon: Zap }
                      ].map((opt) => {
                        const Icon = opt.icon
                        const isSelected = selectedRoundType === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedRoundType(opt.id)}
                            className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'border-black bg-stone-50 shadow-xs'
                                : 'border-stone-200 hover:border-stone-300 bg-white'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mb-1.5 ${
                              opt.id === 'technical' ? 'text-emerald-700' : opt.id === 'behavioral' ? 'text-blue-700' : 'text-amber-700'
                            }`} />
                            <p className="font-bold text-xs text-black">{opt.label}</p>
                            <p className="text-[10px] text-stone-500 leading-tight">{opt.sub}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Step 2: Difficulty Tier Selection (For Technical & Aptitude) */}
                  {(selectedRoundType === 'technical' || selectedRoundType === 'aptitude') && (
                    <div>
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                        2. Select Difficulty Level
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'easy', label: 'Easy', color: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200' },
                          { id: 'medium', label: 'Medium', color: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
                          { id: 'hard', label: 'Hard', color: 'text-red-700', badge: 'bg-red-50 border-red-200' },
                          { id: 'all', label: 'Mixed', color: 'text-stone-700', badge: 'bg-stone-50 border-stone-200' }
                        ].map((diff) => (
                          <button
                            key={diff.id}
                            type="button"
                            onClick={() => setSelectedDifficulty(diff.id)}
                            className={`py-2 px-2 rounded-xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                              selectedDifficulty === diff.id
                                ? 'border-black bg-black text-white shadow-xs'
                                : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                            }`}
                          >
                            <span>{diff.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Question Count Selection */}
                  {selectedRoundType === 'technical' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                          3. Number of Problems
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Min: 5 Problems
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[5, 10, 15, 20].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setSelectedTechCount(count)}
                            className={`py-2 px-2 rounded-xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                              selectedTechCount === count
                                ? 'border-black bg-black text-white shadow-xs'
                                : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                            }`}
                          >
                            <span>{count} Qs</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRoundType === 'aptitude' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                          3. Number of Questions
                        </label>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Min: 10 Questions
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { count: 10, label: '10 Qs (Blitz)' },
                          { count: 20, label: '20 Qs (Half)' },
                          { count: 30, label: '30 Qs' },
                          { count: 50, label: '50 Qs (Full)' }
                        ].map((item) => (
                          <button
                            key={item.count}
                            type="button"
                            onClick={() => setSelectedAptCount(item.count)}
                            className={`py-2 px-2 rounded-xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                              selectedAptCount === item.count
                                ? 'border-black bg-black text-white shadow-xs'
                                : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                            }`}
                          >
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRoundType === 'behavioral' && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
                      <p className="font-bold mb-0.5">STAR Leadership Format</p>
                      <p className="text-[11px] text-blue-800 leading-snug">
                        Standard 3 situational interview questions with voice / text real-time evaluation.
                      </p>
                    </div>
                  )}

                  {/* Launch Practice Session Button */}
                  <button
                    onClick={handleRunSimulatedRound}
                    className="mt-2 w-full bg-black hover:bg-stone-800 text-white font-radio font-bold text-sm py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      Start {selectedRoundType.charAt(0).toUpperCase() + selectedRoundType.slice(1)} Round ({
                        selectedRoundType === 'technical' ? `${selectedTechCount} Problems · ${selectedDifficulty.toUpperCase()}` : (
                          selectedRoundType === 'aptitude' ? `${selectedAptCount} Qs · ${selectedDifficulty.toUpperCase()}` : '3 Questions'
                        )
                      })
                    </span>
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
