import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CreateInterview from './pages/CreateInterview'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import FullReport from './pages/FullReport'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-interview" element={<CreateInterview />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/full-report" element={<FullReport />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
