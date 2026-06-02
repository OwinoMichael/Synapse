import { GlassCard } from './GlassCard'

type SignalColor = 'default' | 'yellow' | 'red' | 'purple' | 'amber'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  valueColor?: SignalColor
  subColor?: SignalColor
}

const colorMap: Record<SignalColor, string> = {
  default: '',
  yellow:  'color-yellow',
  red:     'color-red',
  purple:  'color-purple',
  amber:   'color-amber',
}

export function StatCard({ label, value, sub, valueColor = 'default', subColor = 'default' }: StatCardProps) {
  return (
    <GlassCard>
      <div className="stat-card">
        <span className="stat-label">{label}</span>
        <span className={['stat-value', colorMap[valueColor]].filter(Boolean).join(' ')}>{value}</span>
        {sub && <span className={['stat-sub', colorMap[subColor]].filter(Boolean).join(' ')}>{sub}</span>}
      </div>
    </GlassCard>
  )
}