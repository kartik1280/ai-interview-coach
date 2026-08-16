import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Download, Award, CheckCircle2, LayoutDashboard, Sliders, Sparkles, Brain, MessageSquare, Zap, Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'

// Score tier colors
const getScoreColor = (score) => {
  const num = parseFloat(score)
  if (num >= 8.5) return '#2F8F6E' // Green
  if (num >= 7.0) return '#B8862E' // Amber
  return '#C0533F' // Red / Coral
}

export default function FullReport() {
  const navigate = useNavigate()
  const location = useLocation()
  const reportRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  const [userProfile, setUserProfile] = useState({
    fullName: 'Candidate',
    targetPosition: 'Software Engineer',
    industry: 'Tech'
  })

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
    areasToImproveList: [],
    aiAnalysisAvailable: false,
    aiPlan: {}
  })

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          throw new Error('No active user session found. Please log in.')
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/report/latest`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.detail || 'Failed to load report data')
        }

        const data = await response.json()
        setUserProfile({
          fullName: data.fullName || (data.overview && data.overview.fullName) || 'Candidate',
          targetPosition: data.targetPosition || (data.overview && data.overview.targetPosition) || 'Software Engineer',
          industry: data.industry || (data.overview && data.overview.industry) || 'Tech'
        })

        setAnalytics({
          overview: data.overview || {
            overallReadiness: data.overallScore || 0.0,
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
          areasToImproveList: data.areasToImproveList || [],
          aiAnalysisAvailable: data.aiAnalysisAvailable || false,
          aiPlan: data.aiPlan || {}
        })
      } catch (err) {
        console.error('Error fetching report:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [])

  // Chart comparison data
  const chartData = [
    {
      name: 'Technical',
      score: analytics.technical.averageScore,
      fillColor: getScoreColor(analytics.technical.averageScore)
    },
    {
      name: 'Behavioral',
      score: analytics.behavioral.averageScore,
      fillColor: getScoreColor(analytics.behavioral.averageScore)
    },
    {
      name: 'Aptitude',
      score: roundToOneDecimal((analytics.aptitude.averageScore / 50.0) * 10),
      fillColor: getScoreColor((analytics.aptitude.averageScore / 50.0) * 10)
    }
  ]

  function roundToOneDecimal(num) {
    return Math.round(num * 10) / 10
  }

  const overallScore = analytics.overview.overallReadiness.toFixed(1)
  const overallColor = getScoreColor(overallScore)

  // Export to PDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 20) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const cleanName = (userProfile.fullName || 'Candidate').replace(/\s+/g, '_')
      pdf.save(`Interview_Performance_Report_${cleanName}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Could not export PDF report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FCF5E2] flex items-center justify-center font-radio">
        <div className="text-stone-600 font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
          <span>Generating full report...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FCF5E2] text-black font-radio selection:bg-parker-red selection:text-white">
      {/* Top Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_#000000] flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard') }} className="font-serif italic font-bold text-2xl tracking-tight text-parker-red">
            InterviewOS
          </a>

          <div className="flex items-center gap-6 font-radio text-sm font-bold text-black">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-stone-500 hover:text-black transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
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
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {/* Action Header Bar: Back + Download PDF */}
          <div className="flex items-center justify-between bg-white border-2 border-black rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_#000000]">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to dashboard</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="bg-black hover:bg-stone-800 active:scale-95 text-white font-radio font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
          </div>

          {/* Printable Report Document Card */}
          <motion.div
            ref={reportRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border-2 border-black rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000000]"
          >
            {/* Title Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-black">
              <span className="font-fragment text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                OFFICIAL PRACTICE AUDIT & READINESS REPORT
              </span>
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight mt-1 mb-1">
                Candidate Assessment Report
              </h1>
              <p className="font-radio text-stone-600 text-sm font-semibold">
                Candidate: <span className="text-black font-bold">{userProfile.fullName}</span> · Role: <span className="text-black font-bold">{userProfile.targetPosition}</span> · Industry: <span className="text-stone-700">{userProfile.industry}</span>
              </p>
            </div>

            {/* 1. EXECUTIVE READINESS SUMMARY */}
            <section className="mb-10 text-center bg-stone-50/70 rounded-2xl border-2 border-black p-6 shadow-xs">
              <span className="font-fragment text-xs font-bold text-stone-500 uppercase tracking-widest block mb-1">
                OVERALL INTERVIEW READINESS SCORE
              </span>
              <div className="font-radio font-extrabold text-5xl sm:text-6xl" style={{ color: overallColor }}>
                {overallScore}<span className="text-stone-400 font-medium text-2xl">/10</span>
              </div>
              <p className="font-radio text-xs text-stone-600 mt-2 max-w-md mx-auto">
                Aggregated across {analytics.overview.totalCompletedRounds} completed assessments ({analytics.technical.attempts} Technical, {analytics.behavioral.attempts} Behavioral, {analytics.aptitude.attempts} Aptitude).
              </p>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-stone-200 text-left font-radio">
                <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Rounds</span>
                  <span className="font-extrabold text-base text-black">{analytics.overview.totalCompletedRounds} Completed</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Strongest Area</span>
                  <span className="font-extrabold text-xs text-emerald-700">{analytics.overview.strongestArea}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Focus Priority</span>
                  <span className="font-extrabold text-xs text-amber-700">{analytics.overview.weakestArea}</span>
                </div>
              </div>
            </section>

            {/* 2. RECHARTS SCORES COMPARISON */}
            <section className="mb-10 text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                  BENCHMARK PERFORMANCE COMPARISON
                </h2>
                <span className="font-radio text-[11px] text-stone-400">
                  Normalized 10-point scale
                </span>
              </div>

              <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-6 shadow-xs">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#1A1A1A', fontSize: 12, fontWeight: 700 }}
                        axisLine={{ stroke: '#1A1A1A', strokeWidth: 2 }}
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fill: '#6E6E7A', fontSize: 11 }}
                        axisLine={{ stroke: '#1A1A1A', strokeWidth: 2 }}
                      />
                      <Tooltip
                        formatter={(val) => [`${val} / 10`, 'Average Score']}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '2px solid #000000',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={48}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fillColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* 3. MULTI-ROUND DEEP-DIVE SECTIONS */}
            <section className="mb-10 text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A]">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                  CATEGORY DEEP-DIVE REPORTS
                </h2>
              </div>

              <div className="flex flex-col gap-4 font-radio">
                {/* 3.1 TECHNICAL DEEP-DIVE */}
                <div className="p-5 rounded-2xl border-2 border-black bg-stone-50/50 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-radio font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                      <Brain className="w-4 h-4 text-emerald-700" />
                      TECHNICAL CODING & ALGORITHMS
                    </span>
                    <span className="font-radio font-extrabold text-base text-emerald-700">
                      {analytics.technical.averageScore} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center bg-white p-2 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Attempts</span>
                      <span className="font-extrabold text-xs text-black">{analytics.technical.attempts}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Average</span>
                      <span className="font-extrabold text-xs text-black">{analytics.technical.averageScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Best</span>
                      <span className="font-extrabold text-xs text-emerald-700">{analytics.technical.bestScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Latest</span>
                      <span className="font-extrabold text-xs text-black">{analytics.technical.latestScore}</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Evaluates candidate runtime complexity, edge case handling, and programming precision. Solutions are graded using Google Gemini structured evaluation.
                  </p>
                </div>

                {/* 3.2 BEHAVIORAL DEEP-DIVE */}
                <div className="p-5 rounded-2xl border-2 border-black bg-stone-50/50 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-radio font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-700" />
                      BEHAVIORAL (STAR METHODOLOGY)
                    </span>
                    <span className="font-radio font-extrabold text-base text-blue-700">
                      {analytics.behavioral.averageScore} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center bg-white p-2 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Situation</span>
                      <span className="font-extrabold text-xs text-black">{analytics.behavioral.star.situation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Task</span>
                      <span className="font-extrabold text-xs text-black">{analytics.behavioral.star.task}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Action</span>
                      <span className="font-extrabold text-xs text-black">{analytics.behavioral.star.action}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Result</span>
                      <span className="font-extrabold text-xs text-black">{analytics.behavioral.star.result}</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Measures articulation clarity and structured responses across Situation, Task, Action, and quantifiable Results.
                  </p>
                </div>

                {/* 3.3 APTITUDE DEEP-DIVE */}
                <div className="p-5 rounded-2xl border-2 border-black bg-stone-50/50 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-radio font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-700" />
                      APTITUDE & QUANTITATIVE REASONING
                    </span>
                    <span className="font-radio font-extrabold text-base text-amber-700">
                      {analytics.aptitude.averageScore} / 50
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center bg-white p-2 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Attempts</span>
                      <span className="font-extrabold text-xs text-black">{analytics.aptitude.attempts}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Avg Score</span>
                      <span className="font-extrabold text-xs text-black">{analytics.aptitude.averageScore} / 50</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Best Score</span>
                      <span className="font-extrabold text-xs text-amber-800">{analytics.aptitude.bestScore} / 50</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Accuracy</span>
                      <span className="font-extrabold text-xs text-black">{analytics.aptitude.accuracy}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Evaluates numerical aptitude, logical reasoning, and time management across timed question sets.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. AI ACTIONABLE IMPROVEMENT PLAN */}
            <section className="text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-black" />
                  <span>ACTIONABLE IMPROVEMENT PLAN</span>
                </h2>
                <span className="font-radio text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                  {analytics.aiAnalysisAvailable ? 'AI Synthesis (Gemini)' : 'Deterministic Analytics'}
                </span>
              </div>

              {analytics.areasToImproveList && analytics.areasToImproveList.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {analytics.areasToImproveList.map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border-2 border-black bg-amber-50/60 shadow-xs flex items-start gap-3">
                      <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-serif font-bold text-sm text-black">
                            {idx + 1}. {item.area}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            item.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.severity} severity
                          </span>
                        </div>
                        <p className="font-radio text-xs text-stone-600 mb-1">
                          <strong>Observed Pattern:</strong> {item.evidence}
                        </p>
                        <p className="font-radio text-xs text-stone-800 font-semibold leading-relaxed">
                          <strong>Action Item:</strong> {item.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl border-2 border-black bg-stone-50/60 shadow-xs text-center">
                  <p className="text-xs text-stone-600">No improvement plan available. Complete practice rounds to view targeted guidance.</p>
                </div>
              )}
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
