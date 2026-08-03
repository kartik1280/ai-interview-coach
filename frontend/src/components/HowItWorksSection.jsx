import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Cpu, Award, ArrowRight } from 'lucide-react'

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      icon: FileText,
      title: 'Upload Resume & Set Goal',
      description: 'Upload your resume PDF and enter your target job title. Our AI parses your exact work history and tech stack.'
    },
    {
      num: '02',
      icon: Cpu,
      title: 'Face AI Mock Interviewer',
      description: 'Answer high-pressure behavioral and technical questions in real-time. Practice under true interview conditions.'
    },
    {
      num: '03',
      icon: Award,
      title: 'Get Detailed Feedback Report',
      description: 'Receive instant score breakdowns, STAR framework analysis, and concrete tips on how to improve your answers.'
    }
  ]

  return (
    <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto border-t border-black/10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-block px-3 py-1 bg-[#141E15] text-[#72D184] font-fragment text-xs font-bold rounded-md mb-3 border border-[#72D184]/30 shadow-sm">
          /// THREE-STEP PROCESS
        </div>
        <h2 className="font-radio text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          How InterviewOS Works
        </h2>
        <p className="font-radio text-base text-stone-600 mt-3">
          From resume parsing to realistic roleplay, build confidence before stepping into the real room.
        </p>
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white border-2 border-black rounded-2xl p-7 shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-parker-red/10 border-2 border-parker-red flex items-center justify-center text-parker-red font-bold">
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="font-fragment font-extrabold text-2xl text-stone-300 group-hover:text-parker-red transition-colors">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-radio font-bold text-xl text-black mb-3">
                  {step.title}
                </h3>
                <p className="font-radio text-sm text-stone-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 flex items-center text-xs font-radio font-bold text-parker-red group-hover:translate-x-1 transition-transform">
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
