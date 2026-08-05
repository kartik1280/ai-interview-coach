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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-interview" element={<CreateInterview />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/full-report" element={<FullReport />} />
        <Route path="/technical-round" element={<TechnicalRound />} />
        <Route path="/behavioral-round" element={<BehavioralRound />} />
        <Route path="/aptitude-round" element={<AptitudeRound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
