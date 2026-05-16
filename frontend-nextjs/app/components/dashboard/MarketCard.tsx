import { GlassCard } from '../ui/GlassCard'

export interface Market {
  id: string
  question: string
  category: string
  yesProb: number
  signal: {
    type: 'high' | 'monitor' | 'normal' | 'none'
    text: string
  }
}

const signalDotColor = {
  high:    'var(--red)',
  monitor: 'var(--amber)',
  normal:  'var(--purple-light)',
  none:    'var(--yellow)',
}

export function MarketCard({ market }: { market: Market }) {
  const { question, category, yesProb, signal } = market
  const noProb = 100 - yesProb

  return (
    <GlassCard className="p-3 flex flex-col gap-2">
      <div>
        <p
          className="font-sans text-[11px] font-medium leading-snug mb-0.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {question}
        </p>
        <p
          className="font-mono text-[9px] tracking-wider"
          style={{ color: 'var(--text-dim)' }}
        >
          {category}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>YES</span>
          <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--yellow)' }}>
            {yesProb}%
          </span>
        </div>
        <div className="prob-bar">
          <div className="prob-fill" style={{ width: `${yesProb}%` }} />
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>NO</span>
          <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--red)' }}>
            {noProb}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '0.5px solid var(--border-dim)' }}>
        <span
          className="signal-dot"
          style={{ background: signalDotColor[signal.type] }}
        />
        <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
          {signal.text}
        </span>
      </div>
    </GlassCard>
  )
}