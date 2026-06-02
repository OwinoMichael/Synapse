'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge }   from '../components/ui/Badge'
import { Navbar }  from '../components/dashboard/Navbar'
import { useMarketTick } from '../hooks/useMarketTick'
import { fetchMarkets, type ApiMarket } from '../../lib/api'

const CATEGORIES = ['All', 'Politics', 'Crypto', 'AI / Tech', 'Sports', 'Weather', 'Science', 'Other']
const FILTERS    = ['Hot', 'Rising', 'New', 'Closing Soon', 'High Volume']

const signalDot:   Record<string, string>                           = { high:'#FF3A6E', monitor:'#F5A623', normal:'#C084FC', none:'#F1FF58' }
const signalBadge: Record<string, 'red'|'amber'|'purple'|'yellow'> = { high:'red', monitor:'amber', normal:'purple', none:'yellow' }
const signalLabel: Record<string, string>                           = { high:'Mismatch', monitor:'Monitor', normal:'Aligned', none:'Stable' }

// Derive "signal" from yesPrice — placeholder until signals feature feeds this
function deriveSignal(m: ApiMarket): string {
  // Will be replaced by actual signal from signals API
  return 'none'
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

function formatClosing(endDate: string | null): string {
  if (!endDate) return '—'
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff < 0) return 'Closed'
  const days = Math.floor(diff / 86400000)
  if (days < 1)   return '<1d'
  if (days < 30)  return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

// ── Sparkline using real yes price ────────────────────────────────
function Sparkline({ yes, conditionId }: { yes: number; conditionId: string }) {
  const { tick } = useMarketTick(conditionId)
  // Show live tick price if available, else use current yes
  const liveYes = tick ? Math.round(tick.yesPrice * 100) : yes
  const pos = liveYes >= yes  // positive if current >= initial

  const pts = Array.from({ length: 8 }, (_, i) => {
    const noise = Math.sin(i * 1.3 + yes) * 2
    return Math.max(10, Math.min(90, yes + noise))
  })
  const w = 60, h = 24
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
  const svgPts = pts.map((v, i) =>
    `${(i / (pts.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={svgPts} fill="none"
        stroke={pos ? '#F1FF58' : '#FF3A6E'}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── Live market card — uses WS tick for real-time YES% ────────────
function MarketCard({ m, maxVol, signal }: { m: ApiMarket; maxVol: number; signal: string }) {
  const { tick } = useMarketTick(m.conditionId)
  const yes  = tick ? Math.round(tick.yesPrice * 100) : Math.round(m.yesPrice * 100)
  const no   = 100 - yes
  const tags: string[] = []
  if (m.volume24h > 500_000) tags.push('High Volume')
  if (yes > 70 || yes < 30)  tags.push('Hot')

  return (
    <div className="mkt-card glass">
      {tags.length > 0 && (
        <div className="mkt-tags">
          {tags.slice(0, 2).map(t => <span key={t} className="mkt-tag">{t}</span>)}
        </div>
      )}
      <p className="mkt-question">{m.question}</p>
      <div className="mkt-meta">
        <span className="mkt-cat">{m.category}</span>
        <span className="mkt-closing">⏱ {formatClosing(m.endDate)}</span>
      </div>
      <div className="mkt-prob-row">
        <span className="mkt-yes">{yes}%</span>
        <div className="mkt-prob-track">
          <div className="mkt-prob-yes" style={{ width: `${yes}%` }} />
          <div className="mkt-prob-no"  style={{ width: `${no}%` }} />
        </div>
        <span className="mkt-no">{no}%</span>
      </div>
      <div className="mkt-bottom">
        <div className="mkt-stats">
          <span className="mkt-vol">{formatVolume(m.volume)}</span>
          <span className="mkt-trades">{formatVolume(m.volume24h)} 24h</span>
          {tick && (
            <span className="mkt-change" style={{ color: tick.side === 'BUY' ? '#F1FF58' : '#FF3A6E' }}>
              {tick.side === 'BUY' ? '▲' : '▼'} LIVE
            </span>
          )}
        </div>
        <Sparkline yes={yes} conditionId={m.conditionId} />
      </div>
      <div className="mkt-vol-bar">
        <div className="mkt-vol-fill" style={{ width: `${(m.volume / maxVol) * 100}%` }} />
      </div>
      <div className="mkt-signal-row">
        <span className="signal-dot" style={{ background: signalDot[signal] }} />
        <Badge variant={signalBadge[signal]}>{signalLabel[signal]}</Badge>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function MarketsPage() {
  const [markets,  setMarkets]  = useState<ApiMarket[]>([])
  const [loading,  setLoading]  = useState(true)
  const [category, setCategory] = useState('All')
  const [filter,   setFilter]   = useState('')
  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState<'vol'|'yes'|'change'|'trades'>('vol')
  const [view,     setView]     = useState<'cards'|'table'>('cards')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMarkets({ active: true, limit: 100 })
      setMarkets(data)
    } catch (e) {
      console.error('Failed to fetch markets:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = markets
    .filter(m => category === 'All' || m.category === category)
    .filter(m => !search || m.question.toLowerCase().includes(search.toLowerCase())
                          || m.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'vol')    return b.volume - a.volume
      if (sort === 'yes')    return b.yesPrice - a.yesPrice
      if (sort === 'change') return b.volume24h - a.volume24h
      return 0
    })

  const maxVol = Math.max(...filtered.map(m => m.volume), 1)

  return (
    <main className="page-wrapper">
      <Navbar />

      <div className="markets-page-header">
        <div>
          <h1 className="page-title">Markets</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${filtered.length} markets${category !== 'All' ? ` in ${category}` : ''}`}
          </p>
        </div>
        <div className="markets-controls">
          <input className="markets-search" type="text" placeholder="Search markets…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="markets-view-toggle">
            <button className={`view-btn${view === 'cards' ? ' active' : ''}`} onClick={() => setView('cards')}>⊞</button>
            <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>☰</button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`category-tab${category === cat ? ' active' : ''}`}
            onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="markets-toolbar">
        <div className="filter-chips">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(filter === f ? '' : f)}>
              {f}
            </button>
          ))}
        </div>
        <div className="sort-wrap">
          <span className="sort-label">Sort:</span>
          {(['vol','yes','change'] as const).map(s => (
            <button key={s} className={`sort-btn${sort === s ? ' active' : ''}`} onClick={() => setSort(s)}>
              {s === 'vol' ? 'Volume' : s === 'yes' ? 'YES %' : '24h Vol'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#7FA8A8', fontSize: 13 }}>
          Loading markets…
        </div>
      )}

      {/* Card grid */}
      {!loading && view === 'cards' && (
        <div className="markets-card-grid">
          {filtered.length === 0
            ? <div className="markets-empty">No markets match your filters.</div>
            : filtered.map(m => (
                <MarketCard key={m.id} m={m} maxVol={maxVol} signal={deriveSignal(m)} />
              ))
          }
        </div>
      )}

      {/* Table view */}
      {!loading && view === 'table' && (
        <div className="glass markets-table-wrap">
          {filtered.length === 0
            ? <div className="markets-empty">No markets match your filters.</div>
            : (
              <table className="markets-table">
                <thead>
                  <tr>
                    <th>MARKET</th><th>CAT</th><th>YES</th><th>NO</th>
                    <th>VOLUME</th><th>24H VOL</th><th>CLOSING</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const yes = Math.round(m.yesPrice * 100)
                    return (
                      <tr key={m.id} className="market-row">
                        <td className="market-row-question">{m.question}</td>
                        <td><span className="market-row-cat">{m.category}</span></td>
                        <td><span className="market-row-yes">{yes}%</span></td>
                        <td><span className="market-row-no">{100 - yes}%</span></td>
                        <td><span className="market-row-vol">{formatVolume(m.volume)}</span></td>
                        <td><span className="market-row-vol">{formatVolume(m.volume24h)}</span></td>
                        <td><span style={{ fontSize: 11, color: '#9ECECE' }}>{formatClosing(m.endDate)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      )}
    </main>
  )
}