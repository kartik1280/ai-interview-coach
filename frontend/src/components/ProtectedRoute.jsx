import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Terminal, ShieldAlert } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null) // null = loading, true/false
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. Check active session on mount
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
      } catch (err) {
        console.error('Error fetching auth session:', err)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // 2. Subscribe to auth state changes (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
      setIsLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Display CRT style loading screen while verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FCF5E2] text-black font-radio flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border-2 border-black rounded-3xl p-8 shadow-[6px_6px_0px_0px_#000000] flex flex-col items-center gap-4 max-w-sm">
          <Terminal className="w-10 h-10 text-parker-red animate-pulse" />
          <h2 className="font-serif font-bold text-xl text-black">
            Verifying Authentication...
          </h2>
          <p className="text-xs text-stone-500 font-mono">
            Checking session authorization tokens...
          </p>
          <div className="w-40 h-2 bg-stone-200 border border-black rounded-full overflow-hidden">
            <div className="h-full bg-black animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to landing page (/)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // If authenticated, render children components
  return children
}
