import React from 'react'

export default function Navbar({ onStartClick }) {
  const scrollToSection = (e, id) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
      {/* Floating White Pill Card Header with Hard Black Offset Shadow */}
      <div className="max-w-5xl mx-auto bg-white border-2 border-black rounded-2xl px-6 py-3 shadow-[5px_5px_0px_0px_#000000] flex items-center justify-between">
        
        {/* Red Serif Brand Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <span className="font-serif italic font-bold text-2.5xl tracking-tight text-parker-red">
            InterviewOS
          </span>
        </a>

        {/* Navigation Links - Connected via Smooth Scroll */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-radio font-bold text-black tracking-tight">
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="hover:text-parker-red transition-colors cursor-pointer"
          >
            How it works
          </a>
          <a
            href="#features"
            onClick={(e) => scrollToSection(e, 'features')}
            className="hover:text-parker-red transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#reviews"
            onClick={(e) => scrollToSection(e, 'reviews')}
            className="hover:text-parker-red transition-colors cursor-pointer"
          >
            Reviews
          </a>
        </nav>

        {/* Black Pill CTA Button */}
        <button
          onClick={onStartClick}
          className="bg-black hover:bg-stone-800 active:scale-95 text-white font-radio font-bold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Start preparing
        </button>
      </div>
    </header>
  )
}
