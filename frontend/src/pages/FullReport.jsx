import React, { useRef, useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Award, CheckCircle2, LayoutDashboard, Sliders,
  Sparkles, Brain, MessageSquare, Zap, Target, TrendingUp, AlertTriangle,
  ShieldCheck, Compass, Code, BookOpen, Layers, Check, Clock, Calendar
} from 'lucide-react'
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
  const reportRef = useRef(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [historyTab, setHistoryTab] = useState('all')

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
    fullHistory: [],
    areasToImproveList: [],
    aiAnalysisAvailable: false,
    aiPlan: {},
    aiReport: {}
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
          fullHistory: data.fullHistory || data.recentHistory || [],
          areasToImproveList: data.areasToImproveList || [],
          aiAnalysisAvailable: data.aiAnalysisAvailable || false,
          aiPlan: data.aiPlan || {},
          aiReport: data.aiReport || {}
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

  // Filtered complete history list
  const filteredHistory = useMemo(() => {
    const list = analytics.fullHistory && analytics.fullHistory.length > 0 ? analytics.fullHistory : analytics.recentHistory
    if (historyTab === 'all') return list
    return list.filter(item => item.roundType === historyTab)
  }, [analytics.fullHistory, analytics.recentHistory, historyTab])

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
      score: analytics.aptitude.averageScore,
      fillColor: getScoreColor(analytics.aptitude.averageScore)
    }
  ]

  const overallScore = analytics.overview.overallReadiness.toFixed(1)
  const overallColor = getScoreColor(overallScore)

  // AI report details
  const aiReport = analytics.aiReport || {}
  const competencyMatrix = aiReport.competencyMatrix || {}
  const roadmap = aiReport.preparationRoadmap || {}
  const readinessLevel = aiReport.readinessLevel || (overallScore >= 8.0 ? 'Production Ready' : overallScore >= 6.5 ? 'Strong Competitor' : 'Developing')

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
      pdf.save(`Interview_Dossier_${cleanName}.pdf`)
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
          <span>Synthesizing comprehensive AI assessment dossier...</span>
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
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
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
                  <span>Download Complete PDF Dossier</span>
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[10px] font-fragment font-bold uppercase tracking-widest mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>CONFIDENTIAL · OFFICIAL AI INTERVIEW DOSSIER</span>
              </div>
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight mb-2">
                Comprehensive Candidate Assessment Report
              </h1>
              <p className="font-radio text-stone-600 text-sm font-semibold">
                Candidate: <span className="text-black font-bold">{userProfile.fullName}</span> · Target Role: <span className="text-black font-bold">{userProfile.targetPosition}</span> · Industry: <span className="text-stone-700">{userProfile.industry}</span>
              </p>
            </div>

            {/* 1. EXECUTIVE READINESS SUMMARY & VERDICT */}
            <section className="mb-10 text-center bg-[#FAF7ED] rounded-2xl border-2 border-black p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200">
                <span className="font-fragment text-xs font-extrabold text-stone-500 uppercase tracking-widest">
                  EXECUTIVE READINESS ASSESSMENT
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-radio font-extrabold text-xs rounded-full uppercase tracking-wider">
                  {readinessLevel}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
                <div>
                  <span className="text-[11px] text-stone-500 font-bold uppercase block mb-1">
                    OVERALL READINESS SCORE
                  </span>
                  <div className="font-radio font-extrabold text-5xl sm:text-6xl" style={{ color: overallColor }}>
                    {overallScore}<span className="text-stone-400 font-medium text-2xl">/10</span>
                  </div>
                </div>

                {/* AI Executive Summary Narrative */}
                <div className="max-w-md text-left bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                  <span className="font-fragment text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3" /> AI EXECUTIVE ASSESSMENT
                  </span>
                  <p className="font-radio text-xs text-stone-700 leading-relaxed">
                    {aiReport.executiveSummary || `Candidate has completed ${analytics.overview.totalCompletedRounds} structured interview assessments for ${userProfile.targetPosition}. Performance shows a benchmark readiness of ${overallScore}/10 across technical problem solving, STAR communication, and quantitative reasoning.`}
                  </p>
                </div>
              </div>

              {/* Stat Badges Grid (Attempted, Correct, Wrong, Accuracy) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-4 border-t border-stone-200 text-left font-radio">
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Rounds Done</span>
                  <span className="font-extrabold text-sm text-black">{analytics.overview.totalCompletedRounds} Sessions</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Qs Attempted</span>
                  <span className="font-extrabold text-sm text-black">{analytics.overview.totalQuestionsAnswered} Qs</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Correct</span>
                  <span className="font-extrabold text-sm text-emerald-700">✅ {analytics.overview.totalQuestionsCorrect || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-red-700 font-bold uppercase block">Wrong / Sub</span>
                  <span className="font-extrabold text-sm text-red-700">❌ {analytics.overview.totalQuestionsWrong || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Overall Accuracy</span>
                  <span className="font-extrabold text-sm text-black">{analytics.overview.overallAccuracyPercentage || 0}%</span>
                </div>
              </div>
            </section>

            {/* 2. CORE COMPETENCIES MATRIX (4 PILLARS) */}
            <section className="mb-10 text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-black" />
                  <span>CORE COMPETENCY MATRIX & EVALUATION PILLARS</span>
                </h2>
                <span className="font-radio text-[10px] font-bold text-stone-500">
                  Evaluated across 4 skill dimensions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-radio">
                {/* 2.1 Algorithmic Logic */}
                <div className="p-4 rounded-2xl border-2 border-black bg-stone-50/50 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-emerald-700" />
                        Algorithmic Logic & Coding
                      </span>
                      <span className="font-extrabold text-xs text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                        {competencyMatrix.problemSolving ? competencyMatrix.problemSolving.score : analytics.technical.averageScore} / 10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(competencyMatrix.problemSolving ? competencyMatrix.problemSolving.score : analytics.technical.averageScore) * 10}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      {competencyMatrix.problemSolving ? competencyMatrix.problemSolving.critique : 'Evaluates time/space complexity efficiency, edge case handling, and programming precision.'}
                    </p>
                  </div>
                </div>

                {/* 2.2 System Architecture & Code Quality */}
                <div className="p-4 rounded-2xl border-2 border-black bg-stone-50/50 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-blue-700" />
                        Architecture & Clean Code
                      </span>
                      <span className="font-extrabold text-xs text-blue-700 px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                        {competencyMatrix.systemArchitecture ? competencyMatrix.systemArchitecture.score : 7.5} / 10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(competencyMatrix.systemArchitecture ? competencyMatrix.systemArchitecture.score : 7.5) * 10}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      {competencyMatrix.systemArchitecture ? competencyMatrix.systemArchitecture.critique : 'Measures modular function structure, clean naming conventions, and idiomatic language patterns.'}
                    </p>
                  </div>
                </div>

                {/* 2.3 STAR Behavioral Communication */}
                <div className="p-4 rounded-2xl border-2 border-black bg-stone-50/50 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-violet-700" />
                        STAR Leadership & Storytelling
                      </span>
                      <span className="font-extrabold text-xs text-violet-700 px-2 py-0.5 bg-violet-50 rounded border border-violet-200">
                        {competencyMatrix.starCommunication ? competencyMatrix.starCommunication.score : analytics.behavioral.averageScore} / 10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-violet-600 rounded-full"
                        style={{ width: `${(competencyMatrix.starCommunication ? competencyMatrix.starCommunication.score : analytics.behavioral.averageScore) * 10}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      {competencyMatrix.starCommunication ? competencyMatrix.starCommunication.critique : 'Measures structured communication across Situation, Task, Action, and quantifiable business Results.'}
                    </p>
                  </div>
                </div>

                {/* 2.4 Quantitative Reasoning & Speed */}
                <div className="p-4 rounded-2xl border-2 border-black bg-stone-50/50 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-700" />
                        Quantitative Aptitude & Pacing
                      </span>
                      <span className="font-extrabold text-xs text-amber-700 px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                        {competencyMatrix.quantitativePacing ? competencyMatrix.quantitativePacing.score : analytics.aptitude.averageScore} / 10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${((competencyMatrix.quantitativePacing ? competencyMatrix.quantitativePacing.score : analytics.aptitude.averageScore) / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      {competencyMatrix.quantitativePacing ? competencyMatrix.quantitativePacing.critique : 'Evaluates numerical agility, time management under strict timer pressure, and problem estimation accuracy.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. RECHARTS SCORES COMPARISON */}
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

            {/* 4. MULTI-ROUND DEEP-DIVE SECTIONS */}
            <section className="mb-10 text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A]">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                  CATEGORY DEEP-DIVE AUDITS
                </h2>
              </div>

              <div className="flex flex-col gap-4 font-radio">
                {/* 4.1 TECHNICAL DEEP-DIVE */}
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
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center bg-white p-2.5 rounded-xl border border-stone-200">
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
                    Evaluates algorithmic time/space complexity, syntax validity, and edge case resilience across JavaScript, Python, Java, and C++. Solutions undergo real-time structured evaluation powered by Google Gemini.
                  </p>
                </div>

                {/* 4.2 BEHAVIORAL DEEP-DIVE */}
                <div className="p-5 rounded-2xl border-2 border-black bg-stone-50/50 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-radio font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-700" />
                      BEHAVIORAL (STAR METHODOLOGY BREAKDOWN)
                    </span>
                    <span className="font-radio font-extrabold text-base text-blue-700">
                      {analytics.behavioral.averageScore} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center bg-white p-2.5 rounded-xl border border-stone-200">
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
                    Measures articulation clarity and structured responses across Situation (context), Task (objective), Action (specific execution steps), and quantifiable Results (business impact & metrics).
                  </p>
                </div>

                {/* 4.3 APTITUDE DEEP-DIVE */}
                <div className="p-5 rounded-2xl border-2 border-black bg-stone-50/50 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-radio font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-700" />
                      APTITUDE & QUANTITATIVE REASONING
                    </span>
                    <span className="font-radio font-extrabold text-base text-amber-700">
                      {analytics.aptitude.averageScore} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center bg-white p-2.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Attempts</span>
                      <span className="font-extrabold text-xs text-black">{analytics.aptitude.attempts}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Avg Score</span>
                      <span className="font-extrabold text-xs text-black">{analytics.aptitude.averageScore} / 10</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Best Score</span>
                      <span className="font-extrabold text-xs text-amber-800">{analytics.aptitude.bestScore} / 10</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">Accuracy</span>
                      <span className="font-extrabold text-xs text-black">{analytics.aptitude.accuracy}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Evaluates numerical estimation, deductive logic, and pacing under standardized timed aptitude assessments.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. STANDOUT STRENGTHS VS GROWTH OPPORTUNITIES (AI SYNTHESIS) */}
            <section className="mb-10 text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-black" />
                  <span>DIAGNOSTIC STRENGTHS & GROWTH AREAS</span>
                </h2>
                <span className="font-radio text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                  {analytics.aiAnalysisAvailable ? 'AI Synthesis (Google Gemini)' : 'Deterministic Analytics'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-radio">
                {/* 5.1 Standout Strengths */}
                <div className="p-5 rounded-2xl border-2 border-black bg-emerald-50/50 shadow-xs">
                  <span className="font-fragment text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    STANDOUT COMPETENCIES
                  </span>
                  <div className="flex flex-col gap-2.5">
                    {(aiReport.keyStrengths && aiReport.keyStrengths.length > 0 ? aiReport.keyStrengths : [
                      `Completed ${analytics.overview.totalCompletedRounds} practice evaluations establishing foundational consistency.`,
                      `Technical problem-solving benchmark of ${analytics.technical.averageScore}/10 with solid logic execution.`,
                      `Aptitude evaluation accuracy of ${analytics.aptitude.accuracy}% across timed practice sets.`
                    ]).map((strength, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-stone-800">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5.2 Growth Opportunities */}
                <div className="p-5 rounded-2xl border-2 border-black bg-amber-50/50 shadow-xs">
                  <span className="font-fragment text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    CRITICAL GROWTH OPPORTUNITIES
                  </span>
                  <div className="flex flex-col gap-2.5">
                    {(aiReport.growthOpportunities && aiReport.growthOpportunities.length > 0 ? aiReport.growthOpportunities : [
                      `Elevate STAR Results depth in behavioral rounds to highlight measurable business metrics.`,
                      `Optimize execution runtime complexity and edge-case boundary testing in technical sessions.`,
                      `Improve question time-budgeting during full 50-question quantitative aptitude drills.`
                    ]).map((opp, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-stone-800">
                        <TrendingUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 6. AI 30-DAY PREPARATION ROADMAP */}
            <section className="mb-10 text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-black" />
                  <span>30-DAY INTERVIEW PREPARATION ROADMAP</span>
                </h2>
                <span className="font-radio text-[10px] font-bold text-stone-500">
                  Target: {userProfile.targetPosition}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-radio">
                <div className="p-4 rounded-2xl border-2 border-black bg-white shadow-2xs">
                  <span className="text-[10px] font-fragment font-extrabold text-amber-700 uppercase tracking-wider block mb-1">
                    PHASE 1: DAYS 1 – 7
                  </span>
                  <h3 className="font-bold text-xs text-black mb-1.5">Foundation & Core Drills</h3>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {roadmap.phase1 || 'Focus on your weakest category with daily 45-minute drills. Review STAR response structures and refresh key data structures.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border-2 border-black bg-white shadow-2xs">
                  <span className="text-[10px] font-fragment font-extrabold text-blue-700 uppercase tracking-wider block mb-1">
                    PHASE 2: DAYS 8 – 20
                  </span>
                  <h3 className="font-bold text-xs text-black mb-1.5">Deep Mock Practice</h3>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {roadmap.phase2 || 'Conduct 2 timed technical coding rounds and 1 full 50-question aptitude assessment weekly under strict countdown conditions.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border-2 border-black bg-white shadow-2xs">
                  <span className="text-[10px] font-fragment font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                    PHASE 3: DAYS 21 – 30
                  </span>
                  <h3 className="font-bold text-xs text-black mb-1.5">Simulation & Final Polish</h3>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {roadmap.phase3 || 'Run end-to-end multi-round interview simulations. Refine STAR stories with exact metric outcomes and calibrate execution speed.'}
                  </p>
                </div>
              </div>
            </section>

            {/* 7. COMPLETE PRACTICE SESSION HISTORY TABLE */}
            <section className="text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                    COMPLETE PRACTICE SESSION HISTORY
                  </h2>
                  <span className="font-radio text-[11px] text-stone-400">
                    All completed practice sessions across Technical, Behavioral & Aptitude
                  </span>
                </div>

                {/* History Filter Tabs */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-radio font-bold">
                  <button
                    onClick={() => setHistoryTab('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      historyTab === 'all'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-stone-600 hover:text-black hover:bg-stone-200'
                    }`}
                  >
                    All ({analytics.fullHistory ? analytics.fullHistory.length : analytics.recentHistory.length})
                  </button>
                  <button
                    onClick={() => setHistoryTab('technical')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      historyTab === 'technical'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-black hover:bg-stone-200'
                    }`}
                  >
                    Technical ({analytics.technical.attempts})
                  </button>
                  <button
                    onClick={() => setHistoryTab('behavioral')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      historyTab === 'behavioral'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-black hover:bg-stone-200'
                    }`}
                  >
                    Behavioral ({analytics.behavioral.attempts})
                  </button>
                  <button
                    onClick={() => setHistoryTab('aptitude')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      historyTab === 'aptitude'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-black hover:bg-stone-200'
                    }`}
                  >
                    Aptitude ({analytics.aptitude.attempts})
                  </button>
                </div>
              </div>

              {filteredHistory && filteredHistory.length > 0 ? (
                <div className="border-2 border-black rounded-2xl overflow-x-auto shadow-xs bg-white">
                  <table className="w-full text-left border-collapse text-xs font-radio min-w-[700px]">
                    <thead>
                      <tr className="bg-[#FAF7ED] border-b-2 border-black font-extrabold uppercase text-stone-600 tracking-wider">
                        <th className="py-3 px-4">Session Name</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 text-center">Attempted</th>
                        <th className="py-3 px-3 text-center">Correct</th>
                        <th className="py-3 px-3 text-center">Wrong</th>
                        <th className="py-3 px-3 text-center">Accuracy</th>
                        <th className="py-3 px-3 text-center">Score</th>
                        <th className="py-3 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-white">
                      {filteredHistory.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-black flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              item.roundType === 'technical' ? 'bg-emerald-600' : item.roundType === 'behavioral' ? 'bg-blue-600' : 'bg-amber-600'
                            }`} />
                            <span>{item.name}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                              item.roundType === 'technical'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : item.roundType === 'behavioral'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {item.roundType}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-stone-700 font-semibold text-center">
                            {item.questionsAttempted || item.questionsCount} / {item.questionsCount}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700 text-center">
                            ✅ {item.correctCount !== undefined ? item.correctCount : (item.score >= 7.0 ? 1 : 0)}
                          </td>
                          <td className="py-3 px-3 font-bold text-red-700 text-center">
                            ❌ {item.wrongCount !== undefined ? item.wrongCount : Math.max(0, (item.questionsAttempted || 1) - (item.correctCount || 0))}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-black text-center">
                            {item.accuracyPercentage !== undefined ? `${item.accuracyPercentage}%` : `${Math.round((item.score / item.maxScore) * 100)}%`}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-black text-center">
                            {item.roundType === 'aptitude' ? (item.correctCount !== undefined ? item.correctCount : Math.round((item.score / 10) * item.questionsCount)) : item.score} <span className="text-stone-400 font-normal">/ {item.roundType === 'aptitude' ? item.questionsCount : 10}</span>
                          </td>
                          <td className="py-3 px-4 text-stone-500 font-medium text-right">
                            {item.formattedDate || item.daysAgo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center bg-stone-50/50 rounded-2xl border-2 border-black">
                  <p className="text-xs text-stone-600 font-semibold">No completed practice sessions in this category yet.</p>
                  <p className="text-[11px] text-stone-400 mt-1">Start a {historyTab !== 'all' ? historyTab : 'practice'} round to view completed sessions.</p>
                </div>
              )}
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
