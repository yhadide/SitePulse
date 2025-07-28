import { useState } from 'react'
import Dashboard from './components/Dashboard'
import SiteDetail from './components/SiteDetail'
import './App.css'

export interface Site {
  name: string
  type: string
  url: string
  perf_budget: {
    lcp_ms: number
    tbt_ms: number
    perf_score: number
    uptime_threshold: number
  }
  tags: string[]
}

export interface UptimeResult {
  timestamp: string
  site: string
  url: string
  status_code: number | null
  response_ms: number | null
  success: boolean
  error: string | null
}

export interface PerformanceResult {
  timestamp: string
  site: string
  url: string
  success: boolean
  error: string | null
  metrics: {
    performance_score: number
    lcp_ms: number
    tbt_ms: number
    cls: number
    fcp_ms: number
    speed_index: number
  } | null
  budget_violations: string[]
}

function App() {
  const [selectedSite, setSelectedSite] = useState<string | null>(null)

  // Add a simple test to see if React is working
  console.log('App component loaded!')

  return (
    <div className="app">
      <div style={{ padding: '20px', background: 'white', margin: '20px' }}>
        <h1>SitePulse Dashboard Test</h1>
        <p>If you see this, React is working!</p>
      </div>
      {selectedSite ? (
        <SiteDetail 
          siteName={selectedSite} 
          onBack={() => setSelectedSite(null)} 
        />
      ) : (
        <Dashboard onSiteSelect={setSelectedSite} />
      )}
    </div>
  )
}

export default App
