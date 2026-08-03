import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, LogIn, Disc, X } from 'lucide-react'

export default function FloppyDiskModal({
  isVisible,
  driveSlotRef,
  onSelectOption,
  onClose
}) {
  const [animStage, setAnimStage] = useState('idle') // 'idle' | 'aligning' | 'inserting'
  const [targetDelta, setTargetDelta] = useState({ x: -280, y: -250 })

  const handleOptionClick = (mode) => {
    // 1. Calculate precise vector to the monitor's drive slot opening
    if (driveSlotRef && driveSlotRef.current) {
      const slotRect = driveSlotRef.current.getBoundingClientRect()
      const slotCenterX = slotRect.left + slotRect.width / 2
      const slotCenterY = slotRect.top + slotRect.height / 2

      // Floppy container element position
      const diskElem = document.getElementById('floppy-disk-container')
      if (diskElem) {
        const diskRect = diskElem.getBoundingClientRect()
        const diskCenterX = diskRect.left + diskRect.width / 2
        const diskCenterY = diskRect.top + diskRect.height / 2

        setTargetDelta({
          x: slotCenterX - diskCenterX,
          y: slotCenterY - diskCenterY
        })
      }
    }

    // Step 1: Align with drive slot (rotate to 0 deg and slide towards slot)
    setAnimStage('aligning')

    // Step 2: Slide directly INTO the slot opening
    setTimeout(() => {
      setAnimStage('inserting')
    }, 400)

    // Step 3: Trigger complete & swap CRT screen
    setTimeout(() => {
      onSelectOption(mode)
      setAnimStage('idle')
    }, 850)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="floppy-disk-container"
          initial={{ opacity: 0, y: 150, rotate: 18, scale: 0.8 }}
          animate={
            animStage === 'idle'
              ? {
                  opacity: 1,
                  y: 0,
                  x: 0,
                  rotate: 12,
                  scale: 1,
                  transition: { type: 'spring', stiffness: 220, damping: 18 }
                }
              : animStage === 'aligning'
              ? {
                  x: targetDelta.x,
                  y: targetDelta.y + 40,
                  rotate: 0,
                  scale: 0.75,
                  opacity: 1,
                  transition: { duration: 0.38, ease: 'easeOut' }
                }
              : {
                  // 'inserting': slides straight up into the slot aperture & shrinks in thickness
                  x: targetDelta.x,
                  y: targetDelta.y - 10,
                  scaleY: 0.08,
                  scaleX: 0.65,
                  opacity: 0,
                  transition: { duration: 0.42, ease: [0.32, 0, 0.67, 0] }
                }
          }
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          className="fixed bottom-6 right-6 z-50 select-none"
        >
          {/* Floppy Disk Outer Frame - heyparker.ai exact purple floppy styling */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 drop-shadow-[0_25px_50px_rgba(0,0,0,0.4)] group">
            
            {/* Close button */}
            {animStage === 'idle' && (
              <button
                onClick={onClose}
                className="absolute -top-2.5 -left-2.5 z-30 w-7 h-7 rounded-full bg-parker-black text-white flex items-center justify-center border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer"
                title="Close disk"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Photorealistic Purple 3.5" Floppy Disk Body */}
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#8C85D4] via-[#7F78C5] to-[#5C559E] p-4 border-2 border-purple-300/40 flex flex-col justify-between shadow-floppy relative overflow-hidden">
              
              {/* Top Notch & Write Protect Slider */}
              <div className="w-full flex items-center justify-between z-10">
                <div className="w-4 h-5 bg-[#3B366E] rounded-xs border border-purple-900/60 shadow-inner" />
                <div className="text-[10px] font-fragment font-bold text-purple-100/90 tracking-widest uppercase">
                  3.5" MF2-HD DISKETTE
                </div>
                <div className="w-3.5 h-3.5 bg-parker-yellow rounded-xs border border-yellow-600/50 shadow-sm" />
              </div>

              {/* Metal Shutter Panel with Interactive Buttons (heyparker.ai style) */}
              <div className="relative my-2 w-full bg-gradient-to-r from-[#E0E0E0] via-[#F8F8F8] to-[#C2C2C2] rounded-lg p-3 border border-stone-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),_0_4px_10px_rgba(0,0,0,0.3)] z-20">
                {/* Shutter Metal Slider & Label Details */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-300">
                  <div className="w-10 h-2 bg-parker-yellow rounded-xs shadow-inner" />
                  <span className="text-[9px] font-fragment font-extrabold text-stone-800 tracking-wider">
                    PARKER_BOOT.DSK
                  </span>
                </div>

                {/* Shutter Panel Buttons: Sign Up & Log In */}
                <div className="grid grid-cols-2 gap-2 font-radio">
                  <button
                    onClick={() => handleOptionClick('signup')}
                    disabled={animStage !== 'idle'}
                    className="flex items-center justify-center gap-1.5 bg-parker-red hover:bg-red-600 active:scale-95 text-white font-bold text-xs py-2 px-3 rounded shadow-sm border border-red-700 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign up</span>
                  </button>

                  <button
                    onClick={() => handleOptionClick('login')}
                    disabled={animStage !== 'idle'}
                    className="flex items-center justify-center gap-1.5 bg-parker-black hover:bg-black active:scale-95 text-white font-bold text-xs py-2 px-3 rounded shadow-sm border border-stone-800 transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log in</span>
                  </button>
                </div>
              </div>

              {/* Floppy Label Sticker */}
              <div className="relative w-full bg-[#FCF5E2] rounded-md p-2.5 border border-purple-200 text-parker-black shadow-inner z-10 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-radio font-bold text-parker-red">
                  <span className="flex items-center gap-1">
                    <Disc className="w-3.5 h-3.5 text-parker-purple animate-spin" />
                    AI COACH BOOT DISK
                  </span>
                  <span className="font-fragment">1.44 MB</span>
                </div>
                <div className="w-full h-1.5 bg-purple-100 rounded flex gap-1 p-0.5">
                  <div className="w-3/4 h-full bg-parker-red rounded-xs" />
                </div>
                <p className="text-[9px] font-fragment text-stone-600">
                  Insert into CRT drive slot to boot session.
                </p>
              </div>

              {/* Bottom Grip Ridge */}
              <div className="w-full flex justify-center gap-2 pt-1 opacity-50 z-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-6 h-1 bg-[#3B366E] rounded-full" />
                ))}
              </div>

              {/* Background Photorealistic Floppy Texture Overlay */}
              <img
                src="/assets/purple_floppy_disk.jpg"
                alt="Purple Floppy Disk"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-35 pointer-events-none"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
