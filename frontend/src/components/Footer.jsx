import React from 'react'
import { Terminal, Heart } from 'lucide-react'

export default function Footer({ onStartClick }) {
  return (
    <footer className="bg-white border-t-2 border-black py-12 px-6 mt-16 text-black font-radio">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-serif italic font-bold text-2xl text-parker-red">
            InterviewOS
          </span>
          <span className="text-xs font-fragment text-stone-500">
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm font-bold">
          <a href="#how-it-works" className="hover:text-parker-red transition-colors">
            How it works
          </a>
          <a href="#features" className="hover:text-parker-red transition-colors">
            Features
          </a>
          <a href="#reviews" className="hover:text-parker-red transition-colors">
            Reviews
          </a>
        </div>

        {/* Action */}
        <button
          onClick={onStartClick}
          className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl border border-black shadow-[3px_3px_0px_0px_#F42615] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
        >
          Boot Mock Interview →
        </button>
      </div>
    </footer>
  )
}
