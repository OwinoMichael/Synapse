import { cn } from '@/lib/utils'

type BadgeVariant = 'yellow' | 'red' | 'purple' | 'amber'

interface BadgeProps {
  children: React.ReactNode
  variant: BadgeVariant
  className?: string
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  )
}