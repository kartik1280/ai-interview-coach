import React from 'react'
import { motion } from 'framer-motion'
import { Zap, ShieldCheck, BarChart3, MessageSquare, Mic, Sparkles } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Adaptive AI Roleplay',
      desc: 'The AI interviewer asks follow-ups based on your exact answers, testing depth and consistency.'
    },
    {
      icon: Zap,
      title: 'STAR Method Analysis',
      desc: 'Get scored on Situation, Task, Action, and Result formatting for high-impact story delivery.'
    },
    {
      icon: BarChart3,
      title: 'Detailed Score Reports',
      desc: 'Visual breakdown of confidence, clarity, technical accuracy, and areas for improvement.'
    },
    {
      icon: Mic,
      title: 'Voice & Speech Feedback',
      desc: 'Analyzes pace, filler words ("um", "like"), tone, and response conciseness in real-time.'
    },
    {
      icon: ShieldCheck,
      title: 'Role-Specific Prompts',
      desc: 'Tailored for Software Engineers, Product Managers, Designers, Data Scientists, and Management.'
    },
    {
      icon: Sparkles,
      title: 'Unlimited Practice Mock Runs',
      desc: 'Re-take interviews as many times as you need until your responses feel natural under pressure.'
    }
  ]

  return (
    <section id="features" className="py-24 px-6 max-w-6xl mx-auto border-t border-black/10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-block px-3 py-1 bg-parker-red text-white font-fragment text-xs font-bold rounded-md mb-3 shadow-sm uppercase tracking-wider">
          SYSTEM CAPABILITIES
        </div>
        <h2 className="font-radio text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          Everything You Need to Ace the Interview
        </h2>
        <p className="font-radio text-base text-stone-600 mt-3">
          Built specifically to turn raw preparation into calm, confident delivery.
        </p>
      </div>

      {/* Grid of 6 feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white border-2 border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-parker-black text-white flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-radio font-bold text-lg text-black mb-2">
                  {item.title}
                </h3>
                <p className="font-radio text-sm text-stone-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
