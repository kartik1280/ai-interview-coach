import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, UploadCloud, X, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

export default function CreateInterview() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    targetPosition: '',
    industry: ''
  })

  const [file, setFile] = useState({
    name: 'Sameer_Resume.pdf',
    size: '312 KB'
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileUpload = (e) => {
    const uploaded = e.target.files?.[0]
    if (uploaded) {
      setFile({
        name: uploaded.name,
        size: `${Math.round(uploaded.size / 1024)} KB`
      })
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsGenerating(true)

    // Simulate interview environment generation
    setTimeout(() => {
      setIsGenerating(false)
      setGenerated(true)

      // Automatically transition directly to Dashboard with user profile state
      setTimeout(() => {
        navigate('/dashboard', {
          state: {
            fullName: formData.fullName || 'Sameer Mishra',
            targetPosition: formData.targetPosition || 'Frontend Developer',
            industry: formData.industry || 'Tech'
          }
        })
      }, 1200)
    }, 1400)
  }

  return (
    <div className="min-h-screen bg-[#FCF5E2] text-black font-radio selection:bg-parker-red selection:text-white">
      <main className="pt-12 sm:pt-16 pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto bg-white border-2 border-black rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000000]"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-black tracking-tight mb-2">
              Create Interview
            </h1>
            <p className="font-radio text-stone-500 text-sm sm:text-base">
              Tell us who you are and what you're preparing for.
            </p>
          </div>

          {generated ? (
            // Success State (Auto-redirects to /dashboard)
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-500 shadow-sm animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-black">
                Interview Environment Ready!
              </h2>
              <p className="text-sm text-stone-600 max-w-md">
                We've built a personalized mock interview based on your profile for <strong className="text-black">{formData.targetPosition || 'Frontend Developer'}</strong> in the <strong className="text-black">{formData.industry || 'Tech'}</strong> industry.
              </p>
              
              <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-stone-100 border border-stone-300 rounded-full text-xs font-bold text-stone-700">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>Redirecting to your Dashboard...</span>
              </div>
            </motion.div>
          ) : (
            // Form Content
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
              {/* SECTION 1: YOUR DETAILS */}
              <div>
                <div className="flex items-center gap-3 mb-4 pb-1 border-b-2 border-black">
                  <h2 className="font-radio font-extrabold text-sm text-black uppercase tracking-wider">
                    YOUR DETAILS
                  </h2>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Sameer Mishra"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-black placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-xs"
                    />
                  </div>

                  {/* 2-Column: Target Position & Industry Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* TARGET POSITION Select */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        TARGET POSITION
                      </label>
                      <select
                        name="targetPosition"
                        required
                        value={formData.targetPosition}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-xs cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                      >
                        <option value="" disabled>Select Target Position...</option>
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="Data Analyst">Data Analyst</option>
                        <option value="Data Engineer">Data Engineer</option>
                        <option value="Product Manager">Product Manager</option>
                      </select>
                    </div>

                    {/* INDUSTRY Select */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        INDUSTRY
                      </label>
                      <select
                        name="industry"
                        required
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-xs cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                      >
                        <option value="" disabled>Select Industry...</option>
                        <option value="Tech">Tech</option>
                        <option value="Finance">Finance</option>
                        <option value="E-Commerce">E-Commerce</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                        <option value="Education & EdTech">Education & EdTech</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: RESUME */}
              <div>
                <div className="flex items-center gap-3 mb-4 pb-1 border-b-2 border-black">
                  <h2 className="font-radio font-extrabold text-sm text-black uppercase tracking-wider">
                    RESUME
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Dropzone */}
                  <label className="border-2 border-dashed border-stone-400 rounded-2xl p-6 text-center bg-stone-50/60 hover:bg-stone-100/80 transition-colors cursor-pointer block">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-1">
                      <h3 className="font-serif font-bold text-base text-black">
                        Drop your resume here
                      </h3>
                      <p className="text-xs text-stone-500">
                        or click to browse · PDF, DOCX up to 10MB
                      </p>
                    </div>
                  </label>

                  {/* Uploaded File Preview Card */}
                  {file && (
                    <div className="bg-white border-2 border-black rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 border border-stone-200">
                          <FileText className="w-5 h-5 text-stone-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-black leading-tight">
                            {file.name}
                          </p>
                          <p className="text-xs text-stone-400">
                            {file.size}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-xs font-bold text-parker-red hover:underline cursor-pointer px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="mt-2 w-full bg-black hover:bg-stone-800 active:scale-[0.99] text-white font-radio font-bold text-base py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin text-amber-400" />
                    <span>Building Personalized Interview...</span>
                  </>
                ) : (
                  <span>Generate my interview →</span>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  )
}
