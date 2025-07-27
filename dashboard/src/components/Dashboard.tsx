import { useState, useEffect } from 'react'
import type { Site, UptimeResult, PerformanceResult } from '../App'

interface DashboardProps {
  onSiteSelect: (siteName: string) => void
}

const Dashboard = ({ onSiteSelect }: DashboardProps) => {
  const [sites, setSites] = useState<Site[]>([])
  const [uptimeData, setUptimeData] = useState<UptimeResult[]>([])
  const [perfData, setPerfData] = useState<PerformanceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load sites config
      const sitesResponse = await fetch('./sites.yaml')
      const sitesText = await sitesResponse.text()
      // Simple YAML parsing for sites array
      const sitesMatch = sitesText.match(/sites:\s*([\s\S]*?)(?=\n\w|\n$|$)/)
      if (sitesMatch) {
        // This is a simplified parser - in production you'd use a proper YAML library
        const sitesSection = sitesMatch[1]
        const siteBlocks = sitesSection.split(/\n\s*-\s*name:/).slice(1)
        
        const parsedSites = siteBlocks.map(block => {
          const nameMatch = block.match(/(\S+)/)
          const typeMatch = block.match(/type:\s*(\S+)/)
          const urlMatch = block.match(/url:\s*(\S+)/)
          
          return {
            name: nameMatch?.[1] || '',
            type: typeMatch?.[1] || '',
            url: urlMatch?.[1] || '',
            perf_budget: {
              lcp_ms: 2500,
              tbt_ms: 300,
              perf_score: 80,
              uptime_threshold: 5000
            },
            tags: ['production']
          }
        })
        
        setSites(parsedSites)
      }

      // Load latest uptime data
      const uptimeResponse = await fetch('./data/uptime/uptime-latest.json')
      if (uptimeResponse.ok) {
        const uptimeJson = await uptimeResponse.json()
        setUptimeData(uptimeJson)
      }

      // Load latest performance data
      const perfResponse = await fetch('./data/perf/perf-latest.json')
      if (perfResponse.ok) {
        const perfJson = await perfResponse.json()
        setPerfData(perfJson)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getSiteStatus = (siteName: string) => {
    const uptime = uptimeData.find(u => u.site === siteName)
    const perf = perfData.find(p => p.site === siteName)
    
    if (!uptime) return { status: 'unknown', color: '#64748b' }
    
    if (!uptime.success) return { status: 'down', color: '#ef4444' }
    if (perf && perf.budget_violations.length > 0) return { status: 'warning', color: '#f59e0b' }
    
    return { status: 'up', color: '#10b981' }
  }

  const getSiteMetrics = (siteName: string) => {
    const uptime = uptimeData.find(u => u.site === siteName)
    const perf = perfData.find(p => p.site === siteName)
    
    return {
      responseTime: uptime?.response_ms || 0,
      perfScore: perf?.metrics?.performance_score || 0,
      lastCheck: uptime?.timestamp || new Date().toISOString()
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="header">
        <h1>SitePulse Dashboard</h1>
        <p>Free monitoring for WordPress & Shopify sites</p>
      </div>

      <div className="sites-grid">
        {sites.map(site => {
          const status = getSiteStatus(site.name)
          const metrics = getSiteMetrics(site.name)
          
          return (
            <div 
              key={site.name} 
              className="site-card"
              onClick={() => onSiteSelect(site.name)}
            >
              <div className="site-header">
                <div className="site-name">{site.name}</div>
                <div className="site-type">{site.type}</div>
              </div>
              
              <div className="site-url">{site.url}</div>
              
              <div className="status-row">
                <div className="status-indicator">
                  <div 
                    className="status-dot" 
                    style={{ backgroundColor: status.color }}
                  />
                  {status.status === 'up' ? 'Online' : 
                   status.status === 'down' ? 'Offline' : 
                   status.status === 'warning' ? 'Issues' : 'Unknown'}
                </div>
                <div className="metric-value">{metrics.responseTime}ms</div>
              </div>
              
              <div className="status-row">
                <div>Performance Score</div>
                <div className="metric-value">{metrics.perfScore}/100</div>
              </div>
              
              <div className="status-row">
                <div>Last Check</div>
                <div className="metric-value">
                  {new Date(metrics.lastCheck).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard