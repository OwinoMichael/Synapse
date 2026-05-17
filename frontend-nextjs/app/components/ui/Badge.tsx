type BadgeVariant = 'yellow' | 'red' | 'purple' | 'amber'

interface BadgeProps {
  children: React.ReactNode
  variant: BadgeVariant
}

export function Badge({ children, variant }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}