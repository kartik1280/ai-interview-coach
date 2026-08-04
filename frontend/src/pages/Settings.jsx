import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Sliders, LogOut, ShieldAlert, Save, CheckCircle2, User, Bell, Volume2, Sparkles, Moon } from 'lucide-react'

export default function Settings() {
  const navigate = useNavigate()
  const location = useLocation()

  // Initial user state
  const [profile, setProfile] = useState({
    fullName: location.state?.fullName || 'Sameer Mishra',
    email: location.state?.email || 'sameer.mishra@example.com',
    targetPosition: location.state?.targetPosition || 'Frontend Developer',
    industry: location.state?.industry || 'Tech'
  })

  // Preference toggles
  const [voiceFeedback, setVoiceFeedback] = useState(true)
  const [interviewRigor, setInterviewRigor] = useState('High Pressure')
  const [themeMode, setThemeMode] = useState('90s B&W TV')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSaveSettings = (e) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF5E2] text-black font-radio selection:bg-parker-red selection:text-white">
      {/* Settings Top Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_#000000] flex items-center justify-between">
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard') }} className="font-serif italic font-bold text-2xl tracking-tight text-parker-red">
            InterviewOS
          </a>

          {/* Nav Options */}
          <div className="flex items-center gap-6 font-radio text-sm font-bold text-black">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-stone-500 hover:text-black transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button className="flex items-center gap-1.5 text-black border-b-2 border-black pb-0.5 cursor-pointer">
              <Sliders className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Settings Container */}
      <main className="pt-28 pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto bg-white border-2 border-black rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000000]"
        >
          {/* Header */}
          <div className="text-center mb-8 pb-4 border-b-2 border-black">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-black tracking-tight mb-2">
              Settings & Preferences
            </h1>
            <p className="font-radio text-stone-500 text-sm sm:text-base">
              Manage your account profile, interview difficulty, and session controls.
            </p>
          </div>

          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-800 text-sm font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Settings updated successfully!</span>
            </motion.div>
          )}

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-8 text-left">
            {/* SECTION 1: ACCOUNT PROFILE */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-1 border-b border-stone-300">
                <User className="w-4 h-4 text-stone-600" />
                <h2 className="font-radio font-extrabold text-xs text-black uppercase tracking-wider">
                  ACCOUNT PROFILE
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={profile.fullName}
                    onChange={handleChange}
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Target Position
                    </label>
                    <input
                      type="text"
                      name="targetPosition"
                      value={profile.targetPosition}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Target Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={profile.industry}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <button
              type="submit"
              className="bg-black hover:bg-stone-800 text-white font-radio font-bold text-sm py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </form>

          {/* SECTION 3: LOGOUT & DANGER ZONE */}
          <div className="mt-10 pt-6 border-t-2 border-stone-200">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-parker-red" />
              <h2 className="font-radio font-extrabold text-xs text-parker-red uppercase tracking-wider">
                SESSION & DANGER ZONE
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border-2 border-red-200 bg-red-50/40">
              <div>
                <p className="font-bold text-sm text-black">Log Out of Account</p>
                <p className="text-xs text-stone-500">Sign out of your active session and return to landing page</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto bg-parker-red hover:bg-red-600 active:scale-95 text-white font-radio font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
