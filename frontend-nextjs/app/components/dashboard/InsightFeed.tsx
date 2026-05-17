import { GlassCard } from '../ui/GlassCard'
import { Badge } from '../ui/Badge'

export interface Insight {
  id: string
  time: string
  text: string
  signal: 'high' | 'monitor' | 'normal'
}

const config = {
  high:    { accentColor: 'var(--red)',          badgeVariant: 'red'    as const, label: 'HIGH CONFIDENCE' },
  monitor: { accentColor: 'var(--amber)',        badgeVariant: 'amber'  as const, label: 'MONITOR'         },
  normal:  { accentColor: 'var(--purple-light)', badgeVariant: 'purple' as const, label: 'NORMAL'          },
}

export function InsightFeed({ insights }: { insights: Insight[] }) {
  return (
    <GlassCard>
      <div className="insight-card">
        <p className="insight-section-label">AI INSIGHTS</p>
        <div className="insight-list">
          {insights.map((insight) => {
            const c = config[insight.signal]
            return (
              <div
                key={insight.id}
                className="glass-inset insight-item"
                style={{ borderLeftColor: c.accentColor }}
              >
                <span className="insight-time">{insight.time}</span>
                <p className="insight-text">{insight.text}</p>
                <Badge variant={c.badgeVariant}>{c.label}</Badge>
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}