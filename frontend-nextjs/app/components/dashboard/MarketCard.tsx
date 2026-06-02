import { GlassCard } from '../ui/GlassCard'

export interface Market {
  id: string
  question: string
  category: string
  yesProb: number
  signal: { type: 'high' | 'monitor' | 'normal' | 'none'; text: string }
}

const dotColor = {
  high:    'var(--red)',
  monitor: 'var(--amber)',
  normal:  'var(--purple-light)',
  none:    'var(--yellow)',
}

export function MarketCard({ market }: { market: Market }) {
  const { question, category, yesProb, signal } = market
  return (
    <GlassCard>
      <div className="market-card">
        <div>
          <p className="market-question">{question}</p>
          <p className="market-category">{category}</p>
        </div>
        <div className="market-probs">
          <div className="prob-row">
            <span className="prob-label">YES</span>
            <span className="prob-value-yes">{yesProb}%</span>
          </div>
          <div className="prob-bar">
            <div className="prob-fill" style={{ width: `${yesProb}%` }} />
          </div>
          <div className="prob-row">
            <span className="prob-label">NO</span>
            <span className="prob-value-no">{100 - yesProb}%</span>
          </div>
        </div>
        <div className="market-signal">
          <span className="signal-dot" style={{ background: dotColor[signal.type] }} />
          <span className="market-signal-text">{signal.text}</span>
        </div>
      </div>
    </GlassCard>
  )
}