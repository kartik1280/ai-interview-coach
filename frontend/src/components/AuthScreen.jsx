import React, { useState } from 'react'
import { signUp, signIn } from '../services/authservice'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { UserPlus, LogIn, Disc, CheckCircle, Terminal, Eye, EyeOff, Mail, RefreshCw, Sparkles } from 'lucide-react'

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

  // Email verification waiting states
  const [isWaitingVerification, setIsWaitingVerification] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendToast, setResendToast] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        if (formData.name) {
          localStorage.setItem('candidate_name', formData.name)
        }
        const data = await signUp(formData.email, formData.password, {
          data: { name: formData.name }
        })

        const session = data?.session
        const user = data?.user

        if (session && user?.email_confirmed_at) {
          // If session is already established & confirmed -> navigate directly to /create-interview
          setSubmitted(true)
          setTimeout(() => {
            navigate('/create-interview')
          }, 1200)
        } else {
          // Display the Check Your Email for Verification screen
          setIsWaitingVerification(true)
        }
      } else {
        // System login
        await signIn(formData.email, formData.password)
        setSubmitted(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1200)
      }
    } catch (error) {
      console.error('Authentication error:', error)
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsCheckingStatus(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && (session.user?.email_confirmed_at || session.access_token)) {
        setIsWaitingVerification(false)
        setSubmitted(true)
        setTimeout(() => {
          navigate('/create-interview')
        }, 1000)
      } else {
        alert(`Email verification not yet confirmed. Please open your inbox (${formData.email}) and click the verification link.`)
      }
    } catch (err) {
      console.error('Verification check error:', err)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      await signUp(formData.email, formData.password, {
        data: { name: formData.name }
      })
      setResendToast(true)
      setTimeout(() => setResendToast(false), 3000)
    } catch (err) {
      console.error('Resend email error:', err)
      alert(`Resend failed: ${err.message}`)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 sm:p-4 text-stone-200 font-mono text-xs overflow-y-auto crt-scrollbar animate-crt-turn-on">
      {/* Top Header / Mode Switcher */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-white">
          <Terminal className="w-4 h-4 text-stone-300" />
          <span className="font-bold tracking-wider uppercase text-xs text-white">
            {isWaitingVerification ? 'EMAIL VERIFICATION REQUIRED' : mode === 'signup' ? 'NEW USER REGISTRATION' : 'SYSTEM LOGIN'}
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

      {isWaitingVerification ? (
        // Check Your Email for Verification Screen
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="my-auto py-3 px-1 flex flex-col items-center justify-center text-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center border border-stone-700 shadow-md relative">
            <Mail className="w-6 h-6 text-amber-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">
              CHECK YOUR EMAIL FOR VERIFICATION
            </h3>
            <p className="text-[11px] text-stone-300 mt-1.5 max-w-xs leading-relaxed">
              We have sent a verification link to your email address:<br />
              <strong className="text-amber-300 underline block mt-0.5">{formData.email}</strong>
            </p>
          </div>

          <div className="w-full bg-[#181818] border border-stone-800 rounded-lg p-2.5 flex flex-col gap-1 text-left text-[11px]">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Verification Pending</span>
            </div>
            <p className="text-stone-400 text-[10px] leading-normal">
              Please open your email inbox, click the verification link to confirm your account, and then log in.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full pt-1">
            <button
              onClick={handleCheckVerification}
              disabled={isCheckingStatus}
              className="w-full py-2 px-3 rounded bg-white hover:bg-stone-200 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-stone-800 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              <span>{isCheckingStatus ? 'VERIFYING...' : 'I HAVE VERIFIED MY EMAIL'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="py-1.5 px-2 rounded border border-stone-700 hover:bg-stone-800 text-stone-300 font-semibold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Mail className="w-3 h-3 text-stone-400" />
                <span>{isResending ? 'SENDING...' : 'RESEND EMAIL'}</span>
              </button>

              <button
                onClick={() => {
                  setIsWaitingVerification(false)
                  setMode('login')
                }}
                className="py-1.5 px-2 rounded border border-stone-700 hover:bg-stone-800 text-stone-300 font-semibold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <LogIn className="w-3 h-3 text-stone-400" />
                <span>GO TO LOGIN</span>
              </button>
            </div>

            {resendToast && (
              <p className="text-[10px] text-emerald-400 font-bold animate-pulse">
                ✓ Verification email resent! Check your inbox.
              </p>
            )}
          </div>
        </motion.div>
      ) : submitted ? (
        // Post-submit Booting State
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="my-auto py-6 flex flex-col items-center justify-center text-center gap-3"
        >
          <CheckCircle className="w-10 h-10 text-white animate-bounce" />
          <h3 className="text-base font-serif font-bold text-white tracking-wide">
            AUTHENTICATION VERIFIED
          </h3>
          <p className="text-xs text-stone-300 max-w-xs">
            Welcome, {formData.name || formData.email || 'Candidate'}! Redirecting...
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
                  <span>SIGN UP & VERIFY EMAIL</span>
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
                  New candidate?{' '}
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
