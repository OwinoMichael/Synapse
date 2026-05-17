type GlassVariant = 'base' | 'bright' | 'inset' | 'yellow' | 'red' | 'purple' | 'amber'

interface GlassCardProps {
  children: React.ReactNode
  variant?: GlassVariant
  className?: string
  onClick?: () => void
}

const variantClass: Record<GlassVariant, string> = {
  base:   'glass',
  bright: 'glass-bright',
  inset:  'glass-inset',
  yellow: 'glass glass-yellow',
  red:    'glass glass-red',
  purple: 'glass glass-purple',
  amber:  'glass glass-amber',
}

export function GlassCard({ children, variant = 'base', className, onClick }: GlassCardProps) {
  const classes = [variantClass[variant], className].filter(Boolean).join(' ')
  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}