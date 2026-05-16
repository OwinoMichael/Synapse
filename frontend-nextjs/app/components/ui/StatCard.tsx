import { GlassCard } from './GlassCard'
import { cn } from '@/lib/utils'

type SignalColor = 'default' | 'yellow' | 'red' | 'purple' | 'amber'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  valueColor?: SignalColor
  subColor?: SignalColor
}

const colorClass: Record<SignalColor, string> = {
  default: 'text-primary',
  yellow:  'text-yellow',
  red:     'text-red',
  purple:  'text-purple',
  amber:   'text-amber',
}

export function StatCard({ label, value, sub, valueColor = 'default', subColor = 'default' }: StatCardProps) {
  return (
    <GlassCard className="p-4 flex flex-col gap-1">
      <span
        className="font-mono text-[10px] tracking-widest"
        style={{ color: 'var(--text-dim)' }}
      >
        {label}
      </span>
      <span
        className={cn('font-mono text-2xl font-bold leading-tight', colorClass[valueColor])}
      >
        {value}
      </span>
      {sub && (
        <span className={cn('font-mono text-[10px]', colorClass[subColor])}>
          {sub}
        </span>
      )}
    </GlassCard>
  )
}