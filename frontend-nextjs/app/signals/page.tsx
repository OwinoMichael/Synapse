import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { Navbar } from '../components/dashboard/Navbar'

const signals = [
  {
    id: '1',
    time: '14:32:01',
    market: 'Will the Fed cut rates in June 2026?',
    category: 'Politics',
    marketOdds: 78,
    aiEstimate: 43,
    gap: '+35%',
    confidence: 'high',
    summary: 'Market pricing a cut at 78% but scraped news and Fed minutes show only 43% implied probability. Large divergence detected — possible overreaction to last week\'s CPI print.',
  },
  {
    id: '2',
    time: '14:18:44',
    market: 'Will OpenAI go public before 2027?',
    category: 'AI / Tech',
    marketOdds: 69,
    aiEstimate: 48,
    gap: '+21%',
    confidence: 'high',
    summary: 'Odds jumped 12% in 2hrs. No corroborating news found. Social sentiment neutral. Possible coordinated buying or rumour-driven spike.',
  },
  {
    id: '3',
    time: '13:55:17',
    market: 'Will BTC reach $100k before July 2026?',
    category: 'Crypto',
    marketOdds: 61,
    aiEstimate: 50,
    gap: '+11%',
    confidence: 'monitor',
    summary: 'Moderate gap between market and AI estimate. On-chain volume declining while odds remain elevated. Worth watching for mean reversion.',
  },
  {
    id: '4',
    time: '13:40:09',
    market: 'Will Trump approve new crypto legislation?',
    category: 'Politics',
    marketOdds: 52,
    aiEstimate: 49,
    gap: '+3%',
    confidence: 'monitor',
    summary: 'Minor gap within noise threshold. Keeping on watchlist given high trade volume on this market.',
  },
  {
    id: '5',
    time: '12:59:33',
    market: 'Will S&P 500 hit 7000 by year end?',
    category: 'Politics',
    marketOdds: 57,
    aiEstimate: 55,
    gap: '+2%',
    confidence: 'normal',
    summary: 'Market and AI estimate closely aligned. Sentiment and financial news both support current pricing.',
  },
  {
    id: '6',
    time: '12:11:22',
    market: 'Will GPT-5 release before August 2026?',
    category: 'AI / Tech',
    marketOdds: 44,
    aiEstimate: 46,
    gap: '-2%',
    confidence: 'normal',
    summary: 'AI estimate slightly above market. Insider commentary on X suggests August is likely — market may catch up.',
  },
]

const confidenceConfig: Record<string, { badge: 'red'|'amber'|'purple'; label: string; accent: string }> = {
  high:    { badge: 'red',    label: 'HIGH CONFIDENCE', accent: '#FF3A6E' },
  monitor: { badge: 'amber',  label: 'MONITOR',         accent: '#F5A623' },
  normal:  { badge: 'purple', label: 'NORMAL',          accent: '#C084FC' },
}

export default function SignalsPage() {
  return (
    <main className="page-wrapper">
      <Navbar />

      <div className="signals-header">
        <div>
          <h1 className="page-title">Signal Feed</h1>
          <p className="page-subtitle">AI-detected mismatches between market odds and real-world data</p>
        </div>
        <div className="signals-stats">
          <div className="signals-stat">
            <span className="signals-stat-val" style={{ color: '#FF3A6E' }}>2</span>
            <span className="signals-stat-label">High confidence</span>
          </div>
          <div className="signals-stat">
            <span className="signals-stat-val" style={{ color: '#F5A623' }}>2</span>
            <span className="signals-stat-label">Monitoring</span>
          </div>
          <div className="signals-stat">
            <span className="signals-stat-val" style={{ color: '#C084FC' }}>2</span>
            <span className="signals-stat-label">Normal</span>
          </div>
        </div>
      </div>

      <div className="signals-list">
        {signals.map((s) => {
          const cfg = confidenceConfig[s.confidence]
          return (
            <GlassCard key={s.id}>
              <div className="signal-card">
                <div className="signal-card-top">
                  <div className="signal-card-left">
                    <div className="signal-card-meta">
                      <span className="signal-time">{s.time}</span>
                      <span className="signal-category">{s.category}</span>
                    </div>
                    <p className="signal-market">{s.market}</p>
                    <p className="signal-summary">{s.summary}</p>
                  </div>
                  <div className="signal-card-right">
                    <Badge variant={cfg.badge}>{cfg.label}</Badge>
                    <div className="signal-odds-wrap">
                      <div className="signal-odds-row">
                        <span className="signal-odds-label">Market</span>
                        <span className="signal-odds-val" style={{ color: '#F1FF58' }}>{s.marketOdds}%</span>
                      </div>
                      <div className="signal-odds-row">
                        <span className="signal-odds-label">AI Est.</span>
                        <span className="signal-odds-val" style={{ color: '#C084FC' }}>{s.aiEstimate}%</span>
                      </div>
                      <div className="signal-odds-divider" />
                      <div className="signal-odds-row">
                        <span className="signal-odds-label">Gap</span>
                        <span
                          className="signal-gap"
                          style={{ color: s.gap.startsWith('+') ? '#FF3A6E' : '#F1FF58' }}
                        >
                          {s.gap}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="signal-card-bar">
                  <div className="signal-bar-track">
                    <div className="signal-bar-fill" style={{ width: `${s.marketOdds}%`, background: '#F1FF58' }} />
                  </div>
                  <div className="signal-bar-track" style={{ marginTop: 4 }}>
                    <div className="signal-bar-fill" style={{ width: `${s.aiEstimate}%`, background: '#C084FC' }} />
                  </div>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </main>
  )
}