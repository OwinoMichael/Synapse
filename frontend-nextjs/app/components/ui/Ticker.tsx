'use client'

interface TickerItem {
  id: string
  text: string
}

interface TickerProps {
  items: TickerItem[]
}

export function Ticker({ items }: TickerProps) {
  const doubled = [...items, ...items]

  return (
    <div
      className="glass flex items-center gap-3 px-4 py-2 overflow-hidden"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      <span
        className="font-mono text-[10px] font-bold tracking-widest shrink-0"
        style={{ color: 'var(--purple-light)' }}
      >
        AI SIGNAL
      </span>

      <div className="overflow-hidden flex-1">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="font-mono text-[11px] pr-12"
              style={{ color: 'var(--yellow)' }}
            >
              ⚡ {item.text}
              <span
                className="mx-6"
                style={{ color: 'var(--border-subtle)' }}
              >
                |
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}