import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Award, AlertTriangle, CheckCircle2, LayoutDashboard, Sliders, TrendingUp, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Score tier colors matching app rules
const getScoreColor = (score) => {
  if (score >= 8.5) return '#2F8F6E' // Green
  if (score >= 7.0) return '#B8862E' // Amber
  return '#C0533F' // Red / Coral
}

export default function FullReport() {
  const navigate = useNavigate()
  const location = useLocation()

  // Data passed from dashboard state or fallback mock data
  const dataState = location.state || {}
  
  const userProfile = dataState.userProfile || {
    fullName: 'Sameer Mishra',
    targetPosition: 'Software Development Engineer',
    industry: 'Google'
  }

  const rounds = dataState.rounds || [
    {
      id: 'technical',
      name: 'Technical round',
      subtitle: 'Data structures and algorithms',
      score: 8.2,
      feedback: [
        'Solid implementation of graph traversal algorithms.',
        'Slower on space complexity analysis for recursive edge cases.'
      ],
      bestQuestion: {
        title: 'Binary Tree Level Order Traversal',
        score: 8.8,
        feedback: 'Clean BFS queue logic with optimal O(N) time complexity.'
      },
      worstQuestion: {
        title: 'LRU Cache Design & Lock Contention',
        score: 7.4,
        feedback: 'Doubly linked list logic was good, but missed concurrency safeguards for thread safety.'
      }
    },
    {
      id: 'behavioral',
      name: 'Behavioral round',
      subtitle: 'Teamwork and leadership',
      score: 9.1,
      feedback: [
        'Excellent use of STAR method for conflict resolution stories.',
        'Clear quantification of project impact and metrics.'
      ],
      starBreakdown: {
        situation: 9.2,
        task: 8.8,
        action: 9.4,
        result: 9.0
      },
      bestQuestion: {
        title: 'Navigating Cross-Functional Stakeholder Conflicts',
        score: 9.5,
        feedback: 'Outstanding STAR delivery. Demonstrated high empathy, data-driven alignment, and clear metrics.'
      },
      worstQuestion: {
        title: 'Handling Unexpected Production Outages under Deadline',
        score: 8.5,
        feedback: 'Strong response overall, but could further detail post-mortem preventative measures.'
      }
    },
    {
      id: 'aptitude',
      name: 'Aptitude round',
      subtitle: 'Career awareness and reasoning',
      score: 7.8,
      feedback: [
        'Solid on logical reasoning; slower on quantitative estimation questions.',
        'Suggested focus: timed practice on estimation-style problems.'
      ],
      bestQuestion: {
        title: 'Pattern Matrix Logical Deductions',
        score: 8.4,
        feedback: 'Accurate analytical pattern matching with strong explanation of sequence rules.'
      },
      worstQuestion: {
        title: 'Market Sizing Fermi Estimation Problem',
        score: 7.2,
        feedback: 'Reasoning steps were sound, but estimation arithmetic took longer than expected.'
      }
    }
  ]

  // Filter completed round types for the Recharts comparison chart
  const completedChartData = rounds.map((r) => ({
    name: r.name.replace(' round', ''),
    score: r.score,
    fillColor: getScoreColor(r.score)
  }))

  // Overall readiness average
  const overallScore = parseFloat(
    (rounds.reduce((acc, curr) => acc + curr.score, 0) / rounds.length).toFixed(1)
  )
  const overallColor = getScoreColor(overallScore)

  // Find single best-scored answer across all completed rounds
  const allBestQuestions = rounds
    .filter((r) => r.bestQuestion)
    .map((r) => ({ ...r.bestQuestion, roundName: r.name }))
  const bestAnswer = allBestQuestions.length > 0
    ? allBestQuestions.reduce((prev, curr) => (curr.score > prev.score ? curr : prev))
    : null

  // Find single worst-scored answer across all completed rounds
  const allWorstQuestions = rounds
    .filter((r) => r.worstQuestion)
    .map((r) => ({ ...r.worstQuestion, roundName: r.name }))
  const worstAnswer = allWorstQuestions.length > 0
    ? allWorstQuestions.reduce((prev, curr) => (curr.score < prev.score ? curr : prev))
    : null

  // Check if user completed Behavioral round for STAR breakdown
  const behavioralRound = rounds.find((r) => r.id === 'behavioral' && r.starBreakdown)

  return (
    <div className="min-h-screen bg-[#FCF5E2] text-black font-radio selection:bg-parker-red selection:text-white">
      {/* Top Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_#000000] flex items-center justify-between">
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard') }} className="font-serif italic font-bold text-2xl tracking-tight text-parker-red">
            InterviewOS
          </a>

          {/* Nav Options */}
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

      {/* Main Report Container */}
      <main className="pt-28 pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto bg-white border-2 border-black rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000000]"
        >
          {/* Back to dashboard button */}
          <div className="flex items-center justify-start mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to dashboard</span>
            </button>
          </div>

          {/* Report Title Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-black">
            <span className="font-fragment text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              PERFORMANCE AUDIT
            </span>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight mt-1 mb-2">
              Full Interview Report
            </h1>
            <p className="font-radio text-stone-500 text-sm sm:text-base">
              Comprehensive analysis generated from your practice rounds.
            </p>
          </div>

          {/* 1. OVERALL READINESS SCORE */}
          <section className="mb-10 text-center bg-stone-50/70 rounded-2xl border-2 border-black p-6 shadow-xs">
            <span className="font-fragment text-xs font-bold text-stone-500 uppercase tracking-widest block mb-1">
              OVERALL READINESS SCORE
            </span>
            <div className="font-radio font-extrabold text-5xl sm:text-6xl" style={{ color: overallColor }}>
              {overallScore}<span className="text-stone-400 font-medium text-2xl">/10</span>
            </div>
            <p className="font-radio text-xs text-stone-600 mt-2 max-w-sm mx-auto">
              Computed across {rounds.length} completed practice round types for {userProfile.targetPosition || 'Software Engineer'}.
            </p>
          </section>

          {/* 2. RECHARTS SCORES COMPARISON CHART */}
          <section className="mb-10 text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                ROUND SCORE COMPARISON
              </h2>
              <span className="font-radio text-[11px] text-stone-400">
                Completed rounds only
              </span>
            </div>

            <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-6 shadow-xs">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completedChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
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
                      formatter={(val) => [`${val} / 10`, 'Score']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #000000',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                      {completedChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fillColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* 3. BEST & WORST ANSWER HIGHLIGHTS */}
          <section className="mb-10 text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A]">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                ANSWER HIGHLIGHTS
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {/* Single Best-scored Answer */}
              {bestAnswer && (
                <div className="p-5 rounded-2xl border-2 border-[#2F8F6E] bg-emerald-50/40 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-radio font-extrabold text-xs text-[#2F8F6E] uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#2F8F6E]" />
                      SINGLE BEST-SCORED ANSWER ({bestAnswer.roundName})
                    </span>
                    <span className="font-radio font-extrabold text-base text-[#2F8F6E]">
                      {bestAnswer.score} / 10
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-black mb-1">
                    "{bestAnswer.title}"
                  </h3>
                  <p className="font-radio text-xs text-stone-700 leading-relaxed">
                    {bestAnswer.feedback}
                  </p>
                </div>
              )}

              {/* Single Worst-scored Answer */}
              {worstAnswer && (
                <div className="p-5 rounded-2xl border-2 border-[#C0533F] bg-red-50/30 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-radio font-extrabold text-xs text-[#C0533F] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#C0533F]" />
                      HIGHEST PRIORITY IMPROVEMENT ({worstAnswer.roundName})
                    </span>
                    <span className="font-radio font-extrabold text-base text-[#C0533F]">
                      {worstAnswer.score} / 10
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-black mb-1">
                    "{worstAnswer.title}"
                  </h3>
                  <p className="font-radio text-xs text-stone-700 leading-relaxed">
                    {worstAnswer.feedback}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 4. STAR METHOD BREAKDOWN (Condition: Only if Behavioral round exists) */}
          {behavioralRound && (
            <section className="mb-10 text-left">
              <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
                <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                  STAR METHOD BREAKDOWN
                </h2>
                <span className="font-radio text-[11px] text-stone-400">
                  Behavioral Round Analysis
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Situation', val: behavioralRound.starBreakdown.situation },
                  { label: 'Task', val: behavioralRound.starBreakdown.task },
                  { label: 'Action', val: behavioralRound.starBreakdown.action },
                  { label: 'Result', val: behavioralRound.starBreakdown.result }
                ].map((item, idx) => {
                  const itemColor = getScoreColor(item.val)
                  return (
                    <div key={idx} className="p-3.5 rounded-xl border-2 border-black bg-white shadow-xs text-center">
                      <span className="font-fragment text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                        {item.label}
                      </span>
                      <span className="font-radio font-extrabold text-lg" style={{ color: itemColor }}>
                        {item.val}
                      </span>
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.val / 10) * 100}%`,
                            backgroundColor: itemColor
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 5. EXPANDED AREAS TO IMPROVE */}
          <section className="text-left">
            <div className="pb-2 mb-4 border-b border-[#1A1A1A] flex items-center justify-between">
              <h2 className="font-radio font-extrabold text-xs text-[#1A1A1A] uppercase tracking-widest">
                DETAILED ACTIONABLE RECOMMENDATIONS
              </h2>
              <span className="font-radio text-[11px] text-stone-400">
                Generated from your last 3 rounds
              </span>
            </div>

            <div className="flex flex-col gap-4 font-radio text-xs text-stone-800 leading-relaxed">
              <div className="p-4 rounded-xl border border-stone-300 bg-stone-50/50">
                <p className="font-bold text-sm text-black mb-1">
                  1. Communication: Explain reasoning aloud, not just the final answer
                </p>
                <p className="text-stone-600">
                  During technical coding questions, vocalize your thoughts while building the algorithm. Interviewers evaluate how you break down complex logic step-by-step before committing to code.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-stone-300 bg-stone-50/50">
                <p className="font-bold text-sm text-black mb-1">
                  2. Technical Depth: System design fundamentals
                </p>
                <p className="text-stone-600">
                  Strengthen core concepts in distributed caching strategies, load balancer tradeoffs, and database indexing rules under high concurrency.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-stone-300 bg-stone-50/50">
                <p className="font-bold text-sm text-black mb-1">
                  3. Pacing: Quantitative reasoning under time pressure
                </p>
                <p className="text-stone-600">
                  Structure Fermi estimation and market sizing problems into explicit formulas before computing numerical values to avoid arithmetic bottlenecks.
                </p>
              </div>
            </div>
          </section>

          {/* Bottom Back Button */}
          <div className="mt-10 pt-6 border-t border-stone-200 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-black hover:bg-stone-800 text-white font-radio font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              ← Return to Dashboard
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
