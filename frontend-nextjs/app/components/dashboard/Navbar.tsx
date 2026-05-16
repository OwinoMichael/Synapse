'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Markets',   href: '/markets' },
  { label: 'Signals',   href: '/signals' },
  { label: 'Settings',  href: '/settings' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-between mb-5">
      <span
        className="font-mono text-lg font-bold tracking-[3px]"
        style={{ color: 'var(--yellow)' }}
      >
        SYNAPSE
      </span>

      <div className="flex gap-1">
        {navItems.map(({ label, href }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'font-mono text-[11px] px-3 py-1.5 rounded transition-colors',
                active
                  ? 'glass text-yellow border-[0.5px]'
                  : 'text-secondary hover:text-primary'
              )}
              style={{
                color: active ? 'var(--yellow)' : 'var(--text-secondary)',
                borderColor: active ? 'var(--border-subtle)' : 'transparent',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="signal-dot live"
          style={{ background: 'var(--yellow)' }}
        />
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
          Live
        </span>
      </div>
    </nav>
  )
}