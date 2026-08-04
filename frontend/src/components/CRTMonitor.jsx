import React, { useState } from 'react'

export default function CRTMonitor({
  children,
  driveSlotRef,
  isDiskInside = false,
  isPoweredOn: externalPoweredOn,
  onTogglePower: externalTogglePower
}) {
  const [internalPoweredOn, setInternalPoweredOn] = useState(true)

  const isPoweredOn = externalPoweredOn !== undefined ? externalPoweredOn : internalPoweredOn
  const handleTogglePower = () => {
    if (externalTogglePower) {
      externalTogglePower()
    } else {
      setInternalPoweredOn((prev) => !prev)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl flex flex-col items-center select-none">
      {/* Macintosh / Vintage Monitor Housing - heyparker.ai cream beige */}
      <div className="relative w-full aspect-[4/3.1] max-w-[760px] bg-[#ECE4CE] rounded-[32px] border-4 border-[#DCD1BA] p-5 sm:p-7 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.25),_inset_0_2px_4px_rgba(255,255,255,0.9),_inset_0_-6px_14px_rgba(0,0,0,0.15)] flex flex-col justify-between">
        
        {/* Bezel Frame Top Badge & Interactive Power Button */}
        <div className="w-full flex items-center justify-between px-3 pb-3 border-b border-[#D4C9B2]">
          <div className="flex items-center gap-2">
            {/* Apple style rainbow / retro icon */}
            <div className="w-4 h-4 rounded-sm bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 flex items-center justify-center text-[9px] font-bold text-white shadow-inner">
              
            </div>
            <span className="font-radio text-xs font-bold text-[#635B4C] tracking-widest uppercase">
              Macintosh SE / Parker OS
            </span>
          </div>

          {/* Interactive Functional Power Button & LED */}
          <button
            onClick={handleTogglePower}
            className="flex items-center gap-2 font-fragment group px-2 py-1 rounded-md hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            title={isPoweredOn ? "Click to Power OFF CRT Screen" : "Click to Power ON CRT Screen"}
          >
            <span className={`text-[10px] uppercase font-bold transition-colors ${
              isPoweredOn ? 'text-[#5C5446]' : 'text-stone-400'
            }`}>
              POWER
            </span>
            <div className={`w-3 h-3 rounded-full border transition-all duration-300 ${
              isPoweredOn
                ? 'bg-white border-stone-300 shadow-[0_0_10px_#FFFFFF] animate-pulse'
                : 'bg-stone-700 border-stone-800 shadow-none'
            }`} />
          </button>
        </div>

        {/* CRT Screen Frame & Display Area - 90s B&W TV Screen */}
        <div className={`relative my-3 w-full flex-1 rounded-2xl p-4 sm:p-6 border-[6px] border-[#C8BEAA] transition-all duration-500 overflow-hidden flex flex-col justify-center items-center ${
          isPoweredOn
            ? 'bg-[#111111] shadow-[inset_0_0_50px_rgba(0,0,0,0.95),_inset_0_0_20px_rgba(255,255,255,0.15)] crt-overlay crt-vignette'
            : 'bg-[#050505] shadow-[inset_0_0_50px_rgba(0,0,0,0.98)]'
        }`}>
          
          {/* Inner Phosphor Screen Container */}
          {isPoweredOn ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center crt-flicker relative z-20 animate-crt-turn-on">
              {children}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center relative z-20 text-stone-700 font-mono text-xs select-none">
              {/* Off TV phosphor dot center highlight */}
              <div className="w-1.5 h-1.5 rounded-full bg-stone-600/40 blur-[1px]" />
            </div>
          )}

          {/* Curvature Reflection Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/8 to-transparent pointer-events-none rounded-t-xl z-30" />
        </div>

        {/* Lower Monitor Casing & Floppy Disk Drive Slot */}
        <div className="w-full pt-2 flex flex-col items-center gap-2 relative">
          {/* Vents */}
          <div className="w-full flex justify-center gap-1.5 opacity-40">
            {[...Array(26)].map((_, i) => (
              <div key={i} className="w-1.5 h-3 bg-[#A59C8B] rounded-full shadow-inner" />
            ))}
          </div>

          {/* Disk Drive Slot Graphic */}
          <div className="w-full flex items-center justify-between px-6">
            <div className="text-[11px] font-fragment text-[#6B6354] tracking-wider uppercase font-semibold">
              FD-800K DISK DRIVE
            </div>

            {/* 3.5" Floppy Disk Drive Slot Receiving Aperture */}
            <div
              ref={driveSlotRef}
              id="floppy-drive-slot"
              className={`relative w-48 h-5 bg-[#141210] rounded-sm border border-[#3A352F] shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)] flex items-center justify-between px-2 transition-all ${
                isDiskInside && isPoweredOn ? 'bg-purple-950/90 border-purple-400 shadow-[0_0_12px_rgba(127,120,197,0.5)]' : ''
              }`}
            >
              {/* Internal Metal Ejector Flap Slot opening where disk physically inserts */}
              <div className="relative w-full h-2 bg-[#2A2520] rounded-full shadow-inner overflow-hidden flex items-center justify-center">
                {isDiskInside && isPoweredOn && (
                  <div className="w-full h-full bg-parker-purple rounded animate-pulse shadow-[0_0_8px_#7F78C5]" />
                )}
              </div>

              {/* Physical Eject Button */}
              <div className="ml-2 w-3 h-2.5 bg-[#8C8370] rounded-xs border border-[#595345] shadow-xs cursor-pointer hover:bg-[#A8A08E] active:translate-y-0.5" />
            </div>
          </div>
        </div>

      </div>

      {/* Monitor Shadow on Desktop Stand */}
      <div className="w-4/5 h-5 bg-black/15 rounded-full blur-md mt-2" />
    </div>
  )
}
