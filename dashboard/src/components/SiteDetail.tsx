import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface SiteDetailProps {
  siteName: string
  onBack: () => void
}

interface HistoricalData {
  timestamp: string
  performance_score: number
  lcp_ms: number
  tbt_ms: number
  cls: number
  success: boolean
  budget_violations: string[]
}

const SiteDetail = ({ siteName, onBack }: SiteDetailProps) => {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistoricalData()
  }, [siteName])

  const loadHistoricalData = async () => {
    try {
      setLoading(true)
      
      // Try to load historical performance data
      const response = await fetch(`./data/perf/perf-summary-${siteName}.json`)
      if (response.ok) {
        const data = await response.json()
        setHistoricalData(data.slice(-50)) // Last 50 data points
      } else {
        // If no historical data, create sample data
        setHistoricalData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load historical data')
    } finally {
      setLoading(false)
    }
  }

  const createChartData = (dataKey: keyof HistoricalData, label: string, color: string) => {
    const labels = historicalData.map(d => 
      new Date(d.timestamp).toLocaleDateString()
    )
    
    const data = historicalData.map(d => d[dataKey] as number)
    
    return {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: color,
          backgroundColor: color + '20',
          tension: 0.1,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (loading) {
    return (
      <div className="site-detail">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="loading">Loading site details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="site-detail">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="site-detail">
      <button className="back-button" onClick={onBack}>
        ← Back to Dashboard
      </button>
      
      <div className="detail-header">
        <h1 className="detail-title">{siteName}</h1>
        <p>Performance trends and metrics</p>
      </div>

      {historicalData.length === 0 ? (
        <div className="error">
          No historical data available yet. Data will appear after the first Lighthouse audit runs.
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">Performance Score</h3>
            <Line 
              data={createChartData('performance_score', 'Performance Score', '#3b82f6')} 
              options={chartOptions} 
            />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Largest Contentful Paint (ms)</h3>
            <Line 
              data={createChartData('lcp_ms', 'LCP (ms)', '#10b981')} 
              options={chartOptions} 
            />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Total Blocking Time (ms)</h3>
            <Line 
              data={createChartData('tbt_ms', 'TBT (ms)', '#f59e0b')} 
              options={chartOptions} 
            />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Cumulative Layout Shift</h3>
            <Line 
              data={createChartData('cls', 'CLS', '#ef4444')} 
              options={chartOptions} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SiteDetail