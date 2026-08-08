import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CreateInterview from './pages/CreateInterview'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import FullReport from './pages/FullReport'
import TechnicalRound from './pages/TechnicalRound'
import BehavioralRound from './pages/BehavioralRound'
import AptitudeRound from './pages/AptitudeRound'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes */}
        <Route
          path="/create-interview"
          element={
            <ProtectedRoute>
              <CreateInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/full-report"
          element={
            <ProtectedRoute>
              <FullReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technical-round"
          element={
            <ProtectedRoute>
              <TechnicalRound />
            </ProtectedRoute>
          }
        />
        <Route
          path="/behavioral-round"
          element={
            <ProtectedRoute>
              <BehavioralRound />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aptitude-round"
          element={
            <ProtectedRoute>
              <AptitudeRound />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
