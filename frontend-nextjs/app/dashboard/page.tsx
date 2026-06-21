'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { Navbar }      from '../components/dashboard/Navbar'
import { Ticker }      from '../components/ui/Ticker'
import { StatCard }    from '../components/ui/StatCard'
import { InsightFeed } from '../components/dashboard/InsightFeed'
import type { Insight } from '../components/dashboard/InsightFeed'
import { useLiveFeed } from '../hooks/useLiveFeed'
import { swrFetcher, urls, type ApiMarket, type ApiStats, type ApiHeatmap, type ApiSignal, type ApiOrderBook } from '../../lib/api'

// ── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 80, h = 32
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  const color = positive ? '#F1FF58' : '#FF3A6E'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── Carousel ─────────────────────────────────────────────────────────
function MarketCarousel({ markets }: { markets: ApiMarket[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused || markets.length === 0) return
    timerRef.current = setInterval(() => setActive(a => (a + 1) % markets.length), 3200)
    return () => clearInterval(timerRef.current!)
  }, [paused, markets.length])

  if (markets.length === 0) return (
    <div className="carousel-wrap" style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#7FA8A8', fontSize: 13 }}>Loading markets…</span>
    </div>
  )

  const visible = [0, 1, 2, 3].map(i => markets[(active + i) % markets.length])

  return (
    <div className="carousel-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="carousel-header">
        <span className="section-label">🔥 TRENDING MARKETS</span>
        <div className="carousel-dots">
          {markets.map((_, i) => (
            <button key={i} className={`carousel-dot${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)} />
          ))}
        </div>
      </div>
      <div className="carousel-track">
        {visible.map((m, i) => {
          const yes = Math.round(m.yesPrice * 100)
          const pos = m.yesPrice >= 0.5
          const spark = Array.from({ length: 11 }, (_, j) =>
            Math.max(0, Math.min(100, yes + Math.sin(j * 1.2 + i) * 3)))
          return (
            <div key={m.id + i} className="carousel-card glass">
              <div className="carousel-card-top">
                <span className="carousel-cat">{m.category}</span>
                <span className="carousel-vol">${(m.volume24h / 1000).toFixed(0)}K</span>
              </div>
              <p className="carousel-question">{m.question}</p>
              <div className="carousel-bottom">
                <div className="carousel-prob">
                  <span className="carousel-yes">{yes}%</span>
                  <span className="carousel-change" style={{ color: pos ? '#F1FF58' : '#FF3A6E' }}>
                    {pos ? '▲' : '▼'} YES
                  </span>
                </div>
                <Sparkline data={spark} positive={pos} />
              </div>
              <div className="carousel-bar">
                <div className="carousel-bar-fill" style={{ width: `${yes}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Live Feed ─────────────────────────────────────────────────────────
const FEED_ICONS: Record<string, string> = { whale: '🐋', spike: '⚡', resolved: '✅', new: '🆕', trade: '💱', signal: '🧠' }
const FEED_COLORS: Record<string, string> = { whale: '#F1FF58', spike: '#FF3A6E', resolved: '#C084FC', new: '#F5A623', trade: '#9ECECE', signal: '#FF3A6E' }

function LiveFeed() {
  const { messages, connected } = useLiveFeed({ maxItems: 8 })
  return (
    <div className="glass livefeed-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span className="section-label" style={{ marginBottom: 0 }}>⚡ LIVE ACTIVITY</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className={`signal-dot${connected ? ' live' : ''}`}
            style={{ background: connected ? '#F1FF58' : '#416858' }} />
          <span style={{ fontSize: 10, color: '#7FA8A8' }}>{connected ? 'Live' : 'Connecting…'}</span>
        </div>
      </div>
      <div className="livefeed-list">
        {messages.length === 0 && (
          <div style={{ padding: '12px 0', fontSize: 12, color: '#7FA8A8', textAlign: 'center' }}>
            Waiting for live trades…
          </div>
        )}
        {messages.map((item, i) => (
          <div key={item.marketId + item.timestamp + i} className={`livefeed-item${i === 0 ? ' fresh' : ''}`}>
            <span className="livefeed-icon">{FEED_ICONS[item.type] ?? '📊'}</span>
            <div className="livefeed-body">
              <p className="livefeed-text">{item.text}</p>
              <div className="livefeed-meta">
                <span className="livefeed-cat" style={{ color: FEED_COLORS[item.type] ?? '#9ECECE' }}>
                  {item.category}
                </span>
                <span className="livefeed-time">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Order Book ────────────────────────────────────────────────────────
function OrderBook({ data }: { data: ApiOrderBook | null }) {
  if (!data) return (
    <div className="glass orderbook-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#7FA8A8', fontSize:12 }}>Loading order book…</span>
    </div>
  )
  const maxTotal = Math.max(...data.asks.map(a => a.total), ...data.bids.map(b => b.total))
  return (
    <div className="glass orderbook-wrap">
      <span className="section-label">📖 ORDER BOOK</span>
      <div className="orderbook-header"><span>PRICE</span><span>SIZE</span><span>TOTAL</span></div>
      <div className="orderbook-asks">
        {[...data.asks].reverse().map((a, i) => (
          <div key={i} className="orderbook-row ask">
            <div className="orderbook-depth ask-depth" style={{ width:`${(a.total/maxTotal)*100}%` }} />
            <span className="orderbook-price ask-price">{a.price.toFixed(2)}</span>
            <span className="orderbook-size">{a.size.toLocaleString()}</span>
            <span className="orderbook-total">{a.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="orderbook-spread">
        <span>SPREAD</span>
        <span style={{ color:'#F1FF58' }}>
          {(data.asks[0]?.price - data.bids[0]?.price).toFixed(3)}
        </span>
      </div>
      <div className="orderbook-bids">
        {data.bids.map((b, i) => (
          <div key={i} className="orderbook-row bid">
            <div className="orderbook-depth bid-depth" style={{ width:`${(b.total/maxTotal)*100}%` }} />
            <span className="orderbook-price bid-price">{b.price.toFixed(2)}</span>
            <span className="orderbook-size">{b.size.toLocaleString()}</span>
            <span className="orderbook-total">{b.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────
function Heatmap({ data }: { data: ApiHeatmap[] }) {
  const maxVol = Math.max(...data.map(h => h.volume), 1)
  return (
    <div className="glass heatmap-wrap">
      <span className="section-label">🌡 VOLATILITY BY CATEGORY</span>
      <div className="heatmap-grid">
        {data.map(h => {
          const intensity = h.volume / maxVol
          const pos = h.change >= 0
          return (
            <div key={h.category} className="heatmap-cell" style={{
              background: pos ? `rgba(241,255,88,${0.04 + intensity * 0.18})` : `rgba(255,58,110,${0.04 + intensity * 0.18})`,
              borderColor: pos ? `rgba(241,255,88,${0.1 + intensity * 0.3})` : `rgba(255,58,110,${0.1 + intensity * 0.3})`,
            }}>
              <span className="heatmap-cat">{h.category}</span>
              <span className="heatmap-vol">${h.volume.toFixed(1)}M</span>
              <span className="heatmap-change" style={{ color: pos ? '#F1FF58' : '#FF3A6E' }}>
                {pos ? '+' : ''}{h.change.toFixed(1)}%
              </span>
              <span className="heatmap-markets">{h.markets} mkts</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Chart ────────────────────────────────────────────────────────
function MainChart({ markets }: { markets: ApiMarket[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<unknown>(null)
  const [range, setRange]           = useState<'1H'|'6H'|'1D'|'1W'>('1D')
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    if (markets.length > 0 && !selectedId) setSelectedId(markets[0].conditionId)
  }, [markets])

  const { data: history } = useSWR(
    selectedId ? urls.history(selectedId, range) : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  useEffect(() => {
    if (!history || !canvasRef.current) return
    import('chart.js/auto').then(mod => {
      const Chart = mod.default
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
      chartRef.current = new Chart(canvasRef.current!, {
        type: 'line',
        data: {
          labels: history.labels,
          datasets: [{
            label: 'Market', data: history.prices,
            borderColor: '#F1FF58', borderWidth: 2.5,
            pointRadius: 0, tension: 0.4, fill: true,
            backgroundColor: 'rgba(241,255,88,0.08)',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: {
            backgroundColor: '#0A3D3E', titleColor: '#9ECECE', bodyColor: '#F1FF58',
            borderColor: '#416858', borderWidth: 0.5, padding: 10,
          }},
          scales: {
            x: { grid: { color: 'rgba(65,104,88,0.15)' }, ticks: { color: '#7FA8A8', font: { size: 10 } }, border: { display: false } },
            y: { grid: { color: 'rgba(65,104,88,0.15)' }, ticks: { color: '#7FA8A8', font: { size: 10 }, callback: (v) => `${v}%` }, border: { display: false } },
          },
        },
      })
    })
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
  }, [history])

  const selected = markets.find(m => m.conditionId === selectedId)

  return (
    <div className="glass main-chart-wrap">
      <div className="main-chart-header">
        <div>
          <span className="section-label" style={{ marginBottom: 4 }}>PRICE CHART</span>
          <select style={{
            background: 'rgba(10,61,62,0.7)', border: '0.5px solid rgba(65,104,88,0.5)',
            borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#E8F5F5',
            outline: 'none', marginTop: 4, maxWidth: 260,
          }} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            {markets.map(m => (
              <option key={m.conditionId} value={m.conditionId}>
                {m.question.length > 45 ? m.question.slice(0, 42) + '…' : m.question}
              </option>
            ))}
          </select>
        </div>
        <div className="chart-range-tabs">
          {(['1H','6H','1D','1W'] as const).map(r => (
            <button key={r} className={`range-tab${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', height: 180, width: '100%', minWidth: 0 }}>
        {!history && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#7FA8A8', fontSize:12 }}>Loading chart…</div>}
        <canvas ref={canvasRef} />
      </div>
      {selected && (
        <div style={{ display:'flex', gap:16, fontSize:11, color:'#7FA8A8' }}>
          <span>YES <span style={{ color:'#F1FF58', fontWeight:700 }}>{Math.round(selected.yesPrice * 100)}%</span></span>
          <span>Vol <span style={{ color:'#9ECECE' }}>${(selected.volume / 1e6).toFixed(2)}M</span></span>
          <span>Liq <span style={{ color:'#9ECECE' }}>${(selected.liquidity / 1000).toFixed(0)}K</span></span>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  // SWR fetches — cached in memory, instant on page revisit
  const { data: stats }   = useSWR<ApiStats>    (urls.stats(),    swrFetcher, { refreshInterval: 30000 })
  const { data: markets } = useSWR<ApiMarket[]> (urls.trending(), swrFetcher, { refreshInterval: 60000 })
  const { data: heatmap } = useSWR<ApiHeatmap[]>(urls.heatmap(),  swrFetcher, { refreshInterval: 60000 })
  const { data: signals } = useSWR<ApiSignal[]> (urls.signals(),  swrFetcher, { refreshInterval: 30000 })

  // Order book for first market
  const firstMarketId = markets?.[0]?.conditionId ?? null
  const { data: orderBook } = useSWR<ApiOrderBook>(
    firstMarketId ? urls.orderBook(firstMarketId) : null,
    swrFetcher,
    { refreshInterval: 15000 }
  )

  const safeMarkets = markets ?? []
  const safeHeatmap = heatmap ?? []
  const safeSignals = signals ?? []

  const insights: Insight[] = safeSignals.slice(0, 3).map(s => ({
    id:     String(s.id),
    time:   new Date(s.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    signal: s.confidence === 'HIGH' ? 'high' : s.confidence === 'MONITOR' ? 'monitor' : 'normal',
    text:   s.summary,
  }))

  const tickerItems = safeSignals.map(s => ({
    id:   String(s.id),
    text: `${s.marketQuestion} — ${s.gap > 0 ? '+' : ''}${s.gap.toFixed(1)}% gap detected`,
  }))

  return (
    <main className="page-wrapper">
      <Navbar />

      {tickerItems.length > 0 && <Ticker items={tickerItems} />}

      <div className="grid-stats">
        <StatCard label="MARKETS TRACKED"  value={stats ? stats.totalMarkets.toLocaleString() : '—'} sub="across 7 categories" />
        <StatCard label="ACTIVE SIGNALS"   value={stats ? String(stats.activeSignals) : '—'} sub="AI mismatches detected" valueColor="purple" />
        <StatCard label="AVG MISMATCH"     value={stats ? `${stats.avgMismatch > 0 ? '+' : ''}${stats.avgMismatch.toFixed(1)}%` : '—'} sub="market vs AI estimate" valueColor="yellow" subColor="yellow" />
        <StatCard label="VOLATILITY"       value={stats?.volatilityLevel ?? '—'}
          sub={stats ? `${stats.volatilitySpikes} spikes in 1h` : 'loading…'}
          valueColor={stats?.volatilityLevel === 'HIGH' ? 'red' : stats?.volatilityLevel === 'MEDIUM' ? 'amber' : 'yellow'}
          subColor={stats?.volatilityLevel === 'HIGH' ? 'red' : 'default'} />
      </div>

      <MarketCarousel markets={safeMarkets} />

      <div className="grid-main">
        <MainChart markets={safeMarkets} />
        <div className="insight-card-wrap">
          <InsightFeed insights={insights.length > 0 ? insights : [
            { id: '0', time: '—', signal: 'normal', text: 'Waiting for AI signals…' }
          ]} />
        </div>
      </div>

      <div className="grid-bottom">
        <LiveFeed />
        <OrderBook data={orderBook ?? null} />
        {safeHeatmap.length > 0 && <Heatmap data={safeHeatmap} />}
      </div>
    </main>
  )
}