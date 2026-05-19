import { GlassCard } from '../components/ui/GlassCard'
import { Navbar } from '../components/dashboard/Navbar'

export default function SettingsPage() {
  return (
    <main className="page-wrapper">
      <Navbar />

      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure Synapse to match your workflow</p>
      </div>

      <div className="settings-grid">

        {/* Data Sources */}
        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">Data Sources</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">Polymarket CLOB WebSocket</p>
                  <p className="settings-desc">Live order book and trade stream</p>
                </div>
                <div className="settings-toggle on" />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Polymarket Gamma API</p>
                  <p className="settings-desc">Market metadata and categories</p>
                </div>
                <div className="settings-toggle on" />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Serper News Scraper</p>
                  <p className="settings-desc">Real-time news for AI comparison</p>
                </div>
                <div className="settings-toggle on" />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Valyu Sentiment API</p>
                  <p className="settings-desc">Social sentiment scoring</p>
                </div>
                <div className="settings-toggle" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* AI Engine */}
        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">AI Engine</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">Model</p>
                  <p className="settings-desc">LLM used for mismatch analysis</p>
                </div>
                <select className="settings-select">
                  <option>claude-sonnet-4-6</option>
                  <option>gpt-4o</option>
                  <option>gpt-4-turbo</option>
                </select>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Trigger threshold</p>
                  <p className="settings-desc">Price move % to fire Deep Research agent</p>
                </div>
                <div className="settings-input-wrap">
                  <input className="settings-input" type="number" defaultValue={5} min={1} max={20} />
                  <span className="settings-input-unit">%</span>
                </div>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Auto-analysis</p>
                  <p className="settings-desc">Trigger AI on every threshold breach</p>
                </div>
                <div className="settings-toggle on" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Alerts */}
        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">Alerts</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">High confidence alerts</p>
                  <p className="settings-desc">Notify on gap &gt; 20%</p>
                </div>
                <div className="settings-toggle on" />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Monitor alerts</p>
                  <p className="settings-desc">Notify on gap 5–20%</p>
                </div>
                <div className="settings-toggle on" />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Email notifications</p>
                  <p className="settings-desc">Send alerts to your inbox</p>
                </div>
                <div className="settings-toggle" />
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-label">Slack webhook</p>
                  <p className="settings-desc">Push signals to a Slack channel</p>
                </div>
                <div className="settings-toggle" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Display */}
        <GlassCard>
          <div className="settings-section">
            <p className="settings-section-title">Display</p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <p className="settings-label">Markets per page</p>
                  <p className="settings-desc">Rows shown in Markets Browser</p>
                </div>
                <select className="settings-select">
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
                <select className="settings-select">
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
                <div className="settings-toggle on" />
              </div>
            </div>
          </div>
        </GlassCard>

      </div>
    </main>
  )
}