'use client'

import { useState } from 'react'
import { GlassCard } from '../components/ui/GlassCard'
import { Navbar }    from '../components/dashboard/Navbar'

interface ToggleProps {
  on: boolean
  onChange: (v: boolean) => void
}

function Toggle({ on, onChange }: ToggleProps) {
  return (
    <div
      className={`settings-toggle${on ? ' on' : ''}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onChange(!on)}
    />
  )
}

export default function SettingsPage() {
  // Data sources
  const [clobEnabled,   setClobEnabled]   = useState(true)
  const [gammaEnabled,  setGammaEnabled]  = useState(true)
  const [serperEnabled, setSerperEnabled] = useState(true)
  const [valyuEnabled,  setValyuEnabled]  = useState(false)

  // AI engine
  const [model,       setModel]       = useState('claude-sonnet-4-6')
  const [threshold,   setThreshold]   = useState(5)
  const [autoAnalysis,setAutoAnalysis]= useState(true)

  // Alerts
  const [highAlerts,  setHighAlerts]  = useState(true)
  const [monAlerts,   setMonAlerts]   = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [slackAlerts, setSlackAlerts] = useState(false)

  // Display
  const [perPage,     setPerPage]     = useState('50')
  const [defaultCat,  setDefaultCat]  = useState('All')
  const [animations,  setAnimations]  = useState(true)

  return (
    <main className="page-wrapper">
      <Navbar />

      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure Synapse to match your workflow</p>
      </div>

      <div className="settings-grid">

        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">DATA SOURCES</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">Polymarket CLOB WebSocket</p>
                  <p className="settings-desc">Live order book and trade stream</p>
                </div>
                <Toggle on={clobEnabled} onChange={setClobEnabled} />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Polymarket Gamma API</p>
                  <p className="settings-desc">Market metadata and categories</p>
                </div>
                <Toggle on={gammaEnabled} onChange={setGammaEnabled} />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Serper News Scraper</p>
                  <p className="settings-desc">Real-time news for AI comparison</p>
                </div>
                <Toggle on={serperEnabled} onChange={setSerperEnabled} />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Valyu Sentiment API</p>
                  <p className="settings-desc">Social sentiment scoring</p>
                </div>
                <Toggle on={valyuEnabled} onChange={setValyuEnabled} />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">AI ENGINE</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">Model</p>
                  <p className="settings-desc">LLM used for mismatch analysis</p>
                </div>
                <select className="settings-select" value={model} onChange={e => setModel(e.target.value)}>
                  <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                </select>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Trigger threshold</p>
                  <p className="settings-desc">Price move % to fire Deep Research agent</p>
                </div>
                <div className="settings-input-wrap">
                  <input className="settings-input" type="number" value={threshold}
                    min={1} max={20} onChange={e => setThreshold(Number(e.target.value))} />
                  <span className="settings-input-unit">%</span>
                </div>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Auto-analysis</p>
                  <p className="settings-desc">Trigger AI on every threshold breach</p>
                </div>
                <Toggle on={autoAnalysis} onChange={setAutoAnalysis} />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">ALERTS</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">High confidence alerts</p>
                  <p className="settings-desc">Notify on gap &gt; 20%</p>
                </div>
                <Toggle on={highAlerts} onChange={setHighAlerts} />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Monitor alerts</p>
                  <p className="settings-desc">Notify on gap 5–20%</p>
                </div>
                <Toggle on={monAlerts} onChange={setMonAlerts} />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Email notifications</p>
                  <p className="settings-desc">Send alerts to your inbox</p>
                </div>
                <Toggle on={emailAlerts} onChange={setEmailAlerts} />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Slack webhook</p>
                  <p className="settings-desc">Push signals to a Slack channel</p>
                </div>
                <Toggle on={slackAlerts} onChange={setSlackAlerts} />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">DISPLAY</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">Markets per page</p>
                  <p className="settings-desc">Rows shown in Markets Browser</p>
                </div>
                <select className="settings-select" value={perPage} onChange={e => setPerPage(e.target.value)}>
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Default category</p>
                  <p className="settings-desc">Filter shown on Markets load</p>
                </div>
                <select className="settings-select" value={defaultCat} onChange={e => setDefaultCat(e.target.value)}>
                  <option>All</option>
                  <option>Politics</option>
                  <option>Crypto</option>
                  <option>AI / Tech</option>
                </select>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Animations</p>
                  <p className="settings-desc">Shimmer and glow effects</p>
                </div>
                <Toggle on={animations} onChange={setAnimations} />
              </div>
            </div>
          </div>
        </GlassCard>

      </div>
    </main>
  )
}