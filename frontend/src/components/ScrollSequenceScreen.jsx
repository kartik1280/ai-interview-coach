import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'

export default function ScrollSequenceScreen({ step, onStartPreparing }) {
  // Lines matching the exact requested sequence
  const sequenceLines = [
    "You've read every article.",
    "Memorized every framework.",
    "But you've never heard yourself answer under pressure.",
    "Until now.",
    "Meet your mock interviewer."
  ]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative font-fragment text-stone-200">
      {/* Top Retro CRT Status Bar - 90s B&W TV Style */}
      <div className="absolute top-2.5 left-4 right-4 flex items-center justify-between text-[11px] text-stone-400 font-mono tracking-widest border-b border-stone-800 pb-1.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-parker-red inline-block" />
          SYS_OS v4.2
        </span>
        <span className="flex items-center gap-1.5 text-stone-300">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          ONLINE
        </span>
      </div>

      {/* Dynamic Scroll Sequence Content - Radio Canada Big Font */}
      <div className="w-full max-w-lg min-h-[170px] flex flex-col items-center justify-center my-auto">
        <AnimatePresence mode="wait">
          {step < 4 ? (
            // Steps 0 through 3 (Fades out when scrolling to next step)
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -18, filter: 'blur(6px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-center px-4"
            >
              <p className="text-xl sm:text-2.5xl font-radio font-medium tracking-tight leading-relaxed text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                "{sequenceLines[step]}"
              </p>

              {/* Progress Indicator Dots */}
              <div className="flex justify-center items-center gap-2 mt-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step
                        ? 'w-6 bg-white shadow-[0_0_10px_#FFFFFF]'
                        : 'w-1.5 bg-stone-700'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            // Final Step (Step 4): "Meet your mock interviewer." + "Start preparing" button
            <motion.div
              key="final-cta"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
              className="text-center px-4 flex flex-col items-center gap-4"
            >
              <h2 className="text-2xl sm:text-3xl font-radio font-bold text-white tracking-tight drop-shadow-[0_0_18px_rgba(255,255,255,0.6)]">
                Meet your mock interviewer.
              </h2>

              <p className="text-sm font-radio text-stone-300 max-w-md leading-relaxed">
                Realistic AI roleplay tailored to your target job title, resume experience, and high-pressure scenario questions.
              </p>

              {/* Start preparing Button - 90s B&W TV High Contrast White Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(255, 255, 255, 0.7)' }}
                whileTap={{ scale: 0.96 }}
                onClick={onStartPreparing}
                className="mt-2 group relative inline-flex items-center gap-3 px-7 py-3 rounded-full bg-white text-black font-radio font-bold text-base shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all cursor-pointer hover:bg-stone-200"
              >
                <span>Start preparing</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Terminal Footer Prompt - Fragment Mono */}
      <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-[10px] text-stone-500 font-fragment">
        <span className="flex items-center gap-1.5">
          <Play className="w-2.5 h-2.5 fill-stone-400 text-stone-400" />
          AWAITING_INPUT
        </span>
        <span>STEP {Math.min(step + 1, 5)} OF 5</span>
      </div>
    </div>
  )
}
