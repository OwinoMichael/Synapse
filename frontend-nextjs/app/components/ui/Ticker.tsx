'use client'

interface TickerItem { id: string; text: string }

export function Ticker({ items }: { items: TickerItem[] }) {
  const doubled = [...items, ...items]
  return (
    <div className="glass ticker-wrap">
      <span className="ticker-label">AI SIGNAL</span>
      <div className="ticker-overflow">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <span key={`${item.id}-${i}`} className="ticker-item">
              ⚡ {item.text}
              <span className="ticker-sep">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}