import React, { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Navbar from '../components/Navbar'
import CRTMonitor from '../components/CRTMonitor'
import ScrollSequenceScreen from '../components/ScrollSequenceScreen'
import FloppyDiskModal from '../components/FloppyDiskModal'
import AuthScreen from '../components/AuthScreen'
import HowItWorksSection from '../components/HowItWorksSection'
import FeaturesSection from '../components/FeaturesSection'
import ReviewsSection from '../components/ReviewsSection'
import Footer from '../components/Footer'

export default function LandingPage() {
  const containerRef = useRef(null)
  const driveSlotRef = useRef(null)

  // Scroll Progress Tracking for the sticky hero section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  // Map scroll progress (0 to 1) to step index (0 to 4)
  const [currentStep, setCurrentStep] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // 5 steps: 0.00-0.20, 0.20-0.40, 0.40-0.60, 0.60-0.80, 0.80-1.00
    let step = Math.floor(latest * 5)
    if (step > 4) step = 4
    if (step !== currentStep) {
      setCurrentStep(step)
    }
  })

  // State management for Floppy Disk & Form Insertion
  const [isFloppyVisible, setIsFloppyVisible] = useState(false)
  const [isDiskInserted, setIsDiskInserted] = useState(false)
  const [authMode, setAuthMode] = useState('signup') // 'signup' | 'login'

  const handleStartPreparingClick = () => {
    setIsFloppyVisible(true)
  }

  const handleFloppyOptionSelect = (mode) => {
    setAuthMode(mode)
    setIsDiskInserted(true)
    setIsFloppyVisible(false)
  }

  const handleEjectDisk = () => {
    setIsDiskInserted(false)
    setIsFloppyVisible(true)
  }

  // Fade out scroll indicator arrow when scrolling past the sticky monitor
  const arrowOpacity = useTransform(scrollYProgress, [0.75, 0.95], [1, 0])

  return (
    <div className="min-h-screen bg-cream-100 text-retro-black relative selection:bg-retro-crimson selection:text-white">
      {/* Fixed Top Navbar */}
      <Navbar onStartClick={handleStartPreparingClick} />

      {/* Tall Hero Section driving the sticky CRT monitor experience */}
      <div ref={containerRef} className="relative h-[350vh]">
        {/* Sticky Centered Monitor Section */}
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center pt-20 px-4 overflow-hidden">
          
          {/* CRT Monitor Graphic & Screen Container */}
          <div className="w-full max-w-4xl">
            <CRTMonitor driveSlotRef={driveSlotRef} isDiskInside={isDiskInserted}>
              {isDiskInserted ? (
                <AuthScreen initialMode={authMode} onEject={handleEjectDisk} />
              ) : (
                <ScrollSequenceScreen
                  step={currentStep}
                  onStartPreparing={handleStartPreparingClick}
                />
              )}
            </CRTMonitor>
          </div>

          {/* Below Monitor: Scroll Down Label with Arrow */}
          <motion.div
            style={{ opacity: arrowOpacity }}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-4 flex flex-col items-center gap-1.5 text-retro-black/60 font-mono text-xs cursor-pointer select-none"
            onClick={() => {
              const element = document.getElementById('how-it-works')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            <span className="uppercase tracking-widest text-[11px] font-medium font-fragment">Scroll down</span>
            <ChevronDown className="w-4 h-4 text-parker-red animate-bounce" />
          </motion.div>
        </div>
      </div>

      {/* Additional Page Sections Below Hero */}
      <div className="relative z-20 bg-cream-100">
        <HowItWorksSection />
        <FeaturesSection />
        <ReviewsSection />
        <Footer onStartClick={handleStartPreparingClick} />
      </div>

      {/* Floppy Disk Modal Interaction */}
      <FloppyDiskModal
        isVisible={isFloppyVisible}
        driveSlotRef={driveSlotRef}
        onSelectOption={handleFloppyOptionSelect}
        onClose={() => setIsFloppyVisible(false)}
      />
    </div>
  )
}
