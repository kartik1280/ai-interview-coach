import React, { useState } from 'react'
import { signUp, signIn } from '../services/authservice'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { UserPlus, LogIn, Disc, CheckCircle, Terminal, Eye, EyeOff } from 'lucide-react'

export default function AuthScreen({ initialMode = 'signup', onEject }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode) // 'signup' | 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    if (mode === 'signup') {
      await signUp(
        formData.email,
        formData.password
      )
    } else {
      await signIn(
        formData.email,
        formData.password
      )
    }

    setSubmitted(true)

    setTimeout(() => {
      navigate('/create-interview')
    }, 1200)

  } catch (error) {
    console.error('Authentication error:', error)
    alert(error.message)
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 sm:p-4 text-stone-200 font-mono text-xs overflow-y-auto crt-scrollbar animate-crt-turn-on">
      {/* Top Header / Mode Switcher */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-white">
          <Terminal className="w-4 h-4 text-stone-300" />
          <span className="font-bold tracking-wider uppercase text-xs text-white">
            {mode === 'signup' ? 'NEW USER REGISTRATION' : 'SYSTEM LOGIN'}
          </span>
        </div>

        <button
          onClick={onEject}
          className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-white transition-colors cursor-pointer"
          title="Eject Floppy Disk"
        >
          <Disc className="w-3 h-3" />
          <span>EJECT</span>
        </button>
      </div>

      {submitted ? (
        // Post-submit Booting State
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="my-auto py-6 flex flex-col items-center justify-center text-center gap-3"
        >
          <CheckCircle className="w-10 h-10 text-white animate-bounce" />
          <h3 className="text-base font-serif font-bold text-white tracking-wide">
            BOOT SEQUENCE INITIALIZED
          </h3>
          <p className="text-xs text-stone-300 max-w-xs">
            Welcome, {formData.name || formData.email || 'Candidate'}! Loading personalized interview environment...
          </p>
          <div className="w-48 h-2 bg-[#1C1C1C] border border-stone-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-white animate-pulse w-3/4" />
          </div>
        </motion.div>
      ) : (
        // Form Content
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2.5 my-auto">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] text-stone-400 uppercase font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#181818] border border-stone-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
            )}

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] text-stone-400 uppercase font-semibold">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="candidate@interview.ai"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#181818] border border-stone-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
              />
            </div>

            {/* Password input with toggleable Eye icon */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] text-stone-400 uppercase font-semibold">
                Password
              </label>
              <div className="relative w-full flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#181818] border border-stone-700 rounded pl-2.5 pr-8 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 text-stone-400 hover:text-white transition-colors p-1 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-stone-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded bg-white hover:bg-stone-200 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>BOOTING SYSTEM...</span>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>INITIALIZE SYSTEM</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>AUTHENTICATE</span>
                </>
              )}
            </button>

            {/* Toggle Link between Login / Signup */}
            <div className="text-center text-[10px] text-stone-400 pt-1">
              {mode === 'signup' ? (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="underline text-white hover:text-stone-300 cursor-pointer"
                  >
                    Log in here
                  </button>
                </span>
              ) : (
                <span>
                  Don't have a floppy session?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="underline text-white hover:text-stone-300 cursor-pointer"
                  >
                    Sign up here
                  </button>
                </span>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
