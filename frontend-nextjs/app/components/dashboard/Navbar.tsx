'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Markets',   href: '/markets' },
  { label: 'Signals',   href: '/signals' },
  { label: 'Settings',  href: '/settings' },
]

export function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="navbar">
      <span className="navbar-logo">SYNAPSE</span>
      <div className="navbar-nav">
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item${pathname === href ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="navbar-live">
        <span className="signal-dot live" style={{ background: 'var(--yellow)' }} />
        Live
      </div>
    </nav>
  )
}